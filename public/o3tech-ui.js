/* Site-local progressive controls. No dependencies, tracking or remote calls. */
(()=>{
 const root=document.querySelector('.o3');if(!root||root.dataset.controlsReady)return;root.dataset.controlsReady='true';
 const dialog=root.querySelector('.o3-lightbox'),content=dialog?.querySelector('.o3-dialog-content');let opener=null,frames=[],frame=0;
 function showFrame(){if(!content||!frames.length)return;const image=document.createElement('img');image.alt=frames[frame].alt;image.src=frames[frame].closest('a').href;image.loading='eager';image.decoding='async';const count=document.createElement('span');count.className='o3-gallery-count';count.textContent=(frame+1)+' / '+frames.length;count.setAttribute('aria-hidden','true');const caption=document.createElement('span');caption.className='o3-gallery-caption';caption.textContent=image.alt;caption.setAttribute('aria-hidden','true');content.replaceChildren(image,count,caption);}
 function openGallery(gallery,trigger){frames=[...gallery.querySelectorAll('.o3-thumbnails img')];if(!frames.length)frames=[gallery.querySelector('.o3-gallery-main img')].filter(Boolean);if(!frames.length)return;frame=Number(gallery.querySelector('[data-gallery-thumb][aria-current=true]')?.dataset.galleryThumb)||0;if(!dialog.open)opener=trigger;dialog.dataset.mode='gallery';showFrame();dialog.showModal();}
 function selectThumb(link){const gallery=link.closest('.o3-gallery'),main=gallery.querySelector('.o3-gallery-main'),source=link.querySelector('img'),image=main.querySelector('img');image.src=source.src;if(source.srcset)image.srcset=source.srcset;image.sizes='(max-width:767px) 92vw,550px';image.alt=source.alt;main.href=link.href;gallery.querySelectorAll('[data-gallery-thumb]').forEach(a=>a.setAttribute('aria-current',String(a===link)));}
 function close(){if(document.fullscreenElement===root)document.exitFullscreen().catch(()=>{});dialog?.close();opener?.focus();}
 root.addEventListener('click',async e=>{
  const single=e.target.closest('[data-single-image]');if(single){e.preventDefault();frames=[single.querySelector('img')];frame=0;opener=single;dialog.dataset.mode='single';showFrame();dialog.showModal();return;}
  const thumb=e.target.closest('[data-gallery-thumb]');if(thumb){e.preventDefault();selectThumb(thumb);return;}
  const galleryLink=e.target.closest('[data-gallery-open]');if(galleryLink){e.preventDefault();openGallery(galleryLink.closest('.o3-gallery'),galleryLink);return;}
  const quick=e.target.closest('[data-quick-view]');if(quick){
   e.preventDefault();if(quick.dataset.busy)return;quick.dataset.busy='true';
   const url=new URL(quick.dataset.quickView,location.origin);if(url.origin!==location.origin||!url.pathname.startsWith('/produktas/'))return;
   quick.disabled=true;
   try{const response=await fetch(url,{signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('Unavailable product');const doc=new DOMParser().parseFromString(await response.text(),'text/html'),detail=doc.querySelector('.o3-product-detail');if(!detail)throw Error('Unavailable product');
    detail.querySelectorAll('script,iframe,object,embed').forEach(e=>e.remove());detail.querySelectorAll('h1').forEach(h=>{const h2=document.createElement('h2');h2.className='o3-quick-title';h2.textContent=h.textContent;h.replaceWith(h2);});content.replaceChildren(detail);opener=quick;dialog.dataset.mode='quick';dialog.showModal();
   }catch{location.href=url.href;}finally{quick.disabled=false;delete quick.dataset.busy;}return;
  }
  if(e.target.closest('.o3-dialog-close'))close();
  if(e.target.closest('.o3-dialog-fullscreen')){try{if(document.fullscreenElement===root)await document.exitFullscreen();else await root.requestFullscreen();}catch{}}
  if(e.target.closest('.o3-dialog-prev')){frame=(frame+frames.length-1)%frames.length;showFrame();}
  if(e.target.closest('.o3-dialog-next')){frame=(frame+1)%frames.length;showFrame();}
 });
 dialog?.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
 dialog?.addEventListener('close',()=>{if(document.fullscreenElement===root)document.exitFullscreen().catch(()=>{});opener?.focus();});
 if(dialog&&(!root.requestFullscreen||!document.fullscreenEnabled))dialog.querySelector('.o3-dialog-fullscreen')?.setAttribute('hidden','');
 dialog?.addEventListener('keydown',e=>{if(dialog.dataset.mode!=='gallery')return;if(e.key==='ArrowLeft'){frame=(frame+frames.length-1)%frames.length;showFrame();}if(e.key==='ArrowRight'){frame=(frame+1)%frames.length;showFrame();}});
 root.querySelectorAll('.o3-price-filter').forEach(form=>{form.addEventListener('input',e=>{const min=form.elements.min_price,max=form.elements.max_price;if(+min.value>+max.value){if(e.target===min)max.value=min.value;else min.value=max.value;}form.querySelector('output').textContent=min.value+'€ — '+max.value+'€';});});
 root.querySelectorAll('.o3-desktop-nav .o3-categories').forEach(menu=>{menu.addEventListener('pointerenter',()=>{if(matchMedia('(hover:hover)').matches)menu.open=true;});menu.addEventListener('pointerleave',()=>{if(!menu.contains(document.activeElement))menu.open=false;});});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')root.querySelectorAll('details[open]').forEach(d=>d.open=false);});
 document.addEventListener('click',e=>{const menu=root.querySelector('.o3-mobile-nav');if(menu?.open&&!menu.contains(e.target))menu.open=false;});
})();
