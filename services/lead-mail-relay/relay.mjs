import {createHash,timingSafeEqual} from 'node:crypto';
import {createCommerceMailGateway} from '../../lib/commerce-mail-gateway.mjs';
const reply=(error,status)=>Response.json({error},{status,headers:{'cache-control':'no-store','x-robots-tag':'noindex, nofollow'}});
async function limitedBody(request){
 const reader=request.body?.getReader();if(!reader)throw Error('invalid_body');
 const chunks=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>65536){await reader.cancel();throw Error('body_too_large');}chunks.push(value);}}finally{reader.releaseLock();}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export function createLeadMailRelay({clients,from,ledger,send,checkTransport}){
 return async request=>{
  const url=new URL(request.url),match=url.pathname.match(/^\/v1\/([a-zA-Z0-9_-]{1,100})\/(transport-check|messages\/[a-zA-Z0-9-]{1,220})$/);
  if(!match||url.search)return reply('not_found',404);
  const client=clients.find(value=>value.id===match[1]);
  const token=request.headers.get('authorization')?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
  if(!client||!token||!/^[a-f0-9]{64}$/.test(client.tokenHash)||!timingSafeEqual(createHash('sha256').update(token).digest(),Buffer.from(client.tokenHash,'hex')))return reply('unauthorized',403);
  let body;
  if(request.method==='POST'){
   try{body=await limitedBody(request);}catch(error){return reply('invalid_body',error.message==='body_too_large'?413:400);}
   if(body?.to!==client.to)return reply('recipient_rejected',403);
  }
  const gateway=createCommerceMailGateway({config:{storeId:client.id,environment:'production',from,enabled:true},ledger,send:message=>send({...message,fromName:client.fromName}),checkTransport});
  return gateway(new Request(`https://core-mail.internal/commerce/${match[2]}`,{method:request.method,...(body?{body:JSON.stringify(body),headers:{'content-type':'application/json'}}:{})}));
 };
}
