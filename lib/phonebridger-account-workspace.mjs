import {randomBytes,scrypt,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {boundedJson,requestRate} from './customer-accounts.mjs';
import {accountDb,accountIdentity,approvedPartner,requireOperator} from './phonebridger-affiliate.mjs';
const derive=promisify(scrypt);
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'}});
const fail=(message,status=400)=>{throw Object.assign(Error(message),{status});};
const rows=async s=>(await s.all()).results||[];
export function sanitizeDiagnostics(value){
 return String(value||'').replace(/(?:Bearer\s+|(?:token|password|secret|api[_ -]?key|authorization|cookie|email|serial|address)\s*[:=]\s*)([^\r\n,}]+)/gi,'[REDACTED]').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[EMAIL REDACTED]').replace(/\b(?:sk|rk|whsec|ghp|github_pat)[_-][A-Za-z0-9_-]+/g,'[KEY REDACTED]').replace(/(?:[A-Za-z]:\\Users\\|\/Users\/|\/home\/)[^\s\\/]+/g,'[USER PATH]').slice(0,8000);
}
export async function accountWorkspace(request,env,action,downloads={}){
 try{
  const db=accountDb(env);
  if(action==='operator'){
   requireOperator(request,env);if(request.method!=='POST')return json({error:'Use POST.'},405);
   if(!await requestRate(db,request,env.AUTH_RATE_SECRET,'support-operator',60))fail('Please wait.',429);
   const d=await boundedJson(request,5000);
   if(d.action==='tickets')return json({tickets:await rows(db.prepare('SELECT id,user_id,order_id,subject,message,diagnostics,status,created_at FROM support_tickets ORDER BY created_at DESC LIMIT 100'))});
   if(d.action==='reply'){
    const message=String(d.message||'').trim();if(message.length<2||message.length>3000||!['open','in_progress','resolved'].includes(d.status))fail('Add a response and a ticket status.');
    if(!await db.prepare('SELECT id FROM support_tickets WHERE id=?').bind(String(d.ticketId||'')).first())fail('Ticket not found.',404);
    const id=crypto.randomUUID();await db.batch([db.prepare('INSERT INTO support_replies VALUES (?,?,\'support\',?,?)').bind(id,d.ticketId,message,Date.now()),db.prepare('UPDATE support_tickets SET status=? WHERE id=?').bind(d.status,d.ticketId)]);return json({ok:true,id},201);
   }
   fail('Support action not found.',404);
  }
  const user=await accountIdentity(request,db);if(!user)fail('Sign in to view your workspace.',401);
  if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed.'},405);
  if(request.method==='POST'){
   if(request.headers.get('origin')!==new URL(request.url).origin)fail('Open the form on this website.',403);
   if(!await requestRate(db,request,env.AUTH_RATE_SECRET,'workspace-write',20,600,user.id))fail('Please wait before another change.',429);
  }
  if(action==='summary'&&request.method==='GET'){
   const profile=await db.prepare('SELECT display_name,notifications,setup FROM account_profiles WHERE user_id=?').bind(user.id).first();
   const partner=await approvedPartner(db,user.id),app=await db.prepare('SELECT status FROM creator_applications WHERE user_id=?').bind(user.id).first();
   const orders=await rows(db.prepare('SELECT id,status,fulfilment,holders,finish,currency,subtotal,shipping,created_at,paid_at FROM commerce_orders WHERE user_id=? ORDER BY created_at DESC LIMIT 50').bind(user.id));
   const licences=await rows(db.prepare('SELECT e.order_id,e.status,e.licence_reference,e.created_at,o.holders,o.status AS payment_status FROM commerce_entitlements e JOIN commerce_orders o ON o.id=e.order_id WHERE e.user_id=? AND o.user_id=? ORDER BY e.created_at DESC LIMIT 100').bind(user.id,user.id));
   const sessions=await rows(db.prepare('SELECT expires_at,digest FROM customer_sessions WHERE user_id=? AND expires_at>? ORDER BY expires_at DESC').bind(user.id,Date.now()));
   return json({user:{email:user.email,createdAt:user.created_at,emailVerified:false},profile:profile?{name:profile.display_name,notifications:!!profile.notifications,setup:JSON.parse(profile.setup)}:{name:'',notifications:false,setup:[]},creator:partner?{approved:true,applicationStatus:app?.status||'approved'}:{approved:false,applicationStatus:app?.status||null},orders,licences,downloads:Object.fromEntries(Object.entries(downloads).map(([platform,d])=>[platform,{filename:d.filename,version:d.version||null,bytes:d.bytes,sha256:d.sha256,url:'/downloads/'+platform}])),sessions:sessions.map(s=>({current:s.digest===user.digest,expiresAt:s.expires_at})),capabilities:{emailChange:false,recovery:false,appActivation:false,phoneStatus:false,emailNotifications:false}});
  }
  if(action==='profile'&&request.method==='POST'){
   const d=await boundedJson(request),name=String(d.name||'').trim(),setup=d.setup||[];
   if(name.length>80||!Array.isArray(setup)||setup.some(s=>!['windows','android','permissions','pairing'].includes(s))||setup.length>4)fail('Use a name of up to 80 characters and a valid checklist.');
   if(d.notifications===true)fail('Email notifications are not enabled yet.',409);
   await db.prepare('INSERT INTO account_profiles VALUES (?,?,0,?) ON CONFLICT(user_id) DO UPDATE SET display_name=excluded.display_name,setup=excluded.setup').bind(user.id,name,JSON.stringify([...new Set(setup)])).run();return json({ok:true});
  }
  if(action==='revoke-sessions'&&request.method==='POST'){
   await boundedJson(request);await db.prepare('DELETE FROM customer_sessions WHERE user_id=? AND digest<>?').bind(user.id,user.digest).run();return json({ok:true});
  }
  if(action==='password'&&request.method==='POST'){
   const d=await boundedJson(request);if(typeof d.currentPassword!=='string'||typeof d.newPassword!=='string'||d.currentPassword.length>128||d.newPassword.length<6||d.newPassword.length>128)fail('Use your current password and a new password of 6–128 characters.');
   if(!await requestRate(db,request,env.AUTH_RATE_SECRET,'password-change',5,600,user.id))fail('Please wait ten minutes.',429);
   const stored=await db.prepare('SELECT salt,password_hash FROM customer_users WHERE id=?').bind(user.id).first();
   const old=await derive(d.currentPassword,stored.salt,64,{N:32768,r:8,p:3,maxmem:67108864});if(!timingSafeEqual(old,Buffer.from(stored.password_hash,'hex')))fail('Your current password does not match.',401);
   const salt=randomBytes(16).toString('hex'),next=await derive(d.newPassword,salt,64,{N:32768,r:8,p:3,maxmem:67108864});
   // Match the authenticated hash to prevent two concurrent changes silently overwriting one another.
   const result=await db.batch([db.prepare('UPDATE customer_users SET salt=?,password_hash=? WHERE id=? AND password_hash=?').bind(salt,next.toString('hex'),user.id,stored.password_hash),db.prepare('DELETE FROM customer_sessions WHERE user_id=? AND digest<>?').bind(user.id,user.digest)]);
   if(!(result[0].meta?.changes??result[0].changes))fail('Your password changed in another session. Sign in again.',409);return json({ok:true});
  }
  if(action==='support'){
   if(request.method==='GET')return json({tickets:await rows(db.prepare('SELECT id,order_id,subject,message,status,created_at FROM support_tickets WHERE user_id=? ORDER BY created_at DESC LIMIT 100').bind(user.id)),replies:await rows(db.prepare('SELECT r.ticket_id,r.sender,r.message,r.created_at FROM support_replies r JOIN support_tickets t ON t.id=r.ticket_id WHERE t.user_id=? ORDER BY r.created_at LIMIT 500').bind(user.id))});
   const d=await boundedJson(request,16000),subject=String(d.subject||'').trim(),message=String(d.message||'').trim(),orderId=d.orderId||null;
   if(subject.length<3||subject.length>120||message.length<10||message.length>3000)fail('Add a subject and 10–3000 characters explaining the problem.');
   if(orderId&&!await db.prepare('SELECT id FROM commerce_orders WHERE id=? AND user_id=?').bind(orderId,user.id).first())fail('Order not found.',404);
   if(d.diagnostics&&d.diagnosticsConsent!==true)fail('Choose whether to attach diagnostics.');
   if(d.diagnostics!==undefined&&(typeof d.diagnostics!=='string'||new TextEncoder().encode(d.diagnostics).length>8000))fail('Choose diagnostics no larger than 8 KB.');
   if(d.requestId!==undefined&&! /^[a-f0-9-]{36}$/.test(d.requestId))fail('Use a valid request identifier.');
   const id=d.requestId?createHash('sha256').update(user.id+':support:'+d.requestId).digest('hex').slice(0,32):crypto.randomUUID(),now=Date.now(),diagnostics=d.diagnosticsConsent===true?sanitizeDiagnostics(d.diagnostics):null;
   await db.prepare("INSERT OR IGNORE INTO support_tickets VALUES (?,?,?,?,?,?,'open',?)").bind(id,user.id,orderId,subject,message,diagnostics,now).run();
   const saved=await db.prepare('SELECT * FROM support_tickets WHERE id=? AND user_id=?').bind(id,user.id).first();
   if(!saved||saved.subject!==subject||saved.message!==message||saved.order_id!==orderId||saved.diagnostics!==diagnostics)fail('This request identifier belongs to another message.',409);
   return json({id,createdAt:now,message:'Your support request was saved. Email notification is not enabled; keep this reference for follow-up.'},201);
  }
  fail('Workspace action not found.',404);
 }catch(e){return json({error:e.status?e.message:'Account workspace is temporarily unavailable.'},e.status||503);}
}
