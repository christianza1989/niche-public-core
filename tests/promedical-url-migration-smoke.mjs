// Read-only HTTP verification of the complete approved URL migration.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {request as httpRequest} from 'node:http';
import {request as httpsRequest} from 'node:https';
import {projectPublicPages} from '../lib/niche-links.mjs';
const base=process.env.PROMEDICAL_URL_BASE||'http://127.0.0.1:8841';
assert.ok(/^(?:http:\/\/(?:127\.0\.0\.1|localhost):\d+|https:\/\/promedical\.lt)$/.test(base));
const bytes=await fs.readFile('content-packages/promedical/content-package.json'),pkg=JSON.parse(bytes);
const packages=JSON.parse(await fs.readFile('lib/generated/content-packages.json'));
const settings=JSON.parse(await fs.readFile('config/niche-network.json'));
const aliases=JSON.parse(await fs.readFile('config/niche-path-aliases.json')).sites.promedical.redirects;
const old=new Set(aliases.map(a=>a.from)),observations=[],issues=[];
const visible=projectPublicPages(pkg,packages,settings,Date.now());
const expected=new Set(visible.map(p=>'https://promedical.lt/'+p.slug));
async function get(path,method='GET',host='promedical.lt'){
 const started=Date.now(),url=new URL(base+path);
 const {r,text}=await new Promise((resolve,reject)=>{
  const req=(url.protocol==='https:'?httpsRequest:httpRequest)(url,{method,headers:{Host:host}},res=>{
   const chunks=[];let size=0;res.on('data',chunk=>{size+=chunk.length;if(size>8*1024*1024)req.destroy(Error('Response exceeded8MiB '+path));else chunks.push(chunk);});
   res.on('error',reject);res.on('end',()=>resolve({r:{status:res.statusCode,headers:new Headers(Object.entries(res.headers).filter(([,v])=>v!==undefined).map(([k,v])=>[k,Array.isArray(v)?v.join(','):v]))},text:Buffer.concat(chunks).toString('utf8')}));
  });req.setTimeout(30000,()=>req.destroy(Error('HTTP timeout '+path)));req.on('error',reject);req.end();
 });
 const record={path,method,host,status:r.status,location:r.headers.get('location'),ms:Date.now()-started,sha256:createHash('sha256').update(text).digest('hex')};observations.push(record);return {r,text,record};
}
const canonical=html=>[...html.matchAll(/<link\b[^>]*\brel="canonical"[^>]*\bhref="([^"]+)"/gu)].map(m=>m[1]);
async function parallel(items,task){let cursor=0,done=0;await Promise.all(Array.from({length:4},async()=>{while(cursor<items.length){const item=items[cursor++];try{await task(item);}catch(e){issues.push({path:item.from||item.slug||item,message:e.message});}done++;if(done%250===0)console.log('Checked '+done+'/'+items.length);}}));}
const sitemap=await get('/sitemap.xml');assert.equal(sitemap.r.status,200);
const locs=[...sitemap.text.matchAll(/<loc>(.*?)<\/loc>/gu)].map(m=>m[1]);assert.equal(locs.length,new Set(locs).size);assert.deepEqual(new Set(locs),expected);
assert.ok(locs.every(url=>!old.has(new URL(url).pathname)));
await parallel(aliases,async a=>{const {r}=await get(a.from);assert.equal(r.status,308);const location=new URL(r.headers.get('location'),base);assert.equal(location.pathname,a.to);assert.equal(location.search,'');});
await parallel(visible,async p=>{
 const path='/'+p.slug,{r,text}=await get(path);assert.equal(r.status,200);
 assert.deepEqual(canonical(text),['https://promedical.lt'+path]);
 for(const m of text.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gu)){
  const url=new URL(m[1].replaceAll('&amp;','&'),'https://promedical.lt');if(url.hostname==='promedical.lt')assert.ok(!old.has(url.pathname),'legacy anchor '+url.pathname);
 }
});
const example=aliases.find(a=>a.from==='/produktai/infuzni-stojan-nerez1005ais');
let trailingSlashNormalization=false;
for(const path of [example.from+'/?utm_source=url-migration&q=NEREZ1005AIS',example.from+'?utm_source=url-migration&q=NEREZ1005AIS']){
 let {r}=await get(path);assert.equal(r.status,308);let url=new URL(r.headers.get('location'),base);
 // vinext normalizes a trailing slash before proxy.ts. Original sitemap URLs
 // have no slash and must remain one-hop; this noncanonical variant may have
 // that additional framework hop. Never accept an unrelated/looping target.
 if(path.startsWith(example.from+'/?')&&url.pathname===example.from){trailingSlashNormalization=true;assert.equal(url.searchParams.get('utm_source'),'url-migration');assert.equal(url.searchParams.get('q'),'NEREZ1005AIS');({r}=await get(url.pathname+url.search));assert.equal(r.status,308);url=new URL(r.headers.get('location'),base);}
 assert.equal(url.pathname,example.to);assert.equal(url.searchParams.get('utm_source'),'url-migration');assert.equal(url.searchParams.get('q'),'NEREZ1005AIS');
}
assert.equal((await get(example.from,'HEAD')).r.status,308);
assert.equal((await get('/produktai/neegzistuojantis-modelis-20261013')).r.status,404);
if(base.startsWith('http://'))assert.equal((await get(example.from,'GET','unknown.example')).r.status,404);
const filtered=await get('/produktai?category=infuzni-stojany&q=NEREZ&p=2');assert.equal(filtered.r.status,308);
const filterURL=new URL(filtered.r.headers.get('location'),base);assert.equal(filterURL.searchParams.get('category'),aliases.find(a=>a.from==='/kategorijos/infuzni-stojany').to.slice('/kategorijos/'.length));assert.equal(filterURL.searchParams.get('q'),'NEREZ');assert.equal(filterURL.searchParams.get('p'),'2');
assert.equal((await get(filterURL.pathname+filterURL.search)).r.status,200);
for(const path of ['/llms.txt','/llms-full.txt']){const {r,text}=await get(path);assert.equal(r.status,200);for(const a of aliases)assert.ok(!text.includes('https://promedical.lt'+a.from+')')&&!text.includes('https://promedical.lt'+a.from+'\n'),'legacy reading URL '+a.from);}
const report={state:issues.length?'FAIL':'PASS',checkedAt:new Date().toISOString(),base,packageSha256:createHash('sha256').update(bytes).digest('hex'),sitemapUrls:locs.length,redirects:aliases.length,canonicalPages:visible.length,requests:observations.length,trailingSlashNormalization,issues,observations,scope:'All1845 original sitemap catalogue paths redirect directly to their new canonical URL. A trailing-slash variant may normalize once in vinext before that direct migration. Current eligible canonical HTML, sitemap/internal anchors/reading exports and representative HEAD/query/category/unknown paths. Read-only; no mail/lead submission or indexing/ranking claim.'};
if(process.env.PROMEDICAL_URL_REPORT)await fs.writeFile(process.env.PROMEDICAL_URL_REPORT,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,observations:observations.length},null,2));
assert.equal(issues.length,0);
