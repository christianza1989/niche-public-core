import {env} from 'cloudflare:workers';
import {nicheSiteByHost,normalizedHost} from '@/lib/niche-sites';
import {relayMemoBuyer} from '@/lib/memocasting-commerce-bridge.mjs';
export const dynamic='force-dynamic';
function isFetcher(value:unknown):value is Pick<Fetcher,'fetch'>{return value!==null&&typeof value==='object'&&'fetch' in value&&typeof value.fetch==='function';}
async function bridge(request:Request,{params}:{params:Promise<{path:string[]}>}){
 const normalized=normalizedHost(request.headers.get('host')),site=nicheSiteByHost(normalized);
 const url=new URL(request.url),rawHost=request.headers.get('host')?.toLowerCase();
 const host=['127.0.0.1','localhost'].includes(normalized)?normalized:url.hostname;
 // URL and resolver must agree. No incoming forwarded-host is trusted.
 if(!['127.0.0.1','localhost'].includes(normalized)&&normalizedHost(url.hostname)!==normalized)return Response.json({error:'not_found'},{status:404,headers:{'cache-control':'no-store','x-robots-tag':'noindex, nofollow'}});
 const binding='MEMO_COMMERCE' in env?env.MEMO_COMMERCE:undefined;
 const loopbackOrigin='MEMO_COMMERCE_ORIGIN' in env&&typeof env.MEMO_COMMERCE_ORIGIN==='string'?env.MEMO_COMMERCE_ORIGIN:process.env.MEMO_COMMERCE_ORIGIN;
 return relayMemoBuyer(request,(await params).path.join('/'),{siteId:site?.siteId,host,loopbackOrigin,service:isFetcher(binding)?binding:undefined,cfTrusted:'cf' in request&&Boolean(request.cf)&&rawHost===url.host});
}
export const GET=bridge;export const POST=bridge;
export const HEAD=bridge;
