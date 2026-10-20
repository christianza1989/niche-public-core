import {env} from 'cloudflare:workers';
import {nicheSiteByHost,normalizedHost,publicNichePages} from '@/lib/niche-sites';
import {memoHomepageAdmitted} from '@/lib/memocasting-homepage-markup.mjs';
import {relayMemoInstagram} from '@/lib/memocasting-instagram-bridge.mjs';
export const dynamic='force-dynamic';
async function bridge(request:Request,{params}:{params:Promise<{path:string[]}>}){
 const host=normalizedHost(request.headers.get('host')),site=nicheSiteByHost(host),url=new URL(request.url);
 if(normalizedHost(url.hostname)!==host)return new Response('Not found',{status:404});
 const binding='MEMO_INSTAGRAM' in env?env.MEMO_INSTAGRAM:undefined;
 const service=binding&&typeof binding==='object'&&'fetch' in binding&&typeof binding.fetch==='function'?binding as {fetch:(request:Request)=>Promise<Response>}:undefined;
 return relayMemoInstagram(request,(await params).path.join('/'),{siteId:site?.siteId,host,service,homepageEligible:!!site&&publicNichePages(site).some(memoHomepageAdmitted)});
}
export const GET=bridge;export const HEAD=bridge;export const POST=bridge;
