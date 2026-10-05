import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request as httpRequest } from 'node:http';
import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createPhoneBridgerPreviewMiddleware, phoneBridgerPreview, previewRequestAllowed, byteRange } from '../scripts/phonebridger-preview.mjs';

test('preview admits only a local host and loopback connection; build remains excluded', () => {
  const req = (host, remoteAddress) => ({ headers: { host }, socket: { remoteAddress } });
  assert.equal(previewRequestAllowed(req('localhost:5173', '127.0.0.1')), true);
  assert.equal(previewRequestAllowed(req('127.0.0.1:5173', '::ffff:127.0.0.1')), true);
  assert.equal(previewRequestAllowed(req('phonebridger.com', '127.0.0.1')), false);
  assert.equal(previewRequestAllowed(req('localhost:5173', '192.168.1.10')), false);
  assert.equal(phoneBridgerPreview('/unused').apply, 'serve');
});
test('range parser supports scrubbing and rejects malformed/unsatisfiable ranges', () => {
  assert.deepEqual(byteRange('bytes=5-9', 10), { start: 5, end: 9 });
  assert.deepEqual(byteRange('bytes=5-', 10), { start: 5, end: 9 });
  assert.deepEqual(byteRange('bytes=-3', 10), { start: 7, end: 9 });
  for (const value of ['bytes=10-', 'bytes=7-5', 'bytes=0-2,5-7', 'bytes=-0', 'bytes=-']) assert.throws(() => byteRange(value, 10));
});
test('core-first merge and an absent companion prototype leave other dev routes alone', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'phonebridger-absent-'));
  try {
    await phoneBridgerPreview(root).configureServer({ middlewares: { use() { throw Error('Unexpected preview registration'); } } });
  } finally { await rm(root,{recursive:true,force:true}); }
});
test('actual HTTP preview isolates manifest assets, preserves video range bytes, rejects public hosts and writes', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'phonebridger-preview-'));
  let server;
  try {
    const files = [];
    for (const [name, content] of [['index.html', '<html lang="en">Demo</html>'], ['clip.mp4', '0123456789']]) {
      const bytes = Buffer.from(content); await writeFile(path.join(root,name),bytes);
      files.push({ path: name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
    }
    await writeFile(path.join(root, 'private.txt'), 'must not be served');
    await writeFile(path.join(root, 'manifest.json'), JSON.stringify({ siteId: 'phonebridger', mode: 'private-prototype', files }));
    const middleware = await createPhoneBridgerPreviewMiddleware(root);
    server = createServer((req,res) => middleware(req,res,() => { res.statusCode=418; res.end('Other core route'); }).catch(e=>{res.statusCode=500;res.end(String(e));}));
    await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const base = `${origin}/__projects/phonebridger/`;
    const html = await fetch(base); assert.equal(html.status,200); assert.match(html.headers.get('x-robots-tag'),/noindex/); assert.match(html.headers.get('cache-control'),/no-store/); assert.match(await html.text(), /Demo/);
    const part = await fetch(base+'clip.mp4',{headers:{Range:'bytes=3-6'}}); assert.equal(part.status,206); assert.equal(part.headers.get('content-range'),'bytes 3-6/10'); assert.equal(await part.text(),'3456');
    const head = await fetch(base+'clip.mp4',{method:'HEAD'}); assert.equal(head.headers.get('content-length'),'10'); assert.equal(await head.text(),'');
    assert.equal((await fetch(base+'clip.mp4',{headers:{Range:'bytes=100-'}})).status,416);
    for (const name of ['private.txt','manifest.json','%2e%2e%2fprivate.txt','tests/state.cjs']) assert.equal((await fetch(base+name)).status,404);
    // Undici fetch normalizes Host; use a wire-level HTTP request for this check.
    const denied = await new Promise((resolve,reject) => {
      const req = httpRequest(base,{headers:{Host:'phonebridger.com'}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});
      req.on('error',reject);req.end();
    });
    assert.equal(denied,404);
    assert.equal((await fetch(base,{method:'POST',body:'sale'})).status,405);
    assert.equal((await fetch(origin+'/other')).status,418);
    await writeFile(path.join(root,'clip.mp4'),'tampered');
    await assert.rejects(createPhoneBridgerPreviewMiddleware(root),/Changed preview asset/);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await rm(root,{recursive:true,force:true});
  }
});
