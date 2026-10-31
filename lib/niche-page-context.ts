import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { nicheSiteByHost, publicNichePage, publicNichePages } from '@/lib/niche-sites';
import { memoPublishedProductPage, memoPublishedProductPages } from '@/lib/memocasting-product-server';

// One publication/host gate shared by the network route and isolated Node entry.
// Keep renderer imports out of this module: they pull unrelated CSS/client code
// into a single-site Next build even when only one branch renders at runtime.
export async function nichePageContext(params: Promise<{siteId:string;slug?:string[]}>, expectedSiteId?:string) {
 const {siteId,slug=[]}=await params;
 const host=(await headers()).get('host');
 const pkg=nicheSiteByHost(host);
 if(!pkg||pkg.siteId!==siteId||expectedSiteId&&siteId!==expectedSiteId)notFound();
 const originalPage=publicNichePage(pkg,slug.join('/'));
 const page=siteId==='memocasting'?await memoPublishedProductPage(originalPage,host):originalPage;
 if(!page)notFound();
 const originalPages=publicNichePages(pkg);
 const livePages=siteId==='memocasting'&&['ranku-liejimo-rinkiniai','rinkinys-porai','seimos-rinkinys'].includes(slug.join('/'))?await memoPublishedProductPages(originalPages,host):originalPages;
 return {siteId,props:{pkg,page,livePages}};
}
