import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import * as media from '../lib/niche-media.mjs';
import { projectContentPagesV2 } from '../lib/content-projection-v2.mjs';
import { contentSeoV2 } from '../lib/content-seo-v2.mjs';
import { nativeFixture, retiredFixture } from './fixtures/native-niche-v2.mjs';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url))), nativeRequire = createRequire(import.meta.url), cache = new Map();
function load(relative) {
  const file = path.resolve(root, relative);
  if (cache.has(file)) return cache.get(file);
  const module = { exports: {} }; cache.set(file, module.exports);
  const javascript = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  const require = name => {
    if (name.endsWith('niche-media.mjs')) return media;
    if (name.endsWith('.module.css')) return { default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (name.startsWith('@/') || name.startsWith('.')) {
      const base = name.startsWith('@/') ? path.resolve(root, name.slice(2)) : path.resolve(path.dirname(file), name);
      const resolved = [base, base + '.ts', base + '.tsx'].find(candidate => fs.existsSync(candidate));
      if (!resolved || !resolved.startsWith(root + path.sep)) throw new Error('Unexpected test import ' + name);
      return load(path.relative(root, resolved));
    }
    return nativeRequire(name);
  };
  vm.runInNewContext(javascript, { module, exports: module.exports, require, URL, Intl, Date, Set, Map, console }, { filename: file });
  cache.set(file, module.exports); return module.exports;
}
const { NativeContentSite } = load('components/niche/native-content-site.tsx');
const { contentSchemas, contentMetadata } = load('lib/content-page-seo.ts');
const project = (pkg, now) => projectContentPagesV2(pkg, [pkg, nativeFixture({ siteId: 'peerqa' })], {}, { targets: [] }, now);
const html = (pkg, id, now) => { const livePages = project(pkg, now); return renderToStaticMarkup(createElement(NativeContentSite, { pkg, page: livePages.find(p => p.id === id), livePages })); };
const boundary = Date.parse('2030-01-01T00:00:00.000Z');

test('native rich positions, responsive media and all exports share exact temporal/revocation projection', () => {
  const pkg = nativeFixture(), original = JSON.stringify(pkg);
  for (const id of ['home', 'index', 'current']) assert.doesNotMatch(html(pkg, id, boundary - 1), /SLAPTAS BŪSIMAS|href="[^\"]*veliau|peerqa\.example|future\.webp/);
  const rendered = html(pkg, 'current', boundary);
  assert.match(rendered, /<h2><a[^>]+>Kitas atsakymas<\/a><\/h2>/);
  assert.match(rendered, /<ol><li><a[^>]+>Kitas atsakymas<\/a><\/li>/);
  assert.equal((rendered.match(/href="https:\/\/nativeqa\.example\/gidai\/veliau"/g) || []).length, 3);
  assert.match(rendered, /srcSet="[^\"]*640w[^\"]*1280w[^\"]*1600w"/i);
  assert.equal(JSON.stringify(pkg), original);
  pkg.pages.find(p => p.id === 'future').approval.status = 'revoked';
  assert.doesNotMatch(html(pkg, 'home', boundary), /SLAPTAS BŪSIMAS|veliau|future\.webp/);
  for (const kind of ['sitemap', 'llms', 'llms-full']) assert.doesNotMatch(contentSeoV2(pkg, project(pkg, boundary), kind).body, /\/veliau/);
});
test('guide schema, visible authors/dates/contact use approved facts and real public IDs without defaults', () => {
  const pkg = nativeFixture(), pages = project(pkg, boundary - 1), page = pages.find(p => p.id === 'current');
  const schema = contentSchemas(pkg, page, pages, { articleTypes: ['guide', 'article'], articleIndexSlug: 'gidai', articleIndexLabel: 'Bandymo puslapis index', authorProfileAnySlug: true });
  assert.equal(schema[0]['@type'], 'Article'); assert.equal(schema[0].author[0].url, 'https://nativeqa.example/redakcija');
  assert.equal(schema[0].datePublished, undefined); assert.equal(schema[0].dateModified, undefined);
  assert.equal(contentMetadata(pkg, page, false, ['guide', 'article']).openGraph.type, 'article');
  assert.deepEqual(Array.from(schema[1].itemListElement, crumb => new URL(crumb.item).pathname), ['/', '/gidai', '/gidai/dabartinis']);
  const contact = html(pkg, 'contact', boundary - 1);
  assert.match(contact, /mailto:nativeqa@example\.org/); assert.match(contact, /Bandymo organizacija/);
  assert.doesNotMatch(contact, /MB Pinet|info@pinet|<form|Užklausa gauta|__nicheInterest/);
  assert.equal(renderToStaticMarkup(createElement(NativeContentSite, { pkg: { ...pkg, site: { ...pkg.site, renderer: 'gift' } }, page, livePages: pages })), '');
});
test('new immutable release removes retired page and leaves originals and unrelated hosts intact', () => {
  const pkg = nativeFixture(), bytes = JSON.stringify(pkg), retired = retiredFixture(pkg);
  assert.equal(JSON.stringify(pkg), bytes); assert.equal(retired.pages.some(p => p.id === 'future'), false);
  assert.doesNotMatch(html(retired, 'home', boundary), /SLAPTAS BŪSIMAS|\/veliau/);
  assert.doesNotMatch(html(retired, 'current', boundary), /peerqa\.example|\/veliau/);
  assert.match(html(nativeFixture({ siteId: 'peerqa' }), 'home', boundary), /SLAPTAS BŪSIMAS/);
});
