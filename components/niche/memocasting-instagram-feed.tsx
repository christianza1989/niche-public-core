/* eslint-disable @next/next/no-img-element -- Same-origin, server-admitted Instagram media proxy. */
'use client';
import {useEffect,useRef,useState} from 'react';
import './memocasting-instagram-feed.css';
type Post={id:string;type:'IMAGE'|'VIDEO'|'CAROUSEL_ALBUM';href:string;timestamp:string;caption:string;poster:string|null;video:string|null};
type Feed={username:string;updatedAt:string;items:Post[]};
export function MemoInstagramFeed({fallback}:{fallback:string}){
 const anchor=useRef<HTMLDivElement>(null),[feed,setFeed]=useState<Feed|null>(null),[count,setCount]=useState(12);
 useEffect(()=>{
  const element=anchor.current;if(!element)return;const controller=new AbortController();let started=false;
  const load=async()=>{if(started)return;started=true;try{const response=await fetch('/social/instagram/feed',{signal:controller.signal});if(!response.ok)return;const data=await response.json();if(data.username!=='memocasting.lt'||!Array.isArray(data.items))return;
   const items=data.items.slice(0,48).filter((p:Post)=>/^\d{5,40}$/.test(p.id)&&['IMAGE','VIDEO','CAROUSEL_ALBUM'].includes(p.type)&&/^https:\/\/www\.instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?$/.test(p.href)&&Number.isFinite(Date.parse(p.timestamp))&&typeof p.caption==='string'&&(!p.poster||p.poster===`/social/instagram/media/${p.id}/poster`)&&(!p.video||p.video===`/social/instagram/media/${p.id}/video`));
   if(!controller.signal.aborted)setFeed({username:data.username,updatedAt:data.updatedAt,items});
  }catch{/* Keep the actual approved fallback and profile link during provider outages. */}};
  if(!('IntersectionObserver' in window)){void load();return()=>controller.abort();}
  const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();void load();}},{rootMargin:'400px'});observer.observe(element);return()=>{observer.disconnect();controller.abort();};
 },[]);
 return <div ref={anchor}>{feed?<section className="memo-instagram home-section" id="instagram" aria-labelledby="instagram-title"><header className="section-heading"><div><p className="memo-instagram-kicker">@memocasting.lt</p><h2 id="instagram-title">Dar daugiau akimirkų.</h2></div><p>Kūrimo procesas, skulptūrų detalės ir naujos idėjos mūsų Instagram profilyje.</p></header>
  <div className="memo-instagram-grid">{feed.items.slice(0,count).map(post=><article className="memo-instagram-post" key={post.id}>
   <div className="memo-instagram-visual">{post.type==='VIDEO'&&post.video?<video controls playsInline preload="none" poster={post.poster??undefined} aria-label={'Instagram video: '+(post.caption.slice(0,120)||'Memocasting kūrimo akimirka')} src={post.video}><a href={post.href}>Peržiūrėti video Instagram</a></video>:<a href={post.href} target="_blank" rel="noopener noreferrer" aria-label={'Atverti Instagram įrašą: '+(post.caption.slice(0,100)||'Memocasting akimirka')}>{post.poster&&<img src={post.poster} alt={post.caption.slice(0,180)||'Memocasting Instagram įrašo nuotrauka'} width="600" height="750" loading="lazy" decoding="async"/>}</a>}
   {post.type==='CAROUSEL_ALBUM'&&<span className="memo-instagram-kind" aria-label="Nuotraukų albumas"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="7" width="13" height="13" rx="2"/><path d="M8 4h10a2 2 0 0 1 2 2v10"/></svg>Albumas</span>}</div>
   <div className="memo-instagram-meta"><time dateTime={post.timestamp}>{new Intl.DateTimeFormat('lt-LT',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Vilnius'}).format(new Date(post.timestamp))}</time><a href={post.href} target="_blank" rel="noopener noreferrer">{post.type==='VIDEO'?'Atverti Reels':'Atverti įrašą'}<span aria-hidden="true"> ↗</span></a></div>
   {post.caption&&<p className="memo-instagram-caption">{post.caption}</p>}
  </article>)}</div>
  {!feed.items.length&&<p>Naujausias akimirkas rasite mūsų Instagram profilyje.</p>}
  <div className="memo-instagram-actions">{count<feed.items.length&&<button type="button" onClick={()=>setCount(current=>current+12)}>Rodyti daugiau<span aria-hidden="true"> +</span></button>}<a href="https://www.instagram.com/memocasting.lt/" target="_blank" rel="noopener noreferrer">Visos akimirkos Instagram <span aria-hidden="true">↗</span></a></div>
 </section>:<div dangerouslySetInnerHTML={{__html:fallback}}/>}</div>;
}
