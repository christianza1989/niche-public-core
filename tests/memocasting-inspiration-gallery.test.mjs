import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {memoInspirationItems,memoGallerySelection,memoGalleryStep,memoGallerySwipe} from '../lib/memocasting-inspiration-gallery.mjs';
import {memoHomepageAsset} from '../lib/memocasting-homepage-assets.mjs';
import {projectPublicPages} from '../lib/niche-links.mjs';
import {memoHomepageBlocks} from '../lib/memocasting-homepage-markup.mjs';

test('a category change never retains a hidden selection, including one-photo and empty categories',()=>{
 const pair=memoGallerySelection(memoInspirationItems,'couple','family');
 assert.equal(pair.images.length,2);assert.equal(pair.image.id,'promise');assert.equal(pair.index,0);
 const family=memoGallerySelection(memoInspirationItems,'family','heart');
 assert.equal(family.images.length,1);assert.equal(family.image.id,'family');
 assert.equal(memoGalleryStep(memoInspirationItems,'family','family',1),'family');
 assert.equal(memoGallerySelection(memoInspirationItems,'missing','family').image,null);
 assert.equal(memoGalleryStep([],'all','missing',-1),null);
});
test('previous and next wrap only within the selected category',()=>{
 assert.equal(memoGalleryStep(memoInspirationItems,'all','family',-1),'heart');
 assert.equal(memoGalleryStep(memoInspirationItems,'couple','heart',1),'promise');
 assert.equal(memoGalleryStep(memoInspirationItems,'couple','promise',-1),'heart');
});
test('horizontal swipe distinguishes vertical page scroll, small movement and a held gesture',()=>{
 const start={x:250,y:100,time:1000};
 assert.equal(memoGallerySwipe(start,{x:130,y:105,time:1200}),1);
 assert.equal(memoGallerySwipe(start,{x:350,y:105,time:1200}),-1);
 for(const end of [{x:240,y:101,time:1200},{x:180,y:300,time:1200},{x:100,y:105,time:3000}])assert.equal(memoGallerySwipe(start,end),0);
 assert.equal(memoGallerySwipe(null,{x:100,y:0,time:1200}),0);
});
test('all gallery derivatives are actual WebP, below original dimensions and gated with the exact homepage',async()=>{
 const home={id:'home',slug:'',type:'home',body:memoHomepageBlocks,media:[],links:[],publishAt:'2026-10-01T00:00:00Z',revisionHash:'gallery',approval:{status:'approved',revisionHash:'gallery'}},pkg={siteId:'memocasting',pages:[home]};
 for(const item of memoInspirationItems){
  assert.equal(item.variants.length,5);assert.equal(item.width,1254);assert.equal(item.height,1254);
  for(const v of item.variants){const bytes=await fs.readFile(new URL('../public'+v.src,import.meta.url));assert.equal(bytes.subarray(8,12).toString(),'WEBP');assert.ok(v.width<=1254);assert.equal(v.width,v.height);assert.ok(memoHomepageAsset(pkg,[home],v.src));assert.equal(memoHomepageAsset({...pkg,siteId:'other'},[home],v.src),null);const future={...pkg,pages:[{...home,publishAt:'2030-01-01T00:00:00Z'}]};assert.equal(memoHomepageAsset(future,projectPublicPages(future,[future],{},Date.parse('2026-10-15T00:00:00Z')),v.src),null);}
 }
});
