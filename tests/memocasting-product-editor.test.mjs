import test from 'node:test';
import assert from 'node:assert/strict';
import {memoApplyProductContent,memoDescriptionBlocks} from '../lib/memocasting-product-content.mjs';
import {memoNormalizeCart} from '../lib/memocasting-cart.mjs';
import {resolveCatalogSelection,selectionKey} from '../vendor/commerce-core/commerce-client.mjs';
import {relayMemoBuyer} from '../lib/memocasting-commerce-bridge.mjs';
test('published LT product projection keeps page admission/URL/dates and leaves articles unchanged',()=>{
 const page={slug:'rinkinys-porai',publishAt:'2026-10-13',revisionHash:'approved',title:'Original',description:'Original description',body:[],media:[]};
 const product={sku:'couple',title:'Savininko pavadinimas',content:{summary:'Trumpas aprašymas',description:'## Kaip naudoti?\n\nPirma pastraipa.\n\n- Pirmas\n- Antras',contents:'Alginatas\nGipsas',seoTitle:'Google antraštė',seoDescription:'Google aprašymas',images:[{id:'img_1',src:'/prekyba/catalog-media/img_1',alt:'Rankų liejinys',width:1000,height:1000}]}};
 const projected=memoApplyProductContent(page,product);
 assert.equal(projected.slug,page.slug);assert.equal(projected.publishAt,page.publishAt);assert.equal(projected.revisionHash,page.revisionHash);
 assert.equal(projected.title,product.title);assert.equal(projected.seoTitle,'Google antraštė');assert.equal(projected.body[0].type,'heading');assert.equal(projected.body[2].type,'list');assert.equal(projected.media[0].src,product.content.images[0].src);
 const future={...page,slug:'gidai/future',publishAt:'2030-01-01'};assert.equal(memoApplyProductContent(future,product),future);
 assert.deepEqual(memoDescriptionBlocks('<script>alert(1)</script>'),[{type:'paragraph',text:'<script>alert(1)</script>'}]);
});
test('adapter storage preserves mixed configurations and complete-combination image takes precedence',()=>{
 const white={sku:'couple',quantity:1,choices:{finish:'white'}},gold={sku:'couple',quantity:2,choices:{finish:'gold',base:'wood'}};
 const lines=memoNormalizeCart([white,gold,{...gold,quantity:1}]);assert.equal(lines.length,2);assert.equal(lines[1].quantity,3);assert.notEqual(selectionKey(lines[0]),selectionKey(lines[1]));
 const image={id:'gold_wood',src:'/images/gold-wood.webp',choices:{finish:'gold',base:'wood'}};
 const product={prices:{LT:3200,PL:13900},content:{images:[{id:'white'},image]},optionGroups:[{id:'finish',label:'Spalva',defaultValue:'white',values:[{id:'white',label:'Balta',enabled:true,prices:{LT:0}},{id:'gold',label:'Auksinė',enabled:true,prices:{LT:300}}]},{id:'base',label:'Padėklas',defaultValue:'none',values:[{id:'none',label:'Be padėklo',enabled:true,prices:{LT:0}},{id:'wood',label:'Medinis',enabled:true,prices:{LT:1200}}]}]};
 const configured=resolveCatalogSelection(product,'LT',gold.choices);assert.equal(configured.amount,4700);assert.equal(configured.image.id,'gold_wood');
 assert.equal(resolveCatalogSelection(product,'PL',{}).amount,13900);
});
test('published image proxy preserves WebP type and refuses private editor/image writes',async()=>{
 const options={siteId:'memocasting',host:'memocasting.lt',cfTrusted:true,service:{fetch:async()=>new Response(new Uint8Array([1,2]),{headers:{'content-type':'image/webp'}})}};
 const request=new Request('https://memocasting.lt/prekyba/catalog-media/img_1',{headers:{'cf-connecting-ip':'203.0.113.1'}});
 const response=await relayMemoBuyer(request,'catalog-media/img_1',options);assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/webp');assert.equal(response.headers.get('x-content-type-options'),'nosniff');
 assert.equal((await relayMemoBuyer(request,'operator/catalog-drafts',options)).status,404);
 assert.equal((await relayMemoBuyer(new Request(request,{method:'POST'}),'catalog-media/img_1',options)).status,405);
});
