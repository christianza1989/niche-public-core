import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {hostingerAssetHeaders} from '../lib/hostinger-asset-headers.mjs';
import {kvapunaikinimasImageSrcSet} from '../lib/kvapunaikinimas-image-delivery.mjs';

test('long browser lifetimes cover immutable media and versioned fonts only',()=>{
 const rules=hostingerAssetHeaders();
 assert.equal(rules.length,2);
 assert.match(rules[0].source,/content-assets/);
 assert.deepEqual(rules[1].has,[{type:'query',key:'v',value:'[a-f0-9]{12}'}]);
 for(const r of rules)assert.equal(r.headers[0].value,'public, max-age=31536000, immutable');
 assert.equal(rules.some(r=>/lead|niche|:path\*/.test(r.source)),false);
});

test('circular delivery preserves high-DPI candidate, original and target isolation',()=>{
 const asset={src:'/content-assets/kvapunaikinimas/c1485cdd-ddcc-4920-8565-f7b002c9f62f.webp',width:500,height:500};
 const before=JSON.stringify(asset),result=kvapunaikinimasImageSrcSet(asset,true);
 assert.match(result,/w=300&q=85 300w/);assert.match(result,/w=500&q=85 500w/);
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
