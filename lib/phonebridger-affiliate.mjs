import {createHash,timingSafeEqual,randomBytes} from 'node:crypto';
import {boundedJson,requestRate} from './customer-accounts.mjs';
import terms from '../deploy/phonebridger/affiliate-terms.json' with {type:'json'};
import liveTerms from '../deploy/phonebridger/affiliate-terms-live.json' with {type:'json'};

const day=86400000;
const hash=v=>createHash('sha256').update(v).digest('hex');
const fail=(message,status=400)=>{throw Object.assign(Error(message),{status});};
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow',...headers}});
export const affiliateTerms=terms;
const sandboxEnabled=env=>env.PLAYGROUND==='1'&&env.AFFILIATE_SANDBOX==='1';
export const affiliateEnabled=env=>sandboxEnabled(env)||(env.PLAYGROUND!=='1'&&env.AFFILIATE_LIVE==='1'&&liveTerms.approvedForLive===true);
export const programTerms=env=>env.PLAYGROUND!=='1'&&env.AFFILIATE_LIVE==='1'?liveTerms:terms;
export const accountDb=env=>env.DB.withSession?env.DB.withSession('first-primary'):env.DB;
export async function accountIdentity(request,db){
 const token=/(?:^|;\s*)__Host-pb_session=([a-f0-9]{64})(?:;|$)/.exec(request.headers.get('cookie')||'')?.[1];
 return token?db.prepare('SELECT u.id,u.email,u.created_at,s.digest,s.expires_at FROM customer_sessions s JOIN customer_users u ON u.id=s.user_id WHERE s.digest=? AND s.expires_at>?').bind(hash(token),Date.now()).first():null;
}
export function requireOperator(request,env){
 const supplied=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';
 if(!env.COMMERCE_OPERATOR_SECRET||!supplied||!timingSafeEqual(Buffer.from(hash(supplied)),Buffer.from(hash(env.COMMERCE_OPERATOR_SECRET))))fail('Not authorized.',401);
}
const rows=async statement=>(await statement.all()).results||[];
export async function approvedPartner(db,userId){return db.prepare("SELECT * FROM creator_partners WHERE user_id=? AND status='approved'").bind(userId).first();}
async function persistTerms(db,terms=affiliateTerms){
 await db.prepare('INSERT OR IGNORE INTO affiliate_terms VALUES (?,?,?)').bind(terms.version,JSON.stringify(terms),Date.now()).run();
 const stored=await db.prepare('SELECT definition FROM affiliate_terms WHERE version=?').bind(terms.version).first();
 if(stored?.definition!==JSON.stringify(terms))fail('The program needs a new terms version.',503);
}
export async function referralRedirect(request,env,token){
 const terms=programTerms(env);
 const db=accountDb(env);
 const link=await db.prepare("SELECT l.id FROM affiliate_links l JOIN creator_partners p ON p.id=l.partner_id WHERE l.id=? AND l.active=1 AND p.status='approved'").bind(token).first();
 if(!link)return new Response('Referral link not found',{status:404});
 if(!await requestRate(db,request,env.AUTH_RATE_SECRET,'referral',60))return json({error:'Please try again later.'},429);
 const visitor=/(?:^|;\s*)pb_visitor=([a-f0-9]{32})(?:;|$)/.exec(request.headers.get('cookie')||'')?.[1]||randomBytes(16).toString('hex');
 const id=randomBytes(16).toString('hex');
 await db.prepare('INSERT INTO affiliate_clicks VALUES (?,?,?,?)').bind(id,link.id,hash(env.AUTH_RATE_SECRET+':visitor:'+visitor),Date.now()).run();
 const headers=new Headers({'Location':'/shop','Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'});
 headers.append('Set-Cookie',`pb_ref=${id}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${terms.attributionDays*86400}`);
 headers.append('Set-Cookie',`pb_visitor=${visitor}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${terms.attributionDays*86400}`);
 return new Response(null,{status:302,headers});
}
// Each environment explicitly selects an immutable approved edition; preview flags never enable live.
export async function checkoutAttribution(request,env,db,user,code,price,currency){
 const terms=programTerms(env);
 if(!affiliateEnabled(env)){
  if(code)fail('Creator discounts are not active for this checkout.',409);
  return null;
 }
 await persistTerms(db,terms);
 let partner,linkId=null;
 if(code){
  if(typeof code!=='string'||! /^[A-Z0-9]{4,24}$/.test(code))fail('Enter a valid creator code.');
  partner=await db.prepare("SELECT * FROM creator_partners WHERE code=? AND status='approved' AND accepted_terms=?").bind(code,terms.version).first();
  if(!partner)fail('This creator code is not eligible.',409);
 }else{
  const click=/(?:^|;\s*)pb_ref=([a-f0-9]{32})(?:;|$)/.exec(request.headers.get('cookie')||'')?.[1];
  if(click){partner=await db.prepare("SELECT p.*,l.id AS link_id FROM affiliate_clicks c JOIN affiliate_links l ON l.id=c.link_id JOIN creator_partners p ON p.id=l.partner_id WHERE c.id=? AND c.created_at>? AND l.active=1 AND p.status='approved' AND p.accepted_terms=?").bind(click,Date.now()-terms.attributionDays*day,terms.version).first();linkId=partner?.link_id||null;}
 }
 if(!partner||partner.user_id===user.id)return null;
 // Existing customers do not acquire new-customer referral discounts or commissions.
 if(await db.prepare('SELECT id FROM commerce_orders WHERE user_id=? AND paid_at IS NOT NULL LIMIT 1').bind(user.id).first())return null;
 const discount=code?Math.round(price*terms.audienceDiscountBps/10000):0;
 return {partnerId:partner.id,linkId,version:terms.version,rate:terms.commissionBps,basis:price-discount,discount,currency};
}
export function attributionStatement(db,id,a,now){return db.prepare('INSERT INTO affiliate_order_snapshots VALUES (?,?,?,?,?,?,?,?,?)').bind(id,a.partnerId,a.linkId,a.version,a.currency,a.basis,a.rate,a.discount,now);}
const entry=(db,id,commission,bucket,amount,reason,now)=>db.prepare('INSERT OR IGNORE INTO affiliate_ledger (id,commission_id,bucket,amount,reason,created_at) VALUES (?,?,?,?,?,?)').bind(id,commission,bucket,amount,reason,now);
async function balances(db,id){return Object.fromEntries((await rows(db.prepare('SELECT bucket,SUM(amount) AS amount FROM affiliate_ledger WHERE commission_id=? GROUP BY bucket').bind(id))).map(r=>[r.bucket,r.amount]));}
export async function qualifyCommission(db,orderId,now=Date.now()){
 const o=await db.prepare("SELECT o.*,s.partner_id,s.terms_version,s.basis,s.rate_bps,p.user_id AS partner_user,p.status AS partner_status FROM commerce_orders o JOIN affiliate_order_snapshots s ON s.order_id=o.id JOIN creator_partners p ON p.id=s.partner_id WHERE o.id=? AND o.status='paid'").bind(orderId).first();
 if(!o||o.user_id===o.partner_user||o.partner_status!=='approved')return;
 if(await db.prepare('SELECT id FROM commerce_orders WHERE user_id=? AND paid_at IS NOT NULL AND id<>? AND (created_at<? OR (created_at=? AND id<?)) LIMIT 1').bind(o.user_id,o.id,o.created_at,o.created_at,o.id).first())return;
 if(await db.prepare('SELECT id FROM affiliate_commissions WHERE order_id=? OR buyer_id=?').bind(o.id,o.user_id).first())return;
 const amount=Math.round(o.basis*o.rate_bps/10000);
 if(amount<=0)return;
 // Unique buyer/order constraints and grant identity provide atomic first-purchase qualification.
 try{await db.batch([
  db.prepare('INSERT INTO affiliate_commissions VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(o.id,o.id,o.partner_id,o.user_id,o.currency,o.basis,o.rate_bps,amount,o.terms_version,o.paid_at,o.holders),
  entry(db,'grant:'+o.id,o.id,'Pending',amount,'Verified paid purchase',now)
 ]);}catch(error){if(!await db.prepare('SELECT id FROM affiliate_commissions WHERE buyer_id=?').bind(o.user_id).first())throw error;}
}
export async function releaseHolds(db,partnerId,now=Date.now()){
 const commissions=await rows(db.prepare("SELECT c.*,o.status,d.delivered_at FROM affiliate_commissions c JOIN commerce_orders o ON o.id=c.order_id LEFT JOIN commerce_deliveries d ON d.order_id=c.order_id WHERE c.partner_id=? AND EXISTS (SELECT 1 FROM affiliate_ledger l WHERE l.commission_id=c.id AND l.bucket='Pending' GROUP BY l.commission_id HAVING SUM(l.amount)>0) LIMIT 200").bind(partnerId));
 for(const c of commissions){
  const version=await db.prepare('SELECT definition FROM affiliate_terms WHERE version=?').bind(c.terms_version).first();
  if(!version)continue;
  const t=JSON.parse(version.definition),eligible=c.holders?c.delivered_at&&Math.max(c.paid_at+t.hardwareSaleHoldDays*day,c.delivered_at+t.hardwareDeliveryHoldDays*day):c.paid_at+t.digitalHoldDays*day;
  if(c.status!=='paid'||!eligible||now<eligible)continue;
  const b=await balances(db,c.id),amount=b.Pending||0;
  if(amount>0)await db.batch([entry(db,'release:'+c.id+':out',c.id,'Pending',-amount,'Hold completed',now),entry(db,'release:'+c.id+':in',c.id,'Available',amount,'Hold completed',now)]);
 }
}
export async function reverseCommission(db,orderId,refunded,total,reason='Refund',now=Date.now()){
 const c=await db.prepare('SELECT * FROM affiliate_commissions WHERE order_id=?').bind(orderId).first();if(!c)return;
 if(!Number.isSafeInteger(refunded)||!Number.isSafeInteger(total)||total<=0||refunded<0||refunded>total)fail('Invalid refund amounts.');
 const target=Math.min(c.amount,Math.round(c.amount*refunded/total)),b=await balances(db,c.id);
 let remaining=target-(b.Reversed||0);if(remaining<=0)return;
 const statements=[];
 for(const bucket of ['Pending','Available','Review','Reserved','Paid']){
  const take=Math.min(remaining,b[bucket]||0);if(!take)continue;
  statements.push(entry(db,`reversal:${c.id}:${target}:${bucket}`,c.id,bucket,-take,reason,now));remaining-=take;
 }
 if(remaining)fail('Commission needs reconciliation.',409);
 statements.push(entry(db,`reversal:${c.id}:${target}:in`,c.id,'Reversed',target-(b.Reversed||0),reason,now));
 // Reserved reversals block payment finalization; no provider transfer is attempted here.
 statements.push(db.prepare("UPDATE affiliate_payouts SET status='review' WHERE status='reserved' AND id IN (SELECT payout_id FROM affiliate_payout_items WHERE commission_id=?)").bind(c.id));
 await db.batch(statements);
}
export async function reconcileAffiliateEvent(event,db,stripe,env){
 if(!affiliateEnabled(env))return;
 const object=event.data.object;
 if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)){
  const id=object.metadata?.phonebridger_order;if(id){
   await qualifyCommission(db,id);
   // An earlier partial refund can arrive before the local payment-intent link exists.
   // Reconcile its canonical cumulative amount after completion as well.
   if(await db.prepare('SELECT id FROM affiliate_commissions WHERE order_id=?').bind(id).first()){
    const session=await stripe.checkout.sessions.retrieve(object.id,{expand:['payment_intent.latest_charge']});
    const charge=session.payment_intent?.latest_charge;
    if(charge?.amount_refunded>0)await reverseCommission(db,id,charge.amount_refunded,charge.amount);
   }
  }
 }
 if(['charge.refunded','charge.dispute.created'].includes(event.type)){
  const charge=event.type==='charge.refunded'?await stripe.charges.retrieve(object.id):null;
  const intent=charge?.payment_intent||object.payment_intent;
  const intentId=typeof intent==='string'?intent:intent?.id;
  if(charge&&(charge.livemode!==(env.PLAYGROUND!=='1')||!Number.isSafeInteger(charge.amount_refunded)))fail('Unexpected refund environment.');
  const order=intentId&&await db.prepare('SELECT id,subtotal,shipping FROM commerce_orders WHERE payment_intent=?').bind(intentId).first();
  if(order)await reverseCommission(db,order.id,charge?charge.amount_refunded:order.subtotal+order.shipping,charge?charge.amount:order.subtotal+order.shipping,event.type==='charge.refunded'?'Refund':'Chargeback');
 }
}
export async function reservePayout(db,partnerId,currency,requestId,now=Date.now()){
 if(! /^[a-f0-9-]{36}$/.test(requestId||''))fail('Use an operation request ID.');
 const id=hash(partnerId+':'+currency+':'+requestId).slice(0,32);
 const existing=await db.prepare('SELECT * FROM affiliate_payouts WHERE id=?').bind(id).first();if(existing)return existing;
 const partner=await db.prepare("SELECT id FROM creator_partners WHERE id=? AND status='approved' AND accepted_terms=?").bind(partnerId,terms.version).first();if(!partner)fail('Eligible approved creator access is required.',403);
 const eligible=await rows(db.prepare("SELECT c.id,SUM(l.amount) AS amount FROM affiliate_commissions c JOIN affiliate_ledger l ON l.commission_id=c.id WHERE c.partner_id=? AND c.currency=? AND l.bucket='Available' GROUP BY c.id HAVING SUM(l.amount)>0").bind(partnerId,currency));
 const amount=eligible.reduce((n,r)=>n+r.amount,0),minimum=terms.minimumByCurrency[currency];
 if(!minimum||amount<minimum)fail('Eligible balance is below the currency minimum.',409);
 const statements=[db.prepare("INSERT INTO affiliate_payouts VALUES (?,?,?,?,'reserved',?,NULL,NULL)").bind(id,partnerId,currency,amount,now)];
 for(const c of eligible)statements.push(db.prepare('INSERT INTO affiliate_payout_items VALUES (?,?,?)').bind(id,c.id,c.amount),entry(db,id+':'+c.id+':out',c.id,'Available',-c.amount,'Payout reservation',now),entry(db,id+':'+c.id+':in',c.id,'Reserved',c.amount,'Payout reservation',now));
 await db.batch(statements);return {id,amount,currency,status:'reserved'};
}
export async function settlePayout(db,id,outcome,reference,now=Date.now()){
 if(!['paid','failed'].includes(outcome))fail('Choose a payout result.');
 const p=await db.prepare('SELECT * FROM affiliate_payouts WHERE id=?').bind(id).first();if(!p)fail('Payout not found.',404);
 if(p.status===outcome)return p;
 if(!['reserved','review'].includes(p.status)||p.status==='review'&&outcome==='paid')fail('Reconcile this payout before finalizing it.',409);
 if(outcome==='paid'&&(!reference||! /^test_[a-zA-Z0-9_-]{4,80}$/.test(reference)))fail('A sandbox transfer reference is required.');
 const items=await rows(db.prepare('SELECT * FROM affiliate_payout_items WHERE payout_id=?').bind(id)),statements=[];
 for(const c of items){
  const b=await balances(db,c.commission_id);
  // Each reservation owns its immutable items. Refunded reservations are reviewed, then failed.
  const amount=Math.min(c.amount,b.Reserved||0);
  if(outcome==='paid'&&amount!==c.amount)fail('Reservation changed; reconcile before paying.',409);
  if(amount)statements.push(entry(db,id+':'+outcome+':'+c.commission_id+':out',c.commission_id,'Reserved',-amount,'Payout '+outcome,now),entry(db,id+':'+outcome+':'+c.commission_id+':in',c.commission_id,outcome==='paid'?'Paid':'Available',amount,'Payout '+outcome,now));
 }
 statements.push(db.prepare('UPDATE affiliate_payouts SET status=?,completed_at=?,provider_reference=? WHERE id=? AND status IN (\'reserved\',\'review\')').bind(outcome,now,outcome==='paid'?reference:null,id));
 await db.batch(statements);return {...p,status:outcome};
}
export async function creatorApi(request,env,action){
 try{
  const terms=programTerms(env),programMode=sandboxEnabled(env)?'sandbox':affiliateEnabled(env)?'live':'inactive';
  const db=accountDb(env),url=new URL(request.url);
  if(action==='operator'){
   requireOperator(request,env);if(request.method!=='POST')return json({error:'Use POST.'},405);
   if(!await requestRate(db,request,env.AUTH_RATE_SECRET,'creator-operator',60))fail('Please wait.',429);
   const d=await boundedJson(request,4096);
   if(d.action==='applications')return json({applications:await rows(db.prepare('SELECT * FROM creator_applications ORDER BY created_at DESC LIMIT 100'))});
   if(d.action==='review'){
    if(!['approved','rejected','suspended'].includes(d.status))fail('Choose a review decision.');
    const app=await db.prepare('SELECT * FROM creator_applications WHERE user_id=?').bind(String(d.userId||'')).first();if(!app)fail('Application not found.',404);
    const statements=[db.prepare('UPDATE creator_applications SET status=?,reviewed_at=? WHERE user_id=?').bind(d.status,Date.now(),d.userId),db.prepare('INSERT INTO creator_operations VALUES (?,?,?,?)').bind(crypto.randomUUID(),'application:'+d.status,d.userId,Date.now())];
    if(d.status==='approved')statements.push(db.prepare("INSERT INTO creator_partners (id,user_id,code,status,created_at) VALUES (?,?,?,'approved',?) ON CONFLICT(user_id) DO UPDATE SET status='approved'").bind(crypto.randomUUID(),d.userId,'PB'+randomBytes(6).toString('hex').toUpperCase(),Date.now()));
    else statements.push(db.prepare("UPDATE creator_partners SET status='suspended' WHERE user_id=?").bind(d.userId));
    await db.batch(statements);return json({ok:true});
   }
   if(!sandboxEnabled(env))fail('Provider payout operations are restricted to the isolated sandbox.',403);
   if(d.action==='reserve')return json(await reservePayout(db,d.partnerId,d.currency,d.requestId),201);
   if(d.action==='settle')return json(await settlePayout(db,d.payoutId,d.outcome,d.reference));
   fail('Operation not found.',404);
  }
  const user=await accountIdentity(request,db);if(!user)fail('Sign in to continue.',401);
  if(request.method==='POST'&&request.headers.get('origin')!==url.origin)fail('Open the form on this website.',403);
  if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed.'},405);
  if(request.method==='POST'&&!await requestRate(db,request,env.AUTH_RATE_SECRET,'creator-write',30,600,user.id))fail('Please wait before another change.',429);
  if(action==='application'){
   if(request.method==='GET')return json({application:await db.prepare('SELECT channels,audience,message,terms_version,status,created_at,reviewed_at FROM creator_applications WHERE user_id=?').bind(user.id).first(),terms,financiallyActive:affiliateEnabled(env),programMode});
   const d=await boundedJson(request,4096),channels=String(d.channels||'').trim(),audience=String(d.audience||'').trim(),message=String(d.message||'').trim();
   const urls=channels.split(/\s+/).filter(Boolean);if(!urls.length||urls.length>5||urls.some(v=>{try{const u=new URL(v);return u.protocol!=='https:'||!!u.username||!!u.password;}catch{return true;}})||channels.length>1000||audience.length<2||audience.length>200||message.length>1000||d.consent!==true||d.termsVersion!==terms.version)fail('Add up to five HTTPS channel URLs, your audience and accept the application terms.');
   if(await db.prepare('SELECT user_id FROM creator_applications WHERE user_id=?').bind(user.id).first())fail('Your application is already on file. Contact support for changes.',409);
   await persistTerms(db,terms);await db.prepare("INSERT INTO creator_applications VALUES (?,?,?,?,?,'pending',?,NULL)").bind(user.id,channels,audience,message,terms.version,Date.now()).run();return json({status:'pending'},201);
  }
  const partner=await approvedPartner(db,user.id);if(!partner)fail('Approved creator access is required.',403);
  if(action==='accept-terms'&&request.method==='POST'){
   const d=await boundedJson(request);if(d.version!==terms.version||d.consent!==true)fail('Accept the current program terms version.');await persistTerms(db,terms);
   await db.prepare('UPDATE creator_partners SET accepted_terms=? WHERE id=?').bind(terms.version,partner.id).run();return json({ok:true});
  }
  if(action==='links'&&request.method==='POST'){
   const d=await boundedJson(request);if(d.archive){const result=await db.prepare('UPDATE affiliate_links SET active=0 WHERE id=? AND partner_id=?').bind(String(d.archive),partner.id).run();if(!(result.meta?.changes??result.changes))fail('Link not found.',404);return json({ok:true});}
   const tag=String(d.tag||'').trim();if(tag.length<2||tag.length>80)fail('Use a channel label of 2–80 characters.');
   const count=await db.prepare('SELECT COUNT(*) AS n FROM affiliate_links WHERE partner_id=? AND active=1').bind(partner.id).first();if(count.n>=50)fail('Archive a link before creating another.',409);
   const id=randomBytes(16).toString('hex');await db.prepare('INSERT INTO affiliate_links VALUES (?,?,?,1,?)').bind(id,partner.id,tag,Date.now()).run();return json({id,url:url.origin+'/r/'+id},201);
  }
  if(action==='content'&&request.method==='POST'){
   const d=await boundedJson(request);let contentUrl;try{contentUrl=new URL(d.url);}catch{fail('Use an HTTPS post URL.');}
   const label=String(d.label||'').trim();if(contentUrl.protocol!=='https:'||contentUrl.username||contentUrl.password||contentUrl.href.length>1000||label.length<2||label.length>100)fail('Add an HTTPS post URL and a short label.');
   await db.prepare('INSERT INTO creator_content VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),partner.id,contentUrl.href,label,Date.now()).run();return json({ok:true},201);
  }
  if(request.method!=='GET'||!['overview','links','performance','referrals','earnings','payouts','settings','content','export'].includes(action))fail('Creator action not found.',404);
  if(affiliateEnabled(env))await releaseHolds(db,partner.id);
  const range=Number(url.searchParams.get('days')||30);if(![7,30,90].includes(range))fail('Choose 7, 30 or 90 days.');const since=Math.floor(Date.now()/day)*day-(range-1)*day;
  const links=await rows(db.prepare('SELECT id,tag,active,created_at FROM affiliate_links WHERE partner_id=? ORDER BY created_at DESC LIMIT 100').bind(partner.id));
  const commissions=await rows(db.prepare("SELECT c.id,c.currency,c.basis,c.rate_bps,c.amount,c.terms_version,c.paid_at,c.holders,l.bucket,SUM(l.amount) AS balance FROM (SELECT * FROM affiliate_commissions WHERE partner_id=? AND paid_at>=? ORDER BY paid_at DESC,id DESC LIMIT 200) c JOIN affiliate_ledger l ON l.commission_id=c.id GROUP BY c.id,l.bucket ORDER BY c.paid_at DESC,c.id DESC").bind(partner.id,since));
  const ledger=[],byId=new Map();for(const c of commissions){let row=byId.get(c.id);if(!row){const mask=c.id.slice(0,8).toUpperCase()+'…'+c.id.slice(-4).toUpperCase();row={id:mask,reference:'PB-'+mask,currency:c.currency,basis:c.basis,rateBps:c.rate_bps,amount:c.amount,termsVersion:c.terms_version,paidAt:c.paid_at,holders:c.holders,balances:{}};ledger.push(row);byId.set(c.id,row);}row.balances[c.bucket]=c.balance;}
  const aggregates=await rows(db.prepare('SELECT c.currency,l.bucket,SUM(l.amount) AS balance FROM affiliate_commissions c JOIN affiliate_ledger l ON l.commission_id=c.id WHERE c.partner_id=? GROUP BY c.currency,l.bucket').bind(partner.id));
  const currencyBalances={};for(const c of aggregates){const b=currencyBalances[c.currency]||={};b[c.bucket]=c.balance;}
  const daily=await rows(db.prepare('SELECT currency,CAST(paid_at/86400000 AS INTEGER) AS day,SUM(amount) AS amount FROM affiliate_commissions WHERE partner_id=? AND paid_at>=? GROUP BY currency,day ORDER BY day').bind(partner.id,since));
  const qualified=await db.prepare('SELECT COUNT(*) AS n FROM affiliate_commissions WHERE partner_id=? AND paid_at>=?').bind(partner.id,since).first();
  const visitors=await db.prepare('SELECT COUNT(DISTINCT c.visitor_digest) AS n FROM affiliate_clicks c JOIN affiliate_links l ON l.id=c.link_id WHERE l.partner_id=? AND c.created_at>=?').bind(partner.id,since).first();
  const period=ledger.filter(c=>c.paidAt>=since),payouts=await rows(db.prepare('SELECT id,currency,amount,status,created_at,completed_at FROM affiliate_payouts WHERE partner_id=? ORDER BY created_at DESC LIMIT 100').bind(partner.id));
  const linked=await db.prepare('SELECT COUNT(*) AS n FROM affiliate_commissions c JOIN affiliate_order_snapshots s ON s.order_id=c.order_id WHERE c.partner_id=? AND c.paid_at>=? AND s.link_id IS NOT NULL').bind(partner.id,since).first();
  if(action==='export'){
   const safe=v=>'"'+String(v).replace(/^[=+\-@\t\r]/,"'$&").replaceAll('"','""')+'"';
   const csv=['Reference,Currency,Basis minor units,Rate basis points,Commission minor units,Date',...period.map(r=>[r.reference,r.currency,r.basis,r.rateBps,r.amount,new Date(r.paidAt).toISOString()].map(safe).join(','))].join('\r\n');
   return new Response(csv,{headers:{'Content-Type':'text/csv;charset=utf-8','Content-Disposition':'attachment; filename="phonebridger-earnings.csv"','Cache-Control':'private, no-store','X-Robots-Tag':'noindex'}});
  }
  return json({partner:{code:partner.code,acceptedTerms:partner.accepted_terms},terms,financiallyActive:affiliateEnabled(env),programMode,links:links.map(l=>({...l,url:url.origin+'/r/'+l.id})),ledger:action==='payouts'?[]:period,ledgerLimit:200,totalRecords:qualified.n,daily,balances:currencyBalances,metrics:{visitors:visitors.n,qualifiedOrders:qualified.n,linkedOrders:linked.n,conversion:visitors.n?linked.n/visitors.n*100:null,definition:'Qualified link-attributed orders / unique referral visitors in the selected period. Code orders excluded; visits and purchases may span periods.'},payouts,content:action==='content'?await rows(db.prepare('SELECT id,url,label,created_at FROM creator_content WHERE partner_id=? ORDER BY created_at DESC LIMIT 100').bind(partner.id)):[],days:range});
 }catch(e){return json({error:e.status?e.message:'Creator service is temporarily unavailable.'},e.status||503);}
}
