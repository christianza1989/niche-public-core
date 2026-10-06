import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import Stripe from 'stripe';
import {commerce,commerceReady,checkoutParameters,applyStripeEvent,fulfilOrder,moderateReview} from '../lib/stripe-commerce.mjs';

const policy={version:'test-policy',seller:'Test seller',stripeAccount:'acct_test',mode:'test',currency:'usd',prices:[2900,4900,6500,7900],licenceApproved:true,taxReviewed:true,returnsApproved:true,shippingApproved:true,shippingCountries:['LT'],shippingAmount:500,shippingDeliveryMinimum:2,shippingDeliveryMaximum:5};
const envOf=db=>({DB:db,AUTH_RATE_SECRET:'local-test-rate',STRIPE_RESTRICTED_KEY:'rk_test_unit_only',STRIPE_WEBHOOK_SECRET:'whsec_unit_only'});
const token='a'.repeat(64),digest=createHash('sha256').update(token).digest('hex');
function database(){
 const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../deploy/phonebridger/schema.sql',import.meta.url),'utf8'));sql.exec(readFileSync(new URL('../deploy/phonebridger/commerce-schema.sql',import.meta.url),'utf8'));
 sql.prepare('INSERT INTO customer_users VALUES (?,?,?,?,?)').run('user-1','buyer@example.com','unused','unused','2026-10-06');sql.prepare('INSERT INTO customer_sessions VALUES (?,?,?)').run(digest,'user-1',Date.now()+3600000);
 const wrap=(statement,values=[])=>({sql:statement,values,bind(...args){return wrap(statement,args);},async first(){return sql.prepare(statement).get(...values)||null;},async all(){return {results:sql.prepare(statement).all(...values)};},async run(){return sql.prepare(statement).run(...values);}});
 return {sql,prepare:statement=>wrap(statement),async batch(statements){sql.exec('BEGIN');try{const results=statements.map(s=>sql.prepare(s.sql).run(...s.values));sql.exec('COMMIT');return results;}catch(error){sql.exec('ROLLBACK');throw error;}}};
}
const request=(action,payload,headers={})=>new Request('https://phonebridger.test/api/shop/'+action,{method:payload?'POST':'GET',headers:{Origin:'https://phonebridger.test',Cookie:'__Host-pb_session='+token,...(payload?{'Content-Type':'application/json'}:{}),...headers},body:payload?JSON.stringify(payload):undefined});
function insertOrder(db,changes={}){
 const order={id:'b'.repeat(32),user_id:'user-1',email:'buyer@example.com',holders:0,finish:'none',policy_version:policy.version,currency:'usd',subtotal:2900,shipping:0,status:'pending',fulfilment:'unfulfilled',created_at:Date.now(),expires_at:Date.now()+7200000,session_id:'cs_test_unit',...changes};
 const entries=Object.entries(order);db.sql.prepare(`INSERT INTO commerce_orders (${entries.map(e=>e[0]).join(',')}) VALUES (${entries.map(()=>'?').join(',')})`).run(...entries.map(e=>e[1]));return order;
}
const sessionOf=order=>({id:order.session_id,livemode:false,client_reference_id:order.id,metadata:{phonebridger_order:order.id,policy_version:order.policy_version},payment_status:'paid',currency:order.currency,amount_subtotal:order.subtotal,amount_total:order.subtotal+order.shipping,total_details:{amount_shipping:order.shipping,amount_tax:0},payment_intent:'pi_test_unit',line_items:{data:[{quantity:1,amount_subtotal:order.subtotal}]}});
const eventOf=(type,session,id='evt_test_unit')=>({id,type,livemode:false,data:{object:session}});

test('checkout policy is fail closed for launch facts, key mode and physical delivery',()=>{
 const env=envOf({});assert.equal(commerceReady(env,policy,2),true);
 for(const field of ['licenceApproved','taxReviewed','returnsApproved'])assert.equal(commerceReady(env,{...policy,[field]:false}),false);
 assert.equal(commerceReady(env,{...policy,mode:'disabled'}),false);assert.equal(commerceReady({...env,STRIPE_RESTRICTED_KEY:'rk_live_wrong'},policy),false);
 assert.equal(commerceReady(env,{...policy,shippingApproved:false},0),true);assert.equal(commerceReady(env,{...policy,shippingApproved:false},1),false);
 assert.equal(commerceReady(env,{...policy,shippingCountries:['../bad']},1),false);
});

test('parameters use authoritative price, stable idempotency inputs and dynamic payment methods',()=>{
 const order={id:'b'.repeat(32),email:'buyer@example.com',holders:2,finish:'black',expires_at:Date.now()+7200000};
 const a=checkoutParameters(order,policy,'https://phonebridger.test'),b=checkoutParameters(order,policy,'https://phonebridger.test');assert.deepEqual(a,b);
 assert.equal(a.line_items[0].price_data.unit_amount,6500);assert.equal(a.line_items[0].quantity,1);assert.equal(a.payment_method_types,undefined);assert.equal(a.automatic_tax,undefined);assert.equal(a.ui_mode,undefined);assert.match(a.integration_identifier,/_[a-z]{8}$/);assert.equal(a.branding_settings.display_name,'PhoneBridger');
 assert.equal(a.shipping_options[0].shipping_rate_data.fixed_amount.amount,500);
 assert.equal(checkoutParameters({...order,holders:0,finish:'none'},policy,'https://phonebridger.test').shipping_options,undefined);
});

test('disabled, foreign origin and unauthenticated checkout cannot create orders',async()=>{
 const db=database(),payload={holders:0,finish:'black',requestId:crypto.randomUUID(),consent:true};
 assert.equal((await commerce(request('checkout',payload),envOf(db),{...policy,mode:'disabled'},'checkout')).status,503);
 assert.equal((await commerce(request('checkout',payload,{Origin:'https://evil.test'}),envOf(db),policy,'checkout')).status,403);
 assert.equal((await commerce(request('checkout',payload,{Cookie:''}),envOf(db),policy,'checkout')).status,401);
 assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM commerce_orders').get().n,0);
});

test('checkout ignores client amount, reserves exact stock and reuses its durable order',async()=>{
 const db=database();db.sql.prepare('INSERT INTO commerce_stock VALUES (?,?)').run('black',2);
 let creations=[];const stripe={accounts:{retrieve:async()=>({id:'acct_test',charges_enabled:true})},checkout:{sessions:{create:async(params,options)=>{creations.push({params,options});return {id:'cs_test_checkout',livemode:false,url:'https://checkout.stripe.com/c/pay/test'};}}}};
 const payload={holders:2,finish:'black',requestId:crypto.randomUUID(),consent:true,amount:1};
 assert.equal((await commerce(request('checkout',payload),envOf(db),policy,'checkout',stripe)).status,201);
 assert.equal((await commerce(request('checkout',payload),envOf(db),policy,'checkout',stripe)).status,201);
 assert.equal(creations[0].params.line_items[0].price_data.unit_amount,6500);assert.deepEqual(creations[0],creations[1]);
 assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM commerce_orders').get().n,1);assert.equal(db.sql.prepare('SELECT SUM(quantity) AS n FROM commerce_reservations').get().n,2);
 assert.equal((await commerce(request('checkout',{...payload,requestId:crypto.randomUUID()}),envOf(db),policy,'checkout',stripe)).status,409);
 assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM commerce_orders').get().n,1);
});

test('live checkout checks the selected account payout readiness before creating payment',async()=>{
 const db=database(),env={...envOf(db),STRIPE_RESTRICTED_KEY:'rk_live_unit_only'};let calls=0;
 const stripe={accounts:{retrieve:async()=>({id:'acct_test',charges_enabled:true,payouts_enabled:false,requirements:{currently_due:['owner']}})},checkout:{sessions:{create:async()=>{calls++;}}}};
 assert.equal((await commerce(request('checkout',{holders:0,finish:'black',requestId:crypto.randomUUID(),consent:true}),env,{...policy,mode:'live'},'checkout',stripe)).status,503);assert.equal(calls,0);
});

test('late retries reuse a confirmed open session and retain uncertain reservations',async()=>{
 const db=database(),requestId=crypto.randomUUID(),id=createHash('sha256').update('user-1:'+requestId).digest('hex').slice(0,32);
 const order=insertOrder(db,{id,holders:1,finish:'black',subtotal:4900,shipping:500,expires_at:Date.now()+600000});
 db.sql.prepare('INSERT INTO commerce_stock VALUES (?,?)').run('black',1);db.sql.prepare('INSERT INTO commerce_reservations VALUES (?,?,?,?)').run(id,'black',1,order.expires_at);
 let creates=0;const stripe={accounts:{retrieve:async()=>({id:'acct_test',charges_enabled:true})},checkout:{sessions:{create:async()=>{creates++;},retrieve:async()=>({id:order.session_id,status:'open',livemode:false,client_reference_id:id,url:'https://checkout.stripe.com/c/pay/test'})}}};
 const payload={holders:1,finish:'black',requestId,consent:true};assert.equal((await commerce(request('checkout',payload),envOf(db),policy,'checkout',stripe)).status,201);
 db.sql.prepare("UPDATE commerce_orders SET session_id=NULL,status='creating'").run();assert.equal((await commerce(request('checkout',payload),envOf(db),policy,'checkout',stripe)).status,503);
 assert.equal(creates,0);assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM commerce_reservations').get().n,1);
});

test('payment waits for verified canonical paid state, duplicate events are harmless',async()=>{
 const db=database(),order=insertOrder(db),session=sessionOf(order);let reads=0;const stripe={checkout:{sessions:{retrieve:async()=>{reads++;return session;}}}};
 await applyStripeEvent(eventOf('checkout.session.completed',{...session,payment_status:'unpaid'},'evt_unpaid'),db,policy,stripe);
 assert.equal(db.sql.prepare('SELECT status FROM commerce_orders').get().status,'pending');assert.equal(reads,0);
 const event=eventOf('checkout.session.async_payment_succeeded',session);await applyStripeEvent(event,db,policy,stripe);await applyStripeEvent(event,db,policy,stripe);
 assert.equal(db.sql.prepare('SELECT status FROM commerce_orders').get().status,'paid');assert.equal(reads,1);assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM commerce_entitlements').get().n,0);
});

test('mismatched amount, session identity or mode never confirms payment',async()=>{
 for(const changed of [{amount_total:1},{amount_subtotal:1},{currency:'eur'},{client_reference_id:'another'},{total_details:{amount_tax:1,amount_shipping:0}},{line_items:{data:[{quantity:2,amount_subtotal:2900}]}}]){
  const db=database(),order=insertOrder(db),session=sessionOf(order);await assert.rejects(applyStripeEvent(eventOf('checkout.session.completed',session),db,policy,{checkout:{sessions:{retrieve:async()=>({...session,...changed})}}}));assert.equal(db.sql.prepare('SELECT status FROM commerce_orders').get().status,'pending');assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM commerce_events').get().n,0);
 }
 const db=database(),order=insertOrder(db);await assert.rejects(applyStripeEvent({...eventOf('checkout.session.completed',sessionOf(order)),livemode:true},db,policy,{}));
});

test('signed raw webhook verifies actual SDK signature; invalid and stale signatures fail',async()=>{
 const db=database(),env=envOf(db),stripe=new Stripe('sk_test_unit_only'),payload=JSON.stringify(eventOf('unhandled.event',{},'evt_signed'));
 const signature=stripe.webhooks.generateTestHeaderString({payload,secret:env.STRIPE_WEBHOOK_SECRET});
 const signed=new Request('https://phonebridger.test/api/shop/webhook',{method:'POST',headers:{'Stripe-Signature':signature},body:payload});assert.equal((await commerce(signed,env,policy,'webhook',stripe)).status,200);assert.equal(db.sql.prepare('SELECT id FROM commerce_events').get().id,'evt_signed');
 for(const header of ['bad',stripe.webhooks.generateTestHeaderString({payload,secret:env.STRIPE_WEBHOOK_SECRET,timestamp:Math.floor(Date.now()/1000)-600})])assert.equal((await commerce(new Request('https://phonebridger.test/api/shop/webhook',{method:'POST',headers:{'Stripe-Signature':header},body:payload}),env,policy,'webhook',stripe)).status,400);
});

test('review requires owned paid fulfilled order; public content waits for moderation',async()=>{
 const db=database(),order=insertOrder(db),payload={orderId:order.id,displayName:'Real buyer',rating:2,title:'Useful, with limits',body:'Worked for my desk, but pairing took some patience.',consent:true};
 assert.equal((await commerce(request('reviews',payload),envOf(db),policy,'reviews')).status,403);
 db.sql.prepare("UPDATE commerce_orders SET status='paid',fulfilment='fulfilled'").run();
 assert.equal((await commerce(request('reviews',payload,{Cookie:''}),envOf(db),policy,'reviews')).status,401);
 assert.equal((await commerce(request('reviews',payload),envOf(db),policy,'reviews')).status,201);
 assert.equal((await (await commerce(request('reviews'),envOf(db),policy,'reviews')).json()).count,0);
 db.sql.prepare("UPDATE commerce_reviews SET moderation='published'").run();
 const reviews=await(await commerce(request('reviews'),envOf(db),policy,'reviews')).json();assert.equal(reviews.count,1);assert.equal(reviews.average,2);assert.equal(reviews.reviews[0].body,payload.body);assert.equal(reviews.reviews[0].email,undefined);
 assert.equal((await commerce(request('reviews',payload),envOf(db),policy,'reviews')).status,409);
 const foreign=insertOrder(db,{id:'c'.repeat(32),user_id:'other',status:'paid',fulfilment:'fulfilled',session_id:'cs_other'});assert.equal((await commerce(request('reviews',{...payload,orderId:foreign.id}),envOf(db),policy,'reviews')).status,403);
});

test('order lookup is private and does not leak another purchaser or address',async()=>{
 const db=database(),order=insertOrder(db,{user_id:'other',shipping_details:'private address'});const response=await commerce(request('order?id='+order.id),envOf(db),policy,'order');assert.equal(response.status,404);assert.match(response.headers.get('Cache-Control'),/private/);
});

test('refunds and disputes revoke fulfilment eligibility, entitlements and published review',async()=>{
 for(const type of ['charge.refunded','charge.dispute.created']){
  const db=database(),order=insertOrder(db,{status:'paid',fulfilment:'fulfilled',payment_intent:'pi_test_unit'});
  db.sql.prepare("INSERT INTO commerce_entitlements VALUES (?,?, 'active',?,?)").run(order.id,'user-1','test-only-reference',Date.now());
  db.sql.prepare("INSERT INTO commerce_reviews VALUES (?,?,?,?,?,?,?,?, 'published')").run('review-1',order.id,'user-1','Buyer',4,'A good fit','Works well with my actual desk setup.',Date.now());
  await applyStripeEvent(eventOf(type,{payment_intent:'pi_test_unit',refunded:true}),db,policy,{});
  assert.equal(db.sql.prepare('SELECT status FROM commerce_entitlements').get().status,'revoked');assert.equal(db.sql.prepare('SELECT moderation FROM commerce_reviews').get().moderation,'withdrawn');assert.equal((await(await commerce(request('reviews'),envOf(db),policy,'reviews')).json()).count,0);
 }
});

test('operator fulfilment is paid-only and stock/licence issuance is idempotent',async()=>{
 const db=database(),order=insertOrder(db,{holders:2,finish:'black',subtotal:6500});
 db.sql.prepare('INSERT INTO commerce_stock VALUES (?,?)').run('black',3);db.sql.prepare('INSERT INTO commerce_reservations VALUES (?,?,?,NULL)').run(order.id,'black',2);
 await assert.rejects(fulfilOrder(db,order.id,'unit-only-delivery-reference'));
 db.sql.prepare("UPDATE commerce_orders SET status='paid'").run();await fulfilOrder(db,order.id,'unit-only-delivery-reference');await fulfilOrder(db,order.id,'unit-only-delivery-reference');
 assert.equal(db.sql.prepare('SELECT quantity FROM commerce_stock').get().quantity,1);assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM commerce_entitlements').get().n,1);assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM commerce_reservations').get().n,0);
});

test('moderation accepts a critical review and records its action; duplicate decisions fail',async()=>{
 const db=database(),order=insertOrder(db,{status:'paid',fulfilment:'fulfilled'});db.sql.prepare("INSERT INTO commerce_reviews VALUES (?,?,?,?,?,?,?,?, 'pending')").run('review-negative',order.id,'user-1','Buyer',1,'Not a fit for me','The holder did not suit my particular desk.',Date.now());
 await assert.rejects(moderateReview(db,'review-negative','reject','low-rating'));await moderateReview(db,'review-negative','publish','publish');
 assert.equal(db.sql.prepare('SELECT moderation FROM commerce_reviews').get().moderation,'published');assert.equal(db.sql.prepare('SELECT reason FROM commerce_moderation_audit').get().reason,'publish');await assert.rejects(moderateReview(db,'review-negative','publish','publish'));
});
