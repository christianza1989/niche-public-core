import {test} from 'node:test';
import assert from 'node:assert/strict';
import {memoIsGiftCollection,memoGiftCollectionProducts} from '../lib/memocasting-gift-collections.mjs';
import {memoBreadcrumbs,memoSchemaGraph} from '../lib/memocasting-structure.mjs';
import {projectPublicPages} from '../lib/niche-links.mjs';

const date='2026-11-09T00:00:00.000Z';
const page=(slug,type='service')=>({id:slug,slug,type,title:slug||'Pradžia',description:'Puslapio aprašymas',body:[],media:[],links:[],revisionHash:'approved',publishAt:date,approval:{status:'approved',revisionHash:'approved',approvedAt:date}});
const home=page('','home'),hub=page('dovanos','faq'),collection=page('dovanos/moterims');
const couple=page('rinkinys-porai','product'),family=page('seimos-rinkinys','product');
const pkg={siteId:'memocasting',schemaVersion:1,canonicalHost:'memocasting.lt',locale:'lt-LT',site:{name:'Memory Casting',offer:'Rinkiniai',contact:{email:'info@memorycasting.lt'}}};

test('only explicitly selected local service pages acquire collection presentation',()=>{
 assert.equal(memoIsGiftCollection(collection),true);
 for(const other of [page('dovanos'),page('gidai/dovanos-moterims','guide'),page('dovanos/moterims','guide'),page('pl/dovanos/moterims'),page('dovanos/vyrams'),undefined])assert.equal(memoIsGiftCollection(other),false);
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
