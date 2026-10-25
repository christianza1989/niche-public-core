import registry from './memocasting-merchant-products.json' with {type:'json'};
import {memoProductForSku} from './memocasting-products.mjs';
import {memoApplyProductContent} from './memocasting-product-content.mjs';
import {resolveCatalogSelection} from '../vendor/commerce-core/commerce-client.mjs';
import {memoWhiteConfiguration as whiteDefault} from './memocasting-product-identifiers.mjs';

const headers={'Content-Type':'application/xml; charset=utf-8','Cache-Control':'private, no-store, no-transform','X-Robots-Tag':'noindex','X-Content-Type-Options':'nosniff'};
const xml=value=>String(value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g,'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
const field=(name,value)=>`<g:${name}>${xml(value)}</g:${name}>`;
const owns=pkg=>pkg?.siteId===registry.siteId&&pkg.canonicalHost===registry.canonicalHost&&pkg.locale==='lt-LT';

// MPNs are manufacturer-assigned to these exact white/no-base configurations.
// They are not substitute GTINs or identifiers for other colors/accessories.
function imageUrl(product,selection,entry,origin){
 const image=selection.image;
 if(!image||!product.content?.images?.includes(image)||!/^[A-Za-z0-9_-]{1,100}$/.test(image.id)
  ||image.src!==`/prekyba/catalog-media/${image.id}`||![image.width,image.height].every(value=>Number.isSafeInteger(value)&&value>=100)
  ||Object.entries(image.choices??{}).some(([key,value])=>entry.choices[key]!==value))return null;
 return origin+image.src;
}

// Caller supplies the same authoritative native publication projection as the
// storefront. Prices, stock, selected media and package weight come only from
// the current published commerce snapshot, never from editorial descriptions.
export function memoMerchantFeedXml(pkg,eligiblePages,shop){
 if(!owns(pkg)||!Array.isArray(eligiblePages)||!Array.isArray(shop?.products))return null;
 const origin=`https://${registry.canonicalHost}`,items=[];
 for(const entry of registry.products){
  const identity=memoProductForSku(entry.sku);
  const pages=eligiblePages.filter(page=>page.siteId===registry.siteId&&page.type==='product'&&page.slug===identity?.slug);
  const products=shop.products.filter(product=>product?.sku===entry.sku);
  if(pages.length!==1||products.length!==1||entry.gtinAssigned!==false)continue;
  const product=products[0];if(!whiteDefault(product,entry))continue;
  let page,selection;
  try{page=memoApplyProductContent(pages[0],product,shop.context);selection=resolveCatalogSelection(product,'LT',{});}catch{continue;}
  const offer=page.seoOffer,image=imageUrl(product,selection,entry,origin);
  if(!offer||offer.priceCurrency!=='EUR'||!Number.isSafeInteger(selection.amount)||selection.amount<=0
   ||offer.price!==(selection.amount/100).toFixed(2)||!['https://schema.org/InStock','https://schema.org/OutOfStock'].includes(offer.availability)
   ||!image||typeof page.title!=='string'||!page.title.trim()||typeof page.description!=='string'||!page.description.trim())continue;
  const weight=product.package?.weightGrams;
  items.push('<item>'+[
   field('id',entry.mpn),field('title',page.title),field('description',page.description),field('link',origin+'/'+page.slug),
   field('image_link',image),field('availability',offer.availability==='https://schema.org/InStock'?'in_stock':'out_of_stock'),
   field('price',offer.price+' EUR'),field('condition','new'),field('brand',registry.brand),field('mpn',entry.mpn),
   ...(Number.isSafeInteger(weight)&&weight>0?[field('shipping_weight',weight/1000+' kg')]:[]),
  ].join('')+'</item>');
 }
 // No HTTP-200 empty feed may silently replace a temporarily unavailable shop.
 if(!items.length)return null;
 return '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>Memocasting</title><link>'+origin+'/</link><description>Memocasting rankų liejimo rinkiniai</description>'+items.join('')+'</channel></rss>';
}

export async function serveMemoMerchantFeed(request,{pkg,eligiblePages,loadCatalog}){
 const url=new URL(request.url);
 const reply=(text,status,extra={})=>new Response(request.method==='HEAD'?null:text,{status,headers:{...headers,'Content-Type':'text/plain; charset=utf-8',...extra}});
 if(!owns(pkg)||url.protocol!=='https:'||url.host!==registry.canonicalHost||request.headers.get('host')!==registry.canonicalHost)
  return reply('Not found',404);
 if(!['GET','HEAD'].includes(request.method))return reply('Method not allowed',405,{Allow:'GET, HEAD'});
 let output;try{output=memoMerchantFeedXml(pkg,eligiblePages,await loadCatalog());}catch{output=null;}
 if(!output)return reply('Product feed temporarily unavailable',503,{'Retry-After':'300'});
 return new Response(request.method==='HEAD'?null:output,{headers});
}
