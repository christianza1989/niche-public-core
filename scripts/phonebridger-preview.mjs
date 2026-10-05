import { createReadStream } from 'node:fs';
import { readFile, realpath, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

export const PHONEBRIDGER_PREVIEW_PREFIX = '/__projects/phonebridger/';
const headers = { 'X-Robots-Tag': 'noindex, nofollow, noarchive', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.wav': 'audio/wav' };
const loopback = address => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address);
export function previewRequestAllowed(request) {
  try {
    const host = new URL(`http://${request.headers.host}`).hostname;
    return ['localhost', '127.0.0.1', '[::1]'].includes(host) && loopback(request.socket.remoteAddress);
  } catch { return false; }
}
export function byteRange(value, size) {
  if (!value) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2])) throw Error('Invalid range');
  let start, end;
  if (!match[1]) { const suffix = Number(match[2]); if (suffix <= 0) throw Error('Invalid suffix'); start = Math.max(0, size - suffix); end = size - 1; }
  else { start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1; }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) throw Error('Unsatisfiable range');
  return { start, end };
}
export async function createPhoneBridgerPreviewMiddleware(root) {
  const canonicalRoot = await realpath(root);
  const manifest = JSON.parse(await readFile(path.join(canonicalRoot, 'manifest.json'), 'utf8'));
  if (manifest.siteId !== 'phonebridger' || manifest.mode !== 'private-prototype') throw Error('Wrong project manifest');
  const files = new Map();
  for (const entry of manifest.files) {
    if (!entry.path || entry.path.startsWith('/') || entry.path.includes('\\') || entry.path.split('/').some(p => p === '..' || !p)) throw Error('Unsafe manifest path');
    const file = await realpath(path.join(canonicalRoot, entry.path));
    if (!file.startsWith(canonicalRoot + path.sep) || !types[path.extname(file)]) throw Error('Unsafe preview asset');
    const bytes = await readFile(file);
    if (bytes.length !== entry.bytes || createHash('sha256').update(bytes).digest('hex') !== entry.sha256) throw Error(`Changed preview asset: ${entry.path}`);
    files.set(entry.path, { file, size: bytes.length });
  }
  if (!files.has('index.html')) throw Error('Missing prototype entry point');
  return async (request, response, next) => {
    const rawPath = request.url.split('?')[0];
    if (rawPath === PHONEBRIDGER_PREVIEW_PREFIX.slice(0, -1)) {
      if (!previewRequestAllowed(request)) { response.writeHead(404, headers); return response.end('Private preview'); }
      response.writeHead(307, { ...headers, Location: PHONEBRIDGER_PREVIEW_PREFIX }); return response.end();
    }
    if (!rawPath.startsWith(PHONEBRIDGER_PREVIEW_PREFIX)) return next();
    if (!previewRequestAllowed(request)) { response.writeHead(404, headers); return response.end('Private preview'); }
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { ...headers, Allow: 'GET, HEAD' }); return response.end(); }
    let name;
    try { name = decodeURIComponent(rawPath.slice(PHONEBRIDGER_PREVIEW_PREFIX.length)) || 'index.html'; } catch { response.writeHead(404, headers); return response.end(); }
    const asset = files.get(name);
    if (!asset) { response.writeHead(404, headers); return response.end('Not found'); }
    // Recheck realpath so replacing a manifest asset with a symlink cannot serve secrets.
    try { if (await realpath(asset.file) !== asset.file || (await stat(asset.file)).size !== asset.size) throw Error('Changed asset'); }
    catch { response.writeHead(404, headers); return response.end('Changed preview asset'); }
    let range;
    try { range = byteRange(request.headers.range, asset.size); }
    catch { response.writeHead(416, { ...headers, 'Content-Range': `bytes */${asset.size}` }); return response.end(); }
    const start = range?.start ?? 0, end = range?.end ?? asset.size - 1;
    response.writeHead(range ? 206 : 200, { ...headers, 'Content-Type': types[path.extname(asset.file)], 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, ...(range ? { 'Content-Range': `bytes ${start}-${end}/${asset.size}` } : {}) });
    if (request.method === 'HEAD') return response.end();
    const stream = createReadStream(asset.file, { start, end });
    stream.on('error', () => response.destroy());
    response.on('close', () => stream.destroy());
    stream.pipe(response);
  };
}
export function phoneBridgerPreview(root) {
  return { name: 'phonebridger-private-preview', apply: 'serve', async configureServer(server) {
    // An absent companion project is normal. No assets are copied to public/dist.
    try { await stat(path.join(root, 'manifest.json')); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
    server.middlewares.use(await createPhoneBridgerPreviewMiddleware(root));
  } };
}
