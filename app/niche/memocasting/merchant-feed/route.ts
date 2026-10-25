import {nicheSiteByHost,publicNichePages} from '@/lib/niche-sites';
import {memoPublishedCatalog} from '@/lib/memocasting-product-server';
import {serveMemoMerchantFeed} from '@/lib/memocasting-merchant-feed.mjs';

export const dynamic='force-dynamic';
async function serve(request:Request){
 const host=request.headers.get('host'),pkg=nicheSiteByHost(host);
 return serveMemoMerchantFeed(request,{pkg,eligiblePages:pkg?publicNichePages(pkg):[],loadCatalog:()=>memoPublishedCatalog(host)});
}
export const GET=serve;
export const HEAD=serve;
