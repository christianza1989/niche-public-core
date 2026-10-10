// Explicit isolated integration harness; never selected by test:core or a live site job.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile, copyFile, lstat, symlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { request as httpRequest } from 'node:http';
import sharp from 'sharp';
import { nativeFixture, retiredFixture, approveFixture } from './fixtures/native-niche-v2.mjs';
import { validateV2Admission } from '../scripts/content-v2-admission.mjs';
import { projectContentPagesV2 } from '../lib/content-projection-v2.mjs';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const [command, relative, phase = 'before', base = 'http://127.0.0.1:8897'] = process.argv.slice(2);
const sandbox = path.resolve(root, relative || 'output/native-v2-http/dovanos-memorycasting');
assert.ok(sandbox.startsWith(path.join(root, 'output') + path.sep), 'fixture must stay under this checkout output');
const markerPath = path.join(sandbox, 'output/native-v2-marker.json');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function savePackage(pkg, scope = 'local-fixture') {
  const directory = path.join(sandbox, 'content-packages', pkg.siteId), raw = JSON.stringify(pkg) + '\n';
  const receipt = { schemaVersion: 1, scope, testOnly: true, siteId: pkg.siteId, canonicalHost: pkg.canonicalHost, renderer: pkg.site.renderer, packageSha256: hash(raw), reviewer: 'isolated HTTP fixture only', acceptedAt: new Date().toISOString() };
  validateV2Admission(pkg, raw, receipt);
  await mkdir(path.join(directory, 'assets'), { recursive: true });
  await writeFile(path.join(directory, 'content-package.json'), raw);
  await writeFile(path.join(directory, 'activation.json'), JSON.stringify(receipt));
  for (const page of pkg.pages) for (const media of page.media) await sharp({ create: { width: media.width, height: media.height, channels: 3, background: '#31554a' } }).webp().toFile(path.join(directory, 'assets', path.basename(media.src)));
}
if (command === 'prepare') {
  await assert.rejects(lstat(sandbox), { code: 'ENOENT' });
  // Copy tracked source plus this feature's exact pre-commit files, never arbitrary untracked inputs.
  const files = [...new Set([...execFileSync('git', ['ls-files', '--cached', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean),
    'app/niche/[siteId]/seo/[kind]/route.ts', 'components/content/rich-content.tsx', 'components/niche/native-content-site.tsx',
    'components/niche/native-content-site.module.css', 'lib/content-page-seo.ts', 'lib/content-presentation.ts',
    'tests/fixtures/native-niche-v2.mjs', 'tests/native-niche-v2.test.mjs', 'tests/native-niche-v2-http.mjs', 'docs/NATIVE_NICHE_V2.md'])];
  for (const file of files) { const destination = path.join(sandbox, file); await mkdir(path.dirname(destination), { recursive: true }); await copyFile(path.join(root, file), destination); }
  await symlink(path.join(root, 'node_modules'), path.join(sandbox, 'node_modules'), 'junction');
  await mkdir(path.dirname(markerPath), { recursive: true });
  // Enough real wall-clock margin for the isolated build; no production time override.
  const boundary = new Date(Date.now() + 180_000).toISOString();
  const pkg = nativeFixture({ boundary });
  const packages = [pkg, nativeFixture({ siteId: 'giftqa', renderer: 'gift', boundary }), nativeFixture({ siteId: 'peerqa', boundary })];
  for (const p of packages) await savePackage(p);
  const preview = nativeFixture({ siteId: 'previewqa', boundary });
  preview.canonicalHost = preview.site.canonicalHost = 'private-preview.lt';
  for (const page of preview.pages) page.siteSnapshot = structuredClone(preview.site);
  approveFixture(preview); await savePackage(preview, 'local-preview');
  const original = JSON.stringify(pkg) + '\n';
  await writeFile(path.join(sandbox, 'output/native-v2-original.json'), original);
  await writeFile(markerPath, JSON.stringify({ scope: 'isolated-native-v2-http', sandbox, boundary, originalSha256: hash(original) }));
  const aliasPath = path.join(sandbox, 'config/content-media-aliases.json'), aliases = JSON.parse(await readFile(aliasPath, 'utf8'));
  aliases.entries.push({ siteId: 'nativeqa', pageId: 'future', assetId: 'future-image', from: '/images/articles/native-qa-future.jpg' });
  await writeFile(aliasPath, JSON.stringify(aliases));
  console.log(JSON.stringify({ prepared: sandbox, boundary, testOnly: true }));
} else {
  const marker = JSON.parse(await readFile(markerPath, 'utf8'));
  assert.equal(marker.scope, 'isolated-native-v2-http'); assert.equal(marker.sandbox, sandbox);
  const original = await readFile(path.join(sandbox, 'output/native-v2-original.json'), 'utf8');
  assert.equal(hash(original), marker.originalSha256);
  if (command === 'retire') { await savePackage(retiredFixture(JSON.parse(original))); console.log('New isolated release retires future; original bytes preserved. Rebuild/restart the owned preview.'); }
  else if (command === 'check') {
    assert.ok(['before', 'after', 'retired'].includes(phase));
    const target = new URL(base); assert.equal(target.protocol, 'http:'); assert.ok(['localhost', '127.0.0.1'].includes(target.hostname));
    const clockValid = phase === 'before' ? Date.now() < Date.parse(marker.boundary) : Date.now() >= Date.parse(marker.boundary);
    if (!clockValid) {
      const message = phase === 'before' ? 'Before-date window elapsed; prepare a NEW sandbox, preserve this failure.' : 'After-date test must use real wall clock.';
      await writeFile(path.join(sandbox, `output/http-${phase}-FAIL-${Date.now()}.json`), JSON.stringify({ result: 'FAIL', phase, message, observedAt: new Date().toISOString(), boundary: marker.boundary }));
      throw new Error(message);
    }
    const packageBytes = await readFile(path.join(sandbox, 'content-packages/nativeqa/content-package.json'), 'utf8');
    const pkg = JSON.parse(packageBytes);
    const activation = JSON.parse(await readFile(path.join(sandbox, 'content-packages/nativeqa/activation.json'), 'utf8'));
    assert.equal(activation.packageSha256, hash(packageBytes), 'HTTP evidence must bind the exact admitted bytes');
    const visible = projectContentPagesV2(pkg, [pkg], {}, {}, Date.now());
    const observations = [];
    async function get(urlPath, host = pkg.canonicalHost, method = 'GET') {
      const url = new URL(urlPath, target);
      const result = await new Promise((resolve, reject) => { const request = httpRequest(url, { method, headers: { Host: host }, timeout: 20_000 }, response => { const chunks = []; response.on('data', data => chunks.push(data)); response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, bytes: Buffer.concat(chunks) })); }); request.on('timeout', () => request.destroy(new Error('HTTP test deadline'))); request.on('error', reject); request.end(); });
      observations.push({ path: urlPath, host, method, status: result.status, sha256: hash(result.bytes) });
      return { ...result, body: result.bytes.toString('utf8') };
    }
    try {
      for (const page of visible) { const response = await get('/' + page.slug); assert.equal(response.status, 200, page.slug); assert.ok(response.body.includes(`<link rel="canonical" href="${page.url}"`)); assert.ok(response.body.includes('type="application/ld+json"')); assert.ok(response.body.includes(page.title)); assert.match(response.headers['x-robots-tag'] || '', /noindex/); }
      const home = await get('/'), current = await get('/gidai/dabartinis'), future = await get('/gidai/veliau');
      const expected = phase === 'after';
      assert.equal(future.status, expected ? 200 : 404);
      if (!expected) { assert.doesNotMatch(home.body, /SLAPTAS BŪSIMAS|\/gidai\/veliau|future\.webp/); assert.doesNotMatch(current.body, /href="[^\"]*veliau|future\.webp/); }
      else { assert.match(home.body, /SLAPTAS BŪSIMAS/); assert.match(current.body, /<h2><a[^>]+>Kitas atsakymas<\/a><\/h2>/); assert.match(current.body, /<ol><li><a[^>]+>Kitas atsakymas<\/a><\/li>/); }
      assert.doesNotMatch(current.body, /href="https:\/\/peerqa\.example/);
      assert.match(current.body, /srcSet="[^\"]*640w[^\"]*1280w[^\"]*1600w"/i);
      const asset = await get('/content-assets/nativeqa/current-640.webp'); assert.equal(asset.status, 200); assert.equal(asset.bytes.toString('ascii', 0, 4), 'RIFF');
      assert.equal((await get('/content-assets/nativeqa/future.webp')).status, expected ? 200 : 404);
      assert.equal((await get('/images/articles/native-qa-future.jpg')).status, expected ? 307 : 404);
      assert.equal((await get('/content-assets/giftqa/current-640.webp')).status, 404);
      for (const resource of ['/sitemap.xml', '/llms.txt', '/llms-full.txt']) { const response = await get(resource); assert.equal(response.status, 200); assert.equal(response.body.includes('https://nativeqa.example/gidai/veliau'), expected); if (resource === '/sitemap.xml') assert.equal((response.body.match(/<url>/g) || []).length, visible.length); }
      assert.match((await get('/robots.txt')).body, /Disallow: \/\n/);
      for (const favicon of ['/favicon.svg', '/favicon.ico']) { const response = await get(favicon); assert.equal(response.status, 200); assert.match(response.headers['content-type'] || '', /image\/svg/); }
      const contact = await get('/kontaktai'); assert.match(contact.body, /mailto:nativeqa@example\.org/); assert.doesNotMatch(contact.body, /<form|info@pinet|MB Pinet/);
      assert.equal((await get('/uzklausa', pkg.canonicalHost, 'POST')).status, 405);
      for (const blocked of ['/niche/nativeqa', '/gift/giftqa', '/api/anything', '/__not_found__']) assert.equal((await get(blocked)).status, 404);
      assert.equal((await get('/', 'unknown-domain.example')).status, 404);
      assert.equal((await get('/', 'private-preview.lt')).status, 404);
      assert.equal((await get('/', 'preview.vercel.app')).status, 404);
      const loopback = await get('/', '127.0.0.1'); assert.equal(loopback.status, 200); assert.match(loopback.headers['x-robots-tag'] || '', /noindex/); assert.match(loopback.body, /private-preview\.lt/);
      const gift = await get('/straipsniai/dabartinis', 'giftqa.example'); assert.equal(gift.status, 200); assert.match(gift.body, /https:\/\/giftqa\.example\/straipsniai\/dabartinis/); assert.doesNotMatch(gift.body, /nativeqa\.example/);
      const peer = await get('/gidai/dabartinis', 'peerqa.example'); assert.equal(peer.status, 200); assert.doesNotMatch(peer.body, /nativeqa\.example/);
      await writeFile(path.join(sandbox, `output/http-${phase}-${Date.now()}.json`), JSON.stringify({ result: 'PASS', phase, observedAt: new Date().toISOString(), boundary: marker.boundary, packageSha256: hash(packageBytes), canonicalPackageSha256: hash(JSON.stringify(pkg)), observations }, null, 2));
      console.log(`Native V2 actual HTTP ${phase}: ${observations.length} requests PASS; noindex test fixtures only.`);
    } catch (error) { await writeFile(path.join(sandbox, `output/http-${phase}-FAIL-${Date.now()}.json`), JSON.stringify({ result: 'FAIL', phase, message: String(error), observations }, null, 2)); throw error; }
  } else throw new Error('Use prepare, check or retire.');
}
