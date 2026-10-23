'use client';
import {useEffect,useState} from 'react';
import {memoCommerceClient} from './memocasting-native-checkout';
import {memoAvailableProduct,memoMarketCurrency} from '@/lib/memocasting-catalog-options.mjs';
import {memoStoreLabels} from '@/lib/memocasting-storefront.mjs';
import {memoProductForSku} from '@/lib/memocasting-products.mjs';
import s from './memocasting-site.module.css';
export function MemoCataloguePrice({sku,country,language}:{sku:string;country:string;language:string}){
 const text=memoStoreLabels[language as keyof typeof memoStoreLabels]??memoStoreLabels.lt;
 const requestKey=sku+':'+country+':'+language;
 const [data,setData]=useState<{key:string;state:'loading'|'ready'|'error';price:string}>({key:'',state:'loading',price:''}),[retry,setRetry]=useState(0);
 const state=data.key===requestKey?data.state:'loading',price=data.key===requestKey?data.price:'';
 useEffect(()=>{let disposed=false;const client=memoCommerceClient();
  Promise.all([client.request('/api/catalog'),client.request('/api/markets')]).then(([catalog,markets])=>{if(disposed)return;const item=memoAvailableProduct(catalog,sku,country),currency=memoMarketCurrency(markets,country),definition=memoProductForSku(sku),raw=Array.isArray(catalog)?catalog.find(p=>p.sku===sku):null;
   const soldout=country==='LT'&&definition?.state==='soldout',amount=(item??(soldout?raw:null))?.prices?.[country],formatted=currency&&Number.isSafeInteger(amount)&&amount>0?new Intl.NumberFormat(language,{style:'currency',currency}).format(amount/100):'';
   setData({key:requestKey,state:'ready',price:item?formatted:soldout?[formatted,'Išparduota'].filter(Boolean).join(' · '):country==='LT'&&definition?.state==='inquiry'?'Dėl įsigijimo susisiekite':''});}).catch(()=>{if(!disposed)setData({key:requestKey,state:'error',price:''});});return()=>{disposed=true;};
 },[sku,country,language,retry,requestKey]);
 return <div className={s.catalogPrice}><p aria-live="polite" className={price?s.price:s.priceStatus}>{state==='loading'?text.checking:state==='error'?text.catalogError:price||text.unavailable}</p>{state==='error'&&<button type="button" className={s.textButton} onClick={()=>{setData({key:requestKey,state:'loading',price:''});setRetry(n=>n+1);}}>{text.retry}</button>}</div>;
}
