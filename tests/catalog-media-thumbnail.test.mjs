import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogThumbnailUrl} from '../lib/catalog-media-thumbnail.mjs';
import {relayMemoBuyer} from '../lib/memocasting-commerce-bridge.mjs';
const id='img_'+'a'.repeat(64),path='catalog-media/'+id;
test('only owned catalogue image paths request the bounded thumbnail',()=>{
 assert.equal(catalogThumbnailUrl('/prekyba/'+path),'/prekyba/'+path+'?size=192');
 for(const src of ['/images/legacy.webp','https://other.example/'+id,'/prekyba/catalog-media/foreign','/prekyba/'+path+'?other=1'])assert.equal(catalogThumbnailUrl(src),src);
});
test('GET and HEAD forward size192 and discard arbitrary media queries; invalid size rejected before upstream',async()=>{
 const calls=[],options={siteId:'memocasting',host:'localhost',loopbackOrigin:'http://127.0.0.1:8827',fetchImpl:async request=>{calls.push(request);return new Response('webp',{headers:{'content-type':'image/webp'}});}};
 const response=await relayMemoBuyer(new Request('http://localhost/prekyba/'+path+'?size=192&secret=discard'),path,options);
 assert.equal(response.status,200);assert.equal(new URL(calls[0].url).search,'?size=192');assert.equal(await response.text(),'webp');
 const head=await relayMemoBuyer(new Request('http://localhost/prekyba/'+path+'?size=192',{method:'HEAD'}),path,options);
 assert.equal(head.status,200);assert.equal(calls[1].method,'GET');assert.equal(new URL(calls[1].url).search,'?size=192');assert.equal(await head.text(),'');
 assert.equal((await relayMemoBuyer(new Request('http://localhost/prekyba/'+path+'?size=4096'),path,options)).status,400);assert.equal(calls.length,2);
});
