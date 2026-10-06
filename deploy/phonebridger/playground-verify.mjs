// Read-only acceptance after authorized browser payments/refund/dispatch tests.
// Private fixture files are produced during the operator's test, never committed.
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
const dir='.sites-runtime/phonebridger-playground/';
const read=name=>readFile(dir+name,'utf8').then(JSON.parse);
const buyer=await read('buyer.json'),physical=await read('payment-proof.json'),digital=await read('digital-proof.json'),expired=await read('expiry-test.json');
assert.equal(buyer.root,'https://phonebridger-playground.phonebridger-app.workers.dev');
const key=(await readFile(dir+'stripe-key.txt','utf8')).trim();assert.match(key,/^(rkcs|rk|sk)_test_/);
const stripe=new Stripe(key);
const owned=async id=>{const r=await fetch(buyer.root+'/api/shop/order?id='+id,{headers:{Cookie:buyer.cookie}});assert.equal(r.status,200);return r.json();};
for(const [fixture,total]of [[physical,7000],[digital,2900]]){
 const id=fixture.application?.order.id||fixture.order.order.id;
 const record=await owned(id);
 const sessions=await stripe.checkout.sessions.list({limit:20});
 const session=sessions.data.find(s=>s.client_reference_id===id);assert.ok(session);assert.equal(session.livemode,false);assert.equal(session.payment_status,'paid');assert.equal(session.amount_total,total);
 if(total===7000){assert.equal(record.order.status,'refunded');assert.equal(record.entitlement.status,'revoked');}
 else {assert.equal(record.order.status,'paid');assert.equal(record.order.fulfilment,'fulfilled');assert.equal(record.order.shipping,0);assert.equal(record.entitlement.status,'active');}
 const anonymous=await fetch(buyer.root+'/api/shop/licence?id='+id);assert.equal(anonymous.status,401);
 const licence=await fetch(buyer.root+'/api/shop/licence?id='+id,{headers:{Cookie:buyer.cookie}});assert.equal(licence.status,total===7000?409:200);
 if(licence.ok)assert.match(await licence.text(),/TEST RECORD/);
 const receipt=await fetch(buyer.root+'/api/shop/receipt?id='+id,{headers:{Cookie:buyer.cookie}});assert.equal(receipt.status,200);assert.match(await receipt.text(),/not a VAT invoice/);
}
assert.equal((await owned(expired.orderId)).order.status,'expired');
const reviews=await(await fetch(buyer.root+'/api/shop/reviews')).json();assert.equal(reviews.count,0);
const live=await(await fetch('https://phonebridger.com/api/shop/catalog')).json();assert.equal(live.mode,'disabled');assert.ok(live.offers.every(o=>!o.available));
const result={observedAt:new Date().toISOString(),environment:'isolated Stripe sandbox',physicalPaymentAndRefund:'PASS',digitalPaymentAndAutomaticDelivery:'PASS',expiryWebhook:'PASS',privateDocuments:'PASS',reviewWithdrawalOnRefund:'PASS',productionSalesGate:'PASS',scope:'Read-only final acceptance; simulated shipping is not carrier delivery, and no email or native activation is certified.'};
await writeFile(dir+'acceptance.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
