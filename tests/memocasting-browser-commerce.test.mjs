import {test} from 'node:test';
import assert from 'node:assert/strict';
import {memoCommerceClient,memoCartLines,memoSaveCart,memoCartKey} from '../lib/memocasting-browser-commerce.mjs';
import {memoHeroImage} from '../lib/memocasting-homepage-images.mjs';
import {memoHomepageStory} from '../lib/memocasting-homepage-markup.mjs';

test('lightweight storefront client retains same-origin credentials and tab cart without touching order access',async()=>{
 const savedFetch=globalThis.fetch,savedStorage=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');
 const values=new Map([['commerce.production.store_memocasting','existing-order-access']]),calls=[];
 try{
  Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)}});
  globalThis.fetch=async(url,init)=>{calls.push({url,init});return new Response(JSON.stringify([{sku:'couple'}]),{headers:{'content-type':'application/json'}});};
  memoSaveCart([{sku:'couple',quantity:1,choices:{finish:'gold'}}]);
  assert.deepEqual(memoCartLines(),[{sku:'couple',quantity:1,choices:{finish:'gold'}}]);
  assert.equal(values.get('commerce.production.store_memocasting'),'existing-order-access');assert.ok(values.has(memoCartKey));
  const client=memoCommerceClient();assert.deepEqual(await client.request('/api/catalog'),[{sku:'couple'}]);
  assert.equal(calls[0].url,'/prekyba/catalog');assert.equal(calls[0].init.credentials,'same-origin');assert.equal(calls[0].init.cache,'no-store');
  await assert.rejects(client.request('https://other.invalid/api/catalog'));assert.equal(calls.length,1);
 }finally{globalThis.fetch=savedFetch;if(savedStorage)Object.defineProperty(globalThis,'sessionStorage',savedStorage);else delete globalThis.sessionStorage;}
});
test('early responsive hero preload describes the exact rendered source and sizes',()=>{
 const tag=memoHomepageStory.match(/<img class="hero-image"[^>]*>/)?.[0];assert.ok(tag);
 for(const [attribute,value]of [['src',memoHeroImage.src],['srcset',memoHeroImage.srcSet],['sizes',memoHeroImage.sizes]])assert.equal(tag.match(new RegExp('\\b'+attribute+'="([^"]+)"'))?.[1],value);
});
