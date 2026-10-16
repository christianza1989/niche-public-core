(() => {
 if(navigator.globalPrivacyControl||navigator.doNotTrack==='1')return;
 const path=location.pathname.replace(/\/+$/,'')||'/';
 const send=event=>fetch('/ivykius',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event,path}),keepalive:true}).catch(()=>{});
 send('pageview');
 document.addEventListener('click',event=>{const href=event.target.closest('a')?.getAttribute('href')||'';if(href.startsWith('mailto:'))send('email_click');else if(href.startsWith('tel:'))send('phone_click');});
})();
