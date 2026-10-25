import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {memoAnalyticsConfig,memoAnalyticsPage,memoReadConsent,createMemoAnalytics,MEMO_CONSENT_KEY,MEMO_CONSENT_BLOCK_KEY,MEMO_CONSENT_DAYS} from '../lib/memocasting-analytics.mjs';

// Synthetic IDs exist only in tests; no real service is called by these fixtures.
const values={MEMO_GA4_ENABLED:'1',MEMO_GA4_MEASUREMENT_ID:'G-TEST000001'};
const page={host:'memocasting.lt',siteId:'memocasting',path:'/gidai/dovana-mamai',title:'Dovana mamai',language:'lt'};
const config=memoAnalyticsConfig(values,page),time=1792900000000;
function fixture({href='https://memocasting.lt/gidai/dovana-mamai?email=private%40example.test&client_secret=secret#private',stored,storageFails=false,storageGetterFails=false,sessionFails=false,sessionBlocked=false}={}){
 const map=new Map(stored?[[MEMO_CONSENT_KEY,stored]]:[]),session=new Map(sessionBlocked?[[MEMO_CONSENT_BLOCK_KEY,'1']]:[]),listeners=new Map(),requests=[],cookieWrites=[],timers=new Map();
 const storage={getItem:key=>{if(storageFails)throw Error('unavailable');return map.get(key)??null;},setItem:(key,value)=>{if(storageFails)throw Error('unavailable');map.set(key,value);},removeItem:key=>{if(storageFails)throw Error('unavailable');map.delete(key);}};
 const document={visibilityState:'visible',addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener:key=>listeners.delete(key),createElement:()=>({remove(){this.removed=true;}}),head:{appendChild:script=>requests.push(script)},get cookie(){return '_ga=old; _ga_TEST000001=old; essential_cart=keep';},set cookie(value){cookieWrites.push(value);}};
 let reloads=0,clock=time,timerId=0;
 const browser={location:{href,reload:()=>reloads++},addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener:key=>listeners.delete(key),setTimeout:(fn,delay)=>{timers.set(++timerId,{fn,delay});return timerId;},clearTimeout:id=>timers.delete(id),sessionStorage:{getItem:key=>{if(sessionFails)throw Error('blocked');return session.get(key)??null;},setItem:(key,value)=>{if(sessionFails)throw Error('blocked');session.set(key,value);},removeItem:key=>{if(sessionFails)throw Error('blocked');session.delete(key);}}};
 Object.defineProperty(browser,'localStorage',{get(){if(storageGetterFails)throw Error('blocked');return storage;}});
 const states=[],instance=createMemoAnalytics({browser,document,config,now:()=>clock,onChange:state=>states.push(state)});
 return {browser,document,map,session,storage,requests,cookieWrites,states,instance,listeners,timers,setClock:value=>clock=value,reloads:()=>reloads};
}
const stored=(choice,at=time)=>JSON.stringify({version:1,choice,at});
test('React19 hoists the nested server referrer metadata into the real head before the body',()=>{
 const h=React.createElement,html=renderToStaticMarkup(h('html',null,h('head',null,h('title',null,'Approved public title')),h('body',null,h('footer',null,h('meta',{name:'referrer',content:'no-referrer'})))));
 const head=html.match(/<head>([\s\S]*?)<\/head>/)?.[1],body=html.match(/<body>([\s\S]*?)<\/body>/)?.[1];
 assert.match(head,/<meta name="referrer" content="no-referrer"\/>/);assert.doesNotMatch(body,/<meta/);
});
test('configuration is off by default and rejects foreign site/host and unsafe configuration',()=>{
 assert.equal(memoAnalyticsConfig({},page),null);
 for(const bad of [{...values,MEMO_GA4_ENABLED:'true'},{...values,MEMO_GA4_MEASUREMENT_ID:'G-x<script>'}])assert.equal(memoAnalyticsConfig(bad,page),null);
 for(const bad of [{...page,siteId:'foreign'},{...page,host:'evil.test'},{...page,path:'//evil.test'},{...page,path:'/ok?client_secret=x'},{...page,path:'/ok#x'},{...page,path:'/ok\\evil'}])assert.equal(memoAnalyticsConfig(values,bad),null);
});
test('fresh visitor makes zero script requests and receives no tracking function',()=>{
 const f=fixture();assert.equal(f.requests.length,0);assert.equal(f.browser.gtag,undefined);assert.equal(f.instance.snapshot().choice,'unknown');f.instance.dispose();
});
test('reject and persisted reject make zero requests',()=>{
 const f=fixture();assert.equal(f.instance.choose('denied'),true);assert.equal(f.requests.length,0);assert.equal(JSON.parse(f.map.get(MEMO_CONSENT_KEY)).choice,'denied');
 const revisit=fixture({stored:stored('denied')});assert.equal(revisit.requests.length,0);assert.equal(revisit.instance.snapshot().choice,'denied');
});
test('only persisted explicit grant loads one tag with no referrer and sanitized defaults/event',()=>{
 const f=fixture();assert.equal(f.instance.choose('granted'),true);assert.equal(f.requests.length,1);assert.equal(f.requests[0].referrerPolicy,'no-referrer');
 const queue=f.browser.dataLayer.map(args=>Array.from(args)),cfg=queue.find(args=>args[0]==='config')[2],event=queue.find(args=>args[0]==='event');
 assert.equal(cfg.page_location,'https://memocasting.lt/gidai/dovana-mamai');assert.equal(cfg.page_referrer,'');assert.equal(cfg.send_page_view,false);assert.equal(cfg.cookie_expires,180*86400);assert.equal(cfg.cookie_update,false);
 assert.equal(cfg.allow_google_signals,false);assert.equal(cfg.allow_ad_personalization_signals,false);
 assert.deepEqual(queue[0][2],{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
 assert.equal(event[1],'page_view');assert.equal(event[2].page_location,cfg.page_location);
 assert.doesNotMatch(JSON.stringify(queue),/private|client_secret|user_id|email/);
 f.instance.choose('granted');assert.equal(f.requests.length,1);
});
test('valid persisted grant loads, expired/malformed/future/unsupported preferences do not',()=>{
 assert.equal(fixture({stored:stored('granted')}).requests.length,1);
 for(const raw of ['{',stored('granted',time+1),stored('granted',time-MEMO_CONSENT_DAYS*86400000),JSON.stringify({version:9,choice:'granted',at:time})])assert.equal(fixture({stored:raw}).requests.length,0);
});
test('storage denied on read/write or property access fails closed, including explicit grant',()=>{
 for(const flags of [{storageFails:true},{storageGetterFails:true},{sessionFails:true}]){const f=fixture({...flags,stored:stored('granted')});assert.equal(f.requests.length,0);assert.equal(f.instance.choose('granted'),false);assert.equal(f.requests.length,0);assert.equal(f.instance.snapshot().available,false);}
 assert.equal(memoReadConsent(undefined,time).available,false);
});
test('foreign host, HTTP and mismatched route never load even with stored grant',()=>{
 for(const href of ['https://foreign.test/gidai/dovana-mamai','http://memocasting.lt/gidai/dovana-mamai','https://memocasting.lt/cart?client_secret=x','https://memocasting.lt/customer/token'])assert.equal(fixture({href,stored:stored('granted')}).requests.length,0);
});
test('functional routes keep preference control but cannot produce pageview',()=>{
 for(const path of ['/cart','/checkout','/uzsakymas']){const c=memoAnalyticsConfig(values,{...page,path});assert.equal(c.track,false);assert.equal(memoAnalyticsPage(c,{href:'https://memocasting.lt'+path}),null);}
});
test('other locales have no configuration or loader even after a Lithuanian grant',()=>{
 for(const language of ['pl','lv','et','unknown',undefined])assert.equal(memoAnalyticsConfig(values,{...page,language}),null);
 for(const path of ['/pl','/pl/cart','/lv/gidai','/et/kontaktai'])assert.equal(memoAnalyticsConfig(values,{...page,path}),null);
 assert.equal(memoAnalyticsPage({...config,language:'pl'},{href:'https://memocasting.lt'+page.path}),null);
});
test('withdrawal synchronously disables tag, removes script/cookies and reloads with denial persisted',()=>{
 const f=fixture();f.instance.choose('granted');f.instance.choose('denied');
 assert.equal(f.browser['ga-disable-'+config.id],true);assert.equal(f.requests[0].removed,true);assert.equal(f.reloads(),1);assert.equal(f.instance.snapshot().active,false);
 assert.equal(JSON.parse(f.map.get(MEMO_CONSENT_KEY)).choice,'denied');assert.ok(f.cookieWrites.some(s=>s.startsWith('_ga_TEST000001=;')));assert.ok(f.cookieWrites.every(s=>!s.includes('essential_cart')));
 f.browser.gtag('event','late');assert.equal(f.browser.dataLayer.length,0);
});
test('cross-tab denial and history navigation to sensitive route stop loaded analytics',()=>{
 const f=fixture({stored:stored('granted')});f.map.set(MEMO_CONSENT_KEY,stored('denied'));f.listeners.get('storage')({key:MEMO_CONSENT_KEY});assert.equal(f.reloads(),1);assert.equal(f.instance.snapshot().active,false);
 const nav=fixture({stored:stored('granted')});nav.browser.location.href='https://memocasting.lt/cart?client_secret=secret';nav.listeners.get('popstate')();assert.equal(nav.reloads(),1);assert.equal(nav.browser['ga-disable-'+config.id],true);
});
test('client unmount unloads runtime without revoking consent or resetting analytics cookies; SSR needs no browser',()=>{
 const f=fixture({stored:stored('granted')});f.instance.dispose();assert.equal(f.listeners.size,0);assert.equal(f.browser['ga-disable-'+config.id],true);assert.equal(f.requests[0].removed,true);assert.equal(f.reloads(),1);assert.equal(f.cookieWrites.length,0);assert.equal(JSON.parse(f.map.get(MEMO_CONSENT_KEY)).choice,'granted');
});
test('expiry timer is bounded and revalidates an open tab; resume also rejects an expired grant',()=>{
 const f=fixture({stored:stored('granted')});assert.equal(f.timers.size,1);assert.equal([...f.timers.values()][0].delay,2147483647);f.setClock(time+180*86400000);[...f.timers.values()][0].fn();assert.equal(f.instance.snapshot().active,false);assert.equal(f.browser['ga-disable-'+config.id],true);assert.equal(f.reloads(),1);
 for(const event of ['pageshow','focus','visibilitychange']){const resumed=fixture({stored:stored('granted')});resumed.setClock(time+180*86400000);resumed.listeners.get(event)();assert.equal(resumed.instance.snapshot().active,false);assert.equal(resumed.reloads(),1);}
});
test('failed withdrawal never reloads into an old grant or restarts on resume',()=>{
 const f=fixture({stored:stored('granted')});f.storage.setItem=(key,value)=>{if(key===MEMO_CONSENT_KEY)throw Error('one-off write failure');f.map.set(key,value);};f.storage.removeItem=()=>{throw Error('remove failed too');};
 assert.equal(f.instance.choose('denied'),false);assert.equal(f.reloads(),0);assert.equal(f.instance.snapshot().active,false);assert.equal(f.session.get(MEMO_CONSENT_BLOCK_KEY),'1');
 f.listeners.get('focus')();assert.equal(f.instance.snapshot().active,false);assert.equal(f.requests.length,1);
 const revisit=fixture({stored:f.map.get(MEMO_CONSENT_KEY),sessionBlocked:true});assert.equal(revisit.requests.length,0);assert.equal(revisit.instance.snapshot().choice,'denied');
});
test('explicit re-grant after a failed withdrawal recovers through a fresh document',()=>{
 const f=fixture({stored:stored('granted')}),set=f.storage.setItem;f.storage.setItem=()=>{throw Error('temporary failure');};assert.equal(f.instance.choose('denied'),false);assert.equal(f.reloads(),0);f.storage.setItem=set;
 assert.equal(f.instance.choose('granted'),true);assert.equal(f.reloads(),1);assert.equal(f.instance.snapshot().active,false);assert.equal(f.session.has(MEMO_CONSENT_BLOCK_KEY),false);
 assert.equal(fixture({stored:f.map.get(MEMO_CONSENT_KEY)}).requests.length,1);
});
