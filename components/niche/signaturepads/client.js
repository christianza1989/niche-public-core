(function clientController(){
  const root=document.querySelector('.signaturepads-site');
  if(!root||root.dataset.spReady==='true')return;
  root.dataset.spReady='true';
  const preference=document.querySelector('#contact-preference'),phone=document.querySelector('#contact-phone');
  preference?.addEventListener('change',()=>{if(phone)phone.required=preference.value==='Telefonu';});
  document.querySelector('.sp-contact-form')?.addEventListener('reset',()=>{if(phone)phone.required=false;});
  const quickDialog=root.querySelector('.sp-product-dialog'),imageDialog=root.querySelector('.sp-image-dialog');
  const quickContent=quickDialog?.querySelector('.sp-dialog-content'),imageContent=imageDialog?.querySelector('.sp-dialog-content');
  const returnFocus=new WeakMap();
  let quickRequest;
  const show=(dialog,trigger,name)=>{
    dialog.setAttribute('aria-label',name||'Greita peržiūra');
    returnFocus.set(dialog,trigger);
    if(!dialog.open)dialog.showModal();
  };
  const openQuick=async trigger=>{
    const url=new URL(trigger.href,location.href);
    if(url.origin!==location.origin||!url.pathname.startsWith('/produktas/'))return;
    quickRequest?.abort();
    const controller=new AbortController();quickRequest=controller;
    const timeout=setTimeout(()=>controller.abort(),10000);
    const title=trigger.closest('.sp-product-card')?.querySelector('h3')?.textContent.trim()||'Greita peržiūra';
    const fallback=document.createElement('a');fallback.href=url.href;fallback.textContent=title;fallback.className='sp-quick-fallback';
    quickContent.replaceChildren(fallback);quickDialog.setAttribute('aria-busy','true');
    show(quickDialog,trigger,title);
    try{
      const response=await fetch(url.href,{signal:controller.signal,headers:{Accept:'text/html'}});
      if(!response.ok)throw Error('Quick view unavailable');
      const doc=new DOMParser().parseFromString(await response.text(),'text/html'),product=doc.querySelector('.sp-product');
      if(!product)throw Error('Product view unavailable');
      if(controller.signal.aborted||!quickDialog.open)return;
      const imported=document.importNode(product,true),heading=imported.querySelector('.sp-product-copy h1');
      if(heading){const h2=document.createElement('h2');h2.className='sp-quick-title';h2.textContent=heading.textContent;heading.replaceWith(h2);}
      quickContent.replaceChildren(imported);
      quickDialog.setAttribute('aria-label',imported.querySelector('.sp-quick-title')?.textContent||title);
    }catch(error){
      if(error.name!=='AbortError'&&quickDialog.open)quickContent.replaceChildren(fallback);
    }finally{
      clearTimeout(timeout);
      if(quickRequest===controller)quickDialog.removeAttribute('aria-busy');
    }
  };
  root.classList.add('sp-js');
  for(const form of root.querySelectorAll('.sp-price-filter')){
    const minimum=form.querySelector('[name=min_price]'),maximum=form.querySelector('[name=max_price]');
    const update=event=>{
      if(+minimum.value>+maximum.value){if(event?.target===minimum)minimum.value=maximum.value;else maximum.value=minimum.value;}
      const span=+minimum.max-+minimum.min||1;
      form.style.setProperty('--sp-price-low',((+minimum.value-+minimum.min)/span*100)+'%');
      form.style.setProperty('--sp-price-high',((+maximum.value-+maximum.min)/span*100)+'%');
      const money=n=>(+n).toLocaleString('lt-LT',{maximumFractionDigits:2})+'€';
      form.querySelector('output').textContent=money(minimum.value)+' — '+money(maximum.value);
    };
    minimum.addEventListener('input',update);maximum.addEventListener('input',update);update();
  }
  for(const form of root.querySelectorAll('[data-catalogue-sort]'))form.querySelector('select').addEventListener('change',()=>form.requestSubmit());
  const toTop=root.querySelector('.sp-top'),updateTop=()=>{if(toTop)toTop.hidden=window.scrollY<350;};
  window.addEventListener('scroll',updateTop,{passive:true});updateTop();
  root.addEventListener('click',event=>{
    const target=event.target.closest('a,button');if(!target)return;
    if(target.matches('[data-gallery]')){
      event.preventDefault();
      const gallery=target.closest('.sp-gallery'),main=gallery.querySelector('.sp-gallery-main'),image=target.querySelector('img').cloneNode(),control=main.querySelector('.sp-zoom-icon')?.cloneNode(true);
      const width=Number(target.dataset.displayWidth)||550;
      image.setAttribute('loading','eager');image.setAttribute('sizes',`(max-width: 720px) min(calc(100vw - 20px), ${width}px), ${width}px`);
      main.style.setProperty('--sp-gallery-width',width+'px');main.href=target.href;main.replaceChildren(image,...(control?[control]:[]));
      for(const link of gallery.querySelectorAll('[data-gallery]')){if(link===target)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');}
    }
    if(target.matches('[data-zoom]')&&imageDialog){
      event.preventDefault();const image=document.createElement('img');image.src=target.href;image.alt=target.querySelector('img')?.alt||'';
      imageContent.replaceChildren(image);
      const title=target.closest('.sp-product')?.querySelector('.sp-product-copy h1,.sp-quick-title')?.textContent||image.alt;
      show(imageDialog,target,title);
    }
    if(target.matches('[data-quick]')&&quickDialog){event.preventDefault();void openQuick(target);}
    if(target.matches('.sp-dialog-close'))target.closest('dialog').close();
    if(target.matches('.sp-top')){event.preventDefault();window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
    if(target.closest('.sp-mobile-nav nav'))target.closest('.sp-mobile-nav').removeAttribute('open');
  });
  for(const dialog of [quickDialog,imageDialog].filter(Boolean)){
    dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
    dialog.addEventListener('close',()=>{
      if(dialog===quickDialog){quickRequest?.abort();quickDialog.removeAttribute('aria-busy');}
      const trigger=returnFocus.get(dialog);if(trigger?.isConnected)trigger.focus({preventScroll:true});
    });
  }
  root.querySelector('.sp-contact-form')?.addEventListener('submit',async event=>{
    event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
    const status=form.querySelector('[role=status]'),button=form.querySelector('button[type=submit]');
    button.disabled=true;status.textContent='';
    try{const response=await fetch(form.action,{method:'POST',body:new URLSearchParams(new FormData(form)),headers:{Accept:'application/json'}});const result=await response.json();status.textContent=result.message;if(response.ok){form.reset();const token=form.elements.namedItem('inquiry_id');if(token&&crypto.randomUUID)token.value=crypto.randomUUID();}}catch{status.textContent='Užklausos išsaugoti nepavyko. Parašykite svetainėje nurodytu el. paštu.';}finally{button.disabled=false;}
  });
})();
