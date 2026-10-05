import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nicheBreadcrumbs, nicheSchemaGraph } from '../lib/niche-schema-core.mjs';
const pkg = { canonicalHost:'sample.lt', locale:'lt-LT', site:{ name:'Niša', offer:'Informacija', contact:{email:'info@pinet.lt'} } };
const guide = { slug:'gidas/dydis', type:'guide', title:'Dydis', description:'Kaip skaityti dydį', publishAt:'2026-09-30T08:00:00.000Z', approval:{approvedAt:'2026-09-30T09:00:00.000Z'}, media:[] };
test('guide breadcrumb and schema share the actual public hub, not raw future pages', () => {
  const pages = [guide, {slug:'gidai'}];
  const data = nicheSchemaGraph(pkg, guide, pages, 'MB Pinet');
  assert.deepEqual(data['@graph'].find(x=>x['@type']==='BreadcrumbList').itemListElement.map(x=>new URL(x.item).pathname), nicheBreadcrumbs(pkg,guide,pages).map(x=>x.path));
  assert.equal(nicheBreadcrumbs(pkg,guide,[guide]).length,2);
  assert.equal(nicheBreadcrumbs(pkg,{type:'home'},pages).length,1);
});
test('organization author references only an eligible profile and has consistent dates', () => {
  let article = nicheSchemaGraph(pkg,guide,[guide],'MB Pinet')['@graph'].find(x=>x['@type']==='Article');
  assert.equal(article.author.url,'https://sample.lt/');
  article = nicheSchemaGraph(pkg,guide,[guide,{slug:'redakcija'}],'MB Pinet')['@graph'].find(x=>x['@type']==='Article');
  assert.equal(article.author.name,'MB Pinet'); assert.equal(article.author['@type'],'Organization');
  assert.equal(article.author.url,'https://sample.lt/redakcija');
  assert.equal(article.datePublished,guide.publishAt); assert.equal(article.dateModified,guide.approval.approvedAt);
  assert.ok(!JSON.stringify(article).includes('Person'));
});
test('public profile links to the same organization; future schedule never predates modified', () => {
  const profile={...guide,type:'faq',slug:'redakcija'};
  const data=nicheSchemaGraph(pkg,profile,[profile],'MB Pinet');
  assert.equal(data['@graph'].find(x=>x['@type']==='ProfilePage').mainEntity['@id'], data['@graph'].find(x=>x['@type']==='Organization')['@id']);
  const future=nicheSchemaGraph(pkg,{...guide,publishAt:'2026-10-01T08:00:00.000Z'},[guide],'MB Pinet')['@graph'].find(x=>x['@type']==='Article');
  assert.equal(future.dateModified,future.datePublished);
});

test('informational utility pages do not become services through the editor bucket', () => {
  for (const slug of ['gidai', 'kontaktai', 'apie-projekta', 'redakcija', 'privatumas', 'naudojimo-salygos']) {
    const page = {...guide, type:'service', slug};
    const graph = nicheSchemaGraph(pkg, page, [page], 'MB Pinet')['@graph'];
    assert.ok(!graph.some(entity=>entity['@type']==='Service'), slug);
    assert.ok(graph.some(entity=>['WebPage','ContactPage','AboutPage','ProfilePage'].includes(entity['@type'])), slug);
  }
  const page = {...guide,type:'service',slug:'poreikio-registracija'};
  assert.ok(nicheSchemaGraph(pkg,page,[page],'MB Pinet')['@graph'].some(entity=>entity['@type']==='Service'));
});
