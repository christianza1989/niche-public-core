import test from 'node:test';
import assert from 'node:assert/strict';
import {memoSelectionTotal,memoGalleryImages} from '../lib/memocasting-storefront.mjs';
const markets={markets:[{country:'LT',currency:'EUR'},{country:'PL',currency:'PLN'}]};
const item=(sku,price,extra={})=>({sku,enabled:true,available:4,prices:{LT:price,PL:price*4},package:{weightGrams:100,dimensionsMm:[10,20,30]},...extra});
test('selection total uses the actual market, quantity and eligible unique extras',()=>{
 const catalog=[item('couple',3200),item('white_paint',300,{addonFor:['couple']}),item('wooden_base',1000,{addonFor:['couple','family']})];
 assert.deepEqual(memoSelectionTotal(catalog,markets,'couple','LT',2,['white_paint','wooden_base','white_paint']),{currency:'EUR',cents:9000});
 assert.deepEqual(memoSelectionTotal(catalog,markets,'couple','PL',1,[]),{currency:'PLN',cents:12800});
 assert.equal(memoSelectionTotal(catalog,{markets:[]},'couple','LT',1),null);
});
test('stale, unrelated, unmeasured and insufficient-stock selections have no price fallback',()=>{
 const base=item('family',4800),extra=item('wooden_base',1000,{addonFor:['couple']});
 assert.equal(memoSelectionTotal([base,extra],markets,'family','LT',1,['wooden_base']),null);
 extra.addonFor=['family'];extra.package={weightGrams:100,dimensionsMm:[]};
 assert.equal(memoSelectionTotal([base,extra],markets,'family','LT',1,['wooden_base']),null);
 assert.equal(memoSelectionTotal([base],markets,'family','LT',5),null);
 assert.equal(memoSelectionTotal([base],markets,'family','LT',1.5),null);
 assert.equal(memoSelectionTotal([base],markets,'family','LT',0),null);
});
test('gallery keeps compositions separate and uses their highest admitted resolution',()=>{
 const media=[{id:'small',src:'/small.webp',width:360,height:360,alt:'Couple',credit:'Owner photograph'},{id:'large',src:'/large.webp',width:533,height:533,alt:'Couple',credit:'Owner photograph'},{id:'base',src:'/base.webp',width:400,height:400,alt:'Wooden base',credit:'Optional base'},{id:'wide',src:'/wide.webp',width:600,height:300,alt:'Couple',credit:'Context'}];
 const images=memoGalleryImages(media);assert.equal(images.length,3);assert.equal(images[0].src,'/large.webp');assert.equal(images[0].srcSet,'/small.webp 360w, /large.webp 533w');assert.equal(images[1].credit,'Optional base');assert.equal(images[2].src,'/wide.webp');assert.deepEqual(memoGalleryImages([]),[]);
});
