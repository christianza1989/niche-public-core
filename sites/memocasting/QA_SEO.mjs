// Read-only acceptance against the actual built Worker. No orders or contacts.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {request} from 'node:http';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {projectPublicPages} from '../../lib/niche-links.mjs';
import {memoIndexablePages} from '../../lib/memocasting-content.mjs';
import {memoBreadcrumbs,memoSectionId} from '../../lib/memocasting-structure.mjs';
import {memoRoute,memoPageRole,memoAlternates} from '../../lib/memocasting-locales.mjs';
import {memoHomepageAdmitted,memoHomepageIntro,memoHomepageStory} from '../../lib/memocasting-homepage-markup.mjs';
const bytes=await readFile(new URL('../../content-packages/memocasting/content-package.json',import.meta.url));
const pkg=JSON.parse(bytes),all=JSON.parse(await readFile(new URL('../../lib/generated/content-packages.json',import.meta.url))),settings=JSON.parse(await readFile(new URL('../../config/niche-network.json',import.meta.url)));
const live=projectPublicPages(pkg,all,settings),indexable=memoIndexablePages(pkg,live),origin='https://memocasting.lt';
const observations=[],html=new Map();
async function get(path,host='memocasting.lt'){
  return new Promise((resolve,reject)=>{const req=request(new URL(path,'http://127.0.0.1:8817'),{headers:{host}},res=>{let body='';res.setEncoding('utf8');res.on('data',s=>body+=s);res.on('end',()=>{observations.push({path,host,status:res.statusCode,cache:res.headers['cache-control'],location:res.headers.location});resolve({status:res.statusCode,body,headers:res.headers});});});req.on('error',reject);req.end();});
}
for(const page of live){
  const path='/'+page.slug,r=await get(path);assert.equal(r.status,200,path);html.set(path,r.body);
  assert.equal((r.body.match(/<h1(?:\s|>)/g)||[]).length,1,path+' H1');
  assert.equal((r.body.match(/rel="canonical"/g)||[]).length,1,path+' canonical');
  assert.ok(r.body.includes(`rel="canonical" href="${origin}${path}"`));
  assert.ok(r.headers['cache-control']?.includes('no-store'),path+' cache');
  const ids=[...r.body.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,path+' unique IDs');
  if(memoHomepageAdmitted(page)){
    const landmarks=[...(memoHomepageIntro+memoHomepageStory).matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
    for(const id of landmarks)assert.ok(ids.includes(id),path+' custom homepage landmark '+id);
  }else for(const b of page.body.filter(b=>b.type==='heading'))assert.ok(ids.includes(memoSectionId(b.text)),path+' section');
  const graph=JSON.parse(r.body.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const route=memoRoute(page);
  assert.ok(r.body.includes('lang="'+route.language+'"'),path+' native language');
  for(const alternate of memoAlternates(pkg,page,live))assert.ok(r.body.includes('hrefLang="'+alternate.language+'" href="'+alternate.url+'"')||r.body.includes('hreflang="'+alternate.language+'" href="'+alternate.url+'"'),path+' admitted alternate '+alternate.language);
  if(memoPageRole(page)!=='home')assert.deepEqual(graph.find(e=>e['@type']==='BreadcrumbList').itemListElement.map(e=>new URL(e.item).pathname),memoBreadcrumbs(pkg,page,live).map(e=>e.path));
  if(page.type==='product')assert.deepEqual(graph.find(e=>e['@type']==='Product').image,[origin+page.media[0].src],path+' visible Product image');
  if(['products/kudikio-pedutes','products/alginato-papildymas-650g-dvieju-ranku-rinkiniui'].includes(route.baseSlug)){assert.ok(!graph.some(e=>e['@type']==='Product'));assert.ok(!/<button/.test(r.body));}
  assert.ok(!graph.some(e=>['Offer','AggregateRating','Review','Person'].includes(e['@type'])),path+' unsupported commercial facts');
  if(route.baseSlug==='cart')assert.ok(r.body.includes('content="noindex, nofollow"'));else assert.ok(!/<meta name="robots" content="noindex/.test(r.body));
}
const internal=new Set();
for(const [path,body] of html)for(const m of body.matchAll(/href="(\/[^"<>]*)"/g)){
  const u=new URL(m[1].replaceAll('&amp;','&'),origin);
  if(!html.has(u.pathname))continue; // asset/API and framework references are checked separately.
  internal.add(u.pathname);
  if(u.hash)assert.ok(html.get(u.pathname).includes(`id="${decodeURIComponent(u.hash.slice(1))}"`),path+' fragment '+m[1]);
}
for(const p of live)if(p.slug)assert.ok(internal.has('/'+p.slug),'orphan '+p.slug);
const sitemap=await get('/sitemap.xml');assert.equal(sitemap.status,200);
assert.deepEqual([...sitemap.body.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]).sort(),indexable.map(p=>origin+'/'+p.slug).sort());
for(const path of ['/llms.txt','/llms-full.txt']){
 const r=await get(path);assert.equal(r.status,200);assert.ok(r.headers['cache-control']?.includes('no-store'));
 for(const p of indexable)assert.ok(r.body.includes(origin+'/'+p.slug),path+' '+p.slug);
 assert.ok(!r.body.includes(origin+'/cart'),path+' excludes cart');
 if(path.endsWith('full.txt'))for(const p of indexable)for(const b of p.body){if(b.text)assert.ok(r.body.includes(b.text),p.slug+' exported body');}
}
const robots=await get('/robots.txt');assert.equal(robots.status,200);assert.ok(robots.body.includes('Allow: /'));assert.ok(robots.body.includes(origin+'/sitemap.xml'));
const www=await get('/products/liejimo-rinkinys-porai?utm_source=qa','www.memocasting.lt');assert.equal(www.status,301);assert.equal(www.headers.location,origin+'/rinkinys-porai?utm_source=qa');
for(const path of ['/products/seimos-rinkinys','/dovanos','/produkto-sauga','/niche/memocasting','/__seo_missing']){const r=await get(path);assert.equal(r.status,404,path);assert.ok(!r.body.includes('rel="canonical"'));}
assert.equal((await get('/','unknown-domain.example')).status,404);
for(const country of ['LT','PL','LV','EE'])assert.equal(live.filter(p=>memoRoute(p).country===country).length,22,country+' accepted inventory');
const owner=JSON.parse(await readFile(new URL('../../../nisiniai_puslapiai_monetizavimui/sites/memocasting/OWNER-ASSETS.json',import.meta.url)));for(const e of owner.entries.filter(e=>e.decision.startsWith('private')))for(const m of e.variants)assert.equal((await get(m.src)).status,404,'private owner media '+e.key);
await mkdir(new URL('../../output/audits/',import.meta.url),{recursive:true});
const report={state:'SEO_STRUCTURE_HTTP_PASS_NOT_DEPLOYED',checkedAt:new Date().toISOString(),packageSha256:createHash('sha256').update(bytes).digest('hex'),publicPages:live.length,indexablePages:indexable.length,articles:live.filter(p=>p.type==='guide').length,internalReachable:internal.size,requests:observations.length,observations,limits:['Production DNS/WAF/crawl/indexing/AI citations not measured','Offers/stock/provider details await live shop integration','Future and revoked lifecycle verified separately']};
await writeFile(new URL('../../output/audits/memocasting-seo-readiness.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,observations:undefined}));
