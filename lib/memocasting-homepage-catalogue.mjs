import {memoAvailableProduct,memoMarketCurrency} from './memocasting-catalog-options.mjs';
export function homepagePriceState(catalog,markets,sku){
 const currency=memoMarketCurrency(markets,'LT'),item=memoAvailableProduct(catalog,sku,'LT');
 if(!currency||!item)return {state:'unavailable',text:'Prieinamumą tikrinkite produkto puslapyje.'};
 return {state:'ready',text:new Intl.NumberFormat('lt-LT',{style:'currency',currency}).format(item.prices.LT/100)};
}
// Same native CommerceClient as product/cart; never a parallel price source.
export function mountHomepageCatalogue(root,client){
 let disposed=false,generation=0;
 const abort=new AbortController(),prices=[...root.querySelectorAll('[data-price-sku]')],retry=[...root.querySelectorAll('[data-price-retry]')];
 async function refresh(){const mine=++generation;prices.forEach(el=>{el.textContent='Kainą tikriname…';el.dataset.state='loading';});retry.forEach(el=>el.hidden=true);
  try{const [catalog,markets]=await Promise.all([client.request('/api/catalog'),client.request('/api/markets')]);if(disposed||mine!==generation)return;
   prices.forEach(el=>{const result=homepagePriceState(catalog,markets,el.dataset.priceSku);el.textContent=result.text;el.dataset.state=result.state;});
  }catch{if(disposed||mine!==generation)return;prices.forEach(el=>{el.textContent='Kainos nepavyko patikrinti.';el.dataset.state='error';});retry.forEach(el=>el.hidden=false);}
 }
 retry.forEach(el=>el.addEventListener('click',refresh,{signal:abort.signal}));refresh();
 return()=>{disposed=true;generation++;abort.abort();};
}
