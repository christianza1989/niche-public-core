import test from 'node:test';
import assert from 'node:assert/strict';
import {creatorPayoutProvider,runCreatorPayouts,reconcileProviderTransfers} from '../lib/phonebridger-payout-provider.mjs';
import {affiliateTerms,qualifyCommission,reverseCommission} from '../lib/phonebridger-affiliate.mjs';
import {database,request,order} from './helpers/phonebridger-db.mjs';
const date=Date.UTC(2026,9,15,3,17),envOf=DB=>({DB,AUTH_RATE_SECRET:'unit-provider',PLAYGROUND:'1',AFFILIATE_SANDBOX:'1',CREATOR_CONNECT_ENABLED:'1',CREATOR_AUTO_PAYOUTS:'1',CREATOR_CONNECT_MERCHANT:'acct_merchant',CREATOR_CONNECT_COUNTRIES:'LT'});
function setup(){const db=database();db.sql.prepare('INSERT INTO affiliate_terms VALUES (?,?,?)').run(affiliateTerms.version,JSON.stringify(affiliateTerms),date);db.sql.prepare("INSERT INTO creator_partners VALUES ('partner','buyer','TESTCODE','approved',?,?)").run(affiliateTerms.version,date);db.sql.prepare('INSERT INTO account_email_verifications VALUES (?,?,?)').run('buyer','buyer@example.invalid',date);return db;}
function stripeFixture(){const accounts=new Map(),transfers=new Map();let created=0,reversed=0;
 const account={id:'acct_recipient',livemode:false,metadata:{phonebridger_partner:'partner'},identity:{country:'LT'},configuration:{recipient:{capabilities:{stripe_balance:{stripe_transfers:{status:'active'},payouts:{status:'active'}}}}}};accounts.set(account.id,account);
 return {accounts:{retrieve:async()=>({id:'acct_merchant',payouts_enabled:true})},v2:{core:{accounts:{create:async d=>{assert.equal(d.configuration.merchant,undefined);assert.equal(d.dashboard,'express');return account;},retrieve:async id=>accounts.get(id)},accountLinks:{create:async()=>({url:'https://connect.stripe.com/setup/fixture',livemode:false})}}},transfers:{create:async d=>{created++;const t={id:'tr_fixture',...d,livemode:false,amount_reversed:0,reversed:false};transfers.set(t.id,t);return t;},retrieve:async id=>transfers.get(id),list:async d=>({data:[...transfers.values()].filter(t=>t.transfer_group===d.transfer_group)}),createReversal:async(id,d)=>{reversed++;transfers.get(id).amount_reversed+=d.amount;return {id:'trr_fixture'};}},counts:()=>({created,reversed}),records:transfers};
}
async function eligible(db){const o=order(db,{user_id:'other',subtotal:12000,paid_at:date-31*86400000});db.sql.prepare('INSERT INTO affiliate_order_snapshots VALUES (?,?,?,?,?,?,?,?,?)').run(o.id,'partner',null,affiliateTerms.version,'usd',12000,2500,0,date);await qualifyCommission(db,o.id);return o;}
const api=(action,d,h)=>request('/api/creator/provider/'+action,d,h);
test('provider status works without a key when disabled and cannot create a recipient',async()=>{
 const db=setup(),env={...envOf(db),CREATOR_CONNECT_ENABLED:'0'};const r=await creatorPayoutProvider(api('status'),env,'status');assert.equal(r.status,200);assert.equal((await r.json()).enabled,false);assert.equal((await creatorPayoutProvider(api('onboard',{country:'LT'}),env,'onboard')).status,409);await runCreatorPayouts(env);
});
test('onboarding uses only the authenticated approved verified identity and immutable provider binding',async()=>{
 const db=setup(),env=envOf(db),stripe=stripeFixture();assert.equal((await creatorPayoutProvider(api('onboard',{country:'LT'},{Origin:'https://attacker.invalid'}),env,'onboard',{stripe})).status,403);
 assert.equal((await creatorPayoutProvider(api('onboard',{country:'LT'}),env,'onboard',{stripe})).status,200);assert.equal(db.sql.prepare('SELECT account_id FROM creator_payout_accounts').get().account_id,'acct_recipient');assert.equal((await creatorPayoutProvider(api('onboard',{country:'US'}),env,'onboard',{stripe})).status,400);
 assert.equal((await(await creatorPayoutProvider(api('status'),env,'status',{stripe})).json()).ready,true);
 db.sql.prepare('DELETE FROM account_email_verifications').run();assert.equal((await creatorPayoutProvider(api('onboard',{country:'LT'}),env,'onboard',{stripe})).status,409);
});
test('scheduled transfer is bounded, provider confirmed, once per month and separately reconciles proportional refunds',async()=>{
 const db=setup(),env=envOf(db),stripe=stripeFixture(),o=await eligible(db);db.sql.prepare("INSERT INTO creator_payout_accounts VALUES ('partner','acct_recipient','LT','test','ready',?,NULL)").run(date);
 await runCreatorPayouts(env,{stripe,now:date});await runCreatorPayouts(env,{stripe,now:date});assert.equal(stripe.counts().created,1);const p=db.sql.prepare('SELECT * FROM affiliate_payouts').get();assert.equal(p.status,'paid');assert.equal(p.amount,3000);assert.equal(p.provider_reference,'tr_fixture');
 await reverseCommission(db,o.id,6000,12000);await reconcileProviderTransfers(db,stripe,env);await reconcileProviderTransfers(db,stripe,env);assert.equal(stripe.records.get('tr_fixture').amount_reversed,1500);assert.equal(stripe.counts().reversed,1);
 assert.equal(db.sql.prepare("SELECT SUM(amount) n FROM affiliate_ledger WHERE bucket='Paid'").get().n,1500);
});
test('an uncertain transfer is not replayed; canonical reconciliation can recover its provider result',async()=>{
 const db=setup(),env=envOf(db),stripe=stripeFixture();await eligible(db);db.sql.prepare("INSERT INTO creator_payout_accounts VALUES ('partner','acct_recipient','LT','test','ready',?,NULL)").run(date);
 const create=stripe.transfers.create;stripe.transfers.create=async d=>{await create(d);throw Error('Lost response');};await runCreatorPayouts(env,{stripe,now:date});assert.equal(db.sql.prepare('SELECT status FROM creator_provider_transfers').get().status,'unknown');
 await runCreatorPayouts(env,{stripe,now:date});assert.equal(stripe.counts().created,1);assert.equal(db.sql.prepare('SELECT status FROM affiliate_payouts').get().status,'paid');
});
test('wrong provider mode and incomplete merchant payouts never produce a paid ledger entry',async()=>{
 const db=setup(),env=envOf(db),stripe=stripeFixture();await eligible(db);db.sql.prepare("INSERT INTO creator_payout_accounts VALUES ('partner','acct_recipient','LT','test','ready',?,NULL)").run(date);
 stripe.accounts.retrieve=async()=>({id:'acct_merchant',payouts_enabled:false});await assert.rejects(runCreatorPayouts(env,{stripe,now:date}),/verification/);assert.equal(stripe.counts().created,0);
 stripe.accounts.retrieve=async()=>({id:'acct_merchant',payouts_enabled:true});const retrieve=stripe.transfers.retrieve;stripe.transfers.retrieve=async id=>({...await retrieve(id),livemode:true});await runCreatorPayouts(env,{stripe,now:date});assert.equal(db.sql.prepare("SELECT COUNT(*) n FROM affiliate_ledger WHERE bucket='Paid'").get().n,0);assert.equal(db.sql.prepare('SELECT status FROM creator_provider_transfers').get().status,'unknown');
});
test('unresolved transfers rotate through reconciliation without resending or starving later records',async()=>{
 const db=setup(),env=envOf(db),stripe=stripeFixture();await eligible(db);db.sql.prepare("INSERT INTO creator_payout_accounts VALUES ('partner','acct_recipient','LT','test','ready',?,NULL)").run(date);
 stripe.transfers.create=async()=>{throw Error('Provider unavailable');};await runCreatorPayouts(env,{stripe,now:date});
 db.sql.prepare('UPDATE creator_provider_transfers SET checked_at=1').run();const started=Date.now();
 await reconcileProviderTransfers(db,stripe,env);const current=db.sql.prepare('SELECT * FROM creator_provider_transfers').get();assert.equal(current.status,'unknown');assert.ok(current.checked_at>=started);assert.equal(stripe.counts().created,0);assert.equal(db.sql.prepare('SELECT status FROM affiliate_payouts').get().status,'reserved');
});
test('refund arriving during provider transfer reverses funds and settles only the remaining reservation',async()=>{
 const db=setup(),env=envOf(db),stripe=stripeFixture(),o=await eligible(db);db.sql.prepare("INSERT INTO creator_payout_accounts VALUES ('partner','acct_recipient','LT','test','ready',?,NULL)").run(date);
 const create=stripe.transfers.create;stripe.transfers.create=async d=>{const t=await create(d);await reverseCommission(db,o.id,6000,12000);return t;};await runCreatorPayouts(env,{stripe,now:date});await reconcileProviderTransfers(db,stripe,env);
 assert.equal(stripe.records.get('tr_fixture').amount_reversed,1500);assert.equal(db.sql.prepare("SELECT SUM(amount) n FROM affiliate_ledger WHERE bucket='Reserved'").get().n,0);assert.equal(db.sql.prepare("SELECT SUM(amount) n FROM affiliate_ledger WHERE bucket='Paid'").get().n,1500);assert.equal(db.sql.prepare('SELECT status FROM affiliate_payouts').get().status,'paid');
});
