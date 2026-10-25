import test from 'node:test';
import assert from 'node:assert/strict';
import {memoAttribution,MEMO_ATTRIBUTION_KEY,bindMemoOrderAnalytics,revokeMemoOrderAnalytics} from '../lib/memocasting-attribution.mjs';
const time=1792926000000;
function storage(){const values=new Map();return {get length(){return values.size;},key:i=>[...values.keys()][i]??null,getItem:key=>values.get(key)??null,setItem:(key,v)=>values.set(key,v),removeItem:key=>values.delete(key),values};}
test('attribution transmits only bounded campaign tokens and origin, never raw URLs/query/hash/referrer path',()=>{
 const s=storage(),a=memoAttribution({href:'https://memocasting.lt/?utm_source=instagram&utm_medium=paid_social&utm_campaign=kaledos_2026&utm_content=video_1&utm_term=private_name&email=secret%40test.example&client_secret=hidden#private'},'https://l.instagram.com/redirect?email=private@test.example',s,time);
 assert.deepEqual(a,{campaign_source:'instagram',campaign_medium:'paid_social',campaign_name:'kaledos_2026',campaign_content:'video_1',page_referrer:'https://l.instagram.com/'});
 assert.doesNotMatch(JSON.stringify(a)+s.getItem(MEMO_ATTRIBUTION_KEY),/private|secret|email|redirect|utm_term|client_secret/);
 const next=memoAttribution({href:'https://memocasting.lt/cart?order_id=secret'},'https://memocasting.lt/products/pair',s,time+1000);assert.deepEqual(next,a);
 const expired=memoAttribution({href:'https://memocasting.lt/'},'',s,time+31*60000);assert.deepEqual(expired,{page_referrer:''});
});
test('unsafe/duplicate campaign values, unknown query params and payment referrers are excluded',()=>{
 const s=storage(),a=memoAttribution({href:'https://memocasting.lt/?utm_source=google&utm_source=evil&utm_medium=private%40test.example&utm_campaign=%3Cscript%3E&utm_id=37069108251&gclid=secret&fbclid=secret'},'https://checkout.stripe.com/pay/customer-secret',s,time);
 assert.deepEqual(a,{page_referrer:''});assert.doesNotMatch(s.getItem(MEMO_ATTRIBUTION_KEY),/secret|private|script|69108251/);
});
test('new campaign changes source; normal navigation retains consented source within the tab session',()=>{
 const s=storage();memoAttribution({href:'https://memocasting.lt/?utm_source=google&utm_medium=cpc'},'',s,time);
 const changed=memoAttribution({href:'https://memocasting.lt/?utm_source=pinterest&utm_medium=social'},'',s,time+1000);assert.equal(changed.campaign_source,'pinterest');
 assert.equal(memoAttribution({href:'https://memocasting.lt/cart'},'https://memocasting.lt/',s,time+2000).campaign_source,'pinterest');
});
test('order binding is production/host/consent gated and never sends money or customer data from browser',async()=>{
 const calls=[],b={location:new URL('https://memocasting.lt/cart?client_secret=private'),__memoAnalytics:{context:async()=>({choice:'granted',version:2,clientId:'1.1',sessionId:'1'}),isGranted:()=>true},fetch:async(path,options)=>{calls.push({path,options});return Response.json({state:'ready'});}};
 const client={context:{environment:'production'},attempt:{orderId:'order_1',token:'a'.repeat(64),customer:{email:'private@test.example'},amount:999}};
 await bindMemoOrderAnalytics({browser:b,client});assert.equal(calls.length,1);assert.equal(calls[0].path,'/prekyba/orders/order_1/analytics');assert.equal(calls[0].options.headers.authorization,'Bearer '+'a'.repeat(64));assert.doesNotMatch(calls[0].options.body,/customer|private|amount|token/);
 for(const change of [()=>b.__memoAnalytics.isGranted=()=>false,()=>b.location=new URL('https://foreign.example/cart'),()=>client.context.environment='sandbox']){change();await bindMemoOrderAnalytics({browser:b,client});assert.equal(calls.length,1);}
});
test('withdrawal reaches only existing same-origin order credentials and never Google',async()=>{
 const s=storage(),calls=[],b={location:new URL('https://memocasting.lt/pages/instrukcija'),sessionStorage:s,fetch:async(path,options)=>{calls.push({path,options});return Response.json({state:'revoked'});}};
 s.setItem('commerce.production.memocasting',JSON.stringify({version:1,storeId:'memocasting',orderId:'order_1',token:'a'.repeat(64)}));s.setItem('commerce.production.other','malformed');s.setItem('unrelated','private');
 revokeMemoOrderAnalytics(b);assert.equal(calls.length,1);assert.equal(calls[0].path,'/prekyba/orders/order_1/analytics');assert.deepEqual(JSON.parse(calls[0].options.body),{choice:'denied',version:2});assert.equal(calls[0].options.keepalive,true);
});
test('a failed analytics context or transport cannot reject the payment hand-off',async()=>{
 const browser={location:new URL('https://memocasting.lt/cart'),__memoAnalytics:{context:async()=>{throw Error('blocked');},isGranted:()=>true},fetch:async()=>{throw Error('offline');}},client={context:{environment:'production'},attempt:{orderId:'order_1',token:'a'.repeat(64)}};
 await assert.doesNotReject(bindMemoOrderAnalytics({browser,client}));browser.__memoAnalytics.context=async()=>({choice:'granted',version:2});await assert.doesNotReject(bindMemoOrderAnalytics({browser,client}));
});
