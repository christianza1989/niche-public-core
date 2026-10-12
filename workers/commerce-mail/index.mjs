import {connect} from 'cloudflare:sockets';
import {smtpSession} from '../../lib/smtp-protocol.mjs';
import {createCommerceMailGateway,D1CommerceMailLedger} from '../../lib/commerce-mail-gateway.mjs';
export default {
 async fetch(request,env){
  const config={storeId:env.COMMERCE_STORE_ID,environment:env.COMMERCE_ENVIRONMENT,from:env.SMTP_USER,enabled:env.COMMERCE_MAIL_ENABLED==='1'&&Boolean(env.SMTP_PASSWORD),testRecipients:(env.COMMERCE_TEST_RECIPIENTS||'').split(',').filter(Boolean)};
  return createCommerceMailGateway({config,ledger:env.COMMERCE_MAIL_DB?new D1CommerceMailLedger(env.COMMERCE_MAIL_DB):null,send:async message=>{
   const socket=connect({hostname:'smtp.hostinger.com',port:465},{secureTransport:'on',allowHalfOpen:false});
   socket.closed.catch(()=>{});
   await smtpSession(socket,{user:env.SMTP_USER,password:env.SMTP_PASSWORD,timeoutMs:12000},{id:message.id,to:message.to,replyTo:message.replyTo,subject:message.subject,text:message.text});
  }})(request);
 }
};
