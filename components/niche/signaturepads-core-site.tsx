import { notFound } from 'next/navigation';
import type { ContentPackageV2, ProjectedContentPageV2 } from '@/lib/content-model-v2';
import { signaturepadsSnapshot } from '@/lib/signaturepads-content.mjs';
import { contentInquiryProductV2 } from '@/lib/content-seo-v2.mjs';
import { giftSchemas, giftJsonLd } from '@/lib/gift-seo';
import layout from '@/sites/signaturepads/migration/core-layout.json';
import { SignaturepadsSite } from './signaturepads-site';
import { SignaturepadsClient } from './signaturepads/client-loader';

export function SignaturepadsCoreSite({pkg,page,livePages,query=''}:{pkg:ContentPackageV2;page:ProjectedContentPageV2;livePages:ProjectedContentPageV2[];query?:string}) {
  const data=signaturepadsSnapshot(pkg,livePages,layout);
  const route=data?.routes.find((r:{path:string})=>r.path===new URL(page.url).pathname);
  if(!data||!route)notFound();
  const schemas:unknown[]=giftSchemas(pkg,page,livePages,{collection:true});
  const product=data.products.find((p:{id:number})=>p.id===route.productId);
  if(product)schemas.push(contentInquiryProductV2(pkg,page,{name:product.name,images:product.images,
    displayPrice:(Number(product.prices.price)/100).toLocaleString('lt-LT',{minimumFractionDigits:2,maximumFractionDigits:2})+'€'}));
  if(page.slug){
    const category=data.routes.find((r:{kind:string;productIds:number[]})=>r.kind==='category'&&r.productIds.includes(route.productId));
    const crumbs=[{name:'Pradžia',item:`https://${pkg.canonicalHost}/`},...(category?[{name:category.title,item:`https://${pkg.canonicalHost}${category.path}`}]:[]),{name:route.title,item:page.url}];
    schemas.push({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:crumbs.map((c,i)=>({'@type':'ListItem',position:i+1,...c}))});
  }
  return <><SignaturepadsSite snapshot={data} route={route} query={query}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:giftJsonLd(schemas)}}/>
    <SignaturepadsClient/></>;
}
