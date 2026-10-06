import { randomBytes, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(scrypt);
const digest = value => createHash('sha256').update(value).digest('hex');
const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', ...extra } });
const cookie = (token, age = 28800) => `__Host-pb_session=${token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${age}`;
const tokenOf = request => /(?:^|;\s*)__Host-pb_session=([a-f0-9]{64})(?:;|$)/.exec(request.headers.get('cookie') || '')?.[1];
export async function boundedJson(request, maximum = 4096) {
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') || '')) throw Object.assign(Error('Use a JSON request.'), {status:415});
  const reader = request.body?.getReader(); if (!reader) throw Object.assign(Error('Request is empty.'), {status:400});
  let length=0, text=''; const decoder=new TextDecoder();
  while (true) { const {done,value}=await reader.read(); if(done)break; length+=value.length; if(length>maximum){await reader.cancel();throw Object.assign(Error('Request is too large.'),{status:413});} text+=decoder.decode(value,{stream:true}); }
  let payload;
  try{payload=JSON.parse(text+decoder.decode());}catch{throw Object.assign(Error('Use valid JSON.'),{status:400});}
  if(!payload||typeof payload!=='object'||Array.isArray(payload))throw Object.assign(Error('Use a JSON object.'),{status:400});
  return payload;
}
export async function requestRate(db, request, secret, namespace, limit, seconds=600, identity='') {
  if(!secret)throw Error('Rate secret missing');
  const now=Date.now(),bucket=Math.floor(now/(seconds*1000));
  const key=digest(`${secret}:${namespace}:${bucket}:${identity || request.headers.get('cf-connecting-ip') || 'local'}`);
  const result=await db.prepare('INSERT INTO request_rates (key, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,now+seconds*2000).first();
  return result.count<=limit;
}
export async function customerAccount(request, env, action) {
  const db=env.DB.withSession ? env.DB.withSession('first-primary') : env.DB;
  try {
    const token=tokenOf(request),now=Date.now();
    if(action==='session'&&request.method==='GET'){
      const user=token&&await db.prepare('SELECT u.email,u.created_at FROM customer_sessions s JOIN customer_users u ON u.id=s.user_id WHERE s.digest=? AND s.expires_at>?').bind(digest(token),now).first();
      return json({user:user?{email:user.email,createdAt:user.created_at}:null});
    }
    if(request.method!=='POST')return json({error:'Method not allowed.'},405,{Allow:'POST'});
    if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Open the form on this website.'},403);
    if(action==='logout'){
      if(token)await db.prepare('DELETE FROM customer_sessions WHERE digest=?').bind(digest(token)).run();
      return json({ok:true},200,{'Set-Cookie':cookie('',0)});
    }
    if(!['register','login','delete'].includes(action))return json({error:'Action not found.'},404);
    if(!await requestRate(db,request,env.AUTH_RATE_SECRET,'account:'+action,action==='register'?5:30))return json({error:'Too many attempts. Try again in ten minutes.'},429,{'Retry-After':'600'});
    const payload=await boundedJson(request);
    const email=typeof payload?.email==='string'?payload.email.trim().toLowerCase():'';
    const password=payload?.password;
    if(typeof password!=='string'||password.length>128||password.length<1||email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json({error:'Enter a valid email and password.'},400);
    if(!await requestRate(db,request,env.AUTH_RATE_SECRET,'account-email:'+action,15,600,email))return json({error:'Too many attempts. Try again in ten minutes.'},429);
    if(action==='register'&&password.length<12)return json({error:'Use at least 12 characters for your password.'},400);
    const user=await db.prepare('SELECT * FROM customer_users WHERE email=?').bind(email).first();
    const salt=action==='register'?randomBytes(16).toString('hex'):user?.salt||'0'.repeat(32);
    const derived=await derive(password,salt,64,{N:32768,r:8,p:3,maxmem:67108864});
    if(action==='register'){
      if(user)return json({error:'Unable to create this account. Sign in or contact support.'},409);
      const created={id:crypto.randomUUID(),email,salt,password_hash:derived.toString('hex'),created_at:new Date().toISOString()};
      try{await db.prepare('INSERT INTO customer_users (id,email,salt,password_hash,created_at) VALUES (?,?,?,?,?)').bind(created.id,email,salt,created.password_hash,created.created_at).run();}catch{return json({error:'Unable to create this account. Sign in or contact support.'},409);}
      return await issue(db,created,201);
    }
    if(!user||!timingSafeEqual(derived,Buffer.from(user.password_hash,'hex')))return json({error:'The email or password does not match.'},401);
    if(action==='delete'){
      const session=token&&await db.prepare('SELECT user_id FROM customer_sessions WHERE digest=? AND expires_at>?').bind(digest(token),now).first();
      if(!session||session.user_id!==user.id)return json({error:'Sign in before deleting your account.'},401);
      await db.batch([db.prepare('DELETE FROM customer_sessions WHERE user_id=?').bind(user.id),db.prepare('DELETE FROM customer_users WHERE id=?').bind(user.id)]);
      return json({ok:true},200,{'Set-Cookie':cookie('',0)});
    }
    return await issue(db,user);
  } catch(error){return json({error:error.status?error.message:'Account service is temporarily unavailable.'},error.status||503);}
}
async function issue(db,user,status=200){
  const token=randomBytes(32).toString('hex');
  await db.prepare('INSERT INTO customer_sessions (digest,user_id,expires_at) VALUES (?,?,?)').bind(digest(token),user.id,Date.now()+28800000).run();
  return json({user:{email:user.email,createdAt:user.created_at,emailVerified:false}},status,{'Set-Cookie':cookie(token)});
}
