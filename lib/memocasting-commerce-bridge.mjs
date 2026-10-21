// Transport only. All prices, admission, identity and order rules stay upstream.
const paths=/^(storefront-context|catalog(?:-media\/[a-zA-Z0-9_-]+)?|markets|quote|delivery-quotes|orders(?:\/[a-zA-Z0-9_-]+(?:\/(checkout|withdrawal|receipt|documents\/[a-zA-Z0-9_-]+))?)?)$/;
const reads=/^(storefront-context|catalog(?:-media\/[a-zA-Z0-9_-]+)?|markets|orders\/[a-zA-Z0-9_-]+(?:\/(receipt|documents\/[a-zA-Z0-9_-]+))?)$/;
const writes=/^(quote|delivery-quotes|orders|orders\/[a-zA-Z0-9_-]+\/(checkout|withdrawal))$/;
const fail=(error,status)=>Response.json({error},{status,headers:{'cache-control':'no-store','x-robots-tag':'noindex, nofollow'}});
/**
 * @param {Request} request
 * @param {string} path
 * @param {{siteId?:string,host?:string,loopbackOrigin?:string,service?:Pick<Fetcher,'fetch'>,cfTrusted?:boolean,fetchImpl?:typeof fetch}} options
 */
export async function relayMemoBuyer(request,path,{siteId,host,loopbackOrigin,service,cfTrusted=false,fetchImpl=fetch}={}){
 if(siteId!=='memocasting'||!paths.test(path))return fail('not_found',404);
 if(!['GET','HEAD','POST'].includes(request.method))return fail('method_not_allowed',405);
 if(!(request.method==='POST'?writes:reads).test(path))return fail('method_not_allowed',405);
 const incoming=new URL(request.url),local=['127.0.0.1','localhost'].includes(host);
 let upstream;
 if(local){
  if(!['http://127.0.0.1:8797','http://127.0.0.1:8827'].includes(loopbackOrigin))return fail('commerce_not_configured',503);
  upstream=new URL('/api/'+path,loopbackOrigin);
 }else{
  if(!['memocasting.lt','www.memocasting.lt'].includes(host)||incoming.protocol!=='https:'||incoming.hostname!==host||!service?.fetch)return fail('commerce_external_host',503);
  const ip=request.headers.get('cf-connecting-ip');
  if(!cfTrusted||!ip||ip.length>64||/[\s,]/.test(ip))return fail('commerce_ingress_unavailable',503);
  upstream=new URL('/api/'+path,incoming.origin);
 }
 const originalOrigin=request.headers.get('origin'),forbidden=request.method==='POST'&&originalOrigin&&originalOrigin!==incoming.origin;
 const headers=new Headers();for(const key of ['content-type','authorization','idempotency-key','order-access-token']){const value=request.headers.get(key);if(value)headers.set(key,value);}
 if(!local){if(originalOrigin)headers.set('origin',originalOrigin);headers.set('cf-connecting-ip',request.headers.get('cf-connecting-ip'));}
 try{
  let body;
  if(request.method==='POST'){
   const reader=request.body?.getReader(),parts=[];let size=0;
   if(reader)try{for(;;){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.byteLength;if(size>131072){await reader.cancel().catch(()=>{});return fail('body_too_large',413);}if(size<=65536)parts.push(chunk.value);}}finally{reader.releaseLock();}
   if(size>65536)return fail('body_too_large',413);
   body=new Uint8Array(size);let offset=0;for(const part of parts){body.set(part,offset);offset+=part.length;}
  }
  if(forbidden)return fail('origin_forbidden',403);
  // Carrier pacing can wait 10s before its bounded 15s provider request.
  const timeoutMs=request.method==='POST'&&path==='delivery-quotes'?30000:10000;
  const forwarded=new Request(upstream,{method:request.method,headers,...(body?{body}:{}),signal:AbortSignal.timeout(timeoutMs),redirect:'manual'});
  const response=await(local?fetchImpl(forwarded):service.fetch(forwarded));
  if(response.status>=300&&response.status<400)return fail('commerce_redirect_refused',503);
  const pdf=response.headers.get('content-type')?.startsWith('application/pdf'),image=response.headers.get('content-type')==='image/webp',outputHeaders=new Headers({'content-type':pdf?'application/pdf':image?'image/webp':'application/json','cache-control':'no-store','x-robots-tag':'noindex, nofollow','x-content-type-options':'nosniff'});
  if(pdf){outputHeaders.set('content-security-policy',"sandbox; default-src 'none'");const disposition=response.headers.get('content-disposition');if(disposition&&/^attachment; filename="[a-zA-Z0-9_.-]+"$/.test(disposition))outputHeaders.set('content-disposition',disposition);}
  return new Response(request.method==='HEAD'?null:response.body,{status:response.status,headers:outputHeaders});
 }catch{return fail('commerce_connection_failed',503);}
}
