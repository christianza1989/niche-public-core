import {configurationQuote} from './catalog-configurator.mjs';
const record=v=>v&&typeof v==='object'&&!Array.isArray(v);
export function reviewedCatalogueModel(catalog,siteId,productId,livePages){if(catalog.siteId!==siteId)return undefined;const model=catalog.models.find(m=>m.id===productId&&m.siteId===siteId);return model&&livePages.some(p=>p.type==='product'&&p.slug.endsWith('/'+model.id)&&p.intent.includes(`catalogue:${model.dataHash}`))?model:undefined;}
export function validateCatalogueRequest(catalog,siteId,input,livePages){
 if(!record(input)||!record(input.selections)||typeof input.locale!=='string')throw Error('Invalid configuration');
 const model=reviewedCatalogueModel(catalog,siteId,input.productId,livePages);if(!model||input.catalogueHash!==model.dataHash)throw Error('Unavailable catalogue revision');
 if(!Object.hasOwn(model.copy,input.locale))throw Error('Unavailable catalogue language');
 if(Object.keys(input.selections).some(id=>!model.sections.some(s=>s.id===id)))throw Error('Unknown section');
 for(const s of model.sections){const entries=input.selections[s.id];if(entries!==undefined&&!record(entries))throw Error('Invalid selection');for(const [id,q]of Object.entries(entries||{})){const item=s.items.find(i=>i.id===id);if(!item||!Number.isInteger(q)||Number(q)<1||Number(q)>(item.maxQty||1))throw Error('Invalid option quantity');}}
 const quote=configurationQuote(model,input.selections,input.locale);
 for(const [section,items]of Object.entries(input.selections))for(const [item,q]of Object.entries(items))if(quote.selections[section]?.[item]!==q)throw Error('Incompatible selection');
 return quote;
}
