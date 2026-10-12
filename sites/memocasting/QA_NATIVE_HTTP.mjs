// Guards on the actual built localhost gateway. No valid order/contact writes.
import {request} from 'node:http';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const observations=[];
async function probe(path,{method='GET',host='127.0.0.1:8817',headers={},body}={}){
 return new Promise((resolve,reject)=>{const req=request('http://127.0.0.1:8817'+path,{method,headers:{host,...headers}},res=>{let text='';res.setEncoding('utf8');res.on('data',chunk=>text+=chunk);res.on('end',()=>{const item={path,host,method,status:res.statusCode,cache:res.headers['cache-control'],robots:res.headers['x-robots-tag']};observations.push(item);resolve({...item,body:text});});});req.on('error',reject);req.end(body);});
}
const context=await probe('/prekyba/storefront-context');assert.equal(context.status,200);const parsed=JSON.parse(context.body);assert.equal(parsed.environment,'sandbox');assert.equal(parsed.storeId,'memocasting_local_07_8827');assert.equal(parsed.paymentConnected,false);assert.equal(parsed.publishOffers,false);assert.equal(parsed.productionReady,false);
const catalog=await probe('/prekyba/catalog');assert.equal(catalog.status,200);assert.deepEqual(JSON.parse(catalog.body).map(p=>p.sku).sort(),['couple','family']);
assert.equal((await probe('/prekyba/catalog',{host:'memocasting.lt'})).status,503);
assert.equal((await probe('/prekyba/catalog',{host:'traktoriupadangos.lt'})).status,404);
for(const path of ['/prekyba/operator/orders','/prekyba/private-files','/prekyba/webhooks/stripe'])assert.equal((await probe(path)).status,404);
assert.equal((await probe('/prekyba/orders',{method:'POST',headers:{origin:'https://outside.example', 'content-type':'application/json'},body:'{}'})).status,403);
assert.equal((await probe('/prekyba/orders',{method:'POST',headers:{'content-type':'application/json'},body:'x'.repeat(70000)})).status,413);
const invalid=await probe('/prekyba/orders',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});assert.ok([400,422].includes(invalid.status));
for(const suffix of ['','/receipt','/documents/fixture-document']){
 const protectedRead=await probe('/prekyba/orders/00000000-0000-4000-8000-000000000001'+suffix);
 assert.ok([401,403,404].includes(protectedRead.status));assert.ok(!/"customer"|"token"|"order"\s*:/.test(protectedRead.body));
}
for(const item of observations.filter(r=>r.host==='127.0.0.1:8817'&&!r.path.includes('operator')&&!r.path.includes('private-files')&&!r.path.includes('webhooks'))){assert.ok(item.cache?.includes('no-store'));assert.ok(item.robots?.includes('noindex'));}
const report={state:'LOCAL_NATIVE_GATEWAY_GUARDS_PASS',checkedAt:new Date().toISOString(),requests:observations.length,observations,limits:['Valid create/reload/withdrawal verified separately through browser','No real SMTP, Stripe, carrier or production admission','Authorized immutable buyer PDF download verified separately by companion QA_BUYER_DOCUMENT.mjs; not a visual/legal invoice acceptance']};
await mkdir(new URL('../../output/audits/',import.meta.url),{recursive:true});await writeFile(new URL('../../output/audits/memocasting-native-gateway.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,observations:undefined}));
