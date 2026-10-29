(() => {
const root=document.querySelector('.signaturepads-site');
if(!root||root.dataset.spReady==='true')return;
root.dataset.spReady='true';
const preference=document.querySelector('#contact-preference'),phone=document.querySelector('#contact-phone');
preference?.addEventListener('change',()=>{if(phone)phone.required=preference.value==='Telefonu';});
document.querySelector('.sp-contact-form')?.addEventListener('reset',()=>{if(phone)phone.required=false;});
const dialog=document.querySelector('.sp-dialog');
const dialogContent=dialog?.querySelector('.sp-dialog-content');
document.querySelector('.signaturepads-site')?.classList.add('sp-js');
for(const form of document.querySelectorAll('.sp-price-filter')){
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
for(const form of document.querySelectorAll('[data-catalogue-sort]'))form.querySelector('select').addEventListener('change',()=>form.requestSubmit());
const toTop=document.querySelector('.sp-top');
const updateTop=()=>{if(toTop)toTop.hidden=window.scrollY<350;};
window.addEventListener('scroll',updateTop,{passive:true});updateTop();
document.addEventListener('click',event=>{
  const target=event.target.closest('a,button');if(!target)return;
  if(target.matches('[data-gallery]')){event.preventDefault();const main=target.closest('.sp-gallery').querySelector('.sp-gallery-main');const image=target.querySelector('img').cloneNode();const control=main.querySelector('.sp-zoom-icon')?.cloneNode(true);image.setAttribute('loading','eager');image.setAttribute('sizes','(max-width: 720px) calc(100vw - 40px), 540px');main.href=target.href;main.replaceChildren(image,...(control?[control]:[]));}
  if(target.matches('[data-zoom]')&&dialog){event.preventDefault();const image=document.createElement('img');image.src=target.href;image.alt=target.querySelector('img')?.alt||'';dialogContent.replaceChildren(image);dialog.showModal();}
  if(target.matches('[data-quick]')&&dialog){event.preventDefault();const card=target.closest('.sp-product-card').cloneNode(true);card.querySelector('[data-quick]')?.remove();dialogContent.replaceChildren(card);dialog.showModal();}
  if(target.matches('.sp-dialog-close'))dialog.close();
  if(target.matches('.sp-top')){event.preventDefault();window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  if(target.closest('.sp-mobile-nav nav'))target.closest('.sp-mobile-nav').removeAttribute('open');
});
dialog?.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
document.querySelector('.sp-contact-form')?.addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
  const status=form.querySelector('[role=status]'),button=form.querySelector('button[type=submit]');
  button.disabled=true;status.textContent='';
  try{const response=await fetch(form.action,{method:'POST',body:new URLSearchParams(new FormData(form)),headers:{Accept:'application/json'}});const result=await response.json();status.textContent=result.message;if(response.ok){form.reset();const token=form.elements.namedItem('inquiry_id');if(token&&crypto.randomUUID)token.value=crypto.randomUUID();}}catch{status.textContent='Užklausos išsaugoti nepavyko. Parašykite svetainėje nurodytu el. paštu.';}finally{button.disabled=false;}
});
})();
