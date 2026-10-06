import {connect} from 'cloudflare:sockets';
import {smtpSession} from './smtp-protocol.mjs';

// Shared transactional transport. Credentials enter only through Worker secrets.
export async function sendHostingerMail(env,mail){
 if(env.MAIL_RELAY_URL){
  if(!env.MAIL_RELAY_KEY||env.MAIL_RELAY_KEY.length<48||!['dovanos123','madbeauty'].includes(env.MAIL_RELAY_SITE))throw Error('Mail relay configuration unavailable');
  const url=new URL(env.MAIL_RELAY_URL);
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw Error('Invalid mail relay URL');
  const body=JSON.stringify(mail),time=String(Date.now());
  let signature;
  try{const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.MAIL_RELAY_KEY),{name:'HMAC',hash:'SHA-256'},false,['sign']);
   signature=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`${time}\n${body}`))),b=>b.toString(16).padStart(2,'0')).join('');
  }catch{throw Error('Mail relay signing unavailable');}
  let response;
  try{response=await fetch(url.toString(),{method:'POST',headers:{'Content-Type':'application/json','x-release-site':env.MAIL_RELAY_SITE,'x-release-time':time,'x-release-signature':signature},body,redirect:'manual',signal:AbortSignal.timeout(20000)});}catch(error){
   const reason=/redirect/i.test(error.message||'')?'redirect':/1042|1024|worker|access/i.test(error.message||'')?'restricted':/abort|timeout/i.test(error.message||'')?'timeout':/URL|scheme|hostname/i.test(error.message||'')?'target':'network';
   throw Error(`Mail relay ${reason} unavailable`);
  }
  if(!response.ok)throw Error(`Mail relay status ${response.status}`);
  let receipt;try{receipt=await response.json();}catch{throw Error('Mail relay response unavailable');}
  if(receipt.accepted!==true)throw Error('Mail relay acceptance unavailable');
  return;
 }
 if(!env.LEAD_SMTP_USER||!env.LEAD_SMTP_PASSWORD)throw Error('SMTP configuration unavailable');
 const socket=connect({hostname:'smtp.hostinger.com',port:465},{secureTransport:'on',allowHalfOpen:false});
 socket.closed.catch(()=>{});
 await smtpSession(socket,{user:env.LEAD_SMTP_USER,password:env.LEAD_SMTP_PASSWORD,timeoutMs:12000},mail);
}
