import {randomBytes,createHash,scrypt} from 'node:crypto';
import {promisify} from 'node:util';
import {boundedJson,requestRate} from './customer-accounts.mjs';
import {accountDb,accountIdentity} from './phonebridger-affiliate.mjs';
import {queueAccountMail,deliverAccountMail,mailAvailable} from './phonebridger-notifications.mjs';
const derive=promisify(scrypt),hash=v=>createHash('sha256').update(v).digest('hex');
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow',...headers}});
const fail=(message,status=400)=>{throw Object.assign(Error(message),{status});};
export const securityActions=new Set(['request-reset','reset-password','request-verification','verify-email']);
export async function emailVerified(db,user){return !!await db.prepare('SELECT user_id FROM account_email_verifications WHERE user_id=? AND email=?').bind(user.id,user.email).first();}
export const securityDeletionStatements=(db,user)=>[
 db.prepare('DELETE FROM account_security_tokens WHERE user_id=?').bind(user.id),
 db.prepare('DELETE FROM account_email_verifications WHERE user_id=?').bind(user.id),
 db.prepare('DELETE FROM account_profiles WHERE user_id=?').bind(user.id),
 db.prepare("UPDATE account_mail_outbox SET payload=NULL,status='expired' WHERE user_id=? AND status='pending'").bind(user.id),
 db.prepare("UPDATE creator_partners SET status='suspended' WHERE user_id=?").bind(user.id)
];
async function issueMail(db,env,user,purpose,origin){
 const token=randomBytes(32).toString('hex'),now=Date.now(),expires=now+(purpose==='reset'?1800000:86400000),id=crypto.randomUUID();
 await db.prepare('INSERT INTO account_security_tokens VALUES (?,?,?,?,NULL,?)').bind(hash(token),user.id,purpose,expires,now).run();
 const url=origin+(purpose==='reset'?'/recover':'/verify')+'#token='+token;
 await queueAccountMail(db,env,{id,userId:user.id,kind:purpose,expiresAt:expires,message:{to:user.email,subject:purpose==='reset'?'Reset your PhoneBridger password':'Verify your PhoneBridger email',text:`${purpose==='reset'?'Reset your password':'Confirm your email address'} using this link:\n\n${url}\n\nThis link expires in ${purpose==='reset'?'30 minutes':'24 hours'} and can be used once. If you did not request it, ignore this email. Never share this link or your password.\n\nPhoneBridger · hello@phonebridger.com`}});return id;
}
export async function accountSecurity(request,env,action,ctx){
 try{
  if(request.method!=='POST')return json({error:'Use POST.'},405);
  const origin=new URL(request.url).origin;if(request.headers.get('origin')!==origin)fail('Open the form on this website.',403);
  const db=accountDb(env),now=Date.now();
  if(!await requestRate(db,request,env.AUTH_RATE_SECRET,'security:'+action,10,3600))fail('Please wait before another attempt.',429);
  const d=await boundedJson(request,2048);
  if(action==='request-reset'){
   const email=String(d.email||'').trim().toLowerCase();if(email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail('Enter a valid email address.');
   if(!mailAvailable(env))fail('Account email is temporarily unavailable. Contact hello@phonebridger.com.',503);
   const allowed=await requestRate(db,request,env.AUTH_RATE_SECRET,'security-email:reset',3,3600,email);
   const user=allowed&&await db.prepare('SELECT id,email FROM customer_users WHERE email=?').bind(email).first();
   if(user){const id=await issueMail(db,env,user,'reset',origin);ctx?.waitUntil(deliverAccountMail(db,env,id));}
   return json({ok:true,message:'If an account uses this email, a reset link will be sent. Check your inbox and spam folder.'});
  }
  if(action==='request-verification'){
   const user=await accountIdentity(request,db);if(!user)fail('Sign in to verify your email.',401);
   if(await emailVerified(db,user))return json({ok:true,message:'Your email is already verified.'});
   if(!mailAvailable(env))fail('Account email is temporarily unavailable.',503);
   if(!await requestRate(db,request,env.AUTH_RATE_SECRET,'security-email:verify',3,3600,user.id))fail('Please wait before requesting another email.',429);
   const id=await issueMail(db,env,user,'verify',origin);ctx?.waitUntil(deliverAccountMail(db,env,id));return json({ok:true,message:'A verification link will be sent. Check your inbox and spam folder.'});
  }
  if(!['verify-email','reset-password'].includes(action)||! /^[a-f0-9]{64}$/.test(d.token||''))fail('This link is invalid or expired. Request a new email.');
  const purpose=action==='verify-email'?'verify':'reset',digest=hash(d.token),record=await db.prepare('SELECT t.user_id,u.email FROM account_security_tokens t JOIN customer_users u ON u.id=t.user_id WHERE t.digest=? AND t.purpose=? AND t.consumed_at IS NULL AND t.expires_at>?').bind(digest,purpose,now).first();
  if(!record)fail('This link is invalid or expired. Request a new email.');
  let result;
  if(purpose==='verify'){
   // Batch conditions recheck the claim inside the transaction, including concurrent requests.
   result=await db.batch([
    db.prepare('INSERT INTO account_email_verifications SELECT ?,?,? WHERE EXISTS (SELECT 1 FROM account_security_tokens WHERE digest=? AND consumed_at IS NULL AND expires_at>?) ON CONFLICT(user_id) DO UPDATE SET email=excluded.email,verified_at=excluded.verified_at').bind(record.user_id,record.email,now,digest,now),
    db.prepare('DELETE FROM account_security_tokens WHERE user_id=? AND purpose=\'verify\' AND digest<>? AND EXISTS (SELECT 1 FROM account_security_tokens WHERE digest=? AND consumed_at IS NULL AND expires_at>?)').bind(record.user_id,digest,digest,now),
    db.prepare('UPDATE account_security_tokens SET consumed_at=? WHERE digest=? AND consumed_at IS NULL AND expires_at>?').bind(now,digest,now)
   ]);
  }else{
   if(typeof d.password!=='string'||d.password.length<6||d.password.length>128)fail('Use a password of 6–128 characters.');
   const salt=randomBytes(16).toString('hex'),derived=await derive(d.password,salt,64,{N:32768,r:8,p:3,maxmem:67108864});
   result=await db.batch([
    db.prepare('UPDATE customer_users SET salt=?,password_hash=? WHERE id=? AND EXISTS (SELECT 1 FROM account_security_tokens WHERE digest=? AND consumed_at IS NULL AND expires_at>?)').bind(salt,derived.toString('hex'),record.user_id,digest,now),
    db.prepare('DELETE FROM customer_sessions WHERE user_id=? AND EXISTS (SELECT 1 FROM account_security_tokens WHERE digest=? AND consumed_at IS NULL AND expires_at>?)').bind(record.user_id,digest,now),
    db.prepare('DELETE FROM account_security_tokens WHERE user_id=? AND purpose=\'reset\' AND digest<>? AND EXISTS (SELECT 1 FROM account_security_tokens WHERE digest=? AND consumed_at IS NULL AND expires_at>?)').bind(record.user_id,digest,digest,now),
    db.prepare('UPDATE account_security_tokens SET consumed_at=? WHERE digest=? AND consumed_at IS NULL AND expires_at>?').bind(now,digest,now)
   ]);
  }
  if(!(result[0].meta?.changes??result[0].changes))fail('This link is invalid or expired. Request a new email.');
  return json({ok:true,message:purpose==='verify'?'Your email is verified.':'Your password was reset. Sign in with your new password.'},200,purpose==='reset'?{'Set-Cookie':'__Host-pb_session=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0'}:{});
 }catch(e){return json({error:e.status?e.message:'Account security is temporarily unavailable.'},e.status||503);}
}
