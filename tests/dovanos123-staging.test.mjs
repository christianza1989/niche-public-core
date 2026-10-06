import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContentPackage } from '../scripts/content-package-core.mjs';
import { inlineNodes } from '../scripts/content-package-v2.mjs';
import { validateV2Admission } from '../scripts/content-v2-admission.mjs';
import { projectContentPagesV2 } from '../lib/content-projection-v2.mjs';
import { contentSeoV2 } from '../lib/content-seo-v2.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(root, 'content-staging/dovanos123');
const raw = await readFile(path.join(directory, 'content-package.json'), 'utf8');
const pkg = validateContentPackage(JSON.parse(raw));
const manifest = JSON.parse(await readFile(path.join(directory, 'handoff.json'), 'utf8'));
const settings = JSON.parse(await readFile(path.join(root, 'config/niche-network.json'), 'utf8'));
const commerce = JSON.parse(await readFile(path.join(root, 'config/commerce-targets.json'), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const boundary = Date.parse('2026-10-04T20:02:01Z');
const projection = now => projectContentPagesV2(pkg, [pkg], settings, commerce, now);

test('staged handoff preserves exact reviewed bytes, all 11 approvals and the closed dependency set', () => {
  assert.equal(sha(raw), manifest.packageSha256);
  assert.equal(manifest.packageSha256, 'f9a14e3a5772781afe1233fbd3ccc6041ea2bf73aef2d7a12d40924ca6b4febd');
  assert.equal(pkg.siteId, manifest.siteId);
  assert.equal(pkg.canonicalHost, manifest.canonicalHost);
  assert.equal(pkg.schemaVersion, 2);
  assert.equal(pkg.site.renderer, 'gift');
  assert.deepEqual(pkg.pages.map(page => page.id), manifest.pageIds);
  assert.equal(pkg.pages.filter(page => page.type === 'article').length, 3);
  for (const page of pkg.pages) {
    assert.equal(page.approval.status, 'approved');
    assert.equal(page.approval.revisionHash, page.revisionHash);
    for (const link of page.links) assert.ok(manifest.pageIds.includes(link.targetPageId));
    for (const id of page.editorial.relatedPageIds) assert.ok(manifest.pageIds.includes(id));
    for (const node of inlineNodes(page)) {
      if (node.type === 'link' && node.target.kind === 'page') assert.ok(manifest.pageIds.includes(node.target.pageId));
    }
    for (const author of page.editorial.authors) assert.equal(author.kind, 'organization');
  }
  assert.ok(!pkg.pages.some(page => ['privatumas', 'slapukai', 'taisykles', 'autoriai/aiste-redaktore'].includes(page.slug)));
  assert.doesNotMatch(raw, /"(?:factChecks|sourceOriginal|originalPath|prompt|jobs|leads)"\s*:/);
});

test('all 15 shipped files have exact reviewed WebP bytes and every media reference resolves', async () => {
  const names = (await readdir(path.join(directory, 'assets'))).sort();
  assert.equal(names.length, 15);
  assert.deepEqual(names, Object.keys(manifest.assets).sort());
  const referenced = new Set();
  for (const page of pkg.pages) for (const media of page.media) {
    assert.equal(media.src, `/content-assets/dovanos123/${path.basename(media.src)}`);
    referenced.add(path.basename(media.src));
  }
  assert.deepEqual([...referenced].sort(), names);
  for (const name of names) {
    const bytes = await readFile(path.join(directory, 'assets', name));
    assert.equal(sha(bytes), manifest.assets[name], name);
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    assert.ok(bytes.length < 8 * 1024 * 1024);
  }
});

test('the staged candidate stays outside active packages, public media and production admission', async () => {
  const registry = JSON.parse(await readFile(path.join(root, 'lib/generated/content-packages.json'), 'utf8'));
  assert.ok(!registry.some(item => item.siteId === pkg.siteId));
  await assert.rejects(access(path.join(root, 'content-packages/dovanos123/content-package.json')), { code: 'ENOENT' });
  await assert.rejects(access(path.join(root, 'public/content-assets/dovanos123')), { code: 'ENOENT' });
  await assert.rejects(access(path.join(directory, 'activation.json')), { code: 'ENOENT' });
  assert.equal(manifest.state, 'staged-not-deployed');
  assert.equal(manifest.productionAccepted, false);
  assert.throws(() => validateV2Admission(pkg, raw, manifest), /acceptance receipt/);
  assert.ok(!settings.networkLiveDomains.includes(pkg.canonicalHost));
});

test('actual transferred dates use the shared projection and SEO/LLM inventory without changing approvals', () => {
  // Pure package projection evidence only, not a live-host/cache or crawler test.
  const original = JSON.stringify(pkg);
  assert.ok(pkg.pages.every(page => Date.parse(page.publishAt) === boundary));
  assert.equal(projection(boundary - 1).length, 0);
  const visible = projection(boundary);
  assert.equal(visible.length, 11);
  assert.equal(projection(boundary + 1).length, 11);
  for (const kind of ['sitemap', 'llms', 'llms-full']) {
    const hidden = contentSeoV2(pkg, [], kind).body;
    const due = contentSeoV2(pkg, visible, kind).body;
    for (const article of pkg.pages.filter(page => page.type === 'article')) {
      assert.ok(!hidden.includes(article.slug));
      assert.ok(due.includes(article.slug));
    }
  }
  assert.equal(JSON.stringify(pkg), original);
});

test('expired MemoryCasting information targets fail closed without altering transferred text or approval', () => {
  const expiry = Date.parse(commerce.targets.find(target => target.id === 'memorycasting-information').expiresAt);
  const visible = projection(expiry);
  assert.ok(visible.every(page => page.editorial.commerceTargets.length === 0));
  assert.ok(visible.every(page => page.editorial.sources.every(source => !new URL(source.url).hostname.endsWith('memorycasting.lt'))));
  for (const page of visible) for (const block of page.body) {
    const nodes = block.content ?? (block.type === 'richList' ? block.items.flat() : []);
    assert.ok(nodes.every(node => node.type !== 'link' || !new URL(node.href).hostname.endsWith('memorycasting.lt')));
  }
  assert.equal(sha(raw), manifest.packageSha256);
});
