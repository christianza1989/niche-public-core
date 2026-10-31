import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {hostingerAssetHeaders} from '../lib/hostinger-asset-headers.mjs';
import {kvapunaikinimasImageSrcSet} from '../lib/kvapunaikinimas-image-delivery.mjs';
import {kvapunaikinimasDeliverySrc,kvapunaikinimasDeliveryCss} from '../lib/kvapunaikinimas-asset-delivery.mjs';
import {fullyPublicDeliveryPages} from '../scripts/hostinger-static-assets.mjs';

test('long browser lifetimes cover immutable media and versioned fonts only',()=>{
 const rules=hostingerAssetHeaders();
 assert.equal(rules.length,2);
 assert.match(rules[0].source,/content-assets/);
 assert.deepEqual(rules[1].has,[{type:'query',key:'v',value:'[a-f0-9]{12}'}]);
 for(const r of rules)assert.equal(r.headers[0].value,'public, max-age=31536000, immutable');
 assert.equal(rules.some(r=>/lead|niche|:path\*/.test(r.source)),false);
});

test('delivery addresses preserve original/foreign inputs and only rewrite isolated font CSS',()=>{
 const src='/content-assets/kvapunaikinimas/c1485cdd-ddcc-4920-8565-f7b002c9f62f.webp';
 assert.equal(kvapunaikinimasDeliverySrc(src,false),src);
 assert.equal(kvapunaikinimasDeliverySrc(src,true),'/_next/static/niche-assets/kvapunaikinimas/c1485cdd-ddcc-4920-8565-f7b002c9f62f.webp');
 for(const s of ['/api/private','https://other.invalid'+src,'/content-assets/other/a.webp'])assert.equal(kvapunaikinimasDeliverySrc(s,true),s);
 const css=".keep{color:red}@font-face{src:url('/fonts/kvapunaikinimas/open-sans-latin.woff2?v=d8e4fe0452aa')}";
 assert.equal(kvapunaikinimasDeliveryCss(css),".keep{color:red}@font-face{src:url('/_next/static/niche-assets/kvapunaikinimas/open-sans-latin-d8e4fe0452aa.woff2')}");
});

test('managed static delivery fails closed on future, revoked, mismatched or paused revisions',()=>{
 const now=Date.parse('2026-10-31T12:00:00Z'),p={id:'home',type:'home',slug:'',publishAt:'2026-10-29T12:00:00Z',revisionHash:'same',approval:{status:'approved',revisionHash:'same'},links:[],media:[]};
 const pkg={siteId:'kvapunaikinimas',canonicalHost:'kvapunaikinimas.lt',pages:[p]};
 assert.equal(fullyPublicDeliveryPages(pkg,{},now).length,1);
 for(const change of [{publishAt:'2027-01-01T00:00:00Z'},{approval:{status:'revoked',revisionHash:'same'}},{revisionHash:'changed'}])assert.throws(()=>fullyPublicDeliveryPages({...pkg,pages:[{...p,...change}]},{},now),/fully_public/);
 assert.throws(()=>fullyPublicDeliveryPages({...pkg,schemaVersion:1,pages:[{...p,type:'guide'}]},{guidePublicationPausedAtBySite:{kvapunaikinimas:'2026-10-28T12:00:00.000Z'}},now),/fully_public/);
});

test('circular delivery preserves high-DPI candidate, original and target isolation',()=>{
 const asset={src:'/content-assets/kvapunaikinimas/c1485cdd-ddcc-4920-8565-f7b002c9f62f.webp',width:500,height:500};
 const before=JSON.stringify(asset),result=kvapunaikinimasImageSrcSet(asset,true);
 assert.match(result,/w=300&q=85 300w/);assert.match(result,/w=500&q=85 500w/);
 assert.equal(new URL(result.split(' ')[0],'https://kvapunaikinimas.lt').searchParams.get('url'),'https://kvapunaikinimas.lt'+asset.src);
 assert.equal(JSON.stringify(asset),before);
 assert.equal(kvapunaikinimasImageSrcSet(asset,false),undefined);
 for(const src of ['https://external.invalid/a.webp','/content-assets/other/a.webp','/api/private'])assert.equal(kvapunaikinimasImageSrcSet({...asset,src},true),undefined);
 assert.equal(kvapunaikinimasImageSrcSet({...asset,width:300},true),undefined);
});

test('font cache-busting versions match unchanged local bytes and both font references',async()=>{
 const css=await readFile(new URL('../components/niche/kvapunaikinimas-site.module.css',import.meta.url),'utf8');
 const component=await readFile(new URL('../components/niche/kvapunaikinimas-site.tsx',import.meta.url),'utf8');
 for(const name of ['open-sans-latin','open-sans-latin-ext','open-sans-italic-latin','open-sans-italic-latin-ext']){
  const bytes=await readFile(new URL(`../public/fonts/kvapunaikinimas/${name}.woff2`,import.meta.url));
  const version=createHash('sha256').update(bytes).digest('hex').slice(0,12);
  const url=`/fonts/kvapunaikinimas/${name}.woff2?v=${version}`;
  assert.ok(css.includes(url),`font-face ${name}`);assert.ok(component.includes(url),`preload ${name}`);
 }
});
