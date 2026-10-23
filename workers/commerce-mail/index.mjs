import {connect} from 'cloudflare:sockets';
import {smtpSession} from '../../lib/smtp-protocol.mjs';
import {createCommerceMailGateway,D1CommerceMailLedger} from '../../lib/commerce-mail-gateway.mjs';
import {checkHostingerCommerceMail,sendHostingerCommerceMail} from '../../lib/hostinger-commerce-mail.mjs';
export default {
 async fetch(request,env){
  const useApi=env.COMMERCE_MAIL_TRANSPORT==='hostinger_api';
  const api={apiKey:env.HOSTINGER_MAIL_API_KEY,mailboxResourceId:env.HOSTINGER_MAILBOX_ID,sender:env.SMTP_USER,displayName:env.SMTP_SENDER_NAME};
  const config={storeId:env.COMMERCE_STORE_ID,environment:env.COMMERCE_ENVIRONMENT,from:env.SMTP_USER,enabled:env.COMMERCE_MAIL_ENABLED==='1'&&Boolean(useApi?api.apiKey&&api.mailboxResourceId:env.SMTP_PASSWORD),testRecipients:(env.COMMERCE_TEST_RECIPIENTS||'').split(',').filter(Boolean)};
  const transport=async(message,onStage)=>{
   if(useApi){
    if(message)return sendHostingerCommerceMail(api,message);
    onStage?.('api_authentication');const result=await checkHostingerCommerceMail(api);onStage?.('authenticated');return result;
   }
   const socket=connect({hostname:'smtp.hostinger.com',port:465},{secureTransport:'on',allowHalfOpen:false});
   socket.closed.catch(()=>{});
   onStage?.('tls');await socket.opened;
   await smtpSession(socket,{user:env.SMTP_USER,password:env.SMTP_PASSWORD,timeoutMs:12000,onStage},message?{id:message.id,to:message.to,replyTo:message.replyTo,subject:message.subject,text:message.text,...(env.SMTP_SENDER_NAME?{fromName:env.SMTP_SENDER_NAME}:{})}:undefined);
  };
  return createCommerceMailGateway({config,ledger:env.COMMERCE_MAIL_DB?new D1CommerceMailLedger(env.COMMERCE_MAIL_DB):null,send:message=>transport(message),checkTransport:async()=>{
   let stage='connection';try{await transport(undefined,value=>{stage=value;});return {ready:true,stage};}catch(error){return {ready:false,stage,reason:String(error?.message||'smtp_connection_failed').replaceAll(env.SMTP_PASSWORD||'__no_password__','[redacted]').replaceAll(env.SMTP_USER||'__no_user__','[redacted]').replace(/[\r\n\x00-\x1f]/g,' ').slice(0,240)};}
  }})(request);
 }
};


