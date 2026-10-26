import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {memoReviewProjection,memoReviewSchema,memoReviewMetadata} from '../lib/memocasting-reviews.mjs';
import {relayMemoBuyer} from '../lib/memocasting-commerce-bridge.mjs';
const item={id:'review-fixture',sku:'couple',rating:4,authorName:'Test Buyer',title:'Fixture',body:'Only isolated test text',date:'2024-01-01',photos:[],verifiedPurchase:true};
test('review functional metadata is host-scoped, private and cannot inherit home indexing/images',()=>{
 const data=memoReviewMetadata({siteId:'memocasting'},'/atsiliepimas');assert.match(data.title,/Palikti atsiliepimą/);assert.equal(data.robots,'noindex, nofollow');assert.equal(data.image,undefined);assert.equal(data.offer,undefined);
 assert.equal(memoReviewMetadata({siteId:'other'},'/atsiliepimas'),null);assert.equal(memoReviewMetadata({siteId:'memocasting'},'/'),null);
});
test('public product schema uses the same actual published review pool and never adds empty or foreign-item shop stars',()=>{
 assert.deepEqual(memoReviewSchema(null),{});
 const p=memoReviewProjection({items:[item,{...item,sku:'family'}],stats:[{sku:'couple',count:1,average:4,directCount:1,directAverage:4}],total:1},'couple');
 assert.equal(p.items.length,1);assert.equal(memoReviewSchema(p).aggregateRating.ratingValue,4);assert.equal(memoReviewSchema(p).review[0].author.name,'Test Buyer');
 assert.equal(memoReviewSchema(p)['@type'],undefined);
 assert.deepEqual(memoReviewSchema(memoReviewProjection({items:[],stats:[],total:0},'couple')),{});
});
test('review bridge forwards only bounded public review routes, filters and photo bytes; operator routes remain unavailable',async()=>{
 const seen=[];const opts={siteId:'memocasting',host:'127.0.0.1',loopbackOrigin:'http://127.0.0.1:8827',fetchImpl:async r=>{seen.push(r);return Response.json({items:[],stats:[]});}};
 let response=await relayMemoBuyer(new Request('http://127.0.0.1/prekyba/reviews?sku=couple&page=2&token=private'),'reviews',opts);
 assert.equal(response.status,200);assert.equal(new URL(seen[0].url).search,'?sku=couple&page=2');
 response=await relayMemoBuyer(new Request('http://127.0.0.1/prekyba/operator/reviews'),'operator/reviews',opts);assert.equal(response.status,404);
 response=await relayMemoBuyer(new Request('http://127.0.0.1/prekyba/reviews?page=-1'),'reviews',opts);assert.equal(response.status,400);
 response=await relayMemoBuyer(new Request('http://127.0.0.1/prekyba/reviews/submit',{method:'GET'}),'reviews/submit',opts);assert.equal(response.status,405);
 response=await relayMemoBuyer(new Request('http://127.0.0.1/prekyba/reviews/photos',{method:'POST',body:JSON.stringify({bytes:'a'.repeat(180000)})}),'reviews/photos',opts);assert.equal(response.status,200);
 response=await relayMemoBuyer(new Request('http://127.0.0.1/prekyba/orders',{method:'POST',body:'a'.repeat(70000)}),'orders',opts);assert.equal(response.status,413);
});
test('review form is a same-site noindex functional route, with explicit separate consent and native media handling',async()=>{
 const proxy=await readFile(new URL('../proxy.ts',import.meta.url),'utf8'),form=await readFile(new URL('../components/niche/memocasting-review-form.tsx',import.meta.url),'utf8');
 assert.match(proxy,/path==='\/atsiliepimas'/);assert.match(proxy,/Referrer-Policy','no-referrer/);
 assert.match(form,/history.replaceState/);assert.match(form,/publicationConsent/);assert.match(form,/image\/webp/);
 const source=await readFile(new URL('../lib/memocasting-structure.mjs',import.meta.url),'utf8');assert.match(source,/memoReviewSchema\(page.memoReviews\)/);
});

test('legacy feedback is visible but is never silently aggregated into first-party Google ratings',()=>{
 const legacy={...item,body:'',legacyImported:true,verifiedPurchase:false};
 const project=(items,stats)=>memoReviewProjection({items,total:2,stats:[{sku:'couple',...stats}]},'couple');
 const onlyLegacy=project([legacy],{count:1,average:4,directCount:0,directAverage:null});
 assert.equal(onlyLegacy.items[0].legacyImported,true);assert.deepEqual(memoReviewSchema(onlyLegacy),{});
 // An older backend without origin-aware counters must also fail closed.
 assert.deepEqual(memoReviewSchema(project([item],{count:2,average:4})),{});
 const mixed=project([item,legacy],{count:2,average:4.5,directCount:1,directAverage:4});
 assert.equal(memoReviewSchema(mixed).aggregateRating.reviewCount,1);assert.equal(memoReviewSchema(mixed).aggregateRating.ratingValue,4);
 assert.equal(memoReviewSchema(mixed).review.length,1);
 const laterPage=project([legacy],{count:2,average:4.5,directCount:1,directAverage:4});
 assert.equal(memoReviewSchema(laterPage).aggregateRating.reviewCount,1);assert.equal(memoReviewSchema(laterPage).review,undefined);
 const ratingOnly=project([{...item,body:''}],{count:1,average:4,directCount:1,directAverage:4});
 assert.equal(memoReviewSchema(ratingOnly).review[0].reviewBody,undefined);
});
