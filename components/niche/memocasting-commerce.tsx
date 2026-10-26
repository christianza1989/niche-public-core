'use client';
import {useEffect,useState} from 'react';
import {memoCartLines,memoSaveCart,memoCommerceClient} from './memocasting-native-checkout';
import {memoAvailableExtra,memoAvailableProduct,memoMarketCurrency} from '@/lib/memocasting-catalog-options.mjs';
import {memoSelectionTotal,memoStoreLabels,memoComparisonLabels} from '@/lib/memocasting-storefront.mjs';
import {resolveCatalogSelection,selectionKey} from '@/vendor/commerce-core/commerce-client.mjs';
import {memoProductForSku} from '@/lib/memocasting-products.mjs';
import s from './memocasting-site.module.css';
export type ProductImage={id:string;src:string;alt:string;width:number;height:number};
type CatalogProduct={sku:string;enabled:boolean;available:number;prices:Record<string,number>;addonFor?:string[];package:{weightGrams:number;dimensionsMm:number[]};content?:{images:Array<{id:string;src:string;alt:string;width:number;height:number}>};optionGroups?:Array<{id:string;label:string;defaultValue:string;values:Array<{id:string;label:string;enabled:boolean;prices:Record<string,number>;color?:string;imageId?:string}>}>};
const labels={
 lt:{included:'Balti dažai įeina į rinkinį.',wood:'Pridėti medinį pagrindą',preparing:' — pasirinkimas dar ruošiamas',quantity:'Kiekis',add:'Įdėti į krepšelį',limit:'Pasirinkite sveiką kiekį nuo 1 iki 100. Galutinį likutį ir sumą patikrins prekybos serveris.',storage:'Naršyklė neleidžia išsaugoti krepšelio. Įjunkite šio skirtuko saugyklą.'},
 pl:{included:'Biała farba jest wliczona w cenę zestawu.',wood:'Dodaj drewnianą podstawę',preparing:' — opcja jest przygotowywana',quantity:'Ilość',add:'Dodaj do koszyka',limit:'Wybierz liczbę całkowitą od 1 do 100. Ostateczną dostępność i kwotę sprawdzi serwer sklepu.',storage:'Przeglądarka nie pozwala zapisać koszyka. Włącz pamięć dla tej karty.'},
 lv:{included:'Balta krāsa ir iekļauta komplekta cenā.',wood:'Pievienot koka pamatni',preparing:' — iespēja tiek sagatavota',quantity:'Daudzums',add:'Pievienot grozam',limit:'Izvēlieties veselu skaitu no 1 līdz 100. Faktisko atlikumu un summu pārbaudīs veikala serveris.',storage:'Pārlūkprogramma neļauj saglabāt grozu. Iespējojiet šīs cilnes krātuvi.'},
 et:{included:'Valge värv kuulub komplekti hinna sisse.',wood:'Lisa puidust alus',preparing:' — valik on ettevalmistamisel',quantity:'Kogus',add:'Lisa ostukorvi',limit:'Valige täisarv vahemikus 1–100. Tegeliku laoseisu ja summa kontrollib poe server.',storage:'Brauser ei võimalda ostukorvi salvestada. Lubage selle vahelehe salvestusruum.'}
};
const availability={
 lt:{loading:'Tikriname prekės prieinamumą…',unavailable:'Šiuo metu šio rinkinio įsigyti negalima. Bandykite vėliau arba susisiekite su mumis.',retry:'Pakartoti patikrą',error:'Nepavyko patikrinti prekės prieinamumo. Pakartokite patikrą.',stock:'Pasirinktas kiekis viršija šiuo metu galimą likutį.'},
 pl:{loading:'Sprawdzamy dostępność produktu…',unavailable:'Ten zestaw jest obecnie niedostępny. Spróbuj później lub skontaktuj się z nami.',retry:'Sprawdź ponownie',error:'Nie udało się sprawdzić dostępności produktu. Spróbuj ponownie.',stock:'Wybrana ilość przekracza dostępny zapas.'},
 lv:{loading:'Pārbaudām preces pieejamību…',unavailable:'Šis komplekts pašlaik nav pieejams. Mēģiniet vēlāk vai sazinieties ar mums.',retry:'Pārbaudīt vēlreiz',error:'Neizdevās pārbaudīt preces pieejamību. Mēģiniet vēlreiz.',stock:'Izvēlētais daudzums pārsniedz pieejamo atlikumu.'},
 et:{loading:'Kontrollime toote saadavust…',unavailable:'See komplekt pole praegu saadaval. Proovige hiljem uuesti või võtke meiega ühendust.',retry:'Kontrolli uuesti',error:'Toote saadavust ei õnnestunud kontrollida. Proovige uuesti.',stock:'Valitud kogus ületab saadaoleva laovaru.'}
};
const priceLabels={lt:'Prekės kaina',pl:'Cena zestawu',lv:'Komplekta cena',et:'Komplekti hind'};
export function MemoAdd({sku,language='lt',country='LT',cartPath='/cart',onImageChange,onImagesChange}:{sku:string;language?:string;country?:string;cartPath?:string;onImageChange?:(id?:string)=>void;onImagesChange?:(images?:ProductImage[])=>void}){
 const text=labels[language as keyof typeof labels]??labels.lt;
 const stateText=availability[language as keyof typeof availability]??availability.lt;
 const storeText=memoStoreLabels[language as keyof typeof memoStoreLabels]??memoStoreLabels.lt;
 const optionsText=memoComparisonLabels[language as keyof typeof memoComparisonLabels]??memoComparisonLabels.lt;
 const [markets,setMarkets]=useState<unknown>(null);
 const [requestState,setLoadState]=useState<'loading'|'ready'|'error'>('loading'),[loadedCountry,setLoadedCountry]=useState(''),[retry,setRetry]=useState(0);
 const loadState=loadedCountry===country?requestState:'loading';
 const [catalog,setCatalog]=useState<CatalogProduct[]>([]),[currency,setCurrency]=useState(""),[wood,setWood]=useState(false),[qty,setQty]=useState(1),[error,setError]=useState('');
 const [choices,setChoices]=useState<Record<string,string>>({});
 useEffect(()=>{let cancelled=false;const client=memoCommerceClient();Promise.all([client.request('/api/catalog'),client.request('/api/markets')]).then(([items,markets])=>{if(!cancelled){setCatalog(items);setMarkets(markets);setCurrency(memoMarketCurrency(markets,country));setLoadedCountry(country);setWood(false);setChoices({});setLoadState('ready');}}).catch(()=>{if(!cancelled){setLoadedCountry(country);setLoadState('error');}});return()=>{cancelled=true;};},[country,retry]);
 const baseItem=loadState==='ready'&&currency?memoAvailableProduct(catalog,sku,country):null;
 const publishedItem=loadState==='ready'?catalog.find(p=>p.sku===sku):null,definition=memoProductForSku(sku);
 useEffect(()=>{onImagesChange?.(publishedItem?.content?.images);},[publishedItem,onImagesChange]);
 const woodItem=loadState==='ready'&&currency?memoAvailableExtra(catalog,'wooden_base',sku,country):null;
 const price=(item:{prices:Record<string,number>}|null)=>item?' (+'+new Intl.NumberFormat(language,{style:'currency',currency}).format(item.prices[country]/100)+')':text.preparing;
 let configured:{amount:number;image?:{id:string};labels:string[]}|null=null;
 try{if(baseItem)configured=resolveCatalogSelection(baseItem,country,choices);}catch{}
 const selectedImageId=configured?.image?.id;
 useEffect(()=>{onImageChange?.(selectedImageId);},[selectedImageId,onImageChange]);
 const originalTotal=loadState==='ready'?memoSelectionTotal(catalog,markets,sku,country,qty,[...(wood?['wooden_base']:[])]):null;
 const total=originalTotal&&configured?{...originalTotal,cents:originalTotal.cents+(configured.amount-baseItem.prices[country])*qty}:null;
 const optionGroups=(baseItem as CatalogProduct|null)?.optionGroups??[];
 const hasOptions=optionGroups.some(g=>g.values.some(v=>v.id===g.defaultValue&&Number.isSafeInteger(v.prices[country]))&&g.values.filter(v=>v.enabled&&Number.isSafeInteger(v.prices[country])).length>1)||(!optionGroups.some(g=>g.id==='base')&&!!woodItem);
 if(country==='LT'&&!baseItem&&definition?.state!=='active')return <div className={s.add}>
  {currency&&Number.isSafeInteger(publishedItem?.prices.LT)&&publishedItem!.prices.LT>0&&<p className={s.price}>{new Intl.NumberFormat(language,{style:'currency',currency}).format(publishedItem!.prices.LT/100)}</p>}
  <p className={s.priceStatus} role="status">{definition?.state==='soldout'?'Išparduota':'Dėl įsigijimo susisiekite'}</p>
  <p className={s.purchaseHint}>{definition?.state==='soldout'?'Šios prekės šiuo metu užsisakyti negalima. Dėl papildymo galite parašyti mums.':'Patikslinkite kainą, komplektaciją ir pristatymą prieš užsakydami.'}</p>
  <a className={s.button} href="/kontaktai">Susisiekti su Memocasting</a>
 </div>;
 return <form className={s.add} onSubmit={e=>{
  e.preventDefault();setError('');
  if(!Number.isInteger(qty)||qty<1||qty>100){setError(text.limit);return;}
  if(loadState!=='ready'||!baseItem){setError(stateText.unavailable);return;}
  try{
   if(!configured){setError(stateText.unavailable);return;}
   const finalChoices=Object.fromEntries(((baseItem as CatalogProduct).optionGroups??[]).filter(g=>g.values.some(v=>v.id===g.defaultValue&&Number.isSafeInteger(v.prices[country]))).map(g=>[g.id,choices[g.id]??g.defaultValue]));
   const selected=[{sku,quantity:qty,...(Object.keys(finalChoices).length?{choices:finalChoices}:{})},...(wood&&woodItem?[{sku:'wooden_base',quantity:qty}]:[])],lines=memoCartLines();
   for(const chosen of selected){const count=lines.filter(l=>l.sku===chosen.sku).reduce((n,l)=>n+l.quantity,0),item=catalog.find(p=>p.sku===chosen.sku);if(count+qty>100){setError(text.limit);return;}if(!item||count+qty>item.available){setError(stateText.stock);return;}}
   for(const chosen of selected){const line=lines.find(l=>selectionKey(l)===selectionKey(chosen));if(line)line.quantity+=qty;else lines.push(chosen);}
   memoSaveCart(lines);
   window.location.assign(cartPath);
  }catch{setError(text.storage);}
 }}>
  <div className={s.purchasePrice}>{baseItem?<><span>{priceLabels[language as keyof typeof priceLabels]??priceLabels.lt}</span><p className={s.price}>{new Intl.NumberFormat(language,{style:'currency',currency}).format((configured?.amount??baseItem.prices[country])/100)}</p></>:loadState==='loading'?<p className={s.priceStatus} role="status">{storeText.checking}</p>:null}</div>
  {['couple','family'].includes(sku)&&<p className={s.purchaseHint}>{country==='LT'&&(baseItem as CatalogProduct|null)?.optionGroups?.some(g=>g.id==='finish')?('Pasirinkta dažų spalva: '+(baseItem as CatalogProduct).optionGroups!.find(g=>g.id==='finish')!.values.find(v=>v.id===(choices.finish??(baseItem as CatalogProduct).optionGroups!.find(g=>g.id==='finish')!.defaultValue))?.label+'.'):text.included}</p>}
  {hasOptions&&<fieldset className={s.options}><legend>{optionsText.options}</legend>

  {(baseItem as CatalogProduct|null)?.optionGroups?.filter(g=>g.values.some(v=>v.id===g.defaultValue&&Number.isSafeInteger(v.prices[country]))&&g.values.filter(v=>v.enabled&&Number.isSafeInteger(v.prices[country])).length>1).map(g=><fieldset key={g.id} className={s.finishOptions}><legend>{g.label}</legend><div>{g.values.filter(v=>v.enabled&&Number.isSafeInteger(v.prices[country])).map(v=><label key={v.id} className={s.finishChoice} data-selected={(choices[g.id]??g.defaultValue)===v.id}><input type="radio" name={g.id} value={v.id} checked={(choices[g.id]??g.defaultValue)===v.id} disabled={!v.enabled||!Number.isSafeInteger(v.prices[country])} onChange={()=>{setChoices(c=>({...c,[g.id]:v.id}));setError('');}}/>{v.color&&<span aria-hidden="true" style={{background:v.color}}/>}{v.label}{v.prices[country]>0?' (+'+new Intl.NumberFormat(language,{style:'currency',currency}).format(v.prices[country]/100)+')':''}</label>)}</div></fieldset>)}
  {['couple','family'].includes(sku)&&!(baseItem as CatalogProduct|null)?.optionGroups?.some(g=>g.id==='base')&&<label className={s.check}><input type="checkbox" checked={wood} disabled={!woodItem} onChange={e=>setWood(e.target.checked)}/>{text.wood}{price(woodItem)}</label>}
  </fieldset>}
  <div className={s.purchaseActions}>
  <label>{text.quantity}<input type="number" min={1} max={100} step={1} value={qty} onChange={e=>{setQty(Number(e.target.value));setError('');}} required/></label>
  <button type="submit" disabled={loadState!=='ready'||!baseItem}>{text.add}</button>
  </div>
  {total&&<div className={s.selectionTotal} aria-live="polite"><span>{storeText.total}</span><strong>{new Intl.NumberFormat(language,{style:'currency',currency:total.currency}).format(total.cents/100)}</strong></div>}
  <p className={s.purchaseHint}>{storeText.shippingExtra}</p>
  {loadState==='error'&&<><p role="alert">{stateText.error}</p><button type="button" onClick={()=>{setLoadState('loading');setCatalog([]);setCurrency('');setMarkets(null);setWood(false);setError('');setRetry(n=>n+1);}}>{stateText.retry}</button></>}
  {loadState==='ready'&&!baseItem&&<p role="status">{stateText.unavailable}</p>}
  {error&&<p role="alert" className={s.error}>{error}</p>}
  <noscript><p>{storeText.noJs}</p></noscript>
  {total&&<div className={s.mobileBuyBar}><div><span>{storeText.total}</span><strong>{new Intl.NumberFormat(language,{style:'currency',currency:total.currency}).format(total.cents/100)}</strong></div><button type="submit" disabled={loadState!=='ready'||!baseItem}>{text.add}</button></div>}
 </form>;
}
