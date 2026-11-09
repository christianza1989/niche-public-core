import {test} from 'node:test';
import assert from 'node:assert/strict';
import {memoIsGiftCollection,memoGiftCollectionProducts,memoGiftCollectionsForGuide,memoGiftCollectionsForIndex} from '../lib/memocasting-gift-collections.mjs';
import {memoBreadcrumbs,memoSchemaGraph} from '../lib/memocasting-structure.mjs';
import {projectPublicPages} from '../lib/niche-links.mjs';

const date='2026-11-09T00:00:00.000Z';
const page=(slug,type='service')=>({id:slug,slug,type,title:slug||'Pradžia',description:'Puslapio aprašymas',body:[],media:[],links:[],revisionHash:'approved',publishAt:date,approval:{status:'approved',revisionHash:'approved',approvedAt:date}});
const home=page('','home'),hub=page('dovanos','faq'),collection=page('dovanos/moterims');
const couple=page('rinkinys-porai','product'),family=page('seimos-rinkinys','product');
const pkg={siteId:'memocasting',schemaVersion:1,canonicalHost:'memocasting.lt',locale:'lt-LT',site:{name:'Memory Casting',offer:'Rinkiniai',contact:{email:'info@memorycasting.lt'}}};

test('only explicitly selected local service pages acquire collection presentation',()=>{
 assert.equal(memoIsGiftCollection(collection),true);
 for(const other of [page('dovanos'),page('gidai/dovanos-moterims','guide'),page('dovanos/moterims','guide'),page('pl/dovanos/moterims'),page('dovanos/nenumatyta'),undefined])assert.equal(memoIsGiftCollection(other),false);
});

test('planned recipient and occasion collections use eligible real products only',()=>{
 const slugs=['dovanos/vyrams','dovanos/mamai','dovanos/valentino-dienai','dovanos/porai','dovanos/seimai','dovanos/kaledoms/mamai','dovanos/kaledoms/moterims','dovanos/kaledoms/vyrams','dovanos/kaledoms/seimai','dovanos/kaledoms/tevams','dovanos/personalizuotos','dovanos/originalios','dovanos/seneliui','dovanos/mociutei','dovanos/mamos-dienai','dovanos/gimtadieniui/vyrui','dovanos/gimtadieniui/mamai','dovanos/gimtadieniui/moterims'];
 assert.equal(new Set(slugs).size,18);
 for(const slug of slugs){
  const candidate=page(slug),live=[home,hub,candidate,couple,family];
  assert.equal(memoIsGiftCollection(candidate),true,slug);
  assert.equal(memoIsGiftCollection(page(slug,'guide')),false,slug);
  assert.deepEqual(memoGiftCollectionProducts(candidate,live).map(p=>p.slug),['rinkinys-porai','seimos-rinkinys'],slug);
  const graph=memoSchemaGraph(pkg,candidate,live,'MB Memocasting')['@graph'];
  assert.deepEqual(graph.find(item=>item['@type']==='CollectionPage').hasPart.map(item=>new URL(item.url).pathname),['/rinkinys-porai','/seimos-rinkinys'],slug);
 }
});

test('cards and CollectionPage schema use exactly the same eligible two products',()=>{
 const privateProduct={...family,revisionHash:'changed'};
 const laterProduct={...family,publishAt:'2026-11-10T00:00:00.000Z'};
 for(const excluded of [privateProduct,laterProduct]){
  const source={...pkg,pages:[home,hub,collection,couple,excluded,page('products/kudikio-pedutes','product')]};
  const live=projectPublicPages(source,[source],{},Date.parse('2026-11-09T12:00:00Z'));
  const products=memoGiftCollectionProducts(collection,live);
  assert.deepEqual(products.map(p=>p.slug),['rinkinys-porai']);
  const graph=memoSchemaGraph(source,collection,live,'MB Memocasting')['@graph'];
  const collectionSchema=graph.find(item=>item['@type']==='CollectionPage');
  assert.deepEqual(collectionSchema.hasPart.map(item=>new URL(item.url).pathname),products.map(p=>'/'+p.slug));
  assert.equal(graph.some(item=>item['@type']==='Service'),false);
  assert.equal(graph.some(item=>['Product','Offer','AggregateRating'].includes(item['@type'])),false);
 }
 const full=[home,hub,collection,couple,family,page('products/kudikio-pedutes','product')];
 assert.deepEqual(memoGiftCollectionProducts(collection,full).map(p=>p.slug),['rinkinys-porai','seimos-rinkinys']);
});

test('visible breadcrumbs and JSON-LD agree and omit an unavailable gift hub',()=>{
 for(const [pages,expected] of [[[home,hub,collection],['/','/dovanos','/dovanos/moterims']],[[home,collection],['/','/dovanos/moterims']]]){
  const visible=memoBreadcrumbs(pkg,collection,pages).map(item=>item.path);
  const graph=memoSchemaGraph(pkg,collection,pages,'MB Memocasting')['@graph'];
  const schema=graph.find(item=>item['@type']==='BreadcrumbList').itemListElement.map(item=>new URL(item.item).pathname);
  assert.deepEqual(visible,expected);assert.deepEqual(schema,expected);
 }
});

test('Christmas collection shares live kit selection and breadcrumbs without affecting the guide',()=>{
 const christmas=page('dovanos/kaledoms'),guide=page('gidai/kaledines-dovanos','guide');
 assert.equal(memoIsGiftCollection(christmas),true);
 assert.equal(memoIsGiftCollection(guide),false);
 const live=[home,hub,christmas,guide,couple,family,page('products/kudikio-pedutes','product')];
 const products=memoGiftCollectionProducts(christmas,live);
 assert.deepEqual(products.map(p=>p.slug),['rinkinys-porai','seimos-rinkinys']);
 const graph=memoSchemaGraph(pkg,christmas,live,'MB Memocasting')['@graph'];
 assert.deepEqual(graph.find(item=>item['@type']==='CollectionPage').hasPart.map(item=>new URL(item.url).pathname),products.map(p=>'/'+p.slug));
 assert.deepEqual(memoBreadcrumbs(pkg,christmas,live).map(item=>item.path),['/','/dovanos','/dovanos/kaledoms']);
 assert.equal(graph.some(item=>['Service','Product','Offer','AggregateRating'].includes(item['@type'])),false);
});

test('guide and gift index link only to eligible collection revisions',()=>{
 const guide=page('gidai/dovanos-mamai','guide');
 const mom=page('dovanos/mamai'),birthday=page('dovanos/gimtadieniui/mamai');
 const future={...birthday,publishAt:'2026-12-10T00:00:00.000Z'};
 const source={...pkg,pages:[home,hub,guide,mom,future,couple,family]};
 const before=projectPublicPages(source,[source],{},Date.parse('2026-11-09T12:00:00Z'));
 assert.deepEqual(memoGiftCollectionsForGuide(guide,before).map(p=>p.slug),['dovanos/mamai']);
 assert.deepEqual(memoGiftCollectionsForIndex(hub,before).map(p=>p.slug),['dovanos/mamai']);
 assert.deepEqual(memoGiftCollectionsForGuide(page('gidai/nesusijes','guide'),before),[]);
 const after=projectPublicPages(source,[source],{},Date.parse('2026-12-11T12:00:00Z'));
 assert.deepEqual(memoGiftCollectionsForGuide(guide,after).map(p=>p.slug),['dovanos/mamai','dovanos/gimtadieniui/mamai']);
 assert.deepEqual(memoGiftCollectionsForIndex(hub,after).map(p=>p.slug),['dovanos/mamai','dovanos/gimtadieniui/mamai']);
});
