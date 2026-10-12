'use client';
import {useEffect,useState} from 'react';
import {memoCartKey,memoCartLines,memoCommerceClient} from './memocasting-native-checkout';
import {memoAvailableExtra} from '@/lib/memocasting-catalog-options.mjs';
import s from './memocasting-site.module.css';
const labels={
 lt:{paint:'Pridėti baltus dažus',wood:'Pridėti medinį pagrindą',preparing:' — pasirinkimas dar ruošiamas',quantity:'Kiekis',add:'Įdėti į krepšelį',limit:'Pasirinkite sveiką kiekį nuo 1 iki 100. Galutinį likutį ir sumą patikrins prekybos serveris.',storage:'Naršyklė neleidžia išsaugoti krepšelio. Įjunkite šio skirtuko saugyklą.'},
 pl:{paint:'Dodaj białą farbę',wood:'Dodaj drewnianą podstawę',preparing:' — opcja jest przygotowywana',quantity:'Ilość',add:'Dodaj do koszyka',limit:'Wybierz liczbę całkowitą od 1 do 100. Ostateczną dostępność i kwotę sprawdzi serwer sklepu.',storage:'Przeglądarka nie pozwala zapisać koszyka. Włącz pamięć dla tej karty.'},
 lv:{paint:'Pievienot baltu krāsu',wood:'Pievienot koka pamatni',preparing:' — iespēja tiek sagatavota',quantity:'Daudzums',add:'Pievienot grozam',limit:'Izvēlieties veselu skaitu no 1 līdz 100. Faktisko atlikumu un summu pārbaudīs veikala serveris.',storage:'Pārlūkprogramma neļauj saglabāt grozu. Iespējojiet šīs cilnes krātuvi.'},
 et:{paint:'Lisa valge värv',wood:'Lisa puidust alus',preparing:' — valik on ettevalmistamisel',quantity:'Kogus',add:'Lisa ostukorvi',limit:'Valige täisarv vahemikus 1–100. Tegeliku laoseisu ja summa kontrollib poe server.',storage:'Brauser ei võimalda ostukorvi salvestada. Lubage selle vahelehe salvestusruum.'}
};
export function MemoAdd({sku,paint=false,language='lt',country='LT',cartPath='/cart'}:{sku:string;paint?:boolean;language?:string;country?:string;cartPath?:string}){
 const text=labels[language as keyof typeof labels]??labels.lt;
 const [catalog,setCatalog]=useState<Array<{sku:string;enabled:boolean;available:number;prices:Record<string,number>;addonFor?:string[];package:{weightGrams:number;dimensionsMm:number[]}}>>([]),[currency,setCurrency]=useState(""),[wood,setWood]=useState(false),[white,setWhite]=useState(false),[qty,setQty]=useState(1),[error,setError]=useState('');
 useEffect(()=>{let cancelled=false;const client=memoCommerceClient();Promise.all([client.request('/api/catalog'),client.request('/api/markets')]).then(([items,markets])=>{if(!cancelled){setCatalog(items);setCurrency(markets.find((m:{country:string;currency:string})=>m.country===country)?.currency??'');}}).catch(()=>{});return()=>{cancelled=true;};},[country]);
 const paintItem=currency&&paint?memoAvailableExtra(catalog,'white_paint',sku,country):null,woodItem=currency?memoAvailableExtra(catalog,'wooden_base',sku,country):null;
 const price=(item:{prices:Record<string,number>}|null)=>item?' (+'+new Intl.NumberFormat(language,{style:'currency',currency}).format(item.prices[country]/100)+')':text.preparing;
 return <form className={s.add} onSubmit={e=>{
  e.preventDefault();setError('');
  if(!Number.isInteger(qty)||qty<1||qty>100){setError(text.limit);return;}
  try{
   const selected=[sku,...(white&&paintItem?['white_paint']:[]),...(wood&&woodItem?['wooden_base']:[])],lines=memoCartLines();
   for(const selectedSku of selected){const line=lines.find(l=>l.sku===selectedSku);if((line?.quantity??0)+qty>100){setError(text.limit);return;}}
   for(const selectedSku of selected){const line=lines.find(l=>l.sku===selectedSku);if(line)line.quantity+=qty;else lines.push({sku:selectedSku,quantity:qty});}
   sessionStorage.setItem(memoCartKey,JSON.stringify(lines));
   if(sessionStorage.getItem(memoCartKey)!==JSON.stringify(lines))throw Error('cart_storage_unavailable');
   window.location.assign(cartPath);
  }catch{setError(text.storage);}
 }}>
  {paint&&<label className={s.check}><input type="checkbox" checked={white} disabled={!paintItem} onChange={e=>setWhite(e.target.checked)}/>{text.paint}{price(paintItem)}</label>}
  <label className={s.check}><input type="checkbox" checked={wood} disabled={!woodItem} onChange={e=>setWood(e.target.checked)}/>{text.wood}{price(woodItem)}</label>
  <label>{text.quantity}<input type="number" min={1} max={100} step={1} value={qty} onChange={e=>setQty(Number(e.target.value))} required/></label>
  <button type="submit">{text.add}</button><p role="alert">{error}</p>
 </form>;
}
