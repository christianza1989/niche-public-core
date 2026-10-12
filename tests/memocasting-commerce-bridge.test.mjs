import test from 'node:test';
import assert from 'node:assert/strict';
import {relayMemoBuyer} from '../lib/memocasting-commerce-bridge.mjs';
const source=(path='orders',headers={})=>new Request('https://memocasting.lt/prekyba/'+path,{method:'POST',headers:{origin:'https://memocasting.lt','cf-connecting-ip':'203.0.113.12','content-type':'application/json',...headers},body:'{}'});
test('private production binding preserves admitted URL/origin and only buyer headers',async()=>{
 let called;const service={fetch:async request=>{called=request;return Response.json({productionReady:false,publishOffers:false});}};
 const response=await relayMemoBuyer(source('orders',{'authorization':'Bearer synthetic-buyer','idempotency-key':'synthetic-key','order-access-token':'synthetic-access','x-forwarded-host':'evil.example','cookie':'private-cookie','x-operator-token':'must-not-forward'}),'orders',{siteId:'memocasting',host:'memocasting.lt',service,cfTrusted:true});
 assert.equal(response.status,200);assert.equal(called.url,'https://memocasting.lt/api/orders');assert.equal(called.headers.get('origin'),'https://memocasting.lt');assert.equal(called.headers.get('cf-connecting-ip'),'203.0.113.12');
 assert.equal(called.headers.get('authorization'),'Bearer synthetic-buyer');for(const key of ['x-forwarded-host','cookie','x-operator-token'])assert.equal(called.headers.get(key),null);
 assert.deepEqual(await response.json(),{productionReady:false,publishOffers:false});assert.equal(response.headers.get('cache-control'),'no-store');
});
test('untrusted ingress, host/protocol, cross-origin, methods and private endpoints never reach binding',async()=>{
 let calls=0;const options={siteId:'memocasting',host:'memocasting.lt',service:{fetch:async()=>{calls++;return Response.json({});}},cfTrusted:true};
 assert.equal((await relayMemoBuyer(source(),'orders',{...options,cfTrusted:false})).status,503);
 assert.equal((await relayMemoBuyer(source('orders',{'cf-connecting-ip':''}),'orders',options)).status,503);
 assert.equal((await relayMemoBuyer(source('orders',{origin:'https://outside.example'}),'orders',options)).status,403);
 assert.equal((await relayMemoBuyer(new Request('http://memocasting.lt/prekyba/catalog'),'catalog',options)).status,503);
 assert.equal((await relayMemoBuyer(source(),'orders',{...options,host:'other.example'})).status,503);
 for(const path of ['operator/orders','webhooks/stripe','private-files'])assert.equal((await relayMemoBuyer(source(path),path,options)).status,404);
 assert.equal((await relayMemoBuyer(source('catalog'),'catalog',options)).status,405);
 assert.equal((await relayMemoBuyer(new Request('https://memocasting.lt/prekyba/quote'),'quote',options)).status,405);
 assert.equal(calls,0);
});
test('bounded body, redirects and PDF headers preserve the safe transport boundary',async()=>{
 let calls=0;const options={siteId:'memocasting',host:'memocasting.lt',cfTrusted:true,service:{fetch:async()=>{calls++;return new Response(null,{status:302,headers:{location:'https://outside.example'}});}}};
 const large=new Request('https://memocasting.lt/prekyba/orders',{method:'POST',headers:{origin:'https://memocasting.lt','cf-connecting-ip':'203.0.113.12'},body:'x'.repeat(70000)});
 assert.equal((await relayMemoBuyer(large,'orders',options)).status,413);assert.equal(calls,0);assert.equal((await relayMemoBuyer(source(),'orders',options)).status,503);
 const pdfOptions={...options,service:{fetch:async()=>new Response('%PDF-fixture',{headers:{'content-type':'application/pdf','content-disposition':'attachment; filename="MC-2026-1.pdf"'}})}};
 const pdf=await relayMemoBuyer(new Request('https://memocasting.lt/prekyba/orders/test/documents/test',{headers:{'cf-connecting-ip':'203.0.113.12'}}),'orders/test/documents/test',pdfOptions);
 assert.equal(pdf.headers.get('content-type'),'application/pdf');assert.equal(pdf.headers.get('content-disposition'),'attachment; filename="MC-2026-1.pdf"');assert.ok(pdf.headers.get('content-security-policy').includes('sandbox'));
});
test('loopback fixture stays explicit and HEAD does not create or forward a body',async()=>{
 let called;const response=await relayMemoBuyer(new Request('http://127.0.0.1:8817/prekyba/catalog',{method:'HEAD'}),'catalog',{siteId:'memocasting',host:'127.0.0.1',loopbackOrigin:'http://127.0.0.1:8827',fetchImpl:async request=>{called=request;return Response.json([]);}});
 assert.equal(response.status,200);assert.equal(called.body,null);assert.equal(response.body,null);assert.equal(called.url,'http://127.0.0.1:8827/api/catalog');
});
