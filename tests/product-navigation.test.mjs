import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { productCatalogue, productNavigation, productNavigationText, validateProductCatalogue } from '../lib/product-navigation.mjs';
import { projectPublicPages } from '../lib/niche-links.mjs';
import { nicheBreadcrumbs, nicheSchemaGraph } from '../lib/niche-schema-core.mjs';
const now = Date.parse('2026-10-21T12:00:00.000Z');
const make = (id, type, slug, title = id, extra = {}) => ({ id, siteId:'promedical', type, slug, title, description:id, intent:`Katalogo kodas: ${id} | test`, body:[], links:[], media:[], revisionHash:id, publishAt:'2026-10-01T00:00:00.000Z', approval:{ status:'approved', revisionHash:id, approvedAt:'2026-10-01T00:00:00.000Z' }, ...extra });
const a = make('a','product','produktai/a','Vežimėlis ZV2234N/PZ');
const cat = make('cat','faq','kategorijos/vezimeliai');
const sibling = (id, title=id) => make(id,'product',`produktai/${id}`,title);
const guide = (id, extra={}) => make(id,'guide',`gidai/${id}`,id,{links:[{targetPageId:a.id,label:a.title}],...extra});
const pkgFor = pages => ({ siteId:'promedical',canonicalHost:'promedical.lt',locale:'lt-LT',site:{name:'Promedical',offer:'Įranga',contact:{email:'test@example.com'}},pages });
const registry = (products, more={}) => ({ version:1, siteId:'promedical',sourceSha256:'a'.repeat(64), products:Object.fromEntries(products.map(p=>[p.id,{model:p.id==='a'?'ZV2234N-PZ':p.id==='variant'?'ZV2234N':p.id==='near'?'ZV2235N':p.id,categoryIds:['cat']}])) ,...more});
const project = (pkg,time=now,settings={}) => projectPublicPages(pkg,[pkg],settings,time);

test('catalog classification survives absent or misleading editorial category links', () => {
  const wrong = make('wrong','faq','kategorijos/kita');
  const source = {...a,links:[{targetPageId:wrong.id,label:wrong.title}]};
  const pages = [source,cat,wrong,sibling('b'),sibling('c'),sibling('d')];
  const pkg = pkgFor(pages), catalog = registry(pages.filter(p=>p.type==='product'));
  const before = JSON.stringify(pkg);
  const nav = productNavigation(pkg,source,project(pkg),catalog);
  assert.equal(nav.category.id,cat.id);
  assert.deepEqual(nav.related.map(x=>x.kind),['category','product','product','product']);
  assert.equal(productCatalogue(pkg,project(pkg),catalog).byCategory.get(cat.id).length,4);
  assert.equal(JSON.stringify(pkg),before,'approved content is never rewritten');
});

test('same model variants rank before nearby model numbers; five slots reserve two incoming guides', () => {
  const pages=[a,cat,sibling('near',a.title),sibling('variant','Kitas to paties modelio variantas'),sibling('z'),guide('g2'),guide('g1'),guide('g3'),make('unrelated','guide','gidai/unrelated')];
  const pkg=pkgFor(pages),catalog=registry(pages.filter(p=>p.type==='product'));
  const nav=productNavigation(pkg,a,project(pkg),catalog);
  assert.equal(nav.related[1].id,'variant');
  assert.equal(nav.related.length,5);
  assert.equal(nav.related.filter(x=>x.kind==='product').length,2);
  assert.deepEqual(nav.related.filter(x=>x.kind==='guide').map(x=>x.id),['g1','g2']);
  assert.ok(!nav.related.some(x=>x.id==='a'||x.id==='unrelated'));
});

test('numeric and compound model variants outrank similar titles without merging model years', () => {
  const pages=[a,cat,sibling('variant','Kitoks aprašytas variantas'),sibling('near',a.title)];
  const pkg=pkgFor(pages),catalog=registry(pages.filter(p=>p.type==='product'));
  for (const [own,variant,near] of [['11110PL','11110L','11109PL'],['48-20-VE','48-20-VA','48-21-VE'],['CN11/18VB','CN11/18VA','CN11/19VB'],['XMK50-60M','XMK50-60ML','XMK50-62M']]) {
    const revision=structuredClone(catalog);
    revision.products.a.model=own;revision.products.variant.model=variant;revision.products.near.model=near;
    const nav=productNavigation(pkg,a,project(pkg),revision);
    assert.equal(nav.related[1].id,'variant',own);
  }
});

test('sparse leaf uses its populated catalog parent and every recommendation belongs to the displayed category', () => {
  const leaf=make('leaf','faq','kategorijos/vezimeliai/retas-modelis');
  const pages=[a,cat,leaf,sibling('variant'),sibling('near'),sibling('z')];
  const pkg=pkgFor(pages),catalog=registry(pages.filter(p=>p.type==='product'));
  catalog.products.a.categoryIds=['leaf','cat'];
  const live=project(pkg),nav=productNavigation(pkg,a,live,catalog),index=productCatalogue(pkg,live,catalog);
  assert.equal(nav.category.id,'cat');
  assert.equal(nav.related[0].id,nav.category.id);
  for(const link of nav.related.filter(x=>x.kind==='product')) assert.ok(index.byCategory.get(nav.category.id).some(p=>p.id===link.id));
  assert.equal(nav.related.filter(x=>x.kind==='product').length,3);
});

test('request-clock publication, approval revocation and paused guides affect the same navigation projection', () => {
  const future=guide('future',{publishAt:new Date(now+1000).toISOString()});
  const held=guide('held',{publishAt:new Date(now-100).toISOString()});
  const rejected=guide('rejected',{approval:{status:'approved',revisionHash:'older'}});
  const pages=[a,cat,sibling('b'),sibling('c'),future,held,rejected];
  const pkg=pkgFor(pages),catalog=registry(pages.filter(p=>p.type==='product'));
  const links=(t,settings={})=>productNavigation(pkg,a,project(pkg,t,settings),catalog).related.map(x=>x.id);
  assert.ok(!links(now).includes('future'));
  assert.ok(links(now+1000).includes('future'));
  assert.ok(!links(now+1000).includes('rejected'));
  const settings={guidePublicationPausedAtBySite:{promedical:new Date(now-500).toISOString()}};
  assert.ok(!links(now+1000,settings).includes('held'));
  future.approval.status='revoked';
  assert.ok(!links(now+1000).includes('future'));
});

test('new eligible catalog category and guide appear without changing the product revision', () => {
  const futureCat=make('cat','faq','kategorijos/vezimeliai',cat.title,{publishAt:new Date(now+1000).toISOString()});
  const futureGuide=guide('future',{publishAt:new Date(now+1000).toISOString()});
  const pages=[a,futureCat,sibling('b'),sibling('c'),futureGuide];
  const pkg=pkgFor(pages),catalog=registry(pages.filter(p=>p.type==='product')),bytes=JSON.stringify(a);
  assert.equal(productNavigation(pkg,a,project(pkg,now),catalog).category,null);
  const live=project(pkg,now+1000),nav=productNavigation(pkg,a,live,catalog);
  assert.equal(nav.category.id,'cat');assert.ok(nav.related.some(x=>x.id==='future'));
  assert.equal(JSON.stringify(a),bytes);
  const text=productNavigationText(pkg,a,live,catalog).join('\n');
  for(const x of nav.related)assert.ok(text.includes(`href="https://promedical.lt${x.href}"`));
  assert.ok(!text.includes('undefined'));
});

test('a newly published incoming guide enters even when all five related slots were already occupied', () => {
  const future=guide('z-new',{publishAt:new Date(now+1000).toISOString()});
  const pages=[a,cat,sibling('b'),sibling('c'),sibling('d'),guide('g1'),guide('g2'),future];
  const pkg=pkgFor(pages),catalog=registry(pages.filter(p=>p.type==='product')),bytes=JSON.stringify(a);
  const old=productNavigation(pkg,a,project(pkg,now),catalog).related;
  assert.equal(old.length,5);assert.ok(!old.some(x=>x.id===future.id));
  const current=productNavigation(pkg,a,project(pkg,now+1000),catalog).related;
  assert.equal(current.length,5);assert.equal(current.filter(x=>x.kind==='guide')[0].id,future.id);
  assert.equal(JSON.stringify(a),bytes);
});

test('self, duplicate, foreign and invalid route targets never become navigation links', () => {
  const pages=[a,cat,sibling('b'),{...sibling('foreign'),siteId:'other'},sibling('bad'),guide('self')];
  pages.find(p=>p.id==='bad').slug='produktai/../private';
  const catalog=registry(pages.filter(p=>p.type==='product'));
  const pkg=pkgFor(pages),nav=productNavigation(pkg,a,project(pkg),catalog);
  assert.deepEqual(nav.related.map(x=>x.id),['cat','b','self']);
  assert.equal(new Set(nav.related.map(x=>x.href)).size,nav.related.length);
  assert.deepEqual(productNavigation({...pkg,canonicalHost:'foreign.lt'},a,project(pkg),catalog),{category:null,related:[]});
});

test('sparse groups do not invent siblings; catalog compiler rejects dangling categories', () => {
  const pkg=pkgFor([a,cat]),catalog=registry([a]);
  assert.equal(productNavigation(pkg,a,project(pkg),catalog).related.length,1);
  validateProductCatalogue(catalog,pkg);
  assert.throws(()=>validateProductCatalogue({...catalog,products:{}},pkg),/assignment/);
  assert.throws(()=>validateProductCatalogue({...catalog,products:{a:{model:'a',categoryIds:['missing']}}},pkg),/category/);
});

test('a hidden category cannot hide an otherwise public incoming guide from the reading export', () => {
  const pkg=pkgFor([a,guide('g')]),catalog=registry([a]),pages=project(pkg);
  const nav=productNavigation(pkg,a,pages,catalog);
  assert.equal(nav.category,null);assert.equal(nav.related[0].id,'g');
  const text=productNavigationText(pkg,a,pages,catalog).join('\n');
  assert.ok(text.includes('href="https://promedical.lt/gidai/g"'));
  assert.ok(!text.includes('kategorijos/'));
});

test('all production catalog IDs validate and default breadcrumb matches its JSON-LD', () => {
  const pkg=JSON.parse(readFileSync(new URL('../content-packages/promedical/content-package.json',import.meta.url)));
  const catalog=JSON.parse(readFileSync(new URL('../config/promedical-catalogue.json',import.meta.url)));
  validateProductCatalogue(catalog,pkg);
  const pages=project(pkg),page=pages.find(p=>p.id==='f029fd54-1671-4255-bc25-bbf009b41dfa');
  assert.equal(Object.keys(catalog.products).length,1408);
  const trail=nicheBreadcrumbs(pkg,page,pages);
  assert.equal(trail.length,3);assert.ok(trail[1].path.startsWith('/kategorijos/'));
  const schema=nicheSchemaGraph(pkg,page,pages,'Promedical')['@graph'].find(x=>x['@type']==='BreadcrumbList');
  assert.deepEqual(schema.itemListElement.map(x=>new URL(x.item).pathname),trail.map(x=>x.path));
});
