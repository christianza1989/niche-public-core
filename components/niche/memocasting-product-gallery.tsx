/* eslint-disable @next/next/no-img-element -- Immutable responsive owner media. */
'use client';
import {useEffect,useId,useRef,useState,useSyncExternalStore} from 'react';
import {constrainMomentView,momentImageGeometry} from '@/lib/memocasting-moment-viewer.mjs';
import {memoStoreLabels} from '@/lib/memocasting-storefront.mjs';
import {catalogThumbnailUrl} from '@/lib/catalog-media-thumbnail.mjs';
import s from './memocasting-site.module.css';
type Image={id:string;src:string;srcSet:string;width:number;height:number;alt:string;credit:string};
const Icon=({kind}:{kind:'plus'|'minus'|'close'|'reset'})=><svg viewBox="0 0 24 24" aria-hidden="true"><path d={kind==='plus'?'M5 12h14M12 5v14':kind==='minus'?'M5 12h14':kind==='close'?'m6 6 12 12M18 6 6 18':'M4 10a8 8 0 1 1 1 8M4 4v6h6'}/></svg>;
const subscribeToBrowser=()=>()=>{};
const browserHasDialog=()=>typeof HTMLDialogElement!=='undefined'&&typeof HTMLDialogElement.prototype.showModal==='function';
const serverHasDialog=()=>false;
export function MemoProductGallery({images,language,selectedImageId}:{images:Image[];language:string;selectedImageId?:string}){
 const text=memoStoreLabels[language as keyof typeof memoStoreLabels]??memoStoreLabels.lt;
 const id=useId(),[selected,setSelected]=useState(()=>Math.max(0,images.findIndex(m=>m.id===selectedImageId))),enhanced=useSyncExternalStore(subscribeToBrowser,browserHasDialog,serverHasDialog),[open,setOpen]=useState(false),[imageState,setImageState]=useState<'loading'|'ready'|'error'>('loading'),[retry,setRetry]=useState(0),[view,setView]=useState({scale:1,x:0,y:0});
 const dialog=useRef<HTMLDialogElement>(null),stage=useRef<HTMLDivElement>(null),opener=useRef<HTMLButtonElement>(null),closeButton=useRef<HTMLButtonElement>(null),drag=useRef<{pointer:number;x:number;y:number}|null>(null),image=images[selected]??images[0];
 const geometry=()=>momentImageGeometry(stage.current?.clientWidth??1,stage.current?.clientHeight??1,image.width,image.height);
 const change=(next:typeof view)=>setView(constrainMomentView(next,geometry()));
 useEffect(()=>{if(!open||!dialog.current)return;const modal=dialog.current,previous=document.documentElement.style.overflow,previousFocus=opener.current;modal.showModal();document.documentElement.style.overflow='hidden';closeButton.current?.focus();const resize=new ResizeObserver(()=>setView(v=>constrainMomentView(v,geometry())));if(stage.current)resize.observe(stage.current);
  const contain=(e:FocusEvent)=>{if(modal.open&&!modal.contains(e.target as Node))closeButton.current?.focus();};document.addEventListener('focusin',contain);
  return()=>{resize.disconnect();document.removeEventListener('focusin',contain);modal.close();document.documentElement.style.overflow=previous;if(previousFocus?.isConnected)previousFocus.focus();};
 // Selection is fixed while the dialog is open.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[open]);
 if(!image)return null;
 const close=()=>{drag.current=null;setOpen(false);};
 return <div className={s.gallery}>
  <figure className={s.galleryFigure}><div className={s.galleryStage}><img src={image.src} srcSet={image.srcSet} sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1100px) 48vw, 580px" width={image.width} height={image.height} alt={image.alt} fetchPriority="high" decoding="async"/>{enhanced&&<button ref={opener} type="button" className={s.galleryOpen} aria-haspopup="dialog" aria-controls={id} onClick={()=>{setView({scale:1,x:0,y:0});setImageState('loading');setRetry(n=>n+1);setOpen(true);}}><Icon kind="plus"/>{text.view}</button>}</div>{image.credit&&<figcaption>{image.credit}</figcaption>}</figure>
  {enhanced&&images.length>1&&<div className={s.thumbnails} role="group" aria-label={text.gallery}>{images.map((img,i)=><button key={img.id} type="button" aria-pressed={i===selected} aria-label={img.alt} onClick={()=>setSelected(i)}><img src={catalogThumbnailUrl(img.src)} width={img.width} height={img.height} alt="" loading="lazy" decoding="async"/></button>)}</div>}
  <dialog id={id} ref={dialog} className={s.imageDialog} aria-labelledby={id+'-title'} aria-describedby={id+'-help'} onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===e.currentTarget)close();}} onKeyDown={e=>{if(e.key==='Tab'){const elements=[...e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),[tabindex="0"]')].filter(x=>x.getClientRects().length);const first=elements[0],last=elements.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}}>
   <header className={s.viewerHeader}><h2 id={id+'-title'}>{text.gallery}</h2><button ref={closeButton} type="button" aria-label={text.close} onClick={close}><Icon kind="close"/></button></header>
   <div className={s.viewerStage} ref={stage} tabIndex={0} aria-label={image.alt} onKeyDown={e=>{if(imageState!=='ready')return;const v={...view};if(['+','=','-','0','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='+'||e.key==='=')v.scale+=.25;else if(e.key==='-')v.scale-=.25;else if(e.key==='0'){v.scale=1;v.x=0;v.y=0;}else if(e.key==='ArrowLeft')v.x+=40;else if(e.key==='ArrowRight')v.x-=40;else if(e.key==='ArrowUp')v.y+=40;else v.y-=40;change(v);}}}
    onPointerDown={e=>{if(imageState!=='ready'||view.scale<=1||e.target instanceof Element&&e.target.closest('button'))return;drag.current={pointer:e.pointerId,x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}}
    onPointerMove={e=>{const d=drag.current;if(!d||d.pointer!==e.pointerId)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;d.x=e.clientX;d.y=e.clientY;setView(v=>constrainMomentView({...v,x:v.x+dx,y:v.y+dy},geometry()));}}
    onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
    {open&&<img key={image.src+retry} src={image.src+(image.src.includes('?')?'&':'?')+'memo_detail='+retry} alt={image.alt} draggable={false} style={{transform:`translate(${view.x}px,${view.y}px) scale(${view.scale})`}} onLoad={()=>{setImageState('ready');change({scale:1,x:0,y:0});}} onError={()=>setImageState('error')}/>}
    {imageState!=='ready'&&<div className={s.viewerStatus} role="status"><p>{imageState==='loading'?text.imageLoading:text.imageError}</p>{imageState==='error'&&<button type="button" onClick={()=>{setImageState('loading');setRetry(n=>n+1);}}>{text.retry}</button>}</div>}
   </div>
   <div className={s.viewerToolbar}><button type="button" disabled={imageState!=='ready'||view.scale<=1} aria-label={text.zoom+' −'} onClick={()=>change({...view,scale:view.scale-.25})}><Icon kind="minus"/></button><label><span className={s.srOnly}>{text.zoom}</span><input type="range" min={1} max={3} step={.1} value={view.scale} disabled={imageState!=='ready'} onChange={e=>change({...view,scale:Number(e.target.value)})}/></label><output>{Math.round(view.scale*100)}%</output><button type="button" disabled={imageState!=='ready'||view.scale>=3} aria-label={text.zoom+' +'} onClick={()=>change({...view,scale:view.scale+.25})}><Icon kind="plus"/></button><button type="button" disabled={imageState!=='ready'} aria-label={text.reset} onClick={()=>change({scale:1,x:0,y:0})}><Icon kind="reset"/></button></div>
   <p id={id+'-help'} className={s.viewerHelp}>{text.imageHelp}</p>{image.credit&&<p className={s.viewerHelp}>{image.credit}</p>}
  </dialog>
 </div>;
}
