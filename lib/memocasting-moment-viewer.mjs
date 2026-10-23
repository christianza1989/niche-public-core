const finite=(value,fallback=0)=>Number.isFinite(value)?value:fallback;
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
export function momentImageGeometry(width,height,imageWidth,imageHeight){
 const w=Math.max(1,finite(width,1)),h=Math.max(1,finite(height,1));
 const ratio=Math.max(1,finite(imageWidth,1))/Math.max(1,finite(imageHeight,1));
 const fittedWidth=Math.min(w,h*ratio);
 return {width:w,height:h,fittedWidth,fittedHeight:fittedWidth/ratio};
}
export function constrainMomentView(view,geometry){
 const scale=clamp(finite(view.scale,1),1,3);
 const limitX=Math.max(0,(geometry.fittedWidth*scale-geometry.width)/2);
 const limitY=Math.max(0,(geometry.fittedHeight*scale-geometry.height)/2);
 return {scale,x:clamp(finite(view.x),-limitX,limitX)||0,y:clamp(finite(view.y),-limitY,limitY)||0};
}
export function focusMomentDetail(point,geometry,scale=2.2){
 return constrainMomentView({scale,x:(.5-point.x)*geometry.fittedWidth*scale,y:(.5-point.y)*geometry.fittedHeight*scale},geometry);
}
const detailPoints={couple:{x:.4,y:.53},family:{x:.39,y:.49},gift:{x:.4,y:.46}};
const labels={couple:'Dviese',family:'Su šeima',gift:'Dovanai'};
const plus='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg>';
export function mountMomentViewer(root){
 const scene=root.querySelector('.moment-scene');
 if(!scene)return()=>{};
 const dialog=document.createElement('dialog');
 if(typeof dialog.showModal!=='function')return()=>{};
 const abort=new AbortController(),on=(node,type,fn,options={})=>node.addEventListener(type,fn,{...options,signal:abort.signal});
 const hotspot=document.createElement('button');hotspot.type='button';hotspot.className='moment-detail-hotspot';hotspot.innerHTML=plus;hotspot.setAttribute('aria-label','Priartinti skulptūros detales');hotspot.setAttribute('aria-haspopup','dialog');hotspot.setAttribute('aria-controls','memo-moment-details');scene.append(hotspot);
 const action=document.createElement('button');action.type='button';action.className='moment-detail-action';action.innerHTML='Apžiūrėti detales '+plus;action.setAttribute('aria-haspopup','dialog');action.setAttribute('aria-controls','memo-moment-details');scene.after(action);
 dialog.id='memo-moment-details';dialog.className='memo-moment-dialog';dialog.setAttribute('aria-labelledby','memo-detail-title');dialog.setAttribute('aria-describedby','memo-detail-help');
 dialog.innerHTML='<header class="moment-viewer-header"><div><p class="moment-viewer-choice"></p><h2 id="memo-detail-title">Skulptūros detalės</h2></div><button type="button" class="moment-viewer-close" aria-label="Uždaryti detalių peržiūrą" autofocus><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header><div class="moment-viewer-stage" tabindex="0" aria-label="Skulptūros vaizdas"><img draggable="false" decoding="async"><div class="moment-viewer-status" role="status"><p>Įkeliamas vaizdas…</p><button type="button" hidden>Bandyti dar kartą</button></div></div><div class="moment-viewer-toolbar"><button type="button" class="moment-zoom-out" aria-label="Atitolinti"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg></button><label class="moment-zoom-range"><input type="range" min="1" max="3" step="0.1" value="1" aria-label="Priartinimas"><output>100 %</output></label><button type="button" class="moment-zoom-in" aria-label="Priartinti">'+plus+'</button><button type="button" class="moment-zoom-reset" aria-label="Grąžinti pradinį vaizdą"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/></svg></button></div><p id="memo-detail-help" class="moment-viewer-help">Priartinkite ir tempkite vaizdą. Klaviatūra: +, −, rodyklės; 0 — pradinis vaizdas.</p><p class="moment-viewer-caption">Įkvėpimo iliustracija.</p>';
 root.append(dialog);
 const stage=dialog.querySelector('.moment-viewer-stage'),image=stage.querySelector('img'),status=dialog.querySelector('.moment-viewer-status'),retry=status.querySelector('button'),slider=dialog.querySelector('input'),output=dialog.querySelector('output'),minus=dialog.querySelector('.moment-zoom-out'),more=dialog.querySelector('.moment-zoom-in'),reset=dialog.querySelector('.moment-zoom-reset'),close=dialog.querySelector('.moment-viewer-close');
 let disposed=false,view={scale:1,x:0,y:0},opener=null,locked=false,previousOverflow='',source='',pendingPoint=null,retries=0;
 const pointers=new Map();
 const geometry=()=>momentImageGeometry(stage.clientWidth,stage.clientHeight,image.naturalWidth||1448,image.naturalHeight||1086);
 function render(next=view){view=constrainMomentView(next,geometry());image.style.transform=`translate(${view.x}px,${view.y}px) scale(${view.scale})`;stage.classList.toggle('is-zoomed',view.scale>1);slider.value=String(view.scale);output.value=Math.round(view.scale*100)+' %';slider.setAttribute('aria-valuetext',output.value);const usable=status.hidden&&image.naturalWidth>0;minus.disabled=!usable||view.scale<=1;more.disabled=!usable||view.scale>=3;reset.disabled=slider.disabled=!usable;}
 function selected(){return scene.querySelector('.moment-image.is-current')||scene.querySelector('[data-moment-image="couple"]');}
 function updateHotspot(){const point=detailPoints[selected()?.dataset.momentImage]||detailPoints.couple;hotspot.style.left=point.x*100+'%';hotspot.style.top=point.y*100+'%';}
 function loaded(){if(disposed||!dialog.open)return;status.hidden=true;stage.setAttribute('aria-busy','false');image.style.visibility='visible';if(pendingPoint){render(focusMomentDetail(pendingPoint,geometry()));pendingPoint=null;}else render();}
 function load(retryRequest=false){status.hidden=false;status.querySelector('p').textContent='Įkeliamas vaizdas…';retry.hidden=true;stage.setAttribute('aria-busy','true');image.style.visibility='hidden';render();image.src=retryRequest?source+(source.includes('?')?'&':'?')+'detail-retry='+ ++retries:source;if(image.complete&&image.naturalWidth)loaded();}
 function open(from,detail=false){const current=selected();if(!current)return;opener=from;source=current.getAttribute('src');image.alt=current.alt;dialog.querySelector('.moment-viewer-choice').textContent=labels[current.dataset.momentImage]||labels.couple;view={scale:1,x:0,y:0};pendingPoint=detail?(detailPoints[current.dataset.momentImage]||detailPoints.couple):null;pointers.clear();dialog.showModal();previousOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';locked=true;render();load();}
 function finish(){pointers.clear();stage.classList.remove('is-dragging');if(locked){document.documentElement.style.overflow=previousOverflow;locked=false;}if(opener?.isConnected&&!disposed)opener.focus({preventScroll:true});}
 on(action,'click',()=>open(action));on(hotspot,'click',()=>open(hotspot,true));on(close,'click',()=>dialog.close());on(dialog,'close',finish);
 on(dialog,'click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
 on(image,'load',loaded);on(image,'error',()=>{if(!dialog.open)return;status.hidden=false;status.querySelector('p').textContent='Vaizdo nepavyko įkelti.';retry.hidden=false;stage.setAttribute('aria-busy','false');image.style.visibility='hidden';render();});
 on(retry,'click',()=>load(true));
 on(minus,'click',()=>render({...view,scale:view.scale-.5}));on(more,'click',()=>render({...view,scale:view.scale+.5}));on(reset,'click',()=>render({scale:1,x:0,y:0}));on(slider,'input',()=>render({...view,scale:Number(slider.value)}));
 on(stage,'dblclick',event=>{if(!status.hidden||event.target.closest?.('button,input'))return;render({scale:view.scale>1?1:2,x:0,y:0});});
 on(stage,'wheel',event=>{if(!status.hidden)return;event.preventDefault();render({...view,scale:view.scale-Math.sign(event.deltaY)*.15});},{passive:false});
 on(stage,'pointerdown',event=>{if(event.button!==0||pointers.size>=2||!status.hidden||event.target.closest?.('button,input'))return;event.preventDefault();stage.focus({preventScroll:true});stage.setPointerCapture(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});stage.classList.add('is-dragging');});
 on(stage,'pointermove',event=>{const previous=pointers.get(event.pointerId);if(!previous)return;const before=[...pointers.values()];pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const after=[...pointers.values()];if(after.length===1){render({...view,x:view.x+event.clientX-previous.x,y:view.y+event.clientY-previous.y});return;}const distance=points=>Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y),oldDistance=distance(before);if(oldDistance<1)return;const center=points=>({x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2}),a=center(before),b=center(after),r=stage.getBoundingClientRect(),ox=r.left+r.width/2,oy=r.top+r.height/2,scale=clamp(view.scale*distance(after)/oldDistance,1,3),ratio=scale/view.scale;render({scale,x:b.x-ox-(a.x-ox-view.x)*ratio,y:b.y-oy-(a.y-oy-view.y)*ratio});});
 function release(event){pointers.delete(event.pointerId);if(!pointers.size)stage.classList.remove('is-dragging');}
 on(stage,'pointerup',release);on(stage,'pointercancel',release);on(stage,'lostpointercapture',release);
 on(dialog,'keydown',event=>{if(event.key==='Tab'){const items=[...dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),[tabindex="0"]')].filter(el=>!el.hidden&&el.getClientRects().length);const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}return;}if(event.ctrlKey||event.metaKey||event.altKey||event.target===slider)return;let next;if(event.key==='+'||event.key==='=')next={...view,scale:view.scale+.5};else if(event.key==='-')next={...view,scale:view.scale-.5};else if(event.key==='0')next={scale:1,x:0,y:0};else if(event.target===stage&&view.scale>1){const shifts={ArrowLeft:[50,0],ArrowRight:[-50,0],ArrowUp:[0,50],ArrowDown:[0,-50]},shift=shifts[event.key];if(shift)next={...view,x:view.x+shift[0],y:view.y+shift[1]};}if(next){event.preventDefault();render(next);}});
 const resize=typeof ResizeObserver==='undefined'?null:new ResizeObserver(()=>{if(dialog.open)render();});resize?.observe(stage);
 root.querySelectorAll('[data-moment]').forEach(button=>on(button,'click',updateHotspot));updateHotspot();
 return()=>{disposed=true;if(dialog.open)dialog.close();finish();abort.abort();resize?.disconnect();dialog.remove();hotspot.remove();action.remove();};
}
