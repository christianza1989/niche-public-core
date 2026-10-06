import Stripe from 'stripe';
import {createHash,timingSafeEqual} from 'node:crypto';
import {boundedJson, requestRate} from './customer-accounts.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const json = (body, status=200) => new Response(JSON.stringify(body), {status, headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'}});
const fail = (message,status=400) => {throw Object.assign(Error(message),{status});};
const nameOf = count => count ? `App + ${count} ${count===1?'holder':'holders'}` : 'App only';
const dbOf = env => env.DB.withSession ? env.DB.withSession('first-primary') : env.DB;
const stripeOf = env => new Stripe(env.STRIPE_RESTRICTED_KEY, {httpClient:Stripe.createFetchHttpClient(),maxNetworkRetries:1,timeout:12000});

export function commerceReady(env, policy, count=0) {
  const mode=policy.mode;
  if(!['test','live'].includes(mode)||!env.STRIPE_RESTRICTED_KEY||!env.STRIPE_WEBHOOK_SECRET)return false;
  const keyMode=/^(?:rk|rkcs|sk)_(test|live)_/.exec(env.STRIPE_RESTRICTED_KEY)?.[1];
  if(keyMode!==mode||!policy.stripeAccount||!policy.licenceApproved||!policy.taxReviewed||!policy.returnsApproved)return false;
  if(policy.prices.length!==4||policy.prices.some(p=>!Number.isSafeInteger(p)||p<=0)||! /^[a-z]{3}$/.test(policy.currency))return false;
  if(count && (!policy.shippingApproved||!policy.shippingCountries.length||policy.shippingCountries.some(c=>! /^[A-Z]{2}$/.test(c))||!Number.isSafeInteger(policy.shippingAmount)||policy.shippingAmount<0||!Number.isSafeInteger(policy.shippingDeliveryMinimum)||policy.shippingDeliveryMinimum<1||!Number.isSafeInteger(policy.shippingDeliveryMaximum)||policy.shippingDeliveryMaximum<policy.shippingDeliveryMinimum))return false;
  return true;
}

export function checkoutParameters(order, policy, origin) {
  const metadata={phonebridger_order:order.id,policy_version:policy.version,holders:String(order.holders),finish:order.finish};
  return {
    mode:'payment',client_reference_id:order.id,customer_email:order.email,
    adaptive_pricing:{enabled:false},branding_settings:{display_name:'PhoneBridger',background_color:'#101114',button_color:'#d80070',border_style:'rounded'},
    integration_identifier:'phonebridger_shop_'+Buffer.from(hash(order.id).slice(0,16),'hex').map(b=>97+b%26).toString('ascii'),
    line_items:[{price_data:{currency:policy.currency,unit_amount:policy.prices[order.holders],product_data:{name:'PhoneBridger · '+nameOf(order.holders),description:order.holders?`Windows V1 licence + Android companion; ${order.holders} magnetic ${order.finish} ${order.holders===1?'holder':'holders'}`:'Windows V1 licence + Android companion',metadata:{policy_version:policy.version}}},quantity:1}],
    metadata,payment_intent_data:{metadata},
    ...(policy.mode==='test'?{custom_text:{submit:{message:'TEST ONLY. No money, licence or physical goods will be delivered.'}}}:{consent_collection:{terms_of_service:'required'}}),
    success_url:origin+'/checkout?order='+order.id+'&session_id={CHECKOUT_SESSION_ID}',
    cancel_url:origin+'/shop?holders='+order.holders+'&finish='+order.finish+'&checkout=cancelled',
    expires_at:Math.floor(order.expires_at/1000),
    ...(order.holders?{shipping_address_collection:{allowed_countries:policy.shippingCountries},shipping_options:[{shipping_rate_data:{type:'fixed_amount',fixed_amount:{amount:policy.shippingAmount,currency:policy.currency},display_name:'Tracked delivery',delivery_estimate:{minimum:{unit:'business_day',value:policy.shippingDeliveryMinimum},maximum:{unit:'business_day',value:policy.shippingDeliveryMaximum}}}}]}:{})
  };
}

async function userOf(request,db) {
  const token=/(?:^|;\s*)__Host-pb_session=([a-f0-9]{64})(?:;|$)/.exec(request.headers.get('cookie')||'')?.[1];
  return token ? db.prepare('SELECT u.id,u.email FROM customer_sessions s JOIN customer_users u ON u.id=s.user_id WHERE s.digest=? AND s.expires_at>?').bind(hash(token),Date.now()).first() : null;
}

async function createCheckout(request,env,policy,client) {
  if(request.headers.get('origin')!==new URL(request.url).origin)fail('Open checkout on this website.',403);
  const data=await boundedJson(request,1024);
  if(!Number.isInteger(data.holders)||data.holders<0||data.holders>3||!['black','silver'].includes(data.finish)||! /^[a-f0-9-]{36}$/.test(data.requestId||'')||data.consent!==true)fail('Choose a setup and accept the purchase terms.');
  if(!commerceReady(env,policy,data.holders))fail('Orders are not open yet. You can try the beta or ask about your setup.',503);
  const db=dbOf(env),user=await userOf(request,db);
  if(!user)fail('Sign in before checkout to keep your order connected to your account.',401);
  if(!await requestRate(db,request,env.AUTH_RATE_SECRET,'checkout',10,600,user.id))fail('Please wait before trying checkout again.',429);
  const stripe=client||stripeOf(env);
  // Claimable playground keys deliberately cannot read Accounts. This exception
  // is restricted to the explicitly bound, separate test Worker and test policy.
  const claimable=env.PLAYGROUND==='1'&&policy.mode==='test'&&env.CLAIMABLE_SANDBOX_ACCOUNT===policy.stripeAccount&&env.STRIPE_RESTRICTED_KEY.startsWith('rkcs_test_');
  if(!claimable){
    const account=await stripe.accounts.retrieve(policy.stripeAccount);
    if(account.id!==policy.stripeAccount||!account.charges_enabled||(policy.mode==='live'&&(!account.payouts_enabled||account.requirements?.currently_due?.length)))fail('Checkout is temporarily unavailable.',503);
  }
  const finish=data.holders?data.finish:'none',id=hash(`${user.id}:${data.requestId}`).slice(0,32),now=Date.now();
  let order=await db.prepare('SELECT * FROM commerce_orders WHERE id=?').bind(id).first();
  if(order && (order.user_id!==user.id||order.holders!==data.holders||order.finish!==finish||order.policy_version!==policy.version))fail('This checkout request belongs to another selection. Try again.',409);
  if(order?.status==='paid')return json({paid:true,orderId:id,url:new URL(request.url).origin+'/checkout?order='+id});
  if(order && (order.expires_at<=now||!['creating','pending'].includes(order.status)))fail('Start a new checkout for this setup.',409);
  if(!order){
    order={id,user_id:user.id,email:user.email,holders:data.holders,finish,policy_version:policy.version,currency:policy.currency,subtotal:policy.prices[data.holders],shipping:data.holders?policy.shippingAmount:0,created_at:now,expires_at:now+7200000};
    const statements=[db.prepare("INSERT INTO commerce_orders (id,user_id,email,holders,finish,policy_version,currency,subtotal,shipping,status,fulfilment,created_at,expires_at) VALUES (?,?,?,?,?,?,?,?,?,'creating','unfulfilled',?,?)").bind(id,user.id,user.email,order.holders,finish,policy.version,order.currency,order.subtotal,order.shipping,now,order.expires_at)];
    if(order.holders)statements.push(db.prepare('INSERT INTO commerce_reservations (order_id,finish,quantity,expires_at) VALUES (?,?,?,?)').bind(id,finish,order.holders,order.expires_at));
    try{await db.batch(statements);}catch{
      // A concurrent identical request can already have created this order.
      const existing=await db.prepare('SELECT * FROM commerce_orders WHERE id=?').bind(id).first();
      if(!existing)fail('This finish is not available in the selected quantity. Please choose another setup.',409);
      if(existing.holders!==data.holders||existing.finish!==finish||existing.user_id!==user.id)fail('Start a new checkout for this setup.',409);
      order=existing;
    }
  }
  let session;
  // Stripe requires at least 30 minutes for a newly created Session. Do not
  // change its original expiry/idempotency parameters or release uncertain stock.
  if(order.expires_at-now<1801000){
    if(!order.session_id)fail('This checkout needs reconciliation. Contact support before trying another payment.',503);
    session=await stripe.checkout.sessions.retrieve(order.session_id);
    if(session.status!=='open'||session.client_reference_id!==order.id||session.livemode!==(policy.mode==='live')||!session.url?.startsWith('https://checkout.stripe.com/'))fail('This checkout is no longer open. Contact support if you have already paid.',409);
    return json({url:session.url,orderId:id},201);
  }
  try{session=await stripe.checkout.sessions.create(checkoutParameters(order,policy,new URL(request.url).origin),{idempotencyKey:'pb-checkout-'+id});}
  catch(error){
    // A definite Stripe rejection can release stock. An ambiguous timeout must be reconciled, never blindly cancelled.
    if(['StripeInvalidRequestError','StripeAuthenticationError','StripePermissionError'].includes(error.type))await db.batch([
      db.prepare("UPDATE commerce_orders SET status='failed' WHERE id=? AND status='creating'").bind(id),
      db.prepare("DELETE FROM commerce_reservations WHERE order_id=? AND EXISTS (SELECT 1 FROM commerce_orders WHERE id=? AND status='failed')").bind(id,id)
    ]);
    throw error;
  }
  if(session.livemode!==(policy.mode==='live')||!session.url?.startsWith('https://checkout.stripe.com/'))fail('Checkout is temporarily unavailable.',503);
  await db.prepare("UPDATE commerce_orders SET session_id=?,status='pending' WHERE id=? AND status IN ('creating','pending')").bind(session.id,id).run();
  return json({url:session.url,orderId:id},201);
}

async function rawBody(request,limit=262144) {
  const reader=request.body?.getReader();if(!reader)fail('Empty webhook.');
  let length=0;const chunks=[];
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>limit){await reader.cancel();fail('Webhook too large.',413);}chunks.push(value);}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return new TextDecoder().decode(bytes);
}

export async function applyStripeEvent(event,db,policy,stripe) {
  if(event.livemode!==(policy.mode==='live')||(event.account&&event.account!==policy.stripeAccount))fail('Unexpected event environment.');
  if(await db.prepare('SELECT id FROM commerce_events WHERE id=?').bind(event.id).first())return;
  const statements=[];const object=event.data.object;
  if(['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','checkout.session.expired'].includes(event.type)){
    const id=object.metadata?.phonebridger_order;
    const order=id&&await db.prepare('SELECT * FROM commerce_orders WHERE id=?').bind(id).first();
    if(order){
      if((order.session_id&&order.session_id!==object.id)||object.client_reference_id!==order.id||object.metadata.policy_version!==order.policy_version||object.livemode!==(policy.mode==='live'))fail('Unexpected checkout session.');
      if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type) && object.payment_status==='paid'){
        // Re-read Stripe's canonical session, including line items. A return URL is never a payment signal.
        const session=await stripe.checkout.sessions.retrieve(object.id,{expand:['line_items','payment_intent.latest_charge']});
        const line=session.line_items?.data;
        if(session.payment_status!=='paid'||session.livemode!==(policy.mode==='live')||session.client_reference_id!==order.id||session.currency!==order.currency||session.amount_subtotal!==order.subtotal||session.total_details?.amount_shipping!==order.shipping||session.total_details?.amount_tax!==0||session.amount_total!==order.subtotal+order.shipping||line?.length!==1||line[0].quantity!==1||line[0].amount_subtotal!==order.subtotal)fail('Checkout amount or identity does not match the order.');
        const shipping=session.collected_information?.shipping_details||session.shipping_details||null;
        if(order.holders && !policy.shippingCountries.includes(shipping?.address?.country))fail('Shipping destination is not supported.');
        const intent=session.payment_intent,charge=intent?.latest_charge;
        if(!intent?.id||intent.status!=='succeeded'||!charge?.id)fail('Canonical payment details are unavailable.');
        const revoked=charge.refunded===true?'refunded':charge.disputed===true?'disputed':null;
        statements.push(db.prepare("UPDATE commerce_orders SET status=?,session_id=COALESCE(session_id,?),paid_at=COALESCE(paid_at,?),payment_intent=?,shipping_details=? WHERE id=? AND status IN ('creating','pending')").bind(revoked||'paid',session.id,Date.now(),intent.id,shipping?JSON.stringify(shipping):null,order.id));
        if(revoked){
          statements.push(db.prepare("UPDATE commerce_orders SET status=?,fulfilment='on_hold' WHERE id=? AND status IN ('paid','refunded','disputed')").bind(revoked,order.id));
          statements.push(db.prepare("UPDATE commerce_entitlements SET status='revoked' WHERE order_id=?").bind(order.id));
          statements.push(db.prepare("UPDATE commerce_reviews SET moderation='withdrawn' WHERE order_id=?").bind(order.id));
          statements.push(db.prepare('DELETE FROM commerce_reservations WHERE order_id=?').bind(order.id));
        }
        // Paid stock remains reserved until dispatch. Delayed payments hold their reservation too.
        statements.push(db.prepare("UPDATE commerce_reservations SET expires_at=NULL WHERE order_id=? AND EXISTS (SELECT 1 FROM commerce_orders WHERE id=? AND status='paid')").bind(order.id,order.id));
        statements.push(db.prepare("INSERT OR IGNORE INTO commerce_entitlements (order_id,user_id,status,licence_reference,created_at) SELECT id,user_id,'active',?,? FROM commerce_orders WHERE id=? AND status='paid'").bind((policy.mode==='test'?'TEST-':'PB-')+order.id.toUpperCase(),Date.now(),order.id));
        if(!order.holders)statements.push(db.prepare("UPDATE commerce_orders SET fulfilment='fulfilled' WHERE id=? AND status='paid' AND fulfilment='unfulfilled'").bind(order.id));
      }else if(event.type==='checkout.session.completed'){
        statements.push(db.prepare('UPDATE commerce_reservations SET expires_at=NULL WHERE order_id=?').bind(order.id));
      }else if(['checkout.session.expired','checkout.session.async_payment_failed'].includes(event.type)){
        statements.push(db.prepare("UPDATE commerce_orders SET status=? WHERE id=? AND status IN ('creating','pending')").bind(event.type.endsWith('expired')?'expired':'failed',order.id));
        statements.push(db.prepare("DELETE FROM commerce_reservations WHERE order_id=? AND EXISTS (SELECT 1 FROM commerce_orders WHERE id=? AND status IN ('expired','failed'))").bind(order.id,order.id));
      }
    }
  }else if(['charge.refunded','charge.dispute.created'].includes(event.type)){
    const intent=typeof object.payment_intent==='string'?object.payment_intent:object.payment_intent?.id;
    if(intent && (event.type==='charge.dispute.created'||object.refunded===true)){
      const status=event.type==='charge.dispute.created'?'disputed':'refunded';
      statements.push(db.prepare("UPDATE commerce_orders SET status=?,fulfilment='on_hold' WHERE payment_intent=?").bind(status,intent));
      statements.push(db.prepare("UPDATE commerce_reviews SET moderation='withdrawn' WHERE order_id IN (SELECT id FROM commerce_orders WHERE payment_intent=?)").bind(intent));
      statements.push(db.prepare("UPDATE commerce_entitlements SET status='revoked' WHERE order_id IN (SELECT id FROM commerce_orders WHERE payment_intent=?)").bind(intent));
      statements.push(db.prepare("DELETE FROM commerce_reservations WHERE order_id IN (SELECT id FROM commerce_orders WHERE payment_intent=?)").bind(intent));
    }
  }
  statements.push(db.prepare('INSERT OR IGNORE INTO commerce_events (id,type,created_at) VALUES (?,?,?)').bind(event.id,event.type,Date.now()));
  await db.batch(statements);
}

async function webhook(request,env,policy,client) {
  if(!['live','test'].includes(policy.mode)||!env.STRIPE_WEBHOOK_SECRET||!env.STRIPE_RESTRICTED_KEY)fail('Webhook is not configured.',503);
  const stripe=client||stripeOf(env);let event;
  const body=await rawBody(request);
  try{event=await stripe.webhooks.constructEventAsync(body,request.headers.get('stripe-signature'),env.STRIPE_WEBHOOK_SECRET,300,Stripe.createSubtleCryptoProvider());}catch{fail('Invalid webhook signature.');}
  await applyStripeEvent(event,dbOf(env),policy,stripe);return json({received:true});
}

async function reviews(request,env) {
  const db=dbOf(env);
  if(request.method==='GET'){
    const result=await db.prepare("SELECT r.display_name,r.rating,r.title,r.body,r.created_at,o.holders,o.finish FROM commerce_reviews r JOIN commerce_orders o ON o.id=r.order_id WHERE r.moderation='published' AND o.status='paid' AND o.fulfilment='fulfilled' ORDER BY r.created_at DESC LIMIT 24").all();
    const summary=await db.prepare("SELECT COUNT(*) AS count,AVG(r.rating) AS average FROM commerce_reviews r JOIN commerce_orders o ON o.id=r.order_id WHERE r.moderation='published' AND o.status='paid' AND o.fulfilment='fulfilled'").first();
    return json({reviews:result.results||[],count:summary?.count||0,average:summary?.count?summary.average:null});
  }
  if(request.headers.get('origin')!==new URL(request.url).origin)fail('Open the review form on this website.',403);
  const user=await userOf(request,db);if(!user)fail('Sign in to review your purchase.',401);
  if(!await requestRate(db,request,env.AUTH_RATE_SECRET,'review',5,3600,user.id))fail('Please wait before submitting another review.',429);
  const data=await boundedJson(request,4096);
  const order=await db.prepare("SELECT id FROM commerce_orders WHERE id=? AND user_id=? AND status='paid' AND fulfilment='fulfilled'").bind(String(data.orderId||''),user.id).first();
  if(!order)fail('Only a completed purchase from this account can be reviewed.',403);
  const displayName=String(data.displayName||'').trim(),title=String(data.title||'').trim(),body=String(data.body||'').trim();
  if(!Number.isInteger(data.rating)||data.rating<1||data.rating>5||displayName.length<2||displayName.length>40||title.length<3||title.length>100||body.length<20||body.length>1200||data.consent!==true)fail('Enter a rating, public name, title and review of 20–1,200 characters.');
  try{await db.prepare("INSERT INTO commerce_reviews (id,order_id,user_id,display_name,rating,title,body,created_at,moderation) VALUES (?,?,?,?,?,?,?,?,'pending')").bind(crypto.randomUUID(),order.id,user.id,displayName,data.rating,title,body,Date.now()).run();}catch{fail('This order already has a review.',409);}
  return json({message:'Thank you. Your review is saved for moderation.'},201);
}

export async function commerce(request,env,policy,action,client) {
  try{
    if(action==='catalog'&&request.method==='GET'){
      const offers=[];
      for(const [holders,amount]of policy.prices.entries()){
        let available=commerceReady(env,policy,holders),finishes={black:available,silver:available};
        if(available&&holders){
          const inventory=await dbOf(env).prepare("SELECT s.finish,s.quantity-COALESCE((SELECT SUM(r.quantity) FROM commerce_reservations r WHERE r.finish=s.finish),0) AS available FROM commerce_stock s").all();
          finishes=Object.fromEntries(['black','silver'].map(finish=>[finish,(inventory.results||[]).some(row=>row.finish===finish&&row.available>=holders)]));
          available=Object.values(finishes).some(Boolean);
        }
        offers.push({holders,name:nameOf(holders),amount,available,finishes});
      }
      return json({seller:policy.seller,currency:policy.currency,version:policy.version,mode:policy.mode,offers});
    }
    if(action==='reviews'&&['GET','POST'].includes(request.method))return await reviews(request,env);
    if(action==='checkout'&&request.method==='POST')return await createCheckout(request,env,policy,client);
    if(action==='webhook'&&request.method==='POST')return await webhook(request,env,policy,client);
    if(action==='operator'&&request.method==='POST'){
      const supplied=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';
      if(!env.COMMERCE_OPERATOR_SECRET||!supplied||!timingSafeEqual(Buffer.from(hash(supplied)),Buffer.from(hash(env.COMMERCE_OPERATOR_SECRET))))fail('Not authorized.',401);
      const db=dbOf(env);
      if(!await requestRate(db,request,env.AUTH_RATE_SECRET,'commerce-operator',60,600))fail('Please wait before another operation.',429);
      const data=await boundedJson(request,2048);
      if(data.action==='moderate')return json(await moderateReview(db,data.reviewId,data.decision,data.reason));
      if(data.action==='dispatch')return json(await dispatchOrder(db,data.orderId,data));
      if(data.action==='delivered'){
        const delivery=await db.prepare('SELECT order_id FROM commerce_deliveries WHERE order_id=?').bind(String(data.orderId||'')).first();
        if(!delivery)fail('Dispatch the order before confirming delivery.',409);
        const result=await fulfilOrder(db,data.orderId,'delivery:'+data.orderId);
        await db.prepare('UPDATE commerce_deliveries SET delivered_at=COALESCE(delivered_at,?) WHERE order_id=?').bind(Date.now(),data.orderId).run();
        return json(result);
      }
      if(data.action==='reconcile'){
        const order=await db.prepare('SELECT * FROM commerce_orders WHERE id=?').bind(String(data.orderId||'')).first();
        if(!order?.session_id)fail('No persisted Checkout session; inspect the provider before retrying.',409);
        const stripe=client||stripeOf(env),session=await stripe.checkout.sessions.retrieve(order.session_id);
        const type=session.payment_status==='paid'?'checkout.session.completed':session.status==='expired'?'checkout.session.expired':null;
        if(type)await applyStripeEvent({id:'reconcile_'+session.id+'_'+session.status+'_'+session.payment_status,type,livemode:session.livemode,data:{object:session}},db,policy,stripe);
        return json({reconciled:!!type,sessionStatus:session.status,paymentStatus:session.payment_status});
      }
      fail('Unsupported operator action.');
    }
    if(['order','orders','licence','receipt'].includes(action)&&request.method==='GET'){
      const db=dbOf(env),user=await userOf(request,db);if(!user)fail('Sign in to view your order.',401);
      if(action==='orders'){
        const records=await db.prepare('SELECT id,status,fulfilment,holders,finish,currency,subtotal,shipping,created_at,paid_at FROM commerce_orders WHERE user_id=? ORDER BY created_at DESC LIMIT 50').bind(user.id).all();
        return json({mode:policy.mode,orders:records.results||[]});
      }
      const id=new URL(request.url).searchParams.get('id');
      const order=await db.prepare('SELECT id,status,fulfilment,holders,finish,currency,subtotal,shipping,created_at,paid_at FROM commerce_orders WHERE id=? AND user_id=?').bind(id,user.id).first();
      if(!order)fail('Order not found.',404);
      const entitlement=await db.prepare('SELECT status,licence_reference FROM commerce_entitlements WHERE order_id=? AND user_id=?').bind(id,user.id).first();
      const delivery=await db.prepare('SELECT carrier,tracking_number,tracking_url,dispatched_at,delivered_at FROM commerce_deliveries WHERE order_id=?').bind(id).first();
      if(action==='order')return json({order,entitlement,delivery,mode:policy.mode});
      if(!order.paid_at)fail('Payment has not been confirmed.',409);
      if(action==='licence'&&(order.status!=='paid'||entitlement?.status!=='active'))fail('This licence is not active.',409);
      const money=amount=>`${(amount/100).toFixed(2)} ${order.currency.toUpperCase()}`;
      const lines=[policy.mode==='test'?'PHONEBRIDGER TEST RECORD — NOT A REAL PURCHASE':'PHONEBRIDGER PURCHASE RECORD',`Seller: ${policy.seller}`,`Order: ${order.id}`,`Customer: ${user.email}`,`Payment confirmed: ${new Date(order.paid_at).toISOString()}`,`Status: ${order.status}`,`Setup: ${nameOf(order.holders)}`,`Finish: ${order.holders?order.finish:'No hardware'}`,`Setup price: ${money(order.subtotal)}`,`Delivery: ${money(order.shipping)}`,`Total: ${money(order.subtotal+order.shipping)}`];
      if(action==='licence')lines.push(`Licence reference: ${entitlement.licence_reference}`,'Windows V1 purchase entitlement with the Android companion.','This record is not a native application activation key.');
      else lines.push('Payment summary only; this document is not a VAT invoice.');
      if(policy.mode==='test')lines.push('Sandbox simulation. No money was transferred and no product or licence is supplied.');
      return new Response(lines.join('\n')+'\n',{headers:{'Content-Type':'text/plain; charset=utf-8','Content-Disposition':`attachment; filename="phonebridger-${action}-${id}.txt"`,'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'}});
    }
    return json({error:'Method or route not available.'},405);
  }catch(error){return json({error:error.status?error.message:'Shop service is temporarily unavailable. Please try again or contact support.'},error.status||503);}
}

// Operator helpers require a separate server credential; customer sessions cannot call them.
export async function dispatchOrder(db,id,data){
  if(! /^[a-f0-9]{32}$/.test(id||''))fail('Supply an exact order.');
  const carrier=String(data.carrier||'').trim(),number=String(data.trackingNumber||'').trim();let url;
  try{url=new URL(data.trackingUrl);}catch{fail('Supply an HTTPS tracking URL.');}
  if(url.protocol!=='https:'||url.username||url.password||url.href.length>500||carrier.length<2||carrier.length>80||number.length<3||number.length>120)fail('Supply a carrier, tracking number and HTTPS tracking URL.');
  const order=await db.prepare('SELECT * FROM commerce_orders WHERE id=?').bind(id).first();
  if(!order||order.status!=='paid'||!order.holders)fail('Only paid physical orders can be dispatched.',409);
  if(['dispatched','fulfilled'].includes(order.fulfilment)){
    const saved=await db.prepare('SELECT carrier,tracking_number,tracking_url FROM commerce_deliveries WHERE order_id=?').bind(id).first();
    if(saved?.carrier!==carrier||saved?.tracking_number!==number||saved?.tracking_url!==url.href)fail('Dispatch already recorded with different details.',409);
    return {dispatched:true,alreadyDispatched:true};
  }
  if(order.fulfilment!=='unfulfilled')fail('Order needs manual review.',409);
  await db.batch([
    db.prepare("INSERT OR IGNORE INTO commerce_deliveries (order_id,carrier,tracking_number,tracking_url,dispatched_at) SELECT id,?,?,?,? FROM commerce_orders WHERE id=? AND status='paid' AND fulfilment='unfulfilled'").bind(carrier,number,url.href,Date.now(),id),
    db.prepare("UPDATE commerce_stock SET quantity=quantity-? WHERE finish=? AND EXISTS (SELECT 1 FROM commerce_orders WHERE id=? AND status='paid' AND fulfilment='unfulfilled')").bind(order.holders,order.finish,id),
    db.prepare("DELETE FROM commerce_reservations WHERE order_id=? AND EXISTS (SELECT 1 FROM commerce_orders WHERE id=? AND status='paid' AND fulfilment='unfulfilled')").bind(id,id),
    db.prepare("UPDATE commerce_orders SET fulfilment='dispatched' WHERE id=? AND status='paid' AND fulfilment='unfulfilled'").bind(id)
  ]);
  const confirmed=await db.prepare('SELECT status,fulfilment FROM commerce_orders WHERE id=?').bind(id).first();
  const saved=await db.prepare('SELECT carrier,tracking_number,tracking_url FROM commerce_deliveries WHERE order_id=?').bind(id).first();
  if(confirmed?.status!=='paid'||!['dispatched','fulfilled'].includes(confirmed?.fulfilment)||saved?.carrier!==carrier||saved?.tracking_number!==number||saved?.tracking_url!==url.href)fail('Dispatch changed concurrently. Inspect the saved order before retrying.',409);
  return {dispatched:true,alreadyDispatched:false};
}

export async function fulfilOrder(db,id,reference) {
  if(! /^[a-f0-9]{32}$/.test(id)||typeof reference!=='string'||reference.length<3||reference.length>160)fail('Supply an exact order and delivery/licence reference.');
  const order=await db.prepare('SELECT * FROM commerce_orders WHERE id=?').bind(id).first();
  if(!order||order.status!=='paid')fail('Only a paid order can be fulfilled.',409);
  if(order.fulfilment==='fulfilled')return {fulfilled:true,alreadyFulfilled:true};
  if(!['unfulfilled','dispatched'].includes(order.fulfilment))fail('This order needs manual review before fulfilment.',409);
  await db.batch([
    db.prepare("INSERT OR IGNORE INTO commerce_entitlements (order_id,user_id,status,licence_reference,created_at) SELECT id,user_id,'active',?,? FROM commerce_orders WHERE id=? AND status='paid' AND fulfilment='unfulfilled'").bind(reference,Date.now(),id),
    db.prepare("UPDATE commerce_stock SET quantity=quantity-? WHERE finish=? AND EXISTS (SELECT 1 FROM commerce_orders WHERE id=? AND status='paid' AND fulfilment='unfulfilled')").bind(order.holders,order.finish,id),
    db.prepare("DELETE FROM commerce_reservations WHERE order_id=? AND EXISTS (SELECT 1 FROM commerce_orders WHERE id=? AND status='paid' AND fulfilment='unfulfilled')").bind(id,id),
    db.prepare("UPDATE commerce_orders SET fulfilment='fulfilled' WHERE id=? AND status='paid' AND fulfilment IN ('unfulfilled','dispatched')").bind(id)
  ]);
  const confirmed=await db.prepare('SELECT status,fulfilment FROM commerce_orders WHERE id=?').bind(id).first();
  if(confirmed?.status!=='paid'||confirmed.fulfilment!=='fulfilled')fail('This order changed and needs manual review.',409);
  return {fulfilled:true,alreadyFulfilled:false};
}

export async function moderateReview(db,id,action,reason) {
  if(!['publish','reject'].includes(action)||!['publish','spam','privacy','irrelevant','abuse','duplicate'].includes(reason)||(action==='publish')!==(reason==='publish'))fail('Use a documented moderation action and reason.');
  const review=await db.prepare('SELECT * FROM commerce_reviews WHERE id=?').bind(id).first();
  if(!review||review.moderation!=='pending')fail('Only a pending real review can be moderated.',409);
  await db.batch([
    db.prepare("UPDATE commerce_reviews SET moderation=? WHERE id=? AND moderation='pending'").bind(action==='publish'?'published':'rejected',id),
    db.prepare('INSERT INTO commerce_moderation_audit (id,review_id,action,reason,created_at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),id,action,reason,Date.now())
  ]);
  return {moderated:true};
}
