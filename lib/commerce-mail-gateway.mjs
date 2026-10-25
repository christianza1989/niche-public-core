// Private service-binding endpoint. Reuses the established SMTP wire format.
import {smtpMessage} from './smtp-protocol.mjs';
const identifier=/^[a-zA-Z0-9_-]{1,100}$/;
const answer=(value,status=200)=>Response.json(value,{status,headers:{'cache-control':'no-store','x-robots-tag':'noindex, nofollow'}});
const fail=(error,status)=>answer({error},status);
async function boundedJson(request){
 const reader=request.body?.getReader();if(!reader)throw Error('invalid_body');
 const pieces=[];let size=0;
 try{for(;;){const value=await reader.read();if(value.done)break;size+=value.value.byteLength;if(size>65536){await reader.cancel();throw Error('body_too_large');}pieces.push(value.value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const piece of pieces){bytes.set(piece,offset);offset+=piece.byteLength;}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
const fingerprint=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))).map(v=>v.toString(16).padStart(2,'0')).join('');
const result=row=>({id:row.id,environment:row.environment,storeId:row.store_id,from:row.sender,to:row.recipient,status:row.status,reference:row.reference||null});
export class D1CommerceMailLedger{
 constructor(db){this.db=db;}
 async get(environment,storeId,id){return this.db.prepare('SELECT * FROM commerce_mail_messages WHERE environment=? AND store_id=? AND id=?').bind(environment,storeId,id).first();}
 async claim(message,hash){
  const inserted=await this.db.prepare("INSERT INTO commerce_mail_messages(environment,store_id,id,fingerprint,sender,recipient,status,reference,created_at) VALUES(?,?,?,?,?,?,'unknown',NULL,?) ON CONFLICT(environment,store_id,id) DO NOTHING")
   .bind(message.environment,message.storeId,message.id,hash,message.from,message.to,Date.now()).run();
  return {claimed:inserted.meta.changes===1,row:await this.get(message.environment,message.storeId,message.id)};
 }
 async accept(message,hash,reference){
  await this.db.prepare("UPDATE commerce_mail_messages SET status='accepted',reference=? WHERE environment=? AND store_id=? AND id=? AND fingerprint=? AND status='unknown'")
   .bind(reference,message.environment,message.storeId,message.id,hash).run();
  return this.get(message.environment,message.storeId,message.id);
 }
}
export function createCommerceMailGateway({config,ledger,send,checkTransport}){
 // No public route, new provider, credentials or live-send activation is created here.
 return async function gateway(request){
  const url=new URL(request.url);
  if(url.origin==='https://core-mail.internal'&&url.pathname==='/commerce/transport-check'&&!url.search){
   if(request.method!=='GET')return fail('method_not_allowed',405);
   if(!config?.enabled||!config.from||typeof checkTransport!=='function')return fail('mail_transport_disabled',503);
   const result=await checkTransport();return answer({ready:result.ready===true,stage:result.stage,reason:result.reason||null});
  }
  const match=url.pathname.match(/^\/commerce\/messages\/([a-zA-Z0-9-]{1,220})$/);
  if(url.origin!=='https://core-mail.internal'||!match||url.search)return fail('not_found',404);
  if(!['GET','POST'].includes(request.method))return fail('method_not_allowed',405);
  if(!config||!identifier.test(config.storeId)||!['sandbox','production'].includes(config.environment)||!config.from||!ledger)return fail('mail_not_configured',503);
  const id=match[1];
  try{
   if(request.method==='GET'){
    const row=await ledger.get(config.environment,config.storeId,id);
    return row?answer(result(row)):fail('message_not_found',404);
   }
   let body;try{body=await boundedJson(request);}catch(error){return fail(error.message==='body_too_large'?'body_too_large':'invalid_body',error.message==='body_too_large'?413:400);}
   if(body?.schemaVersion!==1||body.id!==id||body.storeId!==config.storeId||body.environment!==config.environment||body.from!==config.from)return fail('mail_context_rejected',403);
   if(typeof body.subject!=='string'||body.subject.length<1||body.subject.length>250||typeof body.text!=='string'||body.text.length<1||body.text.length>40000||body.messageId!==`<${id}@${config.from.split('@')[1]}>`)return fail('invalid_message',400);
   if(body.html!==undefined&&(typeof body.html!=='string'||body.html.length<1||body.html.length>40000))return fail('invalid_message',400);
   if(config.environment==='sandbox'&&!config.testRecipients?.includes(body.to))return fail('sandbox_recipient_rejected',403);
   try{smtpMessage({from:body.from,to:body.to,replyTo:body.replyTo,subject:body.subject,text:body.text,id});}catch{return fail('invalid_message',400);}
   const message={schemaVersion:1,environment:body.environment,storeId:body.storeId,id,messageId:body.messageId,from:body.from,to:body.to,replyTo:body.replyTo||null,subject:body.subject,text:body.text,...(body.html!==undefined?{html:body.html}:{})};
   const hash=await fingerprint(message),existing=await ledger.get(config.environment,config.storeId,id);
   if(existing){if(existing.fingerprint!==hash)return fail('message_conflict',409);return answer(result(existing));}
   // Disabled transport never claims a message or opens an SMTP socket.
   if(!config.enabled||typeof send!=='function')return fail('mail_transport_disabled',503);
   const claimed=await ledger.claim(message,hash);
   if(!claimed.row||claimed.row.fingerprint!==hash)return fail('message_conflict',409);
   if(!claimed.claimed)return answer(result(claimed.row));
   // Claim is permanently unknown before the first SMTP attempt. A crash,
   // timeout, rejection or lost DB acknowledgement never triggers another send.
   try{
    const transportResult=await send(message);
    const reference=transportResult?.reference||`smtp-accepted:${message.messageId}`;
    if(typeof reference!=='string'||reference.length>500||/[\r\n\x00-\x1f]/.test(reference))throw Error('invalid_transport_reference');
    const accepted=await ledger.accept(message,hash,reference);
    return answer(result(accepted));
   }catch{return answer(result(await ledger.get(config.environment,config.storeId,id)));}
  }catch{return fail('mail_operation_unavailable',503);}
 };
}
