'use client';
/* eslint-disable @next/next/no-img-element -- Immutable, responsive first-party video posters. */
import {useCallback,useEffect,useRef,useState,type KeyboardEvent} from 'react';
import {flushSync} from 'react-dom';
import useEmblaCarousel from 'embla-carousel-react';
import AutoScroll from 'embla-carousel-auto-scroll';
import catalogue from '@/lib/memocasting-video-assets.json';
import './memocasting-video-carousel.css';

function Arrow({previous=false}:{previous?:boolean}){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={previous?'M20 12H4m6-6-6 6 6 6':'M4 12h16m-6-6 6 6-6 6'}/></svg>;}
function Play(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7Z"/></svg>;}

export function MemoVideoCarousel(){
 const section=useRef<HTMLElement>(null),player=useRef<HTMLVideoElement>(null);
 const [active,setActive]=useState<string|null>(null),[state,setState]=useState<'loading'|'ready'|'error'>('loading');
 const [position,setPosition]=useState(0),[previous,setPrevious]=useState(false),[next,setNext]=useState(true);
 const [auto]=useState(()=>AutoScroll({speed:.35,startDelay:1200,playOnInit:false,stopOnInteraction:true,stopOnMouseEnter:false,stopOnFocusIn:false}));
 const [autoEnabled,setAutoEnabled]=useState(true),[hovered,setHovered]=useState(false),[focused,setFocused]=useState(false),[dragging,setDragging]=useState(false);
 const [visible,setVisible]=useState(false),[pageVisible,setPageVisible]=useState(false),[motionAllowed,setMotionAllowed]=useState(false);
 const [viewport,api]=useEmblaCarousel({
  align:'start',containScroll:'trimSnaps',loop:true,skipSnaps:false,
  // Playing and operating a video must not become carousel gestures.
  watchDrag:(_api,event)=>!(event.target instanceof Element&&event.target.closest('video,.memo-video-play-icon,.memo-video-close,.memo-video-retry')),
  // Focus must never move the track while a visitor operates a play control.
  watchFocus:false,
 },[auto]);
 const jump=useCallback(()=>Boolean(window.matchMedia('(prefers-reduced-motion: reduce)').matches||section.current?.closest('.motion-off')),[]);
 useEffect(()=>{
  if(!api)return;
  const update=()=>{setPosition(api.selectedScrollSnap());setPrevious(api.canScrollPrev());setNext(api.canScrollNext());};
  api.on('select',update).on('reInit',update);const frame=requestAnimationFrame(update);
  return()=>{cancelAnimationFrame(frame);api.off('select',update).off('reInit',update);};
 },[api]);
 useEffect(()=>{
  const el=section.current;if(!el)return;
  const media=window.matchMedia('(prefers-reduced-motion: reduce)'),root=el.closest('.memo-homepage')||document.documentElement;
  const motion=()=>setMotionAllowed(!media.matches&&!el.closest('.motion-off'));
  const visibility=()=>setPageVisible(!document.hidden);
  const observer=new IntersectionObserver(entries=>setVisible(entries.some(e=>e.isIntersecting&&e.intersectionRatio>=.2)),{threshold:[0,.2]});observer.observe(el);
  const changes=new MutationObserver(motion);changes.observe(root,{attributes:true,attributeFilter:['class']});
  motion();visibility();media.addEventListener('change',motion);document.addEventListener('visibilitychange',visibility);
  return()=>{observer.disconnect();changes.disconnect();media.removeEventListener('change',motion);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 useEffect(()=>{
  if(!api)return;
  const down=()=>{auto.stop();setDragging(true);},up=()=>setDragging(false);
  api.on('pointerDown',down).on('pointerUp',up);
  return()=>{api.off('pointerDown',down).off('pointerUp',up);};
 },[api,auto]);
 useEffect(()=>{
  const scrolling=auto;
  if(api&&autoEnabled&&visible&&pageVisible&&motionAllowed&&!active&&!hovered&&!focused&&!dragging)scrolling.play();else scrolling.stop();
  return()=>scrolling.stop();
 },[api,auto,autoEnabled,visible,pageVisible,motionAllowed,active,hovered,focused,dragging]);
 useEffect(()=>{
  if(!active||!player.current)return;
  const video=player.current;
  video.focus({preventScroll:true});
  const pause=()=>{if(document.hidden)video.pause();};
  const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.intersectionRatio<.2))video.pause();},{threshold:[0,.2]});
  observer.observe(video);document.addEventListener('visibilitychange',pause);
  return()=>{video.pause();observer.disconnect();document.removeEventListener('visibilitychange',pause);};
 },[active]);
 const close=(id:string)=>{setActive(null);requestAnimationFrame(()=>section.current?.querySelector<HTMLButtonElement>(`[data-play="${id}"]`)?.focus({preventScroll:true}));};
 // Keep the chosen card exactly where it is; only navigation moves the track.
 const start=(id:string)=>{
  auto.stop();
  // Mount and play inside the original trusted click, including iOS Safari.
  // Waiting for an effect loses that browser activation and needs a second tap.
  flushSync(()=>{setState('loading');setActive(id);});
  void player.current?.play().catch(()=>{setState('ready');});
 };
 const keys=(event:KeyboardEvent)=>{
  if(event.defaultPrevented)return;
  if(event.altKey||event.ctrlKey||event.metaKey)return;
  if(event.key==='Escape'&&active&&!document.fullscreenElement){event.preventDefault();close(active);return;}
  if(event.target instanceof Element&&event.target.closest('video,.memo-video-close,.memo-video-retry'))return;
  if(event.key==='ArrowLeft'){event.preventDefault();api?.scrollPrev(jump());}
  if(event.key==='ArrowRight'){event.preventDefault();api?.scrollNext(jump());}
  if(event.key==='Home'){event.preventDefault();api?.scrollTo(0,jump());}
  if(event.key==='End'){event.preventDefault();api?.scrollTo(catalogue.items.length-1,jump());}
 };
 return <section ref={section} id="instagram" className="memo-videos" aria-labelledby="memo-video-title" aria-roledescription="karuselė" data-memo-video-carousel onKeyDown={keys} onPointerEnter={event=>{if(event.pointerType==='mouse'){auto.stop();setHovered(true);}}} onPointerLeave={()=>setHovered(false)} onFocusCapture={event=>{const blocked=!(event.target instanceof Element&&event.target.closest('.memo-video-auto'));if(blocked)auto.stop();setFocused(blocked);}} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setFocused(false);}}>
  <div className="memo-video-heading">
   <div><h2 id="memo-video-title">Akimirkos, kurios lieka.</h2><p>Juokas, susikibusios rankos ir pirmas žvilgsnis į savo skulptūrą. Pažiūrėkite, kaip gimsta prisiminimai.</p></div>
   <div className="memo-video-navigation" aria-label="Video karuselės valdymas">
    <span className="memo-video-count" aria-live="off">{String(position+1).padStart(2,'0')} <span>/ {catalogue.items.length}</span></span>
    <button type="button" className="memo-video-auto" aria-pressed={!autoEnabled} aria-label={autoEnabled?'Pristabdyti automatinį slinkimą':'Įjungti automatinį slinkimą'} onClick={()=>setAutoEnabled(value=>!value)}>{autoEnabled?<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5v14M15 5v14"/></svg>:<Play/>}</button>
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
      </>:<button className="memo-video-play" type="button" data-play={item.id} onClick={()=>start(item.id)} aria-label={`Žiūrėti video „${item.title}“`}>
       <img src={poster.src} srcSet={item.variants.map(v=>`${v.src} ${v.width}w`).join(', ')} sizes="(max-width: 600px) 77vw, (max-width: 1000px) 40vw, 300px" width={poster.width} height={poster.height} alt={item.alt} loading="lazy" draggable={false}/>
       <span className="memo-video-play-icon"><Play/></span><span className="memo-video-duration">{item.durationLabel}</span>
      </button>}
     </div>
     <noscript><a href={item.src}>Žiūrėti video</a></noscript>
    </article>;
   })}</div>
  </div>
  <div className="memo-video-foot"><p>Braukite ir atraskite daugiau akimirkų.</p><p>Įrašuose minimi konkursai ir akcijos gali būti pasibaigę.</p></div>
 </section>;
}
