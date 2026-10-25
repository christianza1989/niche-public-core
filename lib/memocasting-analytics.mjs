// Memory Casting only. No module-level browser access or third-party requests.
export const MEMO_CONSENT_KEY='memo_analytics_consent_v1';
export const MEMO_CONSENT_BLOCK_KEY='memo_analytics_block_v1';
export const MEMO_CONSENT_DAYS=180;
export const MEMO_ANALYTICS_HOST='memocasting.lt';
const lifetime=MEMO_CONSENT_DAYS*86400000;
const idPattern=/^G-[A-Z0-9]{6,20}$/;
const functional=/(?:^|\/)(?:cart|checkout|uzsakymas)(?:\/|$)/i;
const foreignLocale=/^\/(?:pl|lv|et)(?:\/|$)/i;
export function memoAnalyticsConfig(values={},page={}){
 const id=values.MEMO_GA4_MEASUREMENT_ID;
 if(values.MEMO_GA4_ENABLED!=='1'||typeof id!=='string'||!idPattern.test(id)||page.siteId!=='memocasting'||page.host!==MEMO_ANALYTICS_HOST||page.language!=='lt')return null;
 const path=page.path;
 if(typeof path!=='string'||!/^\/(?!\/)[^?#\\\s]*$/.test(path)||foreignLocale.test(path)||typeof page.title!=='string'||!page.title.trim())return null;
 return {id,path,title:page.title,language:page.language||'lt',track:!page.functional&&!functional.test(path)};
}
export function memoReadConsent(storage,now=Date.now()){
 try{
  // A successful read alone does not prove that a choice can be persisted.
  const probe=MEMO_CONSENT_KEY+'_probe';storage.setItem(probe,'1');storage.removeItem(probe);
  const raw=storage.getItem(MEMO_CONSENT_KEY);
  if(!raw)return {choice:'unknown',available:true};
  const value=JSON.parse(raw);
  if(value.version!==1||!['granted','denied'].includes(value.choice)||!Number.isFinite(value.at)||value.at>now||now-value.at>=lifetime)return {choice:'unknown',available:true};
  return {choice:value.choice,available:true,expiresAt:value.at+lifetime};
 }catch{return {choice:'unknown',available:false};}
}
export function memoAnalyticsPage(config,location){
 try{
  const url=new URL(location.href);
  if(url.protocol!=='https:'||url.hostname!==MEMO_ANALYTICS_HOST||url.port||!config||config.language!=='lt'||config.track===false||!idPattern.test(config.id)||url.pathname!==config.path||foreignLocale.test(url.pathname)||functional.test(url.pathname))return null;
  return {page_location:'https://'+MEMO_ANALYTICS_HOST+config.path,page_referrer:'',page_title:config.title};
 }catch{return null;}
}
export function createMemoAnalytics({browser,document,config,onChange=state=>{void state;},now=()=>Date.now(),reload=()=>browser.location.reload()}){
 let choice='unknown',available=false,script=null,started=false,disposed=false,ownedGtag=null,withdrawn=false,expiresAt=0,expiryTimer=null,needsReload=false,reloadRequested=false;
 const snapshot=()=>({choice,available,active:started});
 const notify=()=>onChange(snapshot());
 const cleanCookies=()=>{
  for(const part of (document.cookie||'').split(';')){
   const name=part.trim().split('=')[0];
   if(!/^_ga(?:_|$)/.test(name))continue;
   for(const domain of ['',MEMO_ANALYTICS_HOST,'.'+MEMO_ANALYTICS_HOST])document.cookie=name+'=; Max-Age=0; Path=/; SameSite=Lax; Secure'+(domain?'; Domain='+domain:'');
  }
 };
 const stop=(refresh=false,clearCookies=true)=>{
  browser['ga-disable-'+config.id]=true;
  const wasStarted=started;started=false;if(wasStarted)needsReload=true;
  if(script){script.remove();script=null;}
  if(ownedGtag&&browser.gtag===ownedGtag){browser.gtag=()=>{};browser.dataLayer=[];}
  if(clearCookies)cleanCookies();
  if(refresh&&wasStarted&&!reloadRequested){reloadRequested=true;reload();}
 };
 const sessionState=()=>{
  try{
   const storage=browser.sessionStorage,probe=MEMO_CONSENT_BLOCK_KEY+'_probe';
   storage.setItem(probe,'1');storage.removeItem(probe);
   return {blocked:storage.getItem(MEMO_CONSENT_BLOCK_KEY)==='1',available:true};
  }catch{return {blocked:true,available:false};}
 };
 const scheduleExpiry=()=>{
  if(expiryTimer!==null)browser.clearTimeout(expiryTimer);expiryTimer=null;
  // Browsers clamp delays above signed32-bit milliseconds (~24.8 days).
  if(!disposed&&choice==='granted'&&available)expiryTimer=browser.setTimeout(()=>sync(),Math.min(2147483647,Math.max(0,expiresAt-now())));
 };
 const start=()=>{
  if(disposed||started||choice!=='granted'||!available)return;
  const page=memoAnalyticsPage(config,browser.location);if(!page)return;
  // Explicit opt-in after an unpersisted withdrawal also needs a fresh runtime.
  if(needsReload){if(!reloadRequested){reloadRequested=true;reload();}return;}
  // Refuse to share an uncontrolled tag/data layer from a second integration.
  if(browser.gtag&&browser.gtag!==ownedGtag)return;
  const queue=[];browser.dataLayer=queue;
  ownedGtag=function(){queue.push(arguments);};browser.gtag=ownedGtag;
  browser['ga-disable-'+config.id]=false;
  ownedGtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  ownedGtag('set',{...page,allow_google_signals:false,allow_ad_personalization_signals:false,ads_data_redaction:true,url_passthrough:false});
  ownedGtag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  ownedGtag('js',new Date(now()));
  ownedGtag('config',config.id,{...page,send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_expires:MEMO_CONSENT_DAYS*86400,cookie_update:false,cookie_domain:MEMO_ANALYTICS_HOST,cookie_path:'/',cookie_flags:'SameSite=Lax;Secure'});
  ownedGtag('event','page_view',{...page,send_to:config.id});
  script=document.createElement('script');script.id='memo-ga4';script.async=true;script.referrerPolicy='no-referrer';script.src='https://www.googletagmanager.com/gtag/js?id='+config.id;
  started=true;document.head.appendChild(script);
 };
 const sync=()=>{
  if(disposed)return;
  let storage;try{storage=browser.localStorage;}catch{}
  const state=memoReadConsent(storage,now()),session=sessionState();
  choice=withdrawn||(session.available&&session.blocked)?'denied':state.choice;available=state.available&&session.available;expiresAt=state.expiresAt||0;
  if(!available&&choice==='granted')choice='unknown';
  if(choice==='granted'&&available)start();else stop(started);
  scheduleExpiry();notify();
 };
 const choose=value=>{
  if(disposed||!['granted','denied'].includes(value))return false;
  if(value==='denied'){
   withdrawn=true;
   // A session-only denial blocks a surviving old grant if localStorage fails.
   try{browser.sessionStorage.setItem(MEMO_CONSENT_BLOCK_KEY,'1');}catch{}
  }
  try{
   const at=now(),raw=JSON.stringify({version:1,choice:value,at});browser.localStorage.setItem(MEMO_CONSENT_KEY,raw);
   if(browser.localStorage.getItem(MEMO_CONSENT_KEY)!==raw)throw new Error('consent_not_persisted');
   if(value==='granted'){
    browser.sessionStorage.removeItem(MEMO_CONSENT_BLOCK_KEY);
    const session=sessionState();if(!session.available||session.blocked)throw new Error('session_storage_unavailable');
    withdrawn=false;
   }
   expiresAt=at+lifetime;
   available=true;choice=value;
  }catch{
   available=false;choice=value==='denied'?'denied':'unknown';
   try{browser.localStorage.removeItem(MEMO_CONSENT_KEY);}catch{}
  }
  if(choice==='granted'&&available)start();else stop(started&&available);
  scheduleExpiry();notify();return available;
 };
 const checkLocation=()=>{if(started&&!memoAnalyticsPage(config,browser.location)){stop(true,false);notify();}};
 const storageChanged=event=>{if(event.key===MEMO_CONSENT_KEY||event.key===null)sync();};
 const resume=()=>{if(document.visibilityState!=='hidden')sync();};
 browser.addEventListener('storage',storageChanged);browser.addEventListener('popstate',checkLocation);browser.addEventListener('pageshow',resume);browser.addEventListener('focus',resume);document.addEventListener('visibilitychange',resume);
 sync();
 // Memo links perform full document navigation. If a client transition ever
 // unmounts this integration, unload Google's existing runtime rather than
 // initialize a second copy with stale automatic-event listeners. Consent and
 // analytics cookies survive ordinary navigation; only withdrawal clears them.
 return {snapshot,choose,checkLocation,dispose(){disposed=true;browser.removeEventListener('storage',storageChanged);browser.removeEventListener('popstate',checkLocation);browser.removeEventListener('pageshow',resume);browser.removeEventListener('focus',resume);document.removeEventListener('visibilitychange',resume);if(expiryTimer!==null)browser.clearTimeout(expiryTimer);if(started)stop(true,false);}};
}
