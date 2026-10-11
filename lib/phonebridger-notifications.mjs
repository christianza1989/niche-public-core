import {createHash,randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';
import {sendHostingerMail} from './hostinger-mail-api.mjs';
const key=env=>createHash('sha256').update('phonebridger-service-mail-v1:'+env.AUTH_RATE_SECRET).digest();
function encrypt(env,id,message){
 if(!env.AUTH_RATE_SECRET)throw Error('Mail encryption unavailable');
 const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(env),iv);cipher.setAAD(Buffer.from(id));
 const bytes=Buffer.concat([cipher.update(JSON.stringify(message),'utf8'),cipher.final()]);
 return [iv,cipher.getAuthTag(),bytes].map(v=>v.toString('base64')).join('.');
}
function decrypt(env,id,payload){
 const [iv,tag,bytes]=payload.split('.').map(v=>Buffer.from(v,'base64')),cipher=createDecipheriv('aes-256-gcm',key(env),iv);cipher.setAAD(Buffer.from(id));cipher.setAuthTag(tag);
 return JSON.parse(Buffer.concat([cipher.update(bytes),cipher.final()]).toString('utf8'));
}
export const mailAvailable=env=>!!(env.HOSTINGER_MAIL_API_KEY&&env.HOSTINGER_MAILBOX_ID);
export async function queueAccountMail(db,env,{id=crypto.randomUUID(),userId=null,kind,message,expiresAt=Date.now()+86400000}){
 await db.prepare("INSERT OR IGNORE INTO account_mail_outbox (id,user_id,kind,payload,status,created_at,expires_at) VALUES (?,?,?,?,'pending',?,?)").bind(id,userId,kind,encrypt(env,id,{...message,displayName:'PhoneBridger'}),Date.now(),expiresAt).run();return id;
}
export async function deliverAccountMail(db,env,id,sender=sendHostingerMail){
 if(!mailAvailable(env))return false;
 // Claim before sending. An interrupted or ambiguous send is never replayed automatically.
 const item=await db.prepare("UPDATE account_mail_outbox SET status='sending',attempted_at=? WHERE id=? AND status='pending' AND expires_at>? RETURNING id,payload").bind(Date.now(),id,Date.now()).first();
 if(!item)return false;
 try{
  const accepted=await sender(env,decrypt(env,item.id,item.payload));
  await db.prepare("UPDATE account_mail_outbox SET status=?,sent_at=?,payload=NULL WHERE id=? AND status='sending'").bind(accepted?'sent':'unknown',accepted?Date.now():null,id).run();return accepted;
 }catch{
  await db.prepare("UPDATE account_mail_outbox SET status='unknown',payload=NULL WHERE id=? AND status='sending'").bind(id).run();return false;
 }
}
export async function serviceMailMaintenance(env){
 const db=env.DB.withSession?env.DB.withSession('first-primary'):env.DB,now=Date.now();
 await db.batch([
  db.prepare("UPDATE account_mail_outbox SET status='unknown',payload=NULL WHERE status='sending' AND attempted_at<?").bind(now-300000),
  db.prepare("UPDATE account_mail_outbox SET status='expired',payload=NULL WHERE status='pending' AND expires_at<=?").bind(now),
  db.prepare('DELETE FROM account_security_tokens WHERE expires_at<?').bind(now-86400000),
  db.prepare('DELETE FROM account_mail_outbox WHERE created_at<?').bind(now-30*86400000),
  db.prepare('DELETE FROM affiliate_clicks WHERE created_at<?').bind(now-90*86400000)
 ]);
 const items=(await db.prepare("SELECT id FROM account_mail_outbox WHERE status='pending' AND expires_at>? ORDER BY created_at LIMIT 10").bind(now).all()).results||[];
 for(const item of items)await deliverAccountMail(db,env,item.id);
}
