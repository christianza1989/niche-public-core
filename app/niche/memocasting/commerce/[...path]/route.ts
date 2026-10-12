import { env } from 'cloudflare:workers';
import { nicheSiteByHost, normalizedHost } from '@/lib/niche-sites';
export const dynamic='force-dynamic';
const paths=/^(storefront-context|catalog|markets|quote|orders(?:\/[a-zA-Z0-9_-]+(?:\/(checkout|withdrawal|receipt|documents\/[a-zA-Z0-9_-]+))?)?)$/;
async function bridge(request:Request,{params}:{params:Promise<{path:string[]}>}) {
 const host=normalizedHost(request.headers.get('host'));
 const site=nicheSiteByHost(host);
 const path=(await params).path.join('/');
 const blocked=(error:string,status:number)=>Response.json({error},{status,headers:{'cache-control':'no-store','x-robots-tag':'noindex, nofollow'}});
 if(site?.siteId!=='memocasting'||!paths.test(path))return blocked('not_found',404);
 // Loopback-only, explicit local adapter. Production service binding requires separate admission.
 const origin=(env as unknown as Record<string,string>).MEMO_COMMERCE_ORIGIN || process.env.MEMO_COMMERCE_ORIGIN;
 if(!origin)return blocked('commerce_not_configured',503);
 if(!['127.0.0.1','localhost'].includes(host) || !['http://127.0.0.1:8797','http://127.0.0.1:8827'].includes(origin))return blocked('commerce_external_host',503);
 const forbiddenOrigin=request.method!=='GET' && Boolean(request.headers.get('origin')) && request.headers.get('origin')!==new URL(request.url).origin;
 const headers=new Headers();for(const key of ['content-type','authorization','idempotency-key','order-access-token']){const value=request.headers.get(key);if(value)headers.set(key,value);}
 try{
  let body:Uint8Array|undefined;
  if(request.method!=='GET'){
   const reader=request.body?.getReader(),parts:Uint8Array[]=[];let size=0;
   // Drain modest rejected bodies without retaining them so HTTP can deliver
   // the 413 reliably. Abusive streams are stopped at the bounded drain limit.
   if(reader)try{for(;;){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.byteLength;if(size>131072){await reader.cancel().catch(()=>{});return blocked('body_too_large',413);}if(size<=65536)parts.push(chunk.value);}}finally{reader.releaseLock();}
   if(size>65536)return blocked('body_too_large',413);
   body=new Uint8Array(size);let offset=0;for(const part of parts){body.set(part,offset);offset+=part.length;}
  }
  if(forbiddenOrigin)return blocked('origin_forbidden',403);
  const response=await fetch(`${origin}/api/${path}`,{method:request.method,headers,body:body as BodyInit|undefined,signal:AbortSignal.timeout(10000),redirect:'manual'});
  if(response.status>=300&&response.status<400)return blocked('commerce_redirect_refused',503);
  const resultHeaders=new Headers({'content-type':response.headers.get('content-type')?.startsWith('application/pdf')?'application/pdf':'application/json','cache-control':'no-store','x-robots-tag':'noindex, nofollow','x-content-type-options':'nosniff'});
  if(resultHeaders.get('content-type')==='application/pdf'){resultHeaders.set('content-security-policy',"sandbox; default-src 'none'");const disposition=response.headers.get('content-disposition');if(disposition&&/^attachment; filename="[a-zA-Z0-9_.-]+"$/.test(disposition))resultHeaders.set('content-disposition',disposition);}
  return new Response(response.body,{status:response.status,headers:resultHeaders});
 }catch(error){console.error('Memocasting local adapter connection:',error instanceof Error?error.message:'unknown error');return blocked('commerce_connection_failed',503);}
}
export const GET=bridge;export const POST=bridge;
