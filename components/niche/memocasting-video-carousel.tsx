'use client';
/* eslint-disable @next/next/no-img-element -- Immutable, responsive first-party video posters. */
import {useCallback,useEffect,useRef,useState,type KeyboardEvent} from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import catalogue from '@/lib/memocasting-video-assets.json';
import './memocasting-video-carousel.css';

function Arrow({previous=false}:{previous?:boolean}){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={previous?'M20 12H4m6-6-6 6 6 6':'M4 12h16m-6-6 6 6-6 6'}/></svg>;}
function Play(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7Z"/></svg>;}

export function MemoVideoCarousel(){
 const section=useRef<HTMLElement>(null),player=useRef<HTMLVideoElement>(null);
 const [active,setActive]=useState<string|null>(null),[state,setState]=useState<'loading'|'ready'|'error'>('loading');
 const [position,setPosition]=useState(0),[previous,setPrevious]=useState(false),[next,setNext]=useState(true);
 const [viewport,api]=useEmblaCarousel({align:'start',containScroll:'trimSnaps',loop:false,skipSnaps:false,watchDrag:(_api,event)=>!(event.target instanceof Element&&event.target.closest('video,.memo-video-close,.memo-video-retry'))});
 const jump=useCallback(()=>Boolean(window.matchMedia('(prefers-reduced-motion: reduce)').matches||section.current?.closest('.motion-off')),[]);
 useEffect(()=>{
  if(!api)return;
  const update=()=>{setPosition(api.selectedScrollSnap());setPrevious(api.canScrollPrev());setNext(api.canScrollNext());};
  api.on('select',update).on('reInit',update);const frame=requestAnimationFrame(update);
  return()=>{cancelAnimationFrame(frame);api.off('select',update).off('reInit',update);};
 },[api]);
 useEffect(()=>{
  if(!active||!player.current)return;
  const video=player.current;
  // No media element with src exists until a deliberate play action.
  void video.play().catch(()=>{ /* Native play control remains available if browser policy intervenes. */ });
  const pause=()=>{if(document.hidden)video.pause();};
  const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.intersectionRatio<.2))video.pause();},{threshold:[0,.2]});
  observer.observe(video);document.addEventListener('visibilitychange',pause);
  return()=>{video.pause();observer.disconnect();document.removeEventListener('visibilitychange',pause);};
 },[active]);
 const close=(id:string)=>{setActive(null);requestAnimationFrame(()=>section.current?.querySelector<HTMLButtonElement>(`[data-play="${id}"]`)?.focus({preventScroll:true}));};
 const start=(id:string,index:number)=>{setState('loading');setActive(id);api?.scrollTo(index,jump());};
 const keys=(event:KeyboardEvent)=>{
  if(event.target instanceof Element&&event.target.closest('video'))return;
  if(event.altKey||event.ctrlKey||event.metaKey)return;
  if(event.key==='ArrowLeft'){event.preventDefault();api?.scrollPrev(jump());}
  if(event.key==='ArrowRight'){event.preventDefault();api?.scrollNext(jump());}
  if(event.key==='Home'){event.preventDefault();api?.scrollTo(0,jump());}
  if(event.key==='End'){event.preventDefault();api?.scrollTo(catalogue.items.length-1,jump());}
  if(event.key==='Escape'&&active)close(active);
 };
 return <section ref={section} id="instagram" className="memo-videos" aria-labelledby="memo-video-title" aria-roledescription="karuselė" data-memo-video-carousel onKeyDown={keys}>
  <div className="memo-video-heading">
   <div><h2 id="memo-video-title">Akimirkos, kurios lieka.</h2><p>Juokas, susikibusios rankos ir pirmas žvilgsnis į savo skulptūrą. Pažiūrėkite, kaip gimsta prisiminimai.</p></div>
   <div className="memo-video-navigation" aria-label="Video karuselės valdymas">
    <span className="memo-video-count" aria-live="polite" aria-atomic="true">{String(position+1).padStart(2,'0')} <span>/ {catalogue.items.length}</span></span>
    <button type="button" disabled={!api||!previous} onClick={()=>api?.scrollPrev(jump())} aria-label="Ankstesnis video"><Arrow previous/></button>
    <button type="button" disabled={!api||!next} onClick={()=>api?.scrollNext(jump())} aria-label="Kitas video"><Arrow/></button>
   </div>
  </div>
  <div ref={viewport} className={'memo-video-viewport'+(api?' is-ready':'')} tabIndex={0} aria-label="Kūrimo akimirkų video. Naršykite rodyklėmis arba braukite.">
   <div className="memo-video-track">{catalogue.items.map((item,index)=>{
    const playing=active===item.id,poster=item.variants[item.variants.length-1];
    return <article className="memo-video-slide" key={item.id} aria-label={`${index+1} iš ${catalogue.items.length}: ${item.title}`} aria-roledescription="skaidrė">
     <div className="memo-video-frame">
      {playing?<>
       <video key={item.id} ref={player} controls playsInline preload="metadata" src={item.src} poster={poster.src} aria-label={item.title} onCanPlay={()=>setState('ready')} onError={()=>setState('error')}/>
       <button className="memo-video-close" type="button" onClick={()=>close(item.id)} aria-label={`Uždaryti video „${item.title}“`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button>
       {state==='loading'&&<span className="memo-video-status" role="status">Video kraunamas…</span>}
       {state==='error'&&<div className="memo-video-error" role="alert"><p>Nepavyko paleisti video.</p><button type="button" className="memo-video-retry" onClick={()=>{setState('loading');player.current?.load();void player.current?.play().catch(()=>{});}}>Bandyti dar kartą</button></div>}
      </>:<button className="memo-video-play" type="button" data-play={item.id} onClick={()=>start(item.id,index)} aria-label={`Žiūrėti video „${item.title}“`}>
       <img src={poster.src} srcSet={item.variants.map(v=>`${v.src} ${v.width}w`).join(', ')} sizes="(max-width: 600px) 77vw, (max-width: 1000px) 40vw, 300px" width={poster.width} height={poster.height} alt={item.alt} loading="lazy" draggable={false}/>
       <span className="memo-video-play-icon"><Play/></span><span className="memo-video-duration">{item.durationLabel}</span>
      </button>}
     </div>
     <h3>{item.title}</h3>
     <noscript><a href={item.src}>Žiūrėti video</a></noscript>
    </article>;
   })}</div>
  </div>
  <div className="memo-video-foot"><p>Braukite ir atraskite daugiau akimirkų.</p><p>Įrašuose minimi konkursai ir akcijos gali būti pasibaigę.</p></div>
 </section>;
}
