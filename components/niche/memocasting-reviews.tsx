'use client';
/* eslint-disable @next/next/no-img-element -- Moderated native customer WebP media. */
import {useEffect,useId,useRef,useState} from 'react';
import {memoReviewStarPath} from '@/lib/memocasting-reviews.mjs';

export type MemoReview={id:string;sku:string;authorName:string;rating:number;title:string;body:string;date:string;verifiedPurchase:boolean;legacyImported?:boolean;schemaEligible?:boolean;photos:Array<{id:string;src:string;width:number;height:number}>};
export type MemoReviewData={items:MemoReview[];total:number;stats:{count:number;average:number;directCount?:number;directAverage?:number|null}|null};

function Stars({value}:{value:number}){
 const id='memo-stars-'+useId().replace(/[^a-zA-Z0-9_-]/g,'');
 return <svg className="memo-rating-stars" viewBox="0 0 120 24" aria-hidden="true"><defs><clipPath id={id}>{[0,1,2,3,4].map(i=><path key={i} d={memoReviewStarPath} transform={'translate('+i*24+' 0)'}/>)}</clipPath></defs><g clipPath={'url(#'+id+')'}><rect width="120" height="24" fill="#ded5d1"/><rect width={Math.max(0,Math.min(5,value))*24} height="24" fill="currentColor"/></g></svg>;
}
export function MemoRating({average,count}:{average:number;count:number}){
 return <span className="memo-rating"><Stars value={average}/><span>{average.toLocaleString('lt-LT',{maximumFractionDigits:2})}/5 <span className="memo-rating-count">· Įvertinimų: {count}</span></span></span>;
}
function Photo({photo,author,index}:{photo:MemoReview['photos'][number];author:string;index:number}){
 return <a href={photo.src} target="_blank" rel="noopener noreferrer" aria-label={'Atverti '+author+' nuotrauką '+index}><img src={photo.src} alt={'Pirkėjo '+author+' pridėta liejinio nuotrauka'} width={photo.width} height={photo.height} loading="lazy"/></a>;
}
function Item({review,showProduct}:{review:MemoReview;showProduct:boolean}){
 const long=Array.from(review.body).length>180,excerpt=long?Array.from(review.body).slice(0,160).join('').replace(/\s+\S*$/,'')+'…':review.body;
 return <article className="memo-review-item">
  <div className="memo-review-score"><Stars value={review.rating}/><span>{review.rating}/5</span></div>
  {review.title&&<h3>{review.title}</h3>}
  {excerpt&&<p className="memo-review-excerpt">{excerpt}</p>}
  {review.photos.length>0&&<div className="memo-review-photos">{review.photos.slice(0,3).map((photo,i)=><Photo key={photo.id} photo={photo} author={review.authorName} index={i+1}/>)}</div>}
  {(long||review.photos.length>3)&&<details className="memo-review-full"><summary>{long?'Skaityti visą atsiliepimą':'Visos nuotraukos'}</summary>{long&&<p>{review.body}</p>}{review.photos.length>3&&<div className="memo-review-photos">{review.photos.slice(3).map((photo,i)=><Photo key={photo.id} photo={photo} author={review.authorName} index={i+4}/>)}</div>}</details>}
  <footer className="memo-review-author"><div><strong>{review.authorName}</strong><time dateTime={review.date}>{new Intl.DateTimeFormat('lt-LT',{dateStyle:'medium',timeZone:'Europe/Vilnius'}).format(new Date(review.date))}</time></div>{review.verifiedPurchase?<span className="memo-review-verified">Patvirtintas pirkėjas</span>:review.legacyImported?<span className="memo-review-verified">Istorinis atsiliepimas</span>:null}{showProduct&&<a href={(review.sku==='couple'?'/rinkinys-porai':'/seimos-rinkinys')+'#atsiliepimai'}>{review.sku==='couple'?'Rinkinys porai':'Šeimos rinkinys'}</a>}</footer>
 </article>;
}
function Arrow({direction}:{direction:'previous'|'next'}){
 return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={direction==='previous'?'M19 12H5m6-6-6 6 6 6':'M5 12h14m-6-6 6 6-6 6'}/></svg>;
}
function Carousel({items,showProduct=false}:{items:MemoReview[];showProduct?:boolean}){
 const track=useRef<HTMLDivElement>(null),id=useId(),[edges,setEdges]=useState({previous:false,next:items.length>1});
 useEffect(()=>{
  const el=track.current;if(!el)return;
  const measure=()=>setEdges({previous:el.scrollLeft>4,next:el.scrollLeft+el.clientWidth<el.scrollWidth-4});
  measure();el.addEventListener('scroll',measure,{passive:true});window.addEventListener('resize',measure);const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(measure);observer?.observe(el);
  return()=>{el.removeEventListener('scroll',measure);window.removeEventListener('resize',measure);observer?.disconnect();};
 },[items.length]);
 function move(direction:-1|1){const el=track.current;if(!el)return;const first=el.querySelector<HTMLElement>('.memo-review-item'),gap=parseFloat(getComputedStyle(el).gap)||0,step=(first?.getBoundingClientRect().width||el.clientWidth)+gap,reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches||!!el.closest('.motion-off');el.scrollBy({left:step*direction,behavior:reduced?'auto':'smooth'});}
 return <div className="memo-review-carousel" role="region" aria-roledescription="karuselė" aria-label="Pirkėjų atsiliepimai">
  <div className="memo-review-navigation"><span>Braukite arba naudokite rodykles</span><div><button className="memo-review-arrow" type="button" aria-label="Ankstesnis atsiliepimas" aria-controls={id} disabled={!edges.previous} onClick={()=>move(-1)}><Arrow direction="previous"/></button><button className="memo-review-arrow" type="button" aria-label="Kitas atsiliepimas" aria-controls={id} disabled={!edges.next} onClick={()=>move(1)}><Arrow direction="next"/></button></div></div>
  <div className="memo-reviews-track" id={id} ref={track} tabIndex={0} aria-label="Atsiliepimų kortelės" onKeyDown={event=>{if(event.target!==event.currentTarget)return;if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();move(event.key==='ArrowRight'?1:-1);}}}>{items.map(review=><Item key={review.id} review={review} showProduct={showProduct}/>)}</div>
 </div>;
}
export function MemoProductReviews({sku,initial,instruction}:{sku:string;initial:MemoReviewData|null;instruction:{href:string;label:string}|null}){
 const [items,setItems]=useState(initial?.items||[]),[page,setPage]=useState(1),[busy,setBusy]=useState(false),[failed,setFailed]=useState(false);
 async function more(){setBusy(true);setFailed(false);try{const response=await fetch('/prekyba/reviews?sku='+encodeURIComponent(sku)+'&page='+(page+1),{cache:'no-store'});if(!response.ok)throw Error('review_fetch');const data=await response.json() as {items?:MemoReview[]};if(!Array.isArray(data.items))throw Error('review_fetch');const next=data.items;setItems(previous=>[...previous,...next.filter(r=>!previous.some(p=>p.id===r.id))]);setPage(page+1);}catch{setFailed(true);}finally{setBusy(false);}}
 return <section className="memo-reviews" id="atsiliepimai" aria-labelledby="memo-reviews-title">
  <div className="memo-reviews-head"><div><h2 id="memo-reviews-title">Pirkėjų atsiliepimai</h2>{initial?.stats?<MemoRating {...initial.stats}/>:<p>Pasidalykite savo patirtimi ir padėkite kitiems išsirinkti.</p>}</div><a href="/atsiliepimas">Palikti atsiliepimą</a></div>
  {initial?.stats?.directCount&&initial.stats.directCount!==initial.stats.count?<p className="memo-review-hint">Šioje svetainėje surinkti įvertinimai: {String(initial.stats.directAverage).replace('.',',')} / 5 ({initial.stats.directCount}). Į šią suvestinę įtraukti tik tiesiogiai šioje parduotuvėje surinkti įvertinimai.</p>:null}
  <p className="memo-review-hint">Žyma „Patvirtintas pirkėjas“ reiškia, kad pirkimas susietas su apmokėtu užsakymu arba jo patvirtinimas perkeltas iš ankstesnės mūsų parduotuvės. Vienodai peržiūrime ir teigiamas, ir kritiškas patirtis.</p>
  <p className="memo-review-hint">Atsiliepimuose nurodyta liejimo trukmė ir medžiagų proporcijos gali skirtis. Vadovaukitės prie savo rinkinio pridėta instrukcija.{instruction&&<> <a href={instruction.href}>{instruction.label}</a>.</>}</p>
  {items.length>0&&<Carousel items={items}/>}
  {initial&&items.length<initial.total&&<div className="memo-review-more"><span aria-live="polite">Įkelta {items.length} iš {initial.total}</span><button type="button" disabled={busy} onClick={more}>{busy?'Įkeliama…':'Įkelti daugiau atsiliepimų'}</button></div>}
  {failed&&<p role="alert">Nepavyko įkelti. Bandykite dar kartą.</p>}{!initial&&<p className="memo-review-hint">Atsiliepimų ryšys šiuo metu nepasiekiamas. Pabandykite atnaujinti puslapį.</p>}
 </section>;
}
export function MemoHomeReviews(){
 const [data,setData]=useState<{items:MemoReview[];stats:Array<{sku:string;count:number;average:number}>}|null>(null);
 useEffect(()=>{const controller=new AbortController();let observer:IntersectionObserver|undefined;const load=()=>{observer?.disconnect();fetch('/prekyba/reviews',{cache:'no-store',signal:controller.signal}).then(response=>response.ok?response.json():null).then(raw=>{const value=raw as {items:MemoReview[];stats:Array<{sku:string;count:number;average:number}>}|null;if(value?.items?.length&&Array.isArray(value.stats))setData(value);}).catch(()=>{});};const target=document.querySelector('#rinkiniai');if(target&&'IntersectionObserver'in window){observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))load();},{rootMargin:'300px'});observer.observe(target);}else load();return()=>{controller.abort();observer?.disconnect();};},[]);
 if(!data?.items.length)return null;
 return <section className="memo-reviews memo-reviews-home" id="pirkeju-atsiliepimai"><div className="memo-reviews-head"><div><h2>Jūsų sukurti prisiminimai</h2><p>Tikros pirkėjų patirtys apie „Memory Casting“ rinkinius.</p></div><a href="/atsiliepimas">Pasidalyti savo patirtimi</a></div><Carousel items={data.items.slice(0,8)} showProduct/><p className="memo-review-product-links">{data.stats.filter(s=>['couple','family'].includes(s.sku)).map(s=><a href={(s.sku==='couple'?'/rinkinys-porai':'/seimos-rinkinys')+'#atsiliepimai'} key={s.sku}>{s.sku==='couple'?'Poros rinkinio':'Šeimos rinkinio'} atsiliepimai ({s.count})</a>)}</p></section>;
}
