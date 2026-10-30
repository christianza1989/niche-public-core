'use client';
import {Children,useEffect,useRef,useState,type ReactNode} from 'react';

export function KvCarousel({children,label,classes}:{children:ReactNode;label:string;classes:Record<'carousel'|'carouselTrack'|'slide',string>}){
 const images=Children.toArray(children),track=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const el=track.current;if(!el||images.length<2)return;
  let index=0,animation:Animation|undefined;
  el.style.transform='translate3d(0,0,0)';
  const timer=setInterval(()=>{
   const next=index+1,from=`translate3d(-${index*100}%,0,0)`,to=`translate3d(-${next*100}%,0,0)`;
   // Explicit owner motion: original500ms slide, independent of CSS transition overrides.
   animation=el.animate([{transform:from},{transform:to}],{duration:500,easing:'ease'});
   el.style.transform=to;
   if(next===images.length){index=0;animation.onfinish=()=>{el.style.transform='translate3d(0,0,0)';};}
   else index=next;
  },2000);
  return()=>{clearInterval(timer);if(animation){animation.onfinish=null;animation.cancel();}};
 },[images.length]);
 return <div className={classes.carousel} role="region" aria-label={label} aria-roledescription="karuselė">
  <div className={classes.carouselTrack} ref={track}>
   {images.map((image,i)=><div className={classes.slide} key={i} role="group" aria-label={`${i+1} / ${images.length}`}>{image}</div>)}
   {images.length>1&&<div className={classes.slide} aria-hidden="true">{images[0]}</div>}
  </div>
 </div>;
}

export function KvMobileMenu({children,className}:{children:ReactNode;className:string}){
 const menu=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{
  const header=menu.current?.closest('header');if(!header)return;
  const close=()=>{for(const d of header.querySelectorAll<HTMLDetailsElement>('details[open]'))d.open=false;};
  const escape=(e:KeyboardEvent)=>{if(e.key!=='Escape')return;const open=[...header.querySelectorAll<HTMLDetailsElement>('details[open]')];if(!open.length)return;const focused=open.find(d=>d.contains(document.activeElement));close();focused?.querySelector<HTMLElement>('summary')?.focus();};
  const outside=(e:PointerEvent)=>{if(!header.contains(e.target as Node))close();};
  const toggle=(e:Event)=>{const d=e.target;if(!(d instanceof HTMLDetailsElement)||!d.open)return;for(const other of header.querySelectorAll<HTMLDetailsElement>('details[open]'))if(other!==d&&!other.contains(d)&&!d.contains(other))other.open=false;};
  document.addEventListener('keydown',escape);document.addEventListener('pointerdown',outside);header.addEventListener('toggle',toggle,true);
  return()=>{document.removeEventListener('keydown',escape);document.removeEventListener('pointerdown',outside);header.removeEventListener('toggle',toggle,true);};
 },[]);
 return <details className={className} ref={menu} onClick={e=>{if((e.target as HTMLElement).closest('a')&&menu.current)menu.current.open=false;}}><summary aria-label="Atverti meniu"><svg viewBox="0 0 24 24" width="25" height="25" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg></summary><nav aria-label="Mobilioji navigacija">{children}</nav></details>;
}

export function KvBackToTop({className}:{className:string}){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{const update=()=>setVisible(scrollY>300);update();addEventListener('scroll',update,{passive:true});return()=>removeEventListener('scroll',update);},[]);
 return <a href="#kv-top" className={className} hidden={!visible} aria-label="Grįžti į viršų"><svg viewBox="0 0 20 12" width="20" height="12" fill="currentColor" aria-hidden="true"><path d="m1 11 9-10 9 10Z"/></svg></a>;
}
