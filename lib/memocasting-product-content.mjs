import {resolveCatalogSelection} from '../vendor/commerce-core/commerce-client.mjs';
import {memoProductForSlug,memoProductForSku} from './memocasting-products.mjs';
import {memoManufacturerIdentity} from './memocasting-product-identifiers.mjs';
// Published commerce content augments exact LT product URLs only.
// Editorial page admission and future article dates remain owned by the content core.
export function memoProductSku(page){return memoProductForSlug(page?.slug)?.sku??null;}
export function memoProductContents(page){
 const index=page.body.findIndex(b=>b.type==='heading'&&['Kas įeina į rinkinį?','Kas yra rinkinyje?','Patvirtinta komplektacija','Potwierdzona zawartość','Apstiprinātā komplektācija','Kinnitatud komplekti sisu'].includes(b.text));
 return index>=0&&page.body[index+1]?.type==='list'?page.body[index+1].items:[];
}
export function memoDescriptionBlocks(description){
 const blocks=[];let paragraph=[],items=[];
 const flush=()=>{if(paragraph.length){blocks.push({type:'paragraph',text:paragraph.join('\n')});paragraph=[];}if(items.length){blocks.push({type:'list',items});items=[];}};
 for(const line of description.split('\n')){
  const heading=line.match(/^(#{2,3})\s+(.+)$/),item=line.match(/^-\s+(.+)$/);
  if(!line.trim()){flush();continue;}
  if(heading){flush();blocks.push({type:'heading',level:heading[1].length,text:heading[2]});}
  else if(item){if(paragraph.length)flush();items.push(item[1]);}
  else{if(items.length)flush();paragraph.push(line);}
 }flush();return blocks;
}
// A base/default offer is runtime data from the same published catalog as the
// configurator. Editorial prices and optional paid add-ons are not its source.
function liveOffer(product,context){
 if(context?.schemaVersion!==1||context.environment!=='production'||context.testOnly!==false
  ||context.paymentConnected!==true||context.paymentEnvironment!=='live'||context.paymentAccountVerified!==true
  ||context.productionReady!==true||context.publishOffers!==true||!Array.isArray(context.eligibleCountries)||!context.eligibleCountries.includes('LT')
  ||(product.enabled!==true&&!(memoProductForSku(product.sku)?.state==='soldout'&&product.available===0))||!Number.isSafeInteger(product.prices?.LT)||product.prices.LT<=0
  ||!Number.isSafeInteger(product.available)||product.available<0)return undefined;
 let amount;try{amount=resolveCatalogSelection(product,'LT',{}).amount;}catch{return undefined;}
 if(!Number.isSafeInteger(amount)||amount<=0)return undefined;
 return {'@type':'Offer',price:(amount/100).toFixed(2),priceCurrency:'EUR',
  availability:product.available>0?'https://schema.org/InStock':'https://schema.org/OutOfStock',
  itemCondition:'https://schema.org/NewCondition'};
}
export function memoApplyProductContent(page,product,context){
 if(!page||!memoProductSku(page)||product?.sku!==memoProductSku(page))return page;
 const c=product.content;
 const body=c?.description?.trim() ? memoDescriptionBlocks(c.description) : page.body;
 const contents=c?.contents?.trim() ? [{type:'heading',level:2,text:'Kas įeina į rinkinį?'},{type:'list',items:c.contents.split('\n').map(s=>s.trim()).filter(Boolean)}] : [];
 const offer=liveOffer(product,context);
 return {...page,title:product.title||page.title,description:c?.summary||page.description,
  seoTitle:c?.seoTitle||product.title||page.title,seoDescription:c?.seoDescription||c?.summary||page.description,
  body:contents.length?[...body,...contents]:body,
  media:c?.images?.length?c.images.map(m=>({...m,rights:'owner-managed-product-media'})):page.media,
  seoOffer:offer,seoProductIdentity:offer?memoManufacturerIdentity(product):undefined};
}
