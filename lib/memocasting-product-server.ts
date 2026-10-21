import {cache} from 'react';
import {env} from 'cloudflare:workers';
import type {NichePage} from './niche-sites';
import {memoProductSku,memoApplyProductContent} from './memocasting-product-content.mjs';
const loadCatalog=cache(async(host:string|null)=>{
 const binding='MEMO_COMMERCE' in env?env.MEMO_COMMERCE:undefined;
 try{
  let response:Response;
  if(binding&&typeof binding==='object'&&'fetch' in binding&&typeof binding.fetch==='function'){
   response=await binding.fetch(new Request('https://memocasting.lt/api/catalog',{signal:AbortSignal.timeout(5000)}));
  }else if(/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host??'')){
   const origin=('MEMO_COMMERCE_ORIGIN' in env?env.MEMO_COMMERCE_ORIGIN:process.env.MEMO_COMMERCE_ORIGIN);
   if(!['http://127.0.0.1:8797','http://127.0.0.1:8827'].includes(String(origin)))return null;
   response=await fetch(String(origin)+'/api/catalog',{signal:AbortSignal.timeout(3000)});
  }else return null;
  if(!response.ok)return null;
  const products=await response.json() as Array<{sku:string}>;
  return products;
 }catch{return null;}
});
export async function memoPublishedProductPage(page:NichePage|undefined,host:string|null):Promise<(NichePage & {seoTitle?:string;seoDescription?:string})|undefined>{
 const sku=memoProductSku(page);if(!sku||!page)return page;
 const products=await loadCatalog(host);return products?memoApplyProductContent(page,products.find(p=>p.sku===sku)):page;
}
export async function memoPublishedProductPages(pages:NichePage[],host:string|null):Promise<NichePage[]>{
 const products=await loadCatalog(host);return products?pages.map(page=>memoApplyProductContent(page,products.find(p=>p.sku===memoProductSku(page)))):pages;
}
