'use client';
import {useEffect,useRef} from 'react';
import {CommerceClient} from '@/vendor/commerce-core/commerce-client.mjs';
import {mountCheckout} from '@/vendor/commerce-core/checkout-ui.mjs';
import s from './memocasting-site.module.css';

export const memoCartKey='memo_cart_v1';
export function memoCartLines(){try{const lines=JSON.parse(sessionStorage.getItem(memoCartKey)||'[]');return Array.isArray(lines)?lines.filter(l=>['couple','couple_white','family'].includes(l.sku)&&Number.isInteger(l.quantity)&&l.quantity>0&&l.quantity<=100):[];}catch{return [];}}
export function memoCommerceClient(){return new CommerceClient({fetchImpl:(path:string,init?:RequestInit)=>{if(!path.startsWith('/api/'))throw Error('invalid_api_route');return fetch('/prekyba/'+path.slice(5),init);}});}
const loading={lt:'Kraunama prekybos informacija…',pl:'Ładowanie informacji o zamówieniu…',lv:'Tiek ielādēta pasūtījuma informācija…',et:'Tellimuse andmeid laaditakse…'};
const unavailable={lt:'Prekybos ryšys šiuo metu nepasiekiamas. Bandykite dar kartą. Ankstesnis užsakymas šiuo pranešimu neatšaukiamas.',pl:'Połączenie ze sklepem jest obecnie niedostępne. Spróbuj ponownie. Ten komunikat nie anuluje wcześniejszego zamówienia.',lv:'Savienojums ar veikalu pašlaik nav pieejams. Mēģiniet vēlreiz. Šis paziņojums neatceļ iepriekšējo pasūtījumu.',et:'Ühendus poega pole praegu saadaval. Proovige uuesti. See teade ei tühista varasemat tellimust.'};
export function MemoNativeCheckout({title,description,language='lt',country='LT',termsUrl='/naudojimo-salygos'}:{title:string;description:string;language?:string;country?:string;termsUrl?:string}){
 const root=useRef<HTMLDivElement>(null),lang=(['lt','pl','lv','et'].includes(language)?language:'lt') as keyof typeof loading;
 useEffect(()=>{let disposed=false;const target=root.current;if(!target)return;const client=memoCommerceClient();
  // The shared UI owns validation, prices, credentials and order recovery.
  // Caller only supplies same-origin transport, presentation and existing cart lines.
  // The JS module infers its empty-array default as never[]; lines are validated above.
  mountCheckout(target,{language:lang,country,client,termsUrl,initialLines:memoCartLines() as never[],title,headingLevel:1,productTitle:(product:{sku:string;title:string})=>memoProductTitle(product,lang)} as Parameters<typeof mountCheckout>[1]).catch(()=>{if(disposed)return;target.replaceChildren();const h=document.createElement('h1');h.textContent=title;const p=document.createElement('p');p.setAttribute('role','alert');p.textContent=unavailable[lang];target.appendChild(h);target.appendChild(p);});
  return()=>{disposed=true;};
 },[title,lang,country,termsUrl]);
 return <section className={s.commerce}><div ref={root}><h1>{title}</h1><p>{description}</p><p role="status">{loading[lang]}</p></div></section>;
}
const productTitles:Record<string,Record<string,string>>={
 lt:{couple:'Rankų liejimo rinkinys porai',couple_white:'Rankų liejimo rinkinys porai su baltais dažais',family:'Rankų liejimo rinkinys šeimai'},
 pl:{couple:'Zestaw do odlewu dłoni dla pary',couple_white:'Zestaw do odlewu dłoni dla pary z białą farbą',family:'Zestaw do odlewu dłoni dla rodziny'},
 lv:{couple:'Roku atlējuma komplekts pārim',couple_white:'Roku atlējuma komplekts pārim ar baltu krāsu',family:'Roku atlējuma komplekts ģimenei'},
 et:{couple:'Käte valamise komplekt paarile',couple_white:'Käte valamise komplekt paarile valge värviga',family:'Käte valamise komplekt perele'}
};
export function memoProductTitle(product:{sku:string;title:string},language:string){return productTitles[language]?.[product.sku]??product.title;}
