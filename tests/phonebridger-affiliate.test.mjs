import test from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import {creatorApi,affiliateTerms,checkoutAttribution,qualifyCommission,releaseHolds,reverseCommission,reservePayout,settlePayout,referralRedirect,reconcileAffiliateEvent} from '../lib/phonebridger-affiliate.mjs';
import {commerce} from '../lib/stripe-commerce.mjs';
import {database,request,order,otherToken} from './helpers/phonebridger-db.mjs';
const t=affiliateTerms,day=86400000;
const envOf=DB=>({DB,AUTH_RATE_SECRET:'unit-rate',COMMERCE_OPERATOR_SECRET:'unit-operator',PLAYGROUND:'1',AFFILIATE_SANDBOX:'1'});
function partner(db,id='partner',user='other',code='TESTCODE'){
 db.sql.prepare('INSERT OR IGNORE INTO affiliate_terms VALUES (?,?,?)').run(t.version,JSON.stringify(t),Date.now());
 db.sql.prepare("INSERT INTO creator_partners VALUES (?,?,?,'approved',?,?)").run(id,user,code,t.version,Date.now());return id;
}
async function commission(db,change={}){
 if(!db.sql.prepare('SELECT id FROM creator_partners').get())partner(db);
 const o=order(db,change);await db.prepare('INSERT INTO affiliate_order_snapshots VALUES (?,?,?,?,?,?,?,?,?)').bind(o.id,'partner',null,t.version,o.currency,o.subtotal,2500,0,o.created_at).run();await qualifyCommission(db,o.id);return o;
}
const balances=(db,id)=>Object.fromEntries(db.sql.prepare('SELECT bucket,SUM(amount) n FROM affiliate_ledger WHERE commission_id=? GROUP BY bucket').all(id).map(r=>[r.bucket,r.n]));
const api=(action,d,h)=>request('/api/creator/'+action,d,h);
test('application approval is distinct from buying; denied users cannot read or mutate creator records',async()=>{
 const db=database(),env=envOf(db);order(db);
 assert.equal((await creatorApi(api('overview'),env,'overview')).status,403);
 const data={channels:'https://example.invalid/channel',audience:'Windows and Android users',message:'Workspace tutorials',consent:true,termsVersion:t.version};
 assert.equal((await creatorApi(api('application',data),env,'application')).status,201);assert.equal((await creatorApi(api('application',data),env,'application')).status,409);
 assert.equal((await creatorApi(api('operator',{action:'review',userId:'buyer',status:'approved'}),env,'operator')).status,401);
 assert.equal((await creatorApi(api('operator',{action:'review',userId:'buyer',status:'approved'},{Authorization:'Bearer unit-operator'}),env,'operator')).status,200);
 const mine=await(await creatorApi(api('overview'),env,'overview')).json();assert.ok(mine.partner.code);assert.equal(mine.ledger.length,0);
 assert.equal((await creatorApi(api('overview',undefined,{Cookie:'__Host-pb_session='+otherToken}),env,'overview')).status,403);
 assert.equal((await creatorApi(api('links',{tag:'YouTube'},{Origin:'https://evil.invalid'}),env,'links')).status,403);
});
test('approved creators can own links, archive only their links and copy server URLs',async()=>{
 const db=database(),env=envOf(db);partner(db,'mine','buyer','MYCODE');partner(db,'foreign','other','OTHERCODE');
 const created=await(await creatorApi(api('links',{tag:'YouTube'}),env,'links')).json();assert.match(created.url,/\/r\/[a-f0-9]{32}$/);
 db.sql.prepare('INSERT INTO affiliate_links VALUES (?,?,?,1,?)').run('f'.repeat(32),'foreign','Private channel',Date.now());
 assert.equal((await creatorApi(api('links',{archive:'f'.repeat(32)}),env,'links')).status,404);
 const own=await(await creatorApi(api('links'),env,'links')).json();assert.equal(own.links.length,1);assert.ok(!JSON.stringify(own).includes('Private channel'));
 const redirect=await referralRedirect(request('/r/'+created.id),env,created.id);assert.equal(redirect.status,302);assert.equal(redirect.headers.get('location'),'/shop');assert.match(redirect.headers.get('set-cookie'),/HttpOnly; SameSite=Lax/);
 assert.equal((await creatorApi(api('links',{archive:created.id}),env,'links')).status,200);assert.equal((await referralRedirect(request('/r/'+created.id),env,created.id)).status,404);
});
test('coupon precedence, server-owned cookie, direct return, window, new customer and self-referral rules',async()=>{
 const db=database(),env=envOf(db);partner(db);partner(db,'link-partner','third','LINKCODE');
 db.sql.prepare('INSERT INTO affiliate_links VALUES (?,?,?,1,?)').run('f'.repeat(32),'link-partner','Video',Date.now());
 db.sql.prepare('INSERT INTO affiliate_clicks VALUES (?,?,?,?)').run('e'.repeat(32),'f'.repeat(32),'visitor',Date.now());
 const req=request('/api/shop/checkout',{}, {Cookie:'__Host-pb_session='+ 'a'.repeat(64)+'; pb_ref='+ 'e'.repeat(32)});
 const link=await checkoutAttribution(req,env,db,{id:'buyer'},undefined,2900,'usd');assert.equal(link.partnerId,'link-partner');assert.equal(link.discount,0);
 assert.equal((await checkoutAttribution(req,env,db,{id:'buyer'},'TESTCODE',2900,'usd')).partnerId,'partner');assert.equal((await checkoutAttribution(req,env,db,{id:'buyer'},'TESTCODE',2900,'usd')).basis,2755);
 assert.equal(await checkoutAttribution(req,env,db,{id:'other'},'TESTCODE',2900,'usd'),null);
 assert.equal(await checkoutAttribution(request('/shop',undefined,{Cookie:'pb_ref=forged'}),env,db,{id:'buyer'},undefined,2900,'usd'),null);
 db.sql.prepare('UPDATE affiliate_clicks SET created_at=?').run(Date.now()-31*day);assert.equal(await checkoutAttribution(req,env,db,{id:'buyer'},undefined,2900,'usd'),null);
 order(db);assert.equal(await checkoutAttribution(req,env,db,{id:'buyer'},'TESTCODE',2900,'usd'),null);
 await assert.rejects(checkoutAttribution(req,{...env,PLAYGROUND:'0'},db,{id:'buyer'},'TESTCODE',2900,'usd'),/not active/);
});
test('commission qualification is idempotent, frozen and append-only; a second purchase earns nothing',async()=>{
 const db=database(),o=await commission(db);await qualifyCommission(db,o.id);assert.equal(balances(db,o.id).Pending,725);
 assert.equal(db.sql.prepare('SELECT COUNT(*) n FROM affiliate_commissions').get().n,1);
 assert.throws(()=>db.sql.prepare('UPDATE affiliate_ledger SET amount=1').run(),/append-only/);assert.throws(()=>db.sql.prepare('DELETE FROM affiliate_commissions').run(),/immutable/);assert.throws(()=>db.sql.prepare('UPDATE affiliate_terms SET definition=?').run('{}'),/immutable/);
 await commission(db,{id:'d'.repeat(32),session_id:'cs_second',created_at:Date.now()+1000});assert.equal(db.sql.prepare('SELECT COUNT(*) n FROM affiliate_commissions').get().n,1);
});
test('digital and hardware holds use the frozen version and confirmed delivery',async()=>{
 const db=database(),o=await commission(db,{paid_at:Date.now()-31*day});await releaseHolds(db,'partner');assert.equal(balances(db,o.id).Available,725);await releaseHolds(db,'partner');assert.equal(balances(db,o.id).Available,725);
 const hardware=await commission(db,{id:'d'.repeat(32),user_id:'new-buyer',session_id:'cs_hardware',holders:1,paid_at:Date.now()-45*day});await releaseHolds(db,'partner');assert.equal(balances(db,hardware.id).Pending,725);
 db.sql.prepare('INSERT INTO commerce_deliveries VALUES (?,?,?,?,?,?)').run(hardware.id,'Test','TEST','https://example.invalid',Date.now()-20*day,Date.now()-13*day);await releaseHolds(db,'partner');assert.equal(balances(db,hardware.id).Pending,725);
 db.sql.prepare('UPDATE commerce_deliveries SET delivered_at=?').run(Date.now()-15*day);await releaseHolds(db,'partner');assert.equal(balances(db,hardware.id).Available,725);
});
test('partial/cumulative refunds and out-of-order duplicates reverse proportionally once',async()=>{
 const db=database(),o=await commission(db);await reverseCommission(db,o.id,1450,2900);assert.deepEqual(balances(db,o.id),{Pending:362,Reversed:363});
 await reverseCommission(db,o.id,1450,2900);await reverseCommission(db,o.id,500,2900);assert.equal(balances(db,o.id).Reversed,363);
 await reverseCommission(db,o.id,2900,2900);assert.equal(balances(db,o.id).Pending,0);assert.equal(balances(db,o.id).Reversed,725);
});
test('a canonical partial refund before local completion is reconciled on delayed completion',async()=>{
 const db=database();partner(db);const o=order(db);db.sql.prepare('INSERT INTO affiliate_order_snapshots VALUES (?,?,?,?,?,?,?,?,?)').run(o.id,'partner',null,t.version,'usd',2900,2500,0,o.created_at);
 const event={type:'checkout.session.completed',data:{object:{id:'cs_delayed',metadata:{phonebridger_order:o.id}}}},stripe={checkout:{sessions:{retrieve:async()=>({payment_intent:{latest_charge:{amount:2900,amount_refunded:1450}}})}}};
 await reconcileAffiliateEvent(event,db,stripe,envOf(db));await reconcileAffiliateEvent(event,db,stripe,envOf(db));assert.deepEqual(balances(db,o.id),{Pending:362,Reversed:363});
});
test('payout reservation races cannot double-spend, failed reservation returns once and paid funds reverse',async()=>{
 const db=database(),o=await commission(db,{subtotal:12000,paid_at:Date.now()-31*day});await releaseHolds(db,'partner');
 const id=crypto.randomUUID(),p=await reservePayout(db,'partner','usd',id);assert.equal(p.amount,3000);assert.equal((await reservePayout(db,'partner','usd',id)).id,p.id);
 await assert.rejects(reservePayout(db,'partner','usd',crypto.randomUUID()),/below/);assert.equal(balances(db,o.id).Reserved,3000);
 await settlePayout(db,p.id,'failed');await settlePayout(db,p.id,'failed');assert.equal(balances(db,o.id).Available,3000);
 const p2=await reservePayout(db,'partner','usd',crypto.randomUUID());await settlePayout(db,p2.id,'paid','test_transfer_1');await settlePayout(db,p2.id,'paid','test_transfer_1');assert.equal(balances(db,o.id).Paid,3000);
 await reverseCommission(db,o.id,6000,12000);assert.equal(balances(db,o.id).Paid,1500);assert.equal(balances(db,o.id).Reversed,1500);
});
test('refund while reserved requires review and cannot finalize a transfer',async()=>{
 const db=database(),o=await commission(db,{subtotal:12000,paid_at:Date.now()-31*day});await releaseHolds(db,'partner');const p=await reservePayout(db,'partner','usd',crypto.randomUUID());
 await reverseCommission(db,o.id,6000,12000);assert.equal(db.sql.prepare('SELECT status FROM affiliate_payouts').get().status,'review');await assert.rejects(settlePayout(db,p.id,'paid','test_unsafe'),/Reconcile/);
 await settlePayout(db,p.id,'failed');assert.equal(balances(db,o.id).Available,1500);assert.equal(balances(db,o.id).Reserved,0);
});
test('concurrent payout requests admit only one reservation',async()=>{
 const db=database(),o=await commission(db,{subtotal:12000,paid_at:Date.now()-31*day});await releaseHolds(db,'partner');
 const results=await Promise.allSettled([reservePayout(db,'partner','usd',crypto.randomUUID()),reservePayout(db,'partner','usd',crypto.randomUUID())]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(balances(db,o.id).Reserved,3000);assert.equal(db.sql.prepare('SELECT COUNT(*) n FROM affiliate_payouts').get().n,1);
});
test('creator response is masked, aggregates each commission once and separates currencies',async()=>{
 const db=database();await commission(db);await commission(db,{id:'d'.repeat(32),user_id:'new-buyer',email:'private-new@example.invalid',session_id:'cs_eur',currency:'eur'});
 const response=await creatorApi(api('earnings',undefined,{Cookie:'__Host-pb_session='+otherToken}),envOf(db),'earnings'),data=await response.json();assert.equal(data.ledger.length,2);assert.equal(data.balances.usd.Pending,725);assert.equal(data.balances.eur.Pending,725);assert.equal(data.metrics.conversion,null);
 assert.ok(!JSON.stringify(data).includes('buyer@example'));assert.ok(!JSON.stringify(data).includes('private-new'));assert.ok(!JSON.stringify(data).includes('b'.repeat(32)));
 assert.equal((await creatorApi(api('operator',{action:'reserve',partnerId:'partner',currency:'usd',requestId:crypto.randomUUID()},{Authorization:'Bearer unit-operator'}),{...envOf(db),PLAYGROUND:'0'},'operator')).status,403);
});
test('signed sandbox checkout integrates frozen discount, paid qualification and canonical partial refund',async()=>{
 const db=database();partner(db);const env={...envOf(db),STRIPE_RESTRICTED_KEY:'rk_test_unit_only',STRIPE_WEBHOOK_SECRET:'whsec_unit_only'};
 const policy={version:'test-v1',seller:'Test seller',stripeAccount:'acct_test',mode:'test',currency:'usd',prices:[2900,4900,6500,7900],licenceApproved:true,taxReviewed:true,returnsApproved:true};
 const sdk=new Stripe('sk_test_unit_only');let session;
 const stripe={accounts:{retrieve:async()=>({id:'acct_test',charges_enabled:true})},checkout:{sessions:{create:async p=>{assert.equal(p.line_items[0].price_data.unit_amount,2755);session={id:'cs_test_integrated',url:'https://checkout.stripe.com/c/pay/test',livemode:false,metadata:p.metadata,client_reference_id:p.client_reference_id,currency:'usd',amount_subtotal:2755,amount_total:2755,total_details:{amount_shipping:0,amount_tax:0},line_items:{data:[{quantity:1,amount_subtotal:2755}]},payment_intent:{id:'pi_test',status:'succeeded',latest_charge:{id:'ch_test',refunded:false,disputed:false}}};return session;},retrieve:async()=>({...session,payment_status:'paid'})}},webhooks:sdk.webhooks,charges:{retrieve:async()=>({livemode:false,payment_intent:'pi_test',amount:2755,amount_refunded:1378})}};
 const payload={holders:0,finish:'black',requestId:crypto.randomUUID(),consent:true,creatorCode:'TESTCODE'};
 const response=await commerce(request('/api/shop/checkout',payload),env,policy,'checkout',stripe);assert.equal(response.status,201);const {orderId}=await response.json();assert.equal(db.sql.prepare('SELECT amount FROM affiliate_commissions').get(),undefined);
 async function webhook(type,object,id){const body=JSON.stringify({id,type,livemode:false,data:{object}}),signature=sdk.webhooks.generateTestHeaderString({payload:body,secret:env.STRIPE_WEBHOOK_SECRET});return commerce(new Request('https://phonebridger.test/api/shop/webhook',{method:'POST',headers:{'Stripe-Signature':signature},body}),env,policy,'webhook',stripe);}
 assert.equal((await webhook('checkout.session.completed',{...session,payment_status:'paid'},'evt_paid')).status,200);assert.equal((await webhook('checkout.session.completed',{...session,payment_status:'paid'},'evt_paid')).status,200);assert.equal(balances(db,orderId).Pending,689);
 assert.equal((await webhook('charge.refunded',{id:'ch_test',payment_intent:'pi_test',refunded:false},'evt_partial')).status,200);assert.equal(balances(db,orderId).Reversed,345);assert.equal(balances(db,orderId).Pending,344);
});
