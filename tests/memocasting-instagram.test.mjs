import {test} from 'node:test';import assert from 'node:assert/strict';
import {instagramAction,memoInstagramPlacement,relayMemoInstagram} from '../lib/memocasting-instagram-bridge.mjs';
import {memoHomepageStory} from '../lib/memocasting-homepage-markup.mjs';
test('Instagram placement retains every byte of original approved markup as fallback and does not consume adjacent sections',()=>{
 const parts=memoInstagramPlacement(memoHomepageStory);assert.equal(parts.before+parts.fallback+parts.after,memoHomepageStory);assert.ok(parts.fallback.startsWith('<section class="instagram-section'));assert.ok(parts.fallback.includes('@memocasting.lt'));assert.ok(parts.after.startsWith('\n<section'));assert.ok(!parts.fallback.includes('id="gidai"'));
});
test('service bridge is exact-site and current-home admitted, rejects arbitrary URL/credential paths and write methods',async()=>{
 for(const path of ['connection','token','connect','media/123456789/video/other','https://evil.test','media/../../x/poster'])assert.equal(instagramAction(path),false);
 const request=new Request('https://memocasting.lt/social/instagram/feed');let calls=0;const service={fetch:async()=>{calls++;return Response.json({items:[]});}};
 const base={siteId:'memocasting',host:'memocasting.lt',homepageEligible:true,service};
 for(const patch of [{siteId:'other'},{host:'evil.test'},{homepageEligible:false}])assert.equal((await relayMemoInstagram(request,'feed',{...base,...patch})).status,404);
 assert.equal((await relayMemoInstagram(new Request(request.url,{method:'POST'}),'feed',base)).status,405);assert.equal(calls,0);
 assert.equal((await relayMemoInstagram(request,'feed',{...base,service:undefined})).status,503);
});
test('bridge forwards only owned path/range, never cookies/authorization/query or caller host',async()=>{
 const request=new Request('https://memocasting.lt/social/instagram/media/123456789/video?url=https://evil.test',{headers:{Cookie:'owner=private',Authorization:'Bearer fixture-private',Range:'bytes=0-10'}});
 const response=await relayMemoInstagram(request,'media/123456789/video',{siteId:'memocasting',host:'memocasting.lt',homepageEligible:true,service:{fetch:async r=>{assert.equal(r.url,'https://memocasting-instagram.internal/media/123456789/video');assert.deepEqual([...r.headers],[['range','bytes=0-10']]);return new Response('stream',{headers:{'content-type':'video/mp4'}});}}});assert.equal(await response.text(),'stream');
});
