/* eslint-disable @next/next/no-img-element -- Immutable, admitted responsive originals. */
'use client';
import {useEffect,useId,useRef,useState,useSyncExternalStore,type PointerEvent as ReactPointerEvent} from 'react';
import {memoGalleryCopy,memoGalleryFilters,memoInspirationItems,memoGallerySelection,memoGalleryStep,memoGallerySwipe} from '@/lib/memocasting-inspiration-gallery.mjs';
import {constrainMomentView,momentImageGeometry} from '@/lib/memocasting-moment-viewer.mjs';
import './memocasting-inspiration-gallery.css';

type ImageItem={id:string;category:string;title:string;description:string;alt:string;src:string;fullSrc:string;srcSet:string;width:number;height:number};
type Gesture={x:number;y:number;time:number};
const subscribe=()=>()=>{};
const hasDialog=()=>typeof HTMLDialogElement!=='undefined'&&typeof HTMLDialogElement.prototype.showModal==='function';
const serverDialog=()=>false;
function GalleryIcon({kind}:{kind:'left'|'right'|'expand'|'close'|'plus'|'minus'|'reset'}){
 const paths={left:'M19 12H5m6-6-6 6 6 6',right:'M5 12h14m-6-6 6 6-6 6',expand:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',close:'m6 6 12 12M18 6 6 18',plus:'M5 12h14M12 5v14',minus:'M5 12h14',reset:'M4 10a8 8 0 1 1 1 8M4 4v6h6'};
 return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[kind]}/></svg>;
}
function GalleryPhoto({image,main=false}:{image:ImageItem;main?:boolean}){
 const [failed,setFailed]=useState(false);
 return failed?<span className="memo-gallery-image-error">Nuotraukos nepavyko įkelti. Atverkite ją ir bandykite dar kartą.</span>:<img src={image.src} srcSet={image.srcSet} sizes={main?'(max-width: 760px) calc(100vw - 46px), (max-width: 1100px) 60vw, 850px':'(max-width: 760px) 112px, (max-width: 1100px) 18vw, 220px'} width={image.width} height={image.height} alt={image.alt} loading="lazy" decoding="async" draggable={false} onError={()=>setFailed(true)}/>;
}

export function MemoInspirationGallery(){
 const enhanced=useSyncExternalStore(subscribe,hasDialog,serverDialog),id=useId();
 const [filter,setFilter]=useState('all'),[selected,setSelected]=useState(memoInspirationItems[0].id),[open,setOpen]=useState(false);
 const {images,index,image}=memoGallerySelection(memoInspirationItems,filter,selected) as {images:ImageItem[];index:number;image:ImageItem|null};
 const [view,setView]=useState({scale:1,x:0,y:0}),[imageState,setImageState]=useState<'loading'|'ready'|'error'>('loading'),[retry,setRetry]=useState(0);
 const dialog=useRef<HTMLDialogElement>(null),closeButton=useRef<HTMLButtonElement>(null),stage=useRef<HTMLDivElement>(null),opener=useRef<HTMLElement|null>(null),gesture=useRef<Gesture|null>(null),suppressClick=useRef(0),drag=useRef<{pointer:number;x:number;y:number}|null>(null);
 const dimensions=useRef({width:1,height:1});
 useEffect(()=>{dimensions.current={width:image?.width??1,height:image?.height??1};},[image?.width,image?.height]);
 const geometry=()=>momentImageGeometry(stage.current?.clientWidth??1,stage.current?.clientHeight??1,dimensions.current.width,dimensions.current.height);
 const changeView=(next:typeof view)=>setView(constrainMomentView(next,geometry()));
 const select=(next:string)=>{setSelected(next);setView({scale:1,x:0,y:0});setImageState('loading');drag.current=null;};
 const step=(delta:number)=>{const next=memoGalleryStep(memoInspirationItems,filter,selected,delta);if(next)select(next);};
 const touchStart=(event:ReactPointerEvent)=>{if(event.pointerType==='mouse'||view.scale>1)return;gesture.current={x:event.clientX,y:event.clientY,time:event.timeStamp};};
 const touchEnd=(event:ReactPointerEvent)=>{const delta=memoGallerySwipe(gesture.current,{x:event.clientX,y:event.clientY,time:event.timeStamp});gesture.current=null;if(delta&&images.length>1){suppressClick.current=event.timeStamp+400;step(delta);}};
 useEffect(()=>{
  if(!open||!dialog.current)return;
  const modal=dialog.current,previousFocus=opener.current;
  modal.showModal();closeButton.current?.focus();
  const observer=new ResizeObserver(()=>setView(current=>constrainMomentView(current,momentImageGeometry(stage.current?.clientWidth??1,stage.current?.clientHeight??1,dimensions.current.width,dimensions.current.height))));if(stage.current)observer.observe(stage.current);
  return()=>{observer.disconnect();modal.close();if(previousFocus?.isConnected)previousFocus.focus();};
 },[open]);
 if(!image)return null;
 const previews=images.filter(item=>item.id!==image.id);
 return <section className="gallery memo-inspiration-gallery" id="galerija" aria-labelledby="gallery-title">
  <header className="memo-gallery-heading"><div><p className="memo-gallery-eyebrow">Įkvėpimo galerija</p><h2 id="gallery-title">{memoGalleryCopy.title}</h2></div><p>{memoGalleryCopy.intro}</p></header>
  {enhanced&&<div className="memo-gallery-filters" role="group" aria-label="Galerijos kategorijos">{memoGalleryFilters.map(item=><button key={item.id} type="button" aria-pressed={filter===item.id} onClick={()=>{setFilter(item.id);const next=memoGallerySelection(memoInspirationItems,item.id,selected).image;if(next)select(next.id);}}>{item.label}</button>)}</div>}
  <div className="memo-gallery-layout" data-single={images.length===1}>
   <figure className="memo-gallery-selected">
    <a className="memo-gallery-main" href={image.fullSrc} aria-label={'Atverti nuotrauką: '+image.title} aria-haspopup={enhanced?'dialog':undefined} aria-controls={enhanced?id:undefined} onPointerDown={touchStart} onPointerUp={touchEnd} onPointerCancel={()=>{gesture.current=null;}} onClick={event=>{if(!enhanced)return;event.preventDefault();if(event.timeStamp<suppressClick.current)return;opener.current=event.currentTarget;setView({scale:1,x:0,y:0});setImageState('loading');setOpen(true);}}>
     <GalleryPhoto key={image.id} image={image} main/><span className="memo-gallery-open"><GalleryIcon kind="expand"/><span>Atverti</span></span>
    </a>
    <figcaption><h3>{image.title}</h3><p>{image.description}</p></figcaption>
   </figure>
   {previews.length>0&&<div className="memo-gallery-previews" data-count={previews.length} role="group" aria-label="Kitos galerijos nuotraukos">{previews.map(item=><a className="memo-gallery-preview" key={item.id} href={item.fullSrc} aria-label={'Pasirinkti nuotrauką: '+item.title} onClick={event=>{if(enhanced){event.preventDefault();select(item.id);}}}><span className="memo-gallery-preview-frame"><GalleryPhoto image={item}/></span><span className="memo-gallery-preview-caption"><span>{item.title}</span><GalleryIcon kind="right"/></span></a>)}</div>}
  </div>
  {enhanced&&<div className="memo-gallery-navigation"><output aria-live="polite" aria-atomic="true"><span className="memo-gallery-sr">{image.title}. Nuotrauka </span>{String(index+1).padStart(2,'0')}<span className="memo-gallery-total"><span aria-hidden="true"> / </span><span className="memo-gallery-sr"> iš </span>{String(images.length).padStart(2,'0')}</span></output><span className="memo-gallery-progress" aria-hidden="true"><span style={{transform:`scaleX(${(index+1)/images.length})`}}/></span><div><button type="button" aria-label="Ankstesnė nuotrauka" disabled={images.length<2} onClick={()=>step(-1)}><GalleryIcon kind="left"/></button><button type="button" aria-label="Kita nuotrauka" disabled={images.length<2} onClick={()=>step(1)}><GalleryIcon kind="right"/></button></div></div>}
  <p className="memo-gallery-note">{memoGalleryCopy.note}</p>
  <dialog ref={dialog} id={id} className="memo-gallery-dialog" aria-labelledby={id+'-title'} aria-describedby={id+'-help'} onCancel={event=>{event.preventDefault();setOpen(false);}} onClick={event=>{if(event.target===event.currentTarget)setOpen(false);}} onKeyDown={event=>{
   if(event.ctrlKey||event.metaKey||event.altKey)return;
   if(event.key==='Tab'){const controls=[...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],[tabindex="0"]')].filter(item=>item.getClientRects().length);const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
   else if(view.scale===1&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();step(event.key==='ArrowRight'?1:-1);}
  }}>
   <div className="memo-gallery-dialog-panel">
    <header><div><p className="memo-gallery-dialog-count">{String(index+1).padStart(2,'0')} / {String(images.length).padStart(2,'0')}</p><h2 id={id+'-title'}>{image.title}</h2></div><button type="button" ref={closeButton} aria-label="Uždaryti galeriją" onClick={()=>setOpen(false)}><GalleryIcon kind="close"/></button></header>
    <div className="memo-gallery-viewer" ref={stage} tabIndex={0} aria-label="Nuotraukos peržiūra" data-zoomed={view.scale>1} onKeyDown={event=>{
     if(imageState!=='ready'||event.ctrlKey||event.metaKey||event.altKey)return;
     if(['+','=','-','0'].includes(event.key)){event.preventDefault();if(event.key==='0')changeView({scale:1,x:0,y:0});else changeView({...view,scale:view.scale+(event.key==='-'?-.25:.25)});}
     else if(view.scale>1&&event.key.startsWith('Arrow')){event.preventDefault();event.stopPropagation();changeView({...view,x:view.x+(event.key==='ArrowLeft'?40:event.key==='ArrowRight'?-40:0),y:view.y+(event.key==='ArrowUp'?40:event.key==='ArrowDown'?-40:0)});}
    }} onPointerDown={event=>{if(view.scale<=1){touchStart(event);return;}if(imageState!=='ready')return;drag.current={pointer:event.pointerId,x:event.clientX,y:event.clientY};event.currentTarget.setPointerCapture(event.pointerId);}} onPointerMove={event=>{const d=drag.current;if(!d||d.pointer!==event.pointerId)return;const x=event.clientX-d.x,y=event.clientY-d.y;d.x=event.clientX;d.y=event.clientY;setView(current=>constrainMomentView({...current,x:current.x+x,y:current.y+y},geometry()));}} onPointerUp={event=>{if(view.scale<=1)touchEnd(event);drag.current=null;}} onPointerCancel={()=>{gesture.current=null;drag.current=null;}}>
     {open&&<img key={image.id+'-'+retry} src={image.fullSrc+(retry?'?gallery_retry='+retry:'')} width={image.width} height={image.height} alt={image.alt} draggable={false} style={{transform:`translate(${view.x}px, ${view.y}px) scale(${view.scale})`}} onLoad={()=>setImageState('ready')} onError={()=>setImageState('error')}/>}
     {imageState!=='ready'&&<div className="memo-gallery-load-state" role="status"><p>{imageState==='loading'?'Įkeliama nuotrauka…':'Nuotraukos nepavyko įkelti.'}</p>{imageState==='error'&&<button type="button" onClick={()=>{setImageState('loading');setRetry(n=>n+1);}}>Bandyti dar kartą</button>}</div>}
    </div>
    <div className="memo-gallery-viewer-tools"><div className="memo-gallery-zoom"><button type="button" aria-label="Atitolinti nuotrauką" disabled={imageState!=='ready'||view.scale<=1} onClick={()=>changeView({...view,scale:view.scale-.25})}><GalleryIcon kind="minus"/></button><output aria-live="polite">{Math.round(view.scale*100)}%</output><button type="button" aria-label="Priartinti nuotrauką" disabled={imageState!=='ready'||view.scale>=3} onClick={()=>changeView({...view,scale:view.scale+.25})}><GalleryIcon kind="plus"/></button><button type="button" aria-label="Atkurti nuotraukos mastelį" disabled={imageState!=='ready'||view.scale===1} onClick={()=>changeView({scale:1,x:0,y:0})}><GalleryIcon kind="reset"/></button></div><div className="memo-gallery-viewer-arrows"><button type="button" aria-label="Ankstesnė nuotrauka peržiūroje" disabled={images.length<2} onClick={()=>step(-1)}><GalleryIcon kind="left"/></button><button type="button" aria-label="Kita nuotrauka peržiūroje" disabled={images.length<2} onClick={()=>step(1)}><GalleryIcon kind="right"/></button></div></div>
    <p id={id+'-help'} className="memo-gallery-viewer-help">{view.scale>1?'Tempkite nuotrauką, kad apžiūrėtumėte detales.':'Nuotraukas keiskite rodyklėmis arba braukdami pirštu.'} Uždaryti — Esc.</p>
   </div>
  </dialog>
 </section>;
}
