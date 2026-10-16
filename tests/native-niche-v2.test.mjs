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
import { commerceDestination, projectContentPagesV2, contentArticleHubV2 } from '../lib/content-projection-v2.mjs';
import { contentSeoV2 } from '../lib/content-seo-v2.mjs';
import { nativeFixture, retiredFixture, approveFixture } from './fixtures/native-niche-v2.mjs';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url))), nativeRequire = createRequire(import.meta.url), cache = new Map();
function load(relative) {
  const file = path.resolve(root, relative);
  if (cache.has(file)) return cache.get(file);
  const loadedModule = { exports: {} }; cache.set(file, loadedModule.exports);
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
  vm.runInNewContext(javascript, { module: loadedModule, exports: loadedModule.exports, require, URL, Intl, Date, Set, Map, console }, { filename: file });
  cache.set(file, loadedModule.exports); return loadedModule.exports;
}
const { NativeContentSite } = load('components/niche/native-content-site.tsx');
const { contentSchemas, contentMetadata } = load('lib/content-page-seo.ts');
const project = (pkg, now) => projectContentPagesV2(pkg, [pkg, nativeFixture({ siteId: 'peerqa' })], {}, { targets: [] }, now);
const html = (pkg, id, now) => { const livePages = project(pkg, now); return renderToStaticMarkup(createElement(NativeContentSite, { pkg, page: livePages.find(p => p.id === id), livePages })); };
const boundary = Date.parse('2030-01-01T00:00:00.000Z');

function schemasIn(rendered) {
  return JSON.parse(rendered.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
}
function breadcrumbIn(rendered) {
  return rendered.match(/<nav class="breadcrumbs"[^>]*>(.*?)<\/nav>/s)[1];
}
function addPage(pkg, originalId, id, type, slug) {
  const page = structuredClone(pkg.pages.find(item => item.id === originalId));
  Object.assign(page, { id, type, slug, title: `Bandymo puslapis ${id}` });
  pkg.pages.push(page);
  return page;
}
test('native indexes select their own identity with multiple eligible indexes', () => {
  const pkg = nativeFixture();
  addPage(pkg, 'index', 'lessons', 'index', 'pamokos');
  approveFixture(pkg);
  for (const [id, slug] of [['index', 'gidai'], ['lessons', 'pamokos']]) {
    const schema = schemasIn(html(pkg, id, boundary - 1))[0];
    assert.equal(schema['@type'], 'CollectionPage', id);
    assert.equal(schema.url, `https://nativeqa.example/${slug}`);
  }
});
test('native rich links stay on the reader origin without changing canonical projection or external destinations', () => {
  const pkg = nativeFixture();
  const current = pkg.pages.find(page => page.id === 'current');
  current.body.push({type:'richParagraph',content:[{type:'link',text:'Pirminis šaltinis',target:{kind:'external',url:'https://primary.example/source'}}]});
  approveFixture(pkg);
  const original=JSON.stringify(pkg),visible=project(pkg,boundary);
  assert.equal(visible.find(page=>page.id==='current').body[0].content[0].href,'https://nativeqa.example/gidai/veliau');
  const rendered=html(pkg,'current',boundary);
  assert.equal((rendered.match(/href="\/gidai\/veliau"/g)||[]).length,4,'three rich positions plus related navigation');
  assert.match(rendered,/<a href="https:\/\/primary\.example\/source"[^>]*>Pirminis šaltinis<\/a>/);
  assert.equal(schemasIn(rendered)[0].url,'https://nativeqa.example/gidai/dabartinis');
  assert.equal(JSON.stringify(pkg),original);
  const peer=nativeFixture({siteId:'peerqa'});
  const networkPages=projectContentPagesV2(pkg,[pkg,peer],{networkLiveDomains:[peer.canonicalHost]},{targets:[]},boundary);
  const networkHtml=renderToStaticMarkup(createElement(NativeContentSite,{pkg,page:networkPages.find(page=>page.id==='current'),livePages:networkPages}));
  assert.match(networkHtml,/href="https:\/\/peerqa\.example\/gidai\/dabartinis"/);
  const { RichContent }=load('components/content/rich-content.tsx');
  const legacy=renderToStaticMarkup(createElement(RichContent,{body:visible.find(page=>page.id==='current').body,media:[]}));
  assert.equal((legacy.match(/href="https:\/\/nativeqa\.example\/gidai\/veliau"/g)||[]).length,3,'omitted origin preserves compatibility callers');
});
test('native guide breadcrumb selects the nearest eligible nested index', () => {
  const pkg = nativeFixture();
  addPage(pkg, 'index', 'answers', 'index', 'gidai/atsakymai');
  addPage(pkg, 'current', 'nested-guide', 'guide', 'gidai/atsakymai/pasirinkimas');
  approveFixture(pkg);
  const rendered = html(pkg, 'nested-guide', boundary - 1);
  assert.deepEqual(schemasIn(rendered)[1].itemListElement.map(crumb => new URL(crumb.item).pathname), ['/', '/gidai/atsakymai', '/gidai/atsakymai/pasirinkimas']);
  assert.match(breadcrumbIn(rendered), /href="\/gidai\/atsakymai">Bandymo puslapis answers<\/a>/);
});
test('presentation preserves admitted same-origin commerce URLs with a double-slash path', () => {
  const url='https://nativeqa.example//other.example/path';
  const target={id:'approved-destination',url,verified:true,checkedAt:'2020-01-01T00:00:00Z'};
  const registry={targets:[{id:target.id,status:'ready',canonicalUrl:url,allowedQueryParams:[],verifiedAt:target.checkedAt,expiresAt:'2040-01-01T00:00:00Z'}]};
  const destination=commerceDestination(target,registry,boundary);
  assert.equal(destination,url);
  const { contentLinkHref }=load('lib/content-presentation.ts');
  assert.equal(contentLinkHref(destination,'https://nativeqa.example/gidai/dabartinis'),url,'relative // would navigate to another host');
});
test('standalone native guide never gains an unrelated index breadcrumb', () => {
  const pkg = nativeFixture();
  addPage(pkg, 'current', 'standalone', 'guide', 'sprendimas');
  approveFixture(pkg);
  const rendered = html(pkg, 'standalone', boundary - 1);
  assert.deepEqual(schemasIn(rendered)[1].itemListElement.map(crumb => new URL(crumb.item).pathname), ['/', '/sprendimas']);
  assert.doesNotMatch(breadcrumbIn(rendered), /href="\/gidai"/);
});

test('an explicit projected index relation covers a stable guide outside its URL prefix', () => {
  for (const relation of ['attached', 'related', 'richParagraph', 'richHeading', 'richList']) {
    const pkg = nativeFixture();
    addPage(pkg, 'current', 'standalone', 'guide', 'sprendimas');
    const index = pkg.pages.find(page => page.id === 'index');
    const link = {type:'link',text:'Atskiras bandymo gidas',target:{kind:'page',pageId:'standalone'}};
    if (relation === 'attached') index.links.push({targetPageId:'standalone',label:link.text});
    else if (relation === 'related') index.editorial.relatedPageIds.push('standalone');
    else index.body.push(relation === 'richList' ? {type:'richList',ordered:false,items:[[link]]}
      : {type:relation,...(relation === 'richHeading' ? {level:2} : {}),content:[link]});
    approveFixture(pkg);
    const original = JSON.stringify(pkg), renderedIndex = html(pkg, 'index', boundary - 1);
    assert.match(renderedIndex, /href="\/sprendimas"/, relation+' actual index discovery');
    const renderedGuide = html(pkg, 'standalone', boundary - 1);
    assert.deepEqual(schemasIn(renderedGuide)[1].itemListElement.map(crumb => new URL(crumb.item).pathname),
      ['/', '/gidai', '/sprendimas'], relation+' semantic breadcrumb');
    assert.match(breadcrumbIn(renderedGuide), /href="\/gidai">Bandymo puslapis index<\/a>/, relation);
    assert.equal(JSON.stringify(pkg), original, relation+' immutable input');
  }
});

test('semantic hub selection cannot borrow a foreign, hidden, unready or reverse-linked index', () => {
  const make = () => {
    const pkg = nativeFixture();
    const guide = addPage(pkg, 'current', 'standalone', 'guide', 'sprendimas');
    pkg.pages.find(page => page.id === 'index').links.push({targetPageId:guide.id,label:guide.title});
    approveFixture(pkg);return pkg;
  };
  for (const state of ['future', 'unapproved', 'revoked']) {
    const pkg = make(), index = pkg.pages.find(page => page.id === 'index');
    if (state === 'future') { index.publishAt='2040-01-01T00:00:00.000Z';approveFixture(pkg); }
    else if (state === 'unapproved') delete index.approval;
    else index.approval.status='revoked';
    const visible=project(pkg,boundary-1),guide=visible.find(page=>page.id==='standalone');
    assert.equal(contentArticleHubV2(guide,visible),null,state);
    assert.doesNotMatch(breadcrumbIn(html(pkg,'standalone',boundary-1)),/href="\/gidai"/,state);
  }
  const pkg=make(),visible=project(pkg,boundary-1),guide=visible.find(page=>page.id==='standalone');
  const foreign=project(nativeFixture({siteId:'foreignqa'}),boundary-1);
  assert.equal(contentArticleHubV2(guide,[...visible.filter(page=>page.type!=='index'),...foreign]),null,'foreign site cannot supply hub');
  assert.equal(contentArticleHubV2(guide,visible.filter(page=>page.id!==guide.id)),null,'page itself must be eligible');
  const wrongHost=visible.map(page=>page.type==='index'?{...page,url:'https://foreignqa.example/gidai'}:page);
  assert.equal(contentArticleHubV2(guide,wrongHost),null,'foreign host cannot supply hub');
  const reverse=make(),index=reverse.pages.find(page=>page.id==='index');
  index.links=[];reverse.pages.find(page=>page.id==='standalone').links.push({targetPageId:index.id,label:'Bandymo indeksas'});
  approveFixture(reverse);
  const reversed=project(reverse,boundary-1);
  assert.equal(contentArticleHubV2(reversed.find(page=>page.id==='standalone'),reversed),null,'reverse edge is insufficient');
});

test('native rich positions, responsive media and all exports share exact temporal/revocation projection', () => {
  const pkg = nativeFixture(), original = JSON.stringify(pkg);
  for (const id of ['home', 'index', 'current']) assert.doesNotMatch(html(pkg, id, boundary - 1), /SLAPTAS BŪSIMAS|href="[^\"]*veliau|peerqa\.example|future\.webp/);
  const rendered = html(pkg, 'current', boundary);
  assert.match(rendered, /<h2><a[^>]+>Kitas atsakymas<\/a><\/h2>/);
  assert.match(rendered, /<ol><li><a[^>]+>Kitas atsakymas<\/a><\/li>/);
  assert.equal((rendered.match(/href="\/gidai\/veliau"/g) || []).length, 4);
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
  assert.doesNotMatch(contact, /MB Pinet|info@pinet|Užklausa gauta/);
  assert.match(contact, /<form[^>]*action="\/uzklausa"/);
  assert.match(contact, /href="\/privatumas"/);
  assert.match(contact, /__nicheInterest/);
  const withheld=structuredClone(pkg);withheld.pages.find(p=>p.id==='privacy').publishAt='2035-01-01T00:00:00.000Z';approveFixture(withheld);
  assert.doesNotMatch(html(withheld,'contact',boundary-1),/<form|__nicheInterest/);
  assert.doesNotMatch(html(pkg,'current',boundary-1),/<form/);
  assert.equal(renderToStaticMarkup(createElement(NativeContentSite, { pkg: { ...pkg, site: { ...pkg.site, renderer: 'gift' } }, page, livePages: pages })), '');
});
test('new immutable release removes retired page and leaves originals and unrelated hosts intact', () => {
  const pkg = nativeFixture(), bytes = JSON.stringify(pkg), retired = retiredFixture(pkg);
  assert.equal(JSON.stringify(pkg), bytes); assert.equal(retired.pages.some(p => p.id === 'future'), false);
  assert.doesNotMatch(html(retired, 'home', boundary), /SLAPTAS BŪSIMAS|\/veliau/);
  assert.doesNotMatch(html(retired, 'current', boundary), /peerqa\.example|\/veliau/);
  assert.match(html(nativeFixture({ siteId: 'peerqa' }), 'home', boundary), /SLAPTAS BŪSIMAS/);
});
