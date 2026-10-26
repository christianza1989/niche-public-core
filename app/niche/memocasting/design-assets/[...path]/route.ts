import {env,waitUntil} from 'cloudflare:workers';
import {nicheSiteByHost,publicNichePages} from '@/lib/niche-sites';
import {memoHomepageAsset} from '@/lib/memocasting-homepage-assets.mjs';
import {serveStreamedAsset} from '@/lib/streamed-asset-range.mjs';

async function serve(request:Request,{params}:{params:Promise<{path:string[]}>}){
 const pkg=nicheSiteByHost(request.headers.get('host'));
 if(!pkg)return new Response('Not found',{status:404});
 const {path}=await params;
 const pathname='/memocasting-homepage/'+path.join('/');
 const asset=memoHomepageAsset(pkg,publicNichePages(pkg),pathname);
 if(!asset)return new Response('Not found',{status:404});
 const url=new URL(request.url);url.pathname=asset.path;url.search='';
 if(!env.ASSETS)return new Response('Asset service unavailable',{status:503});
 return serveStreamedAsset(new Request(url,request),env.ASSETS,asset.bytes,waitUntil);
}
export const GET=serve;
export const HEAD=serve;
