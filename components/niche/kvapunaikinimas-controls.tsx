'use client';
import {Children,useEffect,useRef,useState,type ReactNode} from 'react';

export function KvCarousel({children,label,classes}:{children:ReactNode;label:string;classes:Record<'carousel'|'carouselTrack'|'slide'|'carouselControls',string>}){
 const images=Children.toArray(children),track=useRef<HTMLDivElement>(null),index=useRef(0),wrapTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),resumeTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const [playing,setPlaying]=useState(true),[reduced,setReduced]=useState(true),[focused,setFocused]=useState(false);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 const move=(delta:number)=>{
  const el=track.current;if(!el||images.length<2)return;
  clearTimeout(wrapTimer.current);
  const next=index.current+delta;
  if(next===images.length){index.current=next;el.scrollTo({left:next*el.clientWidth,behavior:reduced?'instant':'smooth'});wrapTimer.current=setTimeout(()=>{if(track.current){track.current.scrollTo({left:0,behavior:'instant'});index.current=0;}},550);}
  else{index.current=(next+images.length)%images.length;el.scrollTo({left:index.current*el.clientWidth,behavior:reduced||next<0?'instant':'smooth'});}
 };
 useEffect(()=>{
  // The owner requests automatic cycling; reduced motion only changes the transition.
  if(!playing||focused||images.length<2)return;
  const timer=setInterval(()=>move(1),2000);return()=>clearInterval(timer);
 // The slide collection is fixed by the published server package.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[playing,reduced,focused,images.length]);
 useEffect(()=>()=>{clearTimeout(wrapTimer.current);clearTimeout(resumeTimer.current);},[]);
 const stop=()=>{setPlaying(false);clearTimeout(wrapTimer.current);clearTimeout(resumeTimer.current);resumeTimer.current=setTimeout(()=>setPlaying(true),2000);};
 return <div className={classes.carousel} role="region" aria-label={label} aria-roledescription="karuselė" onFocusCapture={e=>setFocused((e.target as HTMLElement).matches(':focus-visible'))} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocused(false);}}>
  <div className={classes.carouselTrack} ref={track} onPointerDown={stop} onWheel={stop} onScroll={()=>{if(!playing&&track.current)index.current=Math.min(images.length-1,Math.round(track.current.scrollLeft/track.current.clientWidth));}}>
   {images.map((image,i)=><div className={classes.slide} key={i} role="group" aria-label={`${i+1} / ${images.length}`}>{image}</div>)}
   {images.length>1&&<div className={classes.slide} aria-hidden="true">{images[0]}</div>}
  </div>
  <div className={classes.carouselControls}>
   <button type="button" aria-label="Ankstesnė iliustracija" onClick={()=>{stop();move(-1);}}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m12 4-6 6 6 6"/></svg></button>
   <button type="button" aria-label="Kita iliustracija" onClick={()=>{stop();move(1);}}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m8 4 6 6-6 6"/></svg></button>
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
