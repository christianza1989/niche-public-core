export const MEMO_ATTRIBUTION_KEY='memo_attribution_v2';
const windowMs=30*60*1000;
const campaignKeys={utm_source:'campaign_source',utm_medium:'campaign_medium',utm_campaign:'campaign_name',utm_id:'campaign_id',utm_content:'campaign_content'};
const safeValue=v=>typeof v==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(v)&&!/[0-9]{9,}/.test(v);
export function memoAttribution(location,referrer,storage,now=Date.now()){
 const current=new URL(location.href),campaign={};
 for(const [query,key] of Object.entries(campaignKeys)){const values=current.searchParams.getAll(query);if(values.length===1&&safeValue(values[0]))campaign[key]=values[0];}
 let origin='';
 try{const source=new URL(referrer);if(['http:','https:'].includes(source.protocol)&&!source.username&&!source.password&&!source.port&&source.hostname.length<=160&&!/(?:^|\.)(?:memocasting\.lt|stripe\.com|link\.com|paypal\.com)$/.test(source.hostname))origin=source.origin+'/';}catch{}
 const entry={version:2,at:now,...campaign,page_referrer:origin};
 try{
  const cached=JSON.parse(storage.getItem(MEMO_ATTRIBUTION_KEY)||'null');
  if(!Object.keys(campaign).length&&!origin&&cached?.version===2&&Number.isFinite(cached.at)&&cached.at<=now&&now-cached.at<windowMs){
   const restored={};for(const key of Object.values(campaignKeys))if(safeValue(cached[key]))restored[key]=cached[key];
   // Cached origin is validated again; unknown keys and all paths are dropped.
   let clean='';try{const u=new URL(cached.page_referrer);if(u.href===u.origin+'/'&&!u.username&&!u.password&&!u.port&&['http:','https:'].includes(u.protocol))clean=u.href;}catch{}
   return {...restored,page_referrer:clean};
  }
  storage.setItem(MEMO_ATTRIBUTION_KEY,JSON.stringify(entry));
 }catch{}
 return {...campaign,page_referrer:origin};
}

// Only order-authenticated, same-origin withdrawal requests; no external tag.
export function revokeMemoOrderAnalytics(browser){
 try{
  if(browser.location.protocol!=='https:'||browser.location.hostname!=='memocasting.lt'||browser.location.port)return;
  const storage=browser.sessionStorage;
  for(let i=0;i<Math.min(storage.length,50);i++){
   const key=storage.key(i);if(!/^commerce\.production\.[a-zA-Z0-9_-]{1,100}$/.test(key||''))continue;
   let order;try{order=JSON.parse(storage.getItem(key)||'null');}catch{continue;}
   if(order?.version!==1||key!=='commerce.production.'+order.storeId||!/^[-a-zA-Z0-9_]{1,100}$/.test(order.orderId||'')||!/^[-a-zA-Z0-9_]{32,128}$/.test(order.token||''))continue;
   browser.fetch('/prekyba/orders/'+order.orderId+'/analytics',{method:'POST',credentials:'same-origin',cache:'no-store',keepalive:true,headers:{'content-type':'application/json',authorization:'Bearer '+order.token},body:JSON.stringify({choice:'denied',version:2})}).catch(()=>{});
  }
 }catch{}
}

export async function bindMemoOrderAnalytics({browser,client,signal}){
 try{
 if(browser.location.protocol!=='https:'||browser.location.hostname!=='memocasting.lt'||browser.location.port||client.context?.environment!=='production'||!/^[-a-zA-Z0-9_]{1,100}$/.test(client.attempt?.orderId||'')||!/^[-a-zA-Z0-9_]{32,128}$/.test(client.attempt?.token||'')||signal?.aborted)return;
 const context=await browser.__memoAnalytics?.context();
 if(!context||signal?.aborted)return;
 // A final synchronous consent check closes a withdrawal during gtag callbacks.
 if(!browser.__memoAnalytics?.isGranted())return;
  await browser.fetch('/prekyba/orders/'+client.attempt.orderId+'/analytics',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json',authorization:'Bearer '+client.attempt.token},body:JSON.stringify(context),signal:AbortSignal.any([AbortSignal.timeout(1500),...(signal?[signal]:[])])});
 }catch{/* Optional measurement must never stop payment. */}
}
