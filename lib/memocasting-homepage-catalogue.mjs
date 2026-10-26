import {memoAvailableProduct,memoMarketCurrency} from './memocasting-catalog-options.mjs';
import {memoReviewStarPath} from './memocasting-reviews.mjs';
export function homepagePriceState(catalog,markets,sku){
 const currency=memoMarketCurrency(markets,'LT'),item=memoAvailableProduct(catalog,sku,'LT');
 if(!currency||!item)return {state:'unavailable',text:'Prieinamumą tikrinkite produkto puslapyje.'};
 return {state:'ready',text:new Intl.NumberFormat('lt-LT',{style:'currency',currency}).format(item.prices.LT/100)};
}
// Same native CommerceClient as product/cart; never a parallel price source.
export function mountHomepageCatalogue(root,client){
 let disposed=false,generation=0;
 const abort=new AbortController(),prices=[...root.querySelectorAll('[data-price-sku]')],retry=[...root.querySelectorAll('[data-price-retry]')],ratings=[];
 client.request('/api/reviews').then(data=>{
  if(disposed||!Array.isArray(data?.stats))return;
  for(const slot of root.querySelectorAll('[data-rating-sku]')){
   const sku=slot.dataset.ratingSku,stat=data.stats.find(s=>s.sku===sku);
   if(!['couple','family'].includes(sku)||!stat||!Number.isSafeInteger(stat.count)||stat.count<1||!Number.isFinite(stat.average)||stat.average<1||stat.average>5)continue;
   const link=document.createElement('a'),value=document.createElement('span'),ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),defs=document.createElementNS(ns,'defs'),clip=document.createElementNS(ns,'clipPath'),group=document.createElementNS(ns,'g'),base=document.createElementNS(ns,'rect'),fill=document.createElementNS(ns,'rect'),id='memo-product-stars-'+sku;
   svg.setAttribute('viewBox','0 0 120 24');svg.setAttribute('aria-hidden','true');svg.classList.add('memo-rating-stars');clip.setAttribute('id',id);
   for(let i=0;i<5;i++){const path=document.createElementNS(ns,'path');path.setAttribute('d',memoReviewStarPath);path.setAttribute('transform','translate('+i*24+' 0)');clip.append(path);}
   defs.append(clip);base.setAttribute('width','120');base.setAttribute('height','24');base.setAttribute('fill','#ded5d1');fill.setAttribute('width',String(stat.average*24));fill.setAttribute('height','24');fill.setAttribute('fill','currentColor');group.setAttribute('clip-path','url(#'+id+')');group.append(base,fill);svg.append(defs,group);
   const average=stat.average.toLocaleString('lt-LT',{maximumFractionDigits:2});link.href=(sku==='couple'?'/rinkinys-porai':'/seimos-rinkinys')+'#atsiliepimai';link.className='memo-home-rating';link.setAttribute('aria-label','Įvertinimas '+average+' iš 5. Įvertinimų: '+stat.count+'. Peržiūrėti atsiliepimus.');value.textContent=average+'/5 ('+stat.count+')';link.append(svg,value);slot.append(link);ratings.push(link);
  }
 }).catch(()=>{});
 async function refresh(){const mine=++generation;prices.forEach(el=>{el.textContent='Kainą tikriname…';el.dataset.state='loading';});retry.forEach(el=>el.hidden=true);
  try{const [catalog,markets]=await Promise.all([client.request('/api/catalog'),client.request('/api/markets')]);if(disposed||mine!==generation)return;
   prices.forEach(el=>{const result=homepagePriceState(catalog,markets,el.dataset.priceSku);el.textContent=result.text;el.dataset.state=result.state;});
  }catch{if(disposed||mine!==generation)return;prices.forEach(el=>{el.textContent='Kainos nepavyko patikrinti.';el.dataset.state='error';});retry.forEach(el=>el.hidden=false);}
 }
 retry.forEach(el=>el.addEventListener('click',refresh,{signal:abort.signal}));refresh();
 return()=>{disposed=true;generation++;abort.abort();ratings.forEach(el=>el.remove());};
}
