const dialog=document.querySelector('.sp-dialog');
const dialogContent=dialog?.querySelector('.sp-dialog-content');
document.addEventListener('click',event=>{
  const target=event.target.closest('a,button');if(!target)return;
  if(target.matches('[data-gallery]')){event.preventDefault();const main=target.closest('.sp-gallery').querySelector('.sp-gallery-main');const image=target.querySelector('img').cloneNode();image.setAttribute('loading','eager');image.setAttribute('sizes','(max-width: 720px) calc(100vw - 40px), 540px');main.href=target.href;main.replaceChildren(image);}
  if(target.matches('[data-zoom]')&&dialog){event.preventDefault();const image=document.createElement('img');image.src=target.href;image.alt=target.querySelector('img')?.alt||'';dialogContent.replaceChildren(image);dialog.showModal();}
  if(target.matches('[data-quick]')&&dialog){event.preventDefault();const card=target.closest('.sp-product-card').cloneNode(true);card.querySelector('[data-quick]')?.remove();dialogContent.replaceChildren(card);dialog.showModal();}
  if(target.matches('.sp-dialog-close'))dialog.close();
  if(target.closest('.sp-mobile-nav nav'))target.closest('.sp-mobile-nav').removeAttribute('open');
});
dialog?.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
document.querySelector('.sp-contact-form')?.addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
  const status=form.querySelector('[role=status]'),button=form.querySelector('button[type=submit]');
  button.disabled=true;status.textContent='';
  try{const response=await fetch(form.action,{method:'POST',body:new URLSearchParams(new FormData(form)),headers:{Accept:'application/json'}});const result=await response.json();status.textContent=result.message;if(response.ok)form.reset();}catch{status.textContent='Užklausos išsaugoti nepavyko. Parašykite svetainėje nurodytu el. paštu.';}finally{button.disabled=false;}
});
