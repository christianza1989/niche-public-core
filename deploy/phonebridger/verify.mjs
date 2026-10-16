import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash,randomBytes} from 'node:crypto';
const base=process.argv[2]||'http://127.0.0.1:4191';
const release=JSON.parse(await readFile('.sites-runtime/phonebridger-production/release.json','utf8'));
const preview=new URL(base).hostname!==release.package.canonicalHost;
const results=[];
const request=(path,body,cookie)=>fetch(base+path,{method:body?'POST':'GET',headers:{...(body?{Origin:base,'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});
if(!preview){
 for(const origin of ['http://'+release.package.canonicalHost,'https://www.'+release.package.canonicalHost]){
  const redirect=await fetch(origin+'/shop?setup=2',{redirect:'manual'});assert.equal(redirect.status,308);assert.equal(redirect.headers.get('location'),base+'/shop?setup=2');
 }
}
for(const page of release.package.pages){
 const path=page.slug?'/'+page.slug:'/';const r=await request(path),html=await r.text();assert.equal(r.status,200,path);assert.equal(r.url,base+path,'Canonical should respond without a redirect.');
 assert.ok(html.includes(`content="${page.revisionHash}"`),path+' exact editorial revision');
 assert.ok(html.includes(`href="https://${release.package.canonicalHost}${path}"`),path+' canonical');
 assert.ok(!html.includes('id="integration-preview"'),path+' no preview banner');assert.ok(html.includes('application/ld+json'));
 assert.equal(r.headers.get('x-robots-tag')?.includes('noindex')||false,preview);results.push({path,status:r.status,revision:page.revisionHash});
}
for(const path of ['/manifest.json','/tests/demo-experience.cjs','/_downloads/windows/0.bin','/assets/conversion-v1/preview.html'])assert.equal((await request(path)).status,404,path);
const sitemap=await (await request('/sitemap.xml')).text();assert.equal((sitemap.match(/<url>/g)||[]).length,14);for(const slug of ['login','register','recover','account','checkout'])assert.ok(!sitemap.includes('/'+slug));
const checkoutPage=await request('/checkout'),checkoutHtml=await checkoutPage.text();assert.equal(checkoutPage.status,200);assert.match(checkoutPage.headers.get('x-robots-tag'),/noindex/);assert.match(checkoutPage.headers.get('cache-control'),/private/);assert.ok(!checkoutHtml.includes('rel="canonical"'));assert.ok(!checkoutHtml.includes('application/ld+json'));
const catalogResponse=await request('/api/shop/catalog'),catalog=await catalogResponse.json();assert.equal(catalogResponse.status,200);assert.equal(catalog.offers.length,4);assert.ok(catalog.offers.every(o=>Number.isSafeInteger(o.amount)&&typeof o.available==='boolean'));
if(catalog.mode==='disabled'){
 assert.ok(catalog.offers.every(o=>o.available===false));
 assert.equal((await request('/api/shop/checkout',{holders:0,finish:'black',requestId:crypto.randomUUID(),consent:true})).status,503);
}
const reviewResponse=await request('/api/shop/reviews'),reviews=await reviewResponse.json();assert.equal(reviewResponse.status,200);assert.ok(Array.isArray(reviews.reviews));assert.ok(Number.isInteger(reviews.count));assert.ok(reviews.reviews.every(r=>!('email' in r)&&!('shipping_details' in r)));
assert.equal((await request('/api/shop/order?id='+ 'a'.repeat(32))).status,401);
const robots=await(await request('/robots.txt')).text();assert.equal(robots.includes('Disallow: /\n'),preview);
const account={email:'delivery-test-'+Date.now()+'@example.com',password:randomBytes(24).toString('hex')};
let r=await request('/api/account/register',account);const data=await r.json();assert.equal(r.status,201,JSON.stringify(data));const set=r.headers.get('set-cookie');for(const flag of ['__Host-pb_session=','Secure','HttpOnly','SameSite=Strict','Path=/'])assert.ok(set.includes(flag));const cookie=set.split(';')[0];
assert.equal((await(await request('/api/account/session',null,cookie)).json()).user.email,account.email);
assert.equal((await request('/api/account/login',{...account,password:'wrong-password'})).status,401);
assert.equal((await fetch(base+'/api/account/logout',{method:'POST',headers:{Origin:'https://example.com',Cookie:cookie}})).status,403);
assert.equal((await request('/api/account/delete',account,cookie)).status,200);
assert.equal((await(await request('/api/account/session',null,cookie)).json()).user,null);
for(const [key,item]of Object.entries(release.downloads)){
 r=await request('/downloads/'+key);assert.equal(r.status,200);const hash=createHash('sha256');let bytes=0;for await(const value of r.body){hash.update(value);bytes+=value.length;}assert.equal(bytes,item.bytes);assert.equal(hash.digest('hex'),item.sha256);
}
r=await fetch(base+'/downloads/windows',{headers:{Range:'bytes=20971510-20971540'}});assert.equal(r.status,206);const range=Buffer.from(await r.arrayBuffer());const p0=await readFile('.sites-runtime/phonebridger-production/assets/_downloads/windows/0.bin'),p1=await readFile('.sites-runtime/phonebridger-production/assets/_downloads/windows/1.bin');assert.deepEqual(range,Buffer.concat([p0.subarray(20971510),p1.subarray(0,21)]));
r=await request('/ivykius',{event:'pageview',path:'/'});assert.equal(r.status,204);
r=await fetch(base+'/ivykius',{method:'POST',headers:{Origin:base,'Content-Type':'application/json',DNT:'1'},body:'{"event":"pageview","path":"/"}'});assert.equal(r.status,204);
const report={base,at:new Date().toISOString(),publicPages:results,privateNamespace:'PASS',authAndCsrf:'PASS',shopCatalogAndOrderGuards:'PASS',commerceMode:catalog.mode,downloadHashes:'PASS',crossPartRange:'PASS',counterEndpoint:'PASS',preview};
await mkdir('output/phonebridger-production',{recursive:true});await writeFile('output/phonebridger-production/'+(preview?'preview':'live')+'-verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,publicPages:results.length}));
