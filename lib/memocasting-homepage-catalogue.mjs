import {memoAvailableProduct,memoMarketCurrency} from './memocasting-catalog-options.mjs';
export function homepagePriceState(catalog,markets,sku){
 const currency=memoMarketCurrency(markets,'LT'),item=memoAvailableProduct(catalog,sku,'LT');
 if(!currency||!item)return {state:'unavailable',text:'Prieinamumą tikrinkite produkto puslapyje.'};
 return {state:'ready',text:new Intl.NumberFormat('lt-LT',{style:'currency',currency}).format(item.prices.LT/100)};
}
// Same native CommerceClient as product/cart; never a parallel price source.
export function mountHomepageCatalogue(root,client){
 let disposed=false,generation=0;
 const abort=new AbortController(),prices=[...root.querySelectorAll('[data-price-sku]')],retry=[...root.querySelectorAll('[data-price-retry]')],ratings=[];
 client.request('/api/reviews').then(data=>{if(disposed||!Array.isArray(data?.stats))return;for(const price of prices){const sku=price.dataset.priceSku,stat=data.stats.find(s=>s.sku===sku);if(!stat||!Number.isInteger(stat.count)||stat.count<1||!Number.isFinite(stat.average))continue;const line=document.createElement('p'),link=document.createElement('a');line.className='memo-home-rating';link.href=(sku==='couple'?'/rinkinys-porai':'/seimos-rinkinys')+'#atsiliepimai';link.textContent=stat.average.toLocaleString('lt-LT',{maximumFractionDigits:2})+'/5 · Įvertinimų: '+stat.count;line.append(link);price.after(line);ratings.push(line);}}).catch(()=>{});
 async function refresh(){const mine=++generation;prices.forEach(el=>{el.textContent='Kainą tikriname…';el.dataset.state='loading';});retry.forEach(el=>el.hidden=true);
  try{const [catalog,markets]=await Promise.all([client.request('/api/catalog'),client.request('/api/markets')]);if(disposed||mine!==generation)return;
   prices.forEach(el=>{const result=homepagePriceState(catalog,markets,el.dataset.priceSku);el.textContent=result.text;el.dataset.state=result.state;});
  }catch{if(disposed||mine!==generation)return;prices.forEach(el=>{el.textContent='Kainos nepavyko patikrinti.';el.dataset.state='error';});retry.forEach(el=>el.hidden=false);}
 }
 retry.forEach(el=>el.addEventListener('click',refresh,{signal:abort.signal}));refresh();
 return()=>{disposed=true;generation++;abort.abort();ratings.forEach(el=>el.remove());};
}
