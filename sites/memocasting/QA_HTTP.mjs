// Explicitly local synthetic checks; no payments, mail, operator or shipping actions.
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {randomBytes} from 'node:crypto';
import {writeFile,mkdir} from 'node:fs/promises';
const origin='http://127.0.0.1:8817',results=[];
async function call(path,{host,method='GET',body,headers={}}={}){
 const url=new URL(path,origin);return new Promise((resolve,reject)=>{const r=request(url,{method,headers:{...(host?{host}:{}),...(body?{'content-type':'application/json','content-length':Buffer.byteLength(JSON.stringify(body))}:{}),...headers}},res=>{let data='';res.on('data',c=>data+=c);res.on('end',()=>{let json;try{json=JSON.parse(data);}catch{}resolve({status:res.statusCode,json});});});r.on('error',reject);r.end(body?JSON.stringify(body):undefined);});
}
function check(name,ok){assert.ok(ok,name);results.push({name,result:'PASS'});}
const input={country:'LT',currency:'EUR',deliveryId:'fixture_courier',lines:[{sku:'family',quantity:1,unitAmount:1}],customer:{name:'Testinis Pirkėjas',email:'memo-http@example.test',phone:'+37060000000',address:{country:'LT',line1:'Testinė g. 1',city:'Vilnius',postalCode:'01101'}}};
const quote=await call('/prekyba/quote',{method:'POST',body:input});check('Server ignores client unit amount; 4800+450 EUR cents',quote.status===200&&quote.json.amount===5250);
const key=randomBytes(32).toString('base64url'),token=randomBytes(32).toString('base64url');
const headers={'Idempotency-Key':key,'Order-Access-Token':token};
const first=await call('/prekyba/orders',{method:'POST',body:input,headers});check('Order persists before payment',first.status>=200&&first.status<300&&first.json.order.payment_state!=='paid');
const again=await call('/prekyba/orders',{method:'POST',body:input,headers});check('Same key/token/input returns same order',again.json.order.id===first.json.order.id);
const changed=await call('/prekyba/orders',{method:'POST',body:{...input,lines:[{sku:'family',quantity:2}]},headers});check('Changed idempotent payload rejected',changed.status===409);
const wrong=await call('/prekyba/orders/'+first.json.order.id,{headers:{Authorization:'Bearer '+randomBytes(32).toString('base64url')}});check('Wrong access token denied',wrong.status>=400);
const own=await call('/prekyba/orders/'+first.json.order.id,{headers:{Authorization:'Bearer '+token}});check('Correct token reads persisted order',own.status===200&&own.json.id===first.json.order.id);
const checkout=await call('/prekyba/orders/'+first.json.order.id+'/checkout',{method:'POST',body:{},headers:{Authorization:'Bearer '+token}});check('Unconnected payment fails without claiming paid',checkout.status===503);
const withdrawal=await call('/prekyba/orders/'+first.json.order.id+'/withdrawal',{method:'POST',body:{reason:'Synthetic local QA'},headers:{Authorization:'Bearer '+token}});check('Local withdrawal request accepted',withdrawal.status>=200&&withdrawal.status<300);
check('Production host bridge fails closed',(await call('/prekyba/catalog',{host:'memocasting.lt'})).status===503);
check('Unknown tenant denied',(await call('/prekyba/catalog',{host:'unknown.example'})).status===404);
check('Cross-origin write denied',(await call('/prekyba/quote',{method:'POST',body:input,headers:{Origin:'https://other.example'}})).status===403);
let oversizedDenied=false,oversizedTransport='';try{const r=await fetch(origin+'/prekyba/quote',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({padding:'x'.repeat(66000)})});oversizedDenied=r.status===413;oversizedTransport='HTTP '+r.status;}catch(e){oversizedDenied=e.code==='ECONNRESET'||e.cause?.code==='ECONNRESET';oversizedTransport=oversizedDenied?'connection closed at rejection boundary':'unexpected error';}check('Oversized write bounded and rejected (413 or closed connection)',oversizedDenied);results.push({name:'Oversized response transport',observation:oversizedTransport});
check('Unapproved legacy product remains 404',(await call('/products/kudikio-pedutes')).status===404);
await mkdir('output/audits',{recursive:true});await writeFile('output/audits/memocasting-http.json',JSON.stringify({checkedAt:new Date().toISOString(),origin,synthetic:true,paymentAndMailOff:true,results},null,2));
console.log(JSON.stringify({passed:results.filter(r=>r.result==='PASS').length,failed:0,synthetic:true}));
