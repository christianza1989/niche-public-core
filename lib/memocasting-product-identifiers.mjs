import registry from './memocasting-merchant-products.json' with {type:'json'};
import {memoProductForSlug} from './memocasting-products.mjs';
// An MPN identifies the manufacturer's exact white/no-base configuration.
// It is neither a GTIN nor an identifier for every configurable combination.
export function memoWhiteConfiguration(product,entry){
 const groups=product?.optionGroups;
 return Array.isArray(groups)&&groups.length===Object.keys(entry.choices).length
  &&new Set(groups.map(group=>group.id)).size===groups.length
  &&groups.every(group=>{
   const values=Array.isArray(group.values)?group.values.filter(value=>value.id===entry.choices[group.id]):[];
   return Object.hasOwn(entry.choices,group.id)&&group.defaultValue===entry.choices[group.id]
    &&values.length===1&&values[0].enabled===true&&Number.isSafeInteger(values[0].prices?.LT);
  });
}
export function memoManufacturerIdentity(product){
 const entry=registry.products.find(entry=>entry.sku===product?.sku);
 return entry&&entry.gtinAssigned===false&&memoWhiteConfiguration(product,entry)
  ? {sku:entry.mpn,mpn:entry.mpn,color:'Balta'}:undefined;
}
export function memoSchemaProductIdentity(page){
 const entry=registry.products.find(entry=>entry.sku===memoProductForSlug(page.slug)?.sku),value=page.seoProductIdentity;
 return entry&&value?.mpn===entry.mpn&&value.sku===entry.mpn&&value.color==='Balta'
  ? {sku:entry.mpn,mpn:entry.mpn,color:'Balta'}:undefined;
}
