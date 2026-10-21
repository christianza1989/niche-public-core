// Actual local HTTP catalogue acceptance, including all pagination destinations.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {request} from 'node:http';
import {createHash} from 'node:crypto';
const base=process.env.NICHE_SMOKE_BASE_URL||'http://127.0.0.1:8787';
assert.match(new URL(base).hostname,/^(127\.0\.0\.1|localhost)$/);
const bytes=await readFile('content-packages/promedical/content-package.json');
const pkg=JSON.parse(bytes),products=pkg.pages.filter(p=>p.slug.startsWith('produktai/'));
assert.equal(products.length,1408);
const observations=[];
async function get(path){return new Promise((resolve,reject)=>{const req=request(new URL(path,base),{headers:{Host:'promedical.lt'}},res=>{let html='';res.setEncoding('utf8');res.on('data',v=>html+=v);res.on('end',()=>{assert.equal(res.statusCode,200,path);observations.push({path,status:res.statusCode,htmlSha256:createHash('sha256').update(html).digest('hex')});resolve(html.replace(/<!--[\s\S]*?-->/g,''));});});req.on('error',reject);req.end();});}
const links=html=>new Set([...html.matchAll(/<a\b[^>]*\bhref="(\/produktai\/[a-z0-9-]+)"/g)].map(m=>m[1]));
const discovered=new Set(),last=Math.ceil(products.length/24);
for(let n=1;n<=last;n++){const html=await get('/produktai'+(n>1?'?p='+n:'')),paths=links(html);assert.equal(paths.size,n===last?16:24,'page '+n+' unique models');for(const p of paths){assert.ok(!discovered.has(p),'model repeated on catalogue pages '+p);discovered.add(p);}assert.ok(html.includes('Puslapis '+n+' iš '+last));}
assert.deepEqual([...discovered].sort(),products.map(p=>'/'+p.slug).sort());
const exact=products.find(p=>p.intent.startsWith('Katalogo kodas: ZV1253N-PZ |'));assert.ok(exact);
assert.ok(links(await get('/produktai?q=ZV1253N-PZ')).has('/'+exact.slug),'exact SKU search');
assert.ok((await get('/produktai?q=neegzistuojantis-qa-kodas-20261009')).includes('Pagal šią paiešką produktų neradome'),'honest empty search');
assert.deepEqual([...links(await get('/produktai?p=999999'))].sort(),products.slice(-16).map(p=>'/'+p.slug).sort(),'last page clamp');
const cats=pkg.pages.filter(p=>p.slug.startsWith('kategorijos/')),byId=new Map(cats.map(p=>[p.id,p]));
const deep=cats.find(p=>p.slug.split('/').length>2&&products.some(v=>v.links.some(l=>l.targetPageId===p.id)));assert.ok(deep,'nested manufacturer category exists');
const categoryHTML=await get('/'+deep.slug);assert.ok(links(categoryHTML).size>0,'nested category renders models');
assert.deepEqual([...links(categoryHTML)].sort(),[...links(await get('/produktai?category='+encodeURIComponent(deep.slug.slice('kategorijos/'.length))))].sort(),'query category matches nested category page');
const rootIds=cats.filter(p=>!p.links.some(l=>byId.has(l.targetPageId)));assert.equal(rootIds.length,34);
const dup=products.filter(p=>p.intent.startsWith('Katalogo kodas: PLV150 |'));assert.equal(dup.length,2,'distinct manufacturer IDs with duplicate SKU retained');
const report={state:'PASS',testedAt:new Date().toISOString(),environment:'local production Workers runtime, canonical Host header',packageSha256:createHash('sha256').update(bytes).digest('hex'),products:products.length,categories:cats.length,cataloguePages:last,uniqueDiscovered:discovered.size,nestedCategory:deep.slug,duplicateSkuPaths:dup.map(p=>'/'+p.slug),observations,limitations:['HTTP checks do not replace pixel, keyboard, inquiry delivery or production-domain acceptance.']};
if(process.env.PROMEDICAL_CATALOGUE_REPORT)await writeFile(process.env.PROMEDICAL_CATALOGUE_REPORT,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,observations:observations.length},null,2));
