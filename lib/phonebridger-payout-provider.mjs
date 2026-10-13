import Stripe from 'stripe';
import {createHash} from 'node:crypto';
import {boundedJson,requestRate} from './customer-accounts.mjs';
import {accountDb,accountIdentity,approvedPartner,programTerms,affiliateEnabled,requireOperator,releaseHolds,reservePayout,settlePayout} from './phonebridger-affiliate.mjs';
import {emailVerified} from './phonebridger-account-security.mjs';
const json=(d,status=200)=>new Response(JSON.stringify(d),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'}});
const fail=(m,status=400)=>{throw Object.assign(Error(m),{status});};
const mode=env=>env.PLAYGROUND==='1'?'test':'live';
const enabled=env=>env.CREATOR_CONNECT_ENABLED==='1'&&affiliateEnabled(env);
const countries=env=>String(env.CREATOR_CONNECT_COUNTRIES||'LT').split(',').filter(c=>/^[A-Z]{2}$/.test(c));
const client=env=>new Stripe(env.CREATOR_STRIPE_KEY||env.STRIPE_RESTRICTED_KEY,{maxNetworkRetries:0,timeout:15000});
const rows=async s=>(await s.all()).results||[];
async function checkMerchant(stripe,env,requirePayout=true){const a=await stripe.accounts.retrieve();if(a.id!==env.CREATOR_CONNECT_MERCHANT)fail('Payout provider account mismatch.',503);if(requirePayout&&!a.payouts_enabled)fail('The merchant must finish Stripe payout verification before creator transfers can run.',409);return a;}
function recipientReady(a){const b=a.configuration?.recipient?.capabilities?.stripe_balance;return b?.stripe_transfers?.status==='active'&&b?.payouts?.status==='active';}
async function recipient(db,stripe,env,saved){
 const a=await stripe.v2.core.accounts.retrieve(saved.account_id,{include:['configuration.recipient','identity']});
 if(a.id!==saved.account_id||a.livemode!==(mode(env)==='live')||a.metadata?.phonebridger_partner!==saved.partner_id||a.identity?.country?.toUpperCase()!==saved.country)fail('Recipient provider identity mismatch.',503);
 const ready=recipientReady(a);await db.prepare('UPDATE creator_payout_accounts SET status=?,checked_at=? WHERE partner_id=? AND account_id=?').bind(ready?'ready':'restricted',Date.now(),saved.partner_id,a.id).run();return {account:a,ready};
}
export async function creatorPayoutProvider(request,env,action,{stripe}={}){
 try{
  if(enabled(env))stripe||=client(env);
  const db=accountDb(env),origin=new URL(request.url).origin;
  if(action==='operator'){
   requireOperator(request,env);if(request.method!=='POST')fail('Use POST.',405);
   const d=await boundedJson(request);if(!enabled(env)||env.CREATOR_AUTO_PAYOUTS!=='1')fail('Automatic provider payouts are awaiting activation.',409);
   if(d.action==='reconcile'){await reconcileProviderTransfers(db,stripe,env);return json({ok:true});}
   fail('Provider operation not found.',404);
  }
  const user=await accountIdentity(request,db);if(!user)fail('Sign in to continue.',401);const partner=await approvedPartner(db,user.id);if(!partner)fail('Approved creator access is required.',403);
  if(!['GET','POST'].includes(request.method))fail('Method not allowed.',405);
  if(request.method==='POST'&&request.headers.get('origin')!==origin)fail('Open this form on the website.',403);
  let saved=await db.prepare('SELECT * FROM creator_payout_accounts WHERE partner_id=?').bind(partner.id).first();
  if(action==='status'&&request.method==='GET'){
   let ready=false;if(enabled(env)&&saved?.account_id)ready=(await recipient(db,stripe,env,saved)).ready;
   return json({enabled:enabled(env),automatic:env.CREATOR_AUTO_PAYOUTS==='1',connected:!!saved?.account_id,ready,mode:mode(env),countries:countries(env),emailVerified:await emailVerified(db,user),message:enabled(env)?'Stripe collects identity and bank details. Transfers require verified accounts and eligible commission balances.':'Stripe creator payouts are awaiting merchant verification and provider activation.'});
  }
  if(action!=='onboard'||request.method!=='POST')fail('Provider action not found.',404);
  if(!enabled(env))fail('Stripe creator onboarding is awaiting activation.',409);
  if(!await emailVerified(db,user))fail('Verify your account email in Account settings first.',409);
  if(partner.accepted_terms!==programTerms(env).version)fail('Accept the current creator terms first.',409);
  await checkMerchant(stripe,env,false);
  if(!await requestRate(db,request,env.AUTH_RATE_SECRET,'creator-provider',5,3600,user.id))fail('Please wait before another attempt.',429);
  const d=await boundedJson(request),country=String(d.country||saved?.country||'').toUpperCase();if(!countries(env).includes(country))fail('Choose a supported country. Contact support if your country is not listed.');
  if(saved&&(saved.country!==country||saved.mode!==mode(env)))fail('Contact support to change your payout country.',409);
  if(!saved){await db.prepare("INSERT OR IGNORE INTO creator_payout_accounts VALUES (?,NULL,?,?,'creating',?,NULL)").bind(partner.id,country,mode(env),Date.now()).run();saved=await db.prepare('SELECT * FROM creator_payout_accounts WHERE partner_id=?').bind(partner.id).first();}
  if(!saved.account_id){
   // Only retry within Stripe's idempotency retention. Older uncertain creations need reconciliation.
   if(Date.now()-saved.created_at>20*3600000)fail('Recipient creation needs support reconciliation. No duplicate account was created.',409);
   const a=await stripe.v2.core.accounts.create({contact_email:user.email,display_name:'PhoneBridger creator',identity:{country:country.toLowerCase()},dashboard:'express',defaults:{responsibilities:{fees_collector:'application',losses_collector:'application'}},configuration:{recipient:{capabilities:{stripe_balance:{stripe_transfers:{requested:true}}}}},metadata:{phonebridger_partner:partner.id},include:['configuration.recipient','identity']},{idempotencyKey:'pb-recipient-v1:'+partner.id});
   if(a.livemode!==(mode(env)==='live')||a.metadata?.phonebridger_partner!==partner.id)fail('Recipient provider environment mismatch.',503);
   await db.prepare("UPDATE creator_payout_accounts SET account_id=?,status='onboarding',checked_at=? WHERE partner_id=? AND account_id IS NULL").bind(a.id,Date.now(),partner.id).run();saved=await db.prepare('SELECT * FROM creator_payout_accounts WHERE partner_id=?').bind(partner.id).first();
  }
  const link=await stripe.v2.core.accountLinks.create({account:saved.account_id,use_case:{type:'account_onboarding',account_onboarding:{refresh_url:origin+'/creator/payouts?onboarding=refresh',return_url:origin+'/creator/payouts?onboarding=return'}}});
  const url=new URL(link.url);if(url.protocol!=='https:'||url.hostname!=='connect.stripe.com'||link.livemode!==(mode(env)==='live'))fail('Unexpected provider onboarding link.',503);
  return json({url:link.url});
 }catch(e){return json({error:e.status?e.message:'The payout provider is temporarily unavailable. Contact support if this continues.'},e.status||503);}
}
async function confirmTransfer(db,env,p,t){
 const provider=await db.prepare('SELECT * FROM creator_provider_transfers WHERE payout_id=?').bind(p.id).first();
 if(!provider||t.destination!==provider.account_id||t.amount!==p.amount||t.currency!==p.currency||t.livemode!==(mode(env)==='live')||t.metadata?.phonebridger_payout!==p.id||t.transfer_group!=='pb_payout_'+p.id)fail('Transfer provider confirmation mismatch.',409);
 if(t.amount_reversed||t.reversed||p.status==='review'){
  await db.batch([db.prepare("UPDATE creator_provider_transfers SET status='review',transfer_id=?,checked_at=? WHERE payout_id=?").bind(t.id,Date.now(),p.id),db.prepare("UPDATE affiliate_payouts SET status='review' WHERE id=? AND status='reserved'").bind(p.id)]);return;
 }
 if(p.status==='paid')return;
 if(p.status!=='reserved')fail('Reservation is not payable.',409);
 const items=await rows(db.prepare('SELECT commission_id,amount FROM affiliate_payout_items WHERE payout_id=?').bind(p.id)),now=Date.now(),statements=[];
 for(const item of items){
  for(const [suffix,bucket,amount] of [['out','Reserved',-item.amount],['in','Paid',item.amount]])statements.push(db.prepare('INSERT INTO affiliate_ledger (id,commission_id,bucket,amount,reason,created_at) SELECT ?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM affiliate_payouts WHERE id=? AND status=\'reserved\')').bind(p.id+':provider:'+item.commission_id+':'+suffix,item.commission_id,bucket,amount,'Verified Stripe balance transfer',now,p.id));
 }
 statements.push(db.prepare("UPDATE affiliate_payouts SET status='paid',completed_at=?,provider_reference=? WHERE id=? AND status='reserved'").bind(now,t.id,p.id),db.prepare("UPDATE creator_provider_transfers SET status='confirmed',transfer_id=?,checked_at=? WHERE payout_id=?").bind(t.id,now,p.id));await db.batch(statements);
}
export async function reconcileProviderTransfers(db,stripe,env){
 const pending=await rows(db.prepare("SELECT p.* FROM affiliate_payouts p JOIN creator_provider_transfers t ON t.payout_id=p.id WHERE t.status IN ('sending','unknown','confirmed','review','reversed') ORDER BY COALESCE(t.checked_at,0),t.created_at LIMIT 10"));
 for(const p of pending){
  const list=await stripe.transfers.list({transfer_group:'pb_payout_'+p.id,limit:2});if(list.data.length>1)fail('Multiple provider transfers require reconciliation.',409);
  if(list.data.length){
   let t=await stripe.transfers.retrieve(list.data[0].id);await confirmTransfer(db,env,p,t);
   // Refund ledger entries may arrive during or after a transfer. Reverse only the new,
   // cumulative commission amount since this reservation, preserving earlier refunds.
   const items=await rows(db.prepare("SELECT i.amount,i.commission_id,b.reversed_before,COALESCE((SELECT SUM(l.amount) FROM affiliate_ledger l WHERE l.commission_id=i.commission_id AND l.bucket='Reversed'),0) AS reversed_now FROM affiliate_payout_items i JOIN creator_transfer_items b ON b.payout_id=i.payout_id AND b.commission_id=i.commission_id WHERE i.payout_id=?").bind(p.id));
   if(items.length){
    const target=items.reduce((n,i)=>n+Math.min(i.amount,Math.max(0,i.reversed_now-i.reversed_before)),0);
    if(target>t.amount_reversed){
     await stripe.transfers.createReversal(t.id,{amount:target-t.amount_reversed,metadata:{phonebridger_payout:p.id}},{idempotencyKey:'pb-reversal-v1:'+p.id+':'+target});t=await stripe.transfers.retrieve(t.id);
     if(t.amount_reversed<target)fail('Transfer reversal needs reconciliation.',409);
    }
    if(p.status==='review'&&t.amount_reversed===target){
     const balances=await rows(db.prepare("SELECT i.commission_id,i.amount,COALESCE((SELECT SUM(l.amount) FROM affiliate_ledger l WHERE l.commission_id=i.commission_id AND l.bucket='Reserved'),0) AS reserved FROM affiliate_payout_items i WHERE i.payout_id=?").bind(p.id));
     if(balances.reduce((n,i)=>n+Math.min(i.amount,i.reserved),0)!==t.amount-t.amount_reversed)fail('Refunded transfer needs ledger reconciliation.',409);
     const statements=[],stamp=Date.now();
     for(const i of balances){const amount=Math.min(i.amount,i.reserved);if(amount)for(const [suffix,bucket,n] of [['out','Reserved',-amount],['in','Paid',amount]])statements.push(db.prepare('INSERT INTO affiliate_ledger (id,commission_id,bucket,amount,reason,created_at) SELECT ?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM affiliate_payouts WHERE id=? AND status=\'review\')').bind(p.id+':adjusted:'+i.commission_id+':'+suffix,i.commission_id,bucket,n,'Verified refunded Stripe balance transfer',stamp,p.id));}
     statements.push(db.prepare("UPDATE affiliate_payouts SET status='paid',completed_at=?,provider_reference=? WHERE id=? AND status='review'").bind(stamp,t.id,p.id));await db.batch(statements);
    }
    await db.prepare("UPDATE creator_provider_transfers SET status=?,reversed_amount=?,checked_at=? WHERE payout_id=?").bind(target>0?'reversed':'confirmed',t.amount_reversed,Date.now(),p.id).run();
   }
  }
  else await db.prepare("UPDATE creator_provider_transfers SET status=CASE WHEN status='sending' THEN 'unknown' ELSE status END,checked_at=? WHERE payout_id=?").bind(Date.now(),p.id).run();
 }
}
export async function runCreatorPayouts(env,{stripe,now=Date.now()}={}){
 if(!enabled(env)||env.CREATOR_AUTO_PAYOUTS!=='1')return;
 stripe||=client(env);
 const db=accountDb(env);await reconcileProviderTransfers(db,stripe,env);
 const date=new Date(now);if(date.getUTCDate()<15)return;await checkMerchant(stripe,env);
 const partners=await rows(db.prepare("SELECT a.* FROM creator_payout_accounts a JOIN creator_partners p ON p.id=a.partner_id JOIN customer_users u ON u.id=p.user_id JOIN account_email_verifications v ON v.user_id=u.id AND v.email=u.email WHERE p.status='approved' AND p.accepted_terms=? AND a.account_id IS NOT NULL AND a.mode=? ORDER BY COALESCE(a.checked_at,0),a.partner_id LIMIT 10").bind(programTerms(env).version,mode(env)));
 for(const saved of partners){
  if(!(await recipient(db,stripe,env,saved)).ready)continue;await releaseHolds(db,saved.partner_id,now);
  // One bounded currency batch per creator/month. Uncertain sends are reconciled, never replayed.
  const requestId=createHash('sha256').update(saved.partner_id+':'+date.toISOString().slice(0,7)).digest('hex').slice(0,32).replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/,'$1-$2-$3-$4-$5');
  let p;try{p=await reservePayout(db,saved.partner_id,'usd',requestId,now,programTerms(env));}catch(e){if(e.status===409)continue;throw e;}
  await db.prepare("INSERT OR IGNORE INTO creator_provider_transfers (payout_id,account_id,mode,status,created_at) VALUES (?,?,?,'prepared',?)").bind(p.id,saved.account_id,mode(env),now).run();
  await db.prepare("INSERT OR IGNORE INTO creator_transfer_items SELECT i.payout_id,i.commission_id,COALESCE((SELECT SUM(l.amount) FROM affiliate_ledger l WHERE l.commission_id=i.commission_id AND l.bucket='Reversed'),0) FROM affiliate_payout_items i WHERE i.payout_id=?").bind(p.id).run();
  const state=await db.prepare('SELECT p.status AS payout_status,t.status AS provider_status FROM affiliate_payouts p JOIN creator_provider_transfers t ON t.payout_id=p.id WHERE p.id=?').bind(p.id).first();
  if(state.payout_status==='review'&&state.provider_status==='prepared'){await settlePayout(db,p.id,'failed');continue;}
  const claimed=await db.prepare("UPDATE creator_provider_transfers SET status='sending' WHERE payout_id=? AND status='prepared' AND EXISTS (SELECT 1 FROM affiliate_payouts WHERE id=? AND status='reserved') RETURNING payout_id").bind(p.id,p.id).first();if(!claimed)continue;
  try{
   const created=await stripe.transfers.create({amount:p.amount,currency:p.currency,destination:saved.account_id,transfer_group:'pb_payout_'+p.id,metadata:{phonebridger_payout:p.id}},{idempotencyKey:'pb-transfer-v1:'+p.id});
   const canonical=await stripe.transfers.retrieve(created.id);await confirmTransfer(db,env,p,canonical);
  }catch{
   await db.prepare("UPDATE creator_provider_transfers SET status='unknown',checked_at=? WHERE payout_id=? AND status='sending'").bind(Date.now(),p.id).run();
  }
 }
}
