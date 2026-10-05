// First-party aggregate counters: no cookies, visitor identifiers or form data.
export function InterestTracking() {
  const code = `(function(){
if(window.__nicheInterest)return;window.__nicheInterest=true;
if(navigator.doNotTrack==='1'||navigator.globalPrivacyControl===true)return;
function send(event){fetch('/ivykius',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event:event,path:location.pathname}),keepalive:true,credentials:'omit'}).catch(function(){});}
send('pageview');
document.addEventListener('click',function(e){var a=e.target instanceof Element?e.target.closest('a[href]'):null;if(!a)return;var href=a.getAttribute('href')||'';if(href.indexOf('mailto:')===0)send('email_click');else if(href.indexOf('tel:')===0)send('phone_click');});
})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
