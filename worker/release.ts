import handler from 'vinext/server/fetch-handler';
import {env} from 'cloudflare:workers';
import {maintainLeadDelivery} from '../lib/niche-lead-delivery.mjs';
export default {
 async fetch(request:Request,_env:Cloudflare.Env,ctx:ExecutionContext){
  const url=new URL(request.url),origin=new URL(env.RELEASE_ORIGIN!);
  if(env.RELEASE_MODE==='production'&&url.hostname==='www.'+origin.hostname)return Response.redirect(origin.origin+url.pathname+url.search,308);
  if(url.host!==origin.host&&!['127.0.0.1','localhost'].includes(url.hostname))return new Response('Not found',{status:404,headers:{'X-Robots-Tag':'noindex'}});
  if(env.RELEASE_MODE==='production'&&url.protocol==='http:')return Response.redirect(origin.origin+url.pathname+url.search,308);
  if(env.RELEASE_MODE!=='production'&&['/sitemap.xml','/llms.txt','/llms-full.txt'].includes(url.pathname))return new Response('Preview discovery disabled',{status:404,headers:{'X-Robots-Tag':'noindex, nofollow'}});
  // With run_worker_first, Vite's generated client files need explicit delegation.
  // Keep the host guard above assets, and publication gates inside proxy for media.
  if(url.pathname.startsWith('/_next/')||url.pathname.startsWith('/fonts/'))return env.ASSETS.fetch(request);
  if(request.method==='POST'&&['/uzklausa','/ivykius'].includes(url.pathname)){
   const limiter=url.pathname==='/uzklausa'?env.LEAD_LIMITER:env.INTEREST_LIMITER;
   if(!limiter)return new Response('Laikinai nepasiekiama',{status:503});
   if(!(await limiter.limit({key:request.headers.get('cf-connecting-ip')||'local'})).success)return new Response('Per daug užklausų. Bandykite vėliau.',{status:429,headers:{'Retry-After':'60','Cache-Control':'no-store'}});
  }
  const response=await handler.fetch(request,_env,ctx),result=new Response(response.body,response);
  result.headers.set('X-Content-Type-Options','nosniff');result.headers.set('Referrer-Policy','strict-origin-when-cross-origin');result.headers.set('X-Frame-Options','DENY');
  if(env.RELEASE_MODE!=='production')result.headers.set('X-Robots-Tag','noindex, nofollow');return result;
 },
 async scheduled(){await maintainLeadDelivery(env);}
};
