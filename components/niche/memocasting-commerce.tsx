'use client';
import {useEffect,useState} from 'react';
import {memoCartKey,memoCartLines,memoCommerceClient} from './memocasting-native-checkout';
import s from './memocasting-site.module.css';
const labels={
 lt:{paint:'Pridėti baltus dažus (+3 €)',preparing:' — pasirinkimas dar ruošiamas',quantity:'Kiekis',add:'Įdėti į krepšelį',limit:'Pasirinkite sveiką kiekį nuo 1 iki 10. Vienos prekės krepšelyje gali būti iki 10 vienetų.',storage:'Naršyklė neleidžia išsaugoti krepšelio. Įjunkite šio skirtuko saugyklą.'},
 pl:{paint:'Dodaj białą farbę (+3 €)',preparing:' — opcja jest przygotowywana',quantity:'Ilość',add:'Dodaj do koszyka',limit:'Wybierz liczbę całkowitą od 1 do 10. W koszyku może być najwyżej 10 sztuk jednego produktu.',storage:'Przeglądarka nie pozwala zapisać koszyka. Włącz pamięć dla tej karty.'},
 lv:{paint:'Pievienot baltu krāsu (+3 €)',preparing:' — iespēja tiek sagatavota',quantity:'Daudzums',add:'Pievienot grozam',limit:'Izvēlieties veselu skaitu no 1 līdz 10. Grozā drīkst būt ne vairāk kā 10 vienas preces vienības.',storage:'Pārlūkprogramma neļauj saglabāt grozu. Iespējojiet šīs cilnes krātuvi.'},
 et:{paint:'Lisa valge värv (+3 €)',preparing:' — valik on ettevalmistamisel',quantity:'Kogus',add:'Lisa ostukorvi',limit:'Valige täisarv vahemikus 1–10. Ostukorvis võib olla kuni 10 ühikut sama toodet.',storage:'Brauser ei võimalda ostukorvi salvestada. Lubage selle vahelehe salvestusruum.'}
};
export function MemoAdd({sku,paint=false,language='lt',cartPath='/cart'}:{sku:string;paint?:boolean;language?:string;cartPath?:string}){
 const text=labels[language as keyof typeof labels]??labels.lt;
 const [paintAvailable,setPaintAvailable]=useState(false),[white,setWhite]=useState(false),[qty,setQty]=useState(1),[error,setError]=useState('');
 useEffect(()=>{let cancelled=false;memoCommerceClient().request('/api/catalog').then((items:{sku:string}[])=>{if(!cancelled)setPaintAvailable(items.some(p=>p.sku==='couple_white'));}).catch(()=>{});return()=>{cancelled=true;};},[]);
 return <form className={s.add} onSubmit={e=>{
  e.preventDefault();setError('');
  if(!Number.isInteger(qty)||qty<1||qty>10){setError(text.limit);return;}
  try{
   const selected=white&&paintAvailable?'couple_white':sku,lines=memoCartLines(),line=lines.find(l=>l.sku===selected);
   if(line&&line.quantity+qty>10){setError(text.limit);return;}
   if(line)line.quantity+=qty;else lines.push({sku:selected,quantity:qty});
   sessionStorage.setItem(memoCartKey,JSON.stringify(lines));
   if(sessionStorage.getItem(memoCartKey)!==JSON.stringify(lines))throw Error('cart_storage_unavailable');
   window.location.assign(cartPath);
  }catch{setError(text.storage);}
 }}>
  {paint&&<label className={s.check}><input type="checkbox" checked={white} disabled={!paintAvailable} onChange={e=>setWhite(e.target.checked)}/>{text.paint}{!paintAvailable&&<span>{text.preparing}</span>}</label>}
  <label>{text.quantity}<input type="number" min={1} max={10} step={1} value={qty} onChange={e=>setQty(Number(e.target.value))} required/></label>
  <button type="submit">{text.add}</button><p role="alert">{error}</p>
 </form>;
}
