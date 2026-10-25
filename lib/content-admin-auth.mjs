import { randomBytes, scrypt as nodeScrypt, timingSafeEqual, createHash } from 'node:crypto';
const derive=(password,salt)=>new Promise((resolve,reject)=>nodeScrypt(password,salt,64,{N:16384,r:8,p:5,maxmem:32*1024*1024},(e,key)=>e?reject(e):resolve(key)));
export const token=()=>randomBytes(32).toString('base64url');
export const digest=value=>createHash('sha256').update(value).digest('hex');
export function authError(status,message){return Object.assign(new Error(message),{status});}
export function emailAddress(value){if(typeof value!=='string'||value.length>254)return '';const email=value.trim().toLowerCase();return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?email:'';}
export async function passwordHash(password){
 if(typeof password!=='string'||[...password].length<15||[...password].length>128||Buffer.byteLength(password,'utf8')>512)throw authError(400,'Slaptažodis turi būti 15–128 simbolių.');
 const salt=randomBytes(16),key=await derive(password,salt);
 return `scrypt$16384$8$5$${salt.toString('base64url')}$${key.toString('base64url')}`;
}
export async function verifyPassword(password,encoded){
 if(typeof password!=='string'||password.length>512)return false;
 const parts=typeof encoded==='string'?encoded.split('$'):[];
 if(parts.length!==6||parts.slice(0,4).join('$')!=='scrypt$16384$8$5')return false;
 const salt=Buffer.from(parts[4],'base64url'),wanted=Buffer.from(parts[5],'base64url');if(salt.length!==16||wanted.length!==64)return false;
 return timingSafeEqual(await derive(password,salt),wanted);
}
export function authTransport(request,bindings,host){
 const local=bindings.CONTENT_ADMIN_DEV_ORIGIN;
 if(local&&/^http:\/\/127\.0\.0\.1:\d+$/.test(local)&&new URL(request.url).hostname==='127.0.0.1')return {origin:local,cookie:'promedical_admin_dev',secure:false};
 return {origin:`https://${host}`,cookie:'__Host-promedical_admin',secure:true};
}
export function cookieValue(request,name){const raw=request.headers.get('cookie')||'';const part=raw.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='));return part?.slice(name.length+1)||'';}
export function sessionCookie(transport,value,clear=false){return `${transport.cookie}=${value}; Path=/; HttpOnly; SameSite=Strict; ${transport.secure?'Secure; ':''}Max-Age=${clear?0:28800}`;}
async function rate(db,key,now,max){
 const row=await db.prepare(`INSERT INTO content_admin_limits(limit_key,window_start,attempts) VALUES(?,?,1)
 ON CONFLICT(limit_key) DO UPDATE SET attempts=CASE WHEN window_start<? THEN 1 ELSE attempts+1 END,
 window_start=CASE WHEN window_start<? THEN excluded.window_start ELSE window_start END RETURNING attempts`).bind(key,now,now-900000,now-900000).first();
 if(row.attempts>max)throw authError(429,'Per daug prisijungimo bandymų. Bandykite po 15 minučių.');
}
export async function signIn(db,siteId,input,ip,now=Date.now()){
 const email=emailAddress(input.email),password=input.password;
 if(typeof password!=='string'||password.length>512)throw authError(401,'Neteisingas el. paštas arba slaptažodis.');
 await rate(db,digest(`${siteId}|ip|${ip}`),now,25);await rate(db,digest(`${siteId}|email|${email}`),now,12);
 const account=await db.prepare('SELECT * FROM content_admin_accounts WHERE site_id=? AND email=? AND enabled=1').bind(siteId,email).first();
 // Unknown/pending accounts pay the same KDF cost; no account enumeration.
 let valid=false;
 if(account?.password_hash)valid=await verifyPassword(password,account.password_hash);
 else await derive(password,Buffer.alloc(16));
 if(!valid)throw authError(401,'Neteisingas el. paštas arba slaptažodis.');
 const value=token(),csrf=token();await db.prepare('INSERT INTO content_admin_sessions(token_hash,site_id,email,csrf_token,account_version,created_at,seen_at,expires_at) VALUES(?,?,?,?,?,?,?,?)').bind(digest(value),siteId,email,csrf,account.password_version,now,now,now+28800000).run();
 return {value,email,csrf};
}
export async function authenticate(db,siteId,value,now=Date.now()){
 if(!/^[A-Za-z0-9_-]{43}$/.test(value))throw authError(401,'Prisijunkite prie administravimo.');
 const row=await db.prepare(`SELECT s.* FROM content_admin_sessions s JOIN content_admin_accounts a ON a.site_id=s.site_id AND a.email=s.email
 WHERE s.token_hash=? AND s.site_id=? AND s.expires_at>? AND s.seen_at>? AND a.enabled=1 AND a.password_version=s.account_version`).bind(digest(value),siteId,now,now-1800000).first();
 if(!row)throw authError(401,'Sesija baigėsi. Prisijunkite iš naujo.');
 if(row.seen_at<now-300000)await db.prepare('UPDATE content_admin_sessions SET seen_at=? WHERE token_hash=?').bind(now,row.token_hash).run();
 return row;
}
export function requireOrigin(request,transport){
 if(request.headers.get('origin')!==transport.origin||request.headers.get('sec-fetch-site')==='cross-site')throw authError(403,'Netinkama užklausos kilmė.');
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))throw authError(415,'Reikia JSON užklausos.');
}
export function requireCsrf(request,session){const value=request.headers.get('x-admin-csrf')||'',expected=session.csrf_token;const a=Buffer.from(value),b=Buffer.from(expected);if(a.length!==b.length||!timingSafeEqual(a,b))throw authError(403,'Atnaujinkite administravimo langą ir bandykite dar kartą.');}
export async function enroll(db,siteId,input,ip,now=Date.now()){
 await rate(db,digest(`${siteId}|setup|${ip}`),now,10);
 if(typeof input.token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(input.token))throw authError(400,'Nustatymo nuoroda negalioja.');
 const hash=digest(input.token),row=await db.prepare('SELECT * FROM content_admin_enrollments WHERE token_hash=? AND site_id=? AND expires_at>? AND consumed_at IS NULL').bind(hash,siteId,now).first();
 if(!row)throw authError(400,'Nustatymo nuoroda negalioja arba jau panaudota.');
 const password=await passwordHash(input.password),op=token();
 const results=await db.batch([
 db.prepare('UPDATE content_admin_enrollments SET consumed_at=?,operation_id=? WHERE token_hash=? AND site_id=? AND expires_at>? AND consumed_at IS NULL').bind(now,op,hash,siteId,now),
 db.prepare('UPDATE content_admin_accounts SET password_hash=?,password_version=password_version+1 WHERE site_id=? AND email=? AND EXISTS(SELECT 1 FROM content_admin_enrollments WHERE token_hash=? AND operation_id=?)').bind(password,siteId,row.email,hash,op),
 db.prepare('DELETE FROM content_admin_sessions WHERE site_id=? AND email=? AND EXISTS(SELECT 1 FROM content_admin_enrollments WHERE token_hash=? AND operation_id=?)').bind(siteId,row.email,hash,op)
 ]);
 if(results[0].meta.changes!==1||results[1].meta.changes!==1)throw authError(409,'Nustatymo nuoroda jau panaudota.');
 return {email:row.email};
}
