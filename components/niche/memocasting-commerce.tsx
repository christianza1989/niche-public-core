'use client';
import {useEffect,useState} from 'react';
import {memoCartLines,memoSaveCart,memoCommerceClient} from './memocasting-native-checkout';
import {memoAvailableExtra,memoAvailableProduct,memoMarketCurrency} from '@/lib/memocasting-catalog-options.mjs';
import {memoSelectionTotal,memoStoreLabels,memoComparisonLabels} from '@/lib/memocasting-storefront.mjs';
import s from './memocasting-site.module.css';
const labels={
 lt:{paint:'Pridėti baltus dažus',wood:'Pridėti medinį pagrindą',preparing:' — pasirinkimas dar ruošiamas',quantity:'Kiekis',add:'Įdėti į krepšelį',limit:'Pasirinkite sveiką kiekį nuo 1 iki 100. Galutinį likutį ir sumą patikrins prekybos serveris.',storage:'Naršyklė neleidžia išsaugoti krepšelio. Įjunkite šio skirtuko saugyklą.'},
 pl:{paint:'Dodaj białą farbę',wood:'Dodaj drewnianą podstawę',preparing:' — opcja jest przygotowywana',quantity:'Ilość',add:'Dodaj do koszyka',limit:'Wybierz liczbę całkowitą od 1 do 100. Ostateczną dostępność i kwotę sprawdzi serwer sklepu.',storage:'Przeglądarka nie pozwala zapisać koszyka. Włącz pamięć dla tej karty.'},
 lv:{paint:'Pievienot baltu krāsu',wood:'Pievienot koka pamatni',preparing:' — iespēja tiek sagatavota',quantity:'Daudzums',add:'Pievienot grozam',limit:'Izvēlieties veselu skaitu no 1 līdz 100. Faktisko atlikumu un summu pārbaudīs veikala serveris.',storage:'Pārlūkprogramma neļauj saglabāt grozu. Iespējojiet šīs cilnes krātuvi.'},
 et:{paint:'Lisa valge värv',wood:'Lisa puidust alus',preparing:' — valik on ettevalmistamisel',quantity:'Kogus',add:'Lisa ostukorvi',limit:'Valige täisarv vahemikus 1–100. Tegeliku laoseisu ja summa kontrollib poe server.',storage:'Brauser ei võimalda ostukorvi salvestada. Lubage selle vahelehe salvestusruum.'}
};
const availability={
 lt:{loading:'Tikriname prekės prieinamumą…',unavailable:'Šiuo metu šio rinkinio įsigyti negalima. Bandykite vėliau arba susisiekite su mumis.',retry:'Pakartoti patikrą',error:'Nepavyko patikrinti prekės prieinamumo. Pakartokite patikrą.',stock:'Pasirinktas kiekis viršija šiuo metu galimą likutį.'},
 pl:{loading:'Sprawdzamy dostępność produktu…',unavailable:'Ten zestaw jest obecnie niedostępny. Spróbuj później lub skontaktuj się z nami.',retry:'Sprawdź ponownie',error:'Nie udało się sprawdzić dostępności produktu. Spróbuj ponownie.',stock:'Wybrana ilość przekracza dostępny zapas.'},
 lv:{loading:'Pārbaudām preces pieejamību…',unavailable:'Šis komplekts pašlaik nav pieejams. Mēģiniet vēlāk vai sazinieties ar mums.',retry:'Pārbaudīt vēlreiz',error:'Neizdevās pārbaudīt preces pieejamību. Mēģiniet vēlreiz.',stock:'Izvēlētais daudzums pārsniedz pieejamo atlikumu.'},
 et:{loading:'Kontrollime toote saadavust…',unavailable:'See komplekt pole praegu saadaval. Proovige hiljem uuesti või võtke meiega ühendust.',retry:'Kontrolli uuesti',error:'Toote saadavust ei õnnestunud kontrollida. Proovige uuesti.',stock:'Valitud kogus ületab saadaoleva laovaru.'}
};
const priceLabels={lt:'Rinkinio kaina',pl:'Cena zestawu',lv:'Komplekta cena',et:'Komplekti hind'};
export function MemoAdd({sku,paint=false,language='lt',country='LT',cartPath='/cart'}:{sku:string;paint?:boolean;language?:string;country?:string;cartPath?:string}){
 const text=labels[language as keyof typeof labels]??labels.lt;
 const stateText=availability[language as keyof typeof availability]??availability.lt;
 const storeText=memoStoreLabels[language as keyof typeof memoStoreLabels]??memoStoreLabels.lt;
 const optionsText=memoComparisonLabels[language as keyof typeof memoComparisonLabels]??memoComparisonLabels.lt;
 const [markets,setMarkets]=useState<unknown>(null);
 const [requestState,setLoadState]=useState<'loading'|'ready'|'error'>('loading'),[loadedCountry,setLoadedCountry]=useState(''),[retry,setRetry]=useState(0);
 const loadState=loadedCountry===country?requestState:'loading';
 const [catalog,setCatalog]=useState<Array<{sku:string;enabled:boolean;available:number;prices:Record<string,number>;addonFor?:string[];package:{weightGrams:number;dimensionsMm:number[]}}>>([]),[currency,setCurrency]=useState(""),[wood,setWood]=useState(false),[white,setWhite]=useState(false),[qty,setQty]=useState(1),[error,setError]=useState('');
 useEffect(()=>{let cancelled=false;const client=memoCommerceClient();Promise.all([client.request('/api/catalog'),client.request('/api/markets')]).then(([items,markets])=>{if(!cancelled){setCatalog(items);setMarkets(markets);setCurrency(memoMarketCurrency(markets,country));setLoadedCountry(country);setWhite(false);setWood(false);setLoadState('ready');}}).catch(()=>{if(!cancelled){setLoadedCountry(country);setLoadState('error');}});return()=>{cancelled=true;};},[country,retry]);
 const baseItem=loadState==='ready'&&currency?memoAvailableProduct(catalog,sku,country):null;
 const paintItem=loadState==='ready'&&currency&&paint?memoAvailableExtra(catalog,'white_paint',sku,country):null,woodItem=loadState==='ready'&&currency?memoAvailableExtra(catalog,'wooden_base',sku,country):null;
 const price=(item:{prices:Record<string,number>}|null)=>item?' (+'+new Intl.NumberFormat(language,{style:'currency',currency}).format(item.prices[country]/100)+')':text.preparing;
 const total=loadState==='ready'?memoSelectionTotal(catalog,markets,sku,country,qty,[...(white?['white_paint']:[]),...(wood?['wooden_base']:[])]):null;
 return <form className={s.add} onSubmit={e=>{
  e.preventDefault();setError('');
  if(!Number.isInteger(qty)||qty<1||qty>100){setError(text.limit);return;}
  if(loadState!=='ready'||!baseItem){setError(stateText.unavailable);return;}
  try{
   const selected=[sku,...(white&&paintItem?['white_paint']:[]),...(wood&&woodItem?['wooden_base']:[])],lines=memoCartLines();
   for(const selectedSku of selected){const line=lines.find(l=>l.sku===selectedSku);if((line?.quantity??0)+qty>100){setError(text.limit);return;}}
   for(const selectedSku of selected){const item=catalog.find(p=>p?.sku===selectedSku),line=lines.find(l=>l.sku===selectedSku);if(!item||(line?.quantity??0)+qty>item.available){setError(stateText.stock);return;}}
   for(const selectedSku of selected){const line=lines.find(l=>l.sku===selectedSku);if(line)line.quantity+=qty;else lines.push({sku:selectedSku,quantity:qty});}
   memoSaveCart(lines);
   window.location.assign(cartPath);
  }catch{setError(text.storage);}
 }}>
  <div className={s.purchasePrice}>{baseItem?<><span>{priceLabels[language as keyof typeof priceLabels]??priceLabels.lt}</span><p className={s.price}>{new Intl.NumberFormat(language,{style:'currency',currency}).format(baseItem.prices[country]/100)}</p></>:loadState==='loading'?<p className={s.priceStatus} role="status">{storeText.checking}</p>:null}</div>
  <fieldset className={s.options}><legend>{optionsText.options}</legend>
  {paint&&<label className={s.check}><input type="checkbox" checked={white} disabled={!paintItem} onChange={e=>setWhite(e.target.checked)}/>{text.paint}{price(paintItem)}</label>}
  <label className={s.check}><input type="checkbox" checked={wood} disabled={!woodItem} onChange={e=>setWood(e.target.checked)}/>{text.wood}{price(woodItem)}</label>
  </fieldset>
  <div className={s.purchaseActions}>
  <label>{text.quantity}<input type="number" min={1} max={100} step={1} value={qty} onChange={e=>{setQty(Number(e.target.value));setError('');}} required/></label>
  <button type="submit" disabled={loadState!=='ready'||!baseItem}>{text.add}</button>
  </div>
  {total&&<div className={s.selectionTotal} aria-live="polite"><span>{storeText.total}</span><strong>{new Intl.NumberFormat(language,{style:'currency',currency:total.currency}).format(total.cents/100)}</strong></div>}
  <p className={s.purchaseHint}>{storeText.shippingExtra}</p>
  {loadState==='error'&&<><p role="alert">{stateText.error}</p><button type="button" onClick={()=>{setLoadState('loading');setCatalog([]);setCurrency('');setMarkets(null);setWhite(false);setWood(false);setError('');setRetry(n=>n+1);}}>{stateText.retry}</button></>}
  {loadState==='ready'&&!baseItem&&<p role="status">{stateText.unavailable}</p>}
  {error&&<p role="alert" className={s.error}>{error}</p>}
  <noscript><p>{storeText.noJs}</p></noscript>
  {total&&<div className={s.mobileBuyBar}><div><span>{storeText.total}</span><strong>{new Intl.NumberFormat(language,{style:'currency',currency:total.currency}).format(total.cents/100)}</strong></div><button type="submit" disabled={loadState!=='ready'||!baseItem}>{text.add}</button></div>}
 </form>;
}
