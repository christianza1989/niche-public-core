// Read-only production HTML audit. Uses the same projection as the public core.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {request as httpRequest} from 'node:http';
import {request as httpsRequest} from 'node:https';
import {validateContentPackage} from './content-package-core.mjs';
import {projectPublicPages} from '../lib/niche-links.mjs';
import {nicheBreadcrumbs,nicheEditorialDates} from '../lib/niche-schema-core.mjs';
const siteId=process.argv[2];
if(!/^[a-z0-9-]+$/.test(siteId??'')) throw Error('Usage: node scripts/audit-niche.mjs <siteId> [baseUrl] [outputFile]');
const base=process.argv[3]??'http://127.0.0.1:8787';
const output=resolve(process.argv[4]??`output/audits/${siteId}-html.json`);
const pkg=validateContentPackage(JSON.parse(await readFile(`content-packages/${siteId}/content-package.json`,'utf8')));
const packages=JSON.parse(await readFile('lib/generated/content-packages.json','utf8'));
const settings=JSON.parse(await readFile('config/niche-network.json','utf8'));
const pages=projectPublicPages(pkg,packages,settings);const origin=`https://${pkg.canonicalHost}`;
const cache=new Map();const findings=[];const pageEvidence=[];const external=new Set();
const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#x27;|&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const plain=s=>decode(s.replace(/<[^>]*>/g,' ')).replace(/\s+/g,' ').trim();
const attrs=s=>Object.fromEntries([...s.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m=>[m[1],decode(m[2])]));
function check(ok,path,code,detail){if(!ok)findings.push({path,code,detail});}
async function get(path){if(cache.has(path))return cache.get(path);const target=new URL(path,base);const result=await new Promise((resolveResult,reject)=>{const client=target.protocol==='https:'?httpsRequest:httpRequest;const req=client(target,{headers:{host:pkg.canonicalHost,'user-agent':'NicheReadOnlyAudit/1.0'}},res=>{let body='';res.setEncoding('utf8');res.on('data',chunk=>body+=chunk);res.on('end',()=>resolveResult({status:res.statusCode,headers:res.headers,body}));res.on('error',reject);});req.setTimeout(15000,()=>req.destroy(Error('Request timeout')));req.on('error',reject);req.end();});cache.set(path,result);return result;}
for(const page of pages){
 const path=page.slug?`/${page.slug}`:'/';const r=await get(path);const html=r.body;
 check(r.status===200,path,'status',r.status);
 const title=plain(html.match(/<title>([\s\S]*?)<\/title>/)?.[1]??'');
 const metas=[...html.matchAll(/<meta\s+[^>]*>/g)].map(m=>attrs(m[0]));
 const canonical=[...html.matchAll(/<link\s+[^>]*>/g)].map(m=>attrs(m[0])).find(a=>a.rel==='canonical')?.href;
 const h1s=[...html.matchAll(/<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>/g)].map(m=>plain(m[1]));
 check(title.includes(page.title),path,'title',title);check(h1s.length===1,path,'h1-count',h1s);
 check(canonical===origin+path,path,'canonical',canonical);check(/<html[^>]*lang="lt/.test(html),path,'language','Expected Lithuanian HTML');
 check(metas.some(a=>a.name==='description'&&a.content===page.description),path,'description','Missing or differing description');
 check(!metas.some(a=>a.name==='robots'&&/noindex/.test(a.content)),path,'indexability','Unexpected noindex on canonical response');
 const graphs=[...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
 const entities=graphs.flatMap(g=>g['@graph']??[g]);check(entities.some(x=>x['@type']==='WebSite'),path,'schema','Missing WebSite');
 check(!entities.some(x=>['Product','Offer','Review','AggregateRating','LocalBusiness'].includes(x['@type'])),path,'truthful-schema','Unsupported commerce entity');
 const trail=nicheBreadcrumbs(pkg,page,pages);
 if(page.type!=='home'){
  const bc=entities.find(x=>x['@type']==='BreadcrumbList');const visible=html.match(/<nav[^>]*aria-label="Puslapio kelias"[^>]*>([\s\S]*?)<\/nav>/)?.[1]??'';
  check(JSON.stringify(bc?.itemListElement?.map(x=>({name:x.name,path:new URL(x.item).pathname})))===JSON.stringify(trail),path,'breadcrumb-schema',bc);
  check(trail.every(item=>plain(visible).includes(item.name)),path,'breadcrumb-visible',plain(visible));
 }
 if(page.type==='guide'){
  const article=entities.find(x=>x['@type']==='Article');const times=[...html.matchAll(/<time[^>]*dateTime="([^"]+)"/g)].map(m=>m[1]);const dates=nicheEditorialDates(page);
  check(article?.author?.['@type']==='Organization'&&article.author.name===(settings.contactsBySite?.[siteId]?.operatorName??settings.operatorName),path,'article-author',article?.author);
  check(article?.datePublished===dates.published&&article?.dateModified===dates.modified,path,'article-dates',article);
  check(times.includes(dates.published)&&times.includes(dates.modified),path,'visible-dates',times);
 }
 const anchors=[...html.matchAll(/<a\b[^>]*>/g)].map(m=>attrs(m[0])).filter(a=>a.href);
 for(const a of anchors){
  if(/^(mailto:|tel:)/.test(a.href))continue;
  const url=new URL(a.href,origin+path);if(url.origin!==origin){external.add(url.href);continue;}
  const target=await get(url.pathname);check(target.status===200,path,'internal-link',{href:a.href,status:target.status});
  if(url.hash){const id=decodeURIComponent(url.hash.slice(1));const ids=[...target.body.matchAll(/\bid="([^"]+)"/g)].map(m=>decode(m[1]));check(ids.includes(id),path,'fragment',a.href);}
 }
 const images=[...html.matchAll(/<img\b[^>]*>/g)].map(m=>attrs(m[0]));
 const assetBySrc=new Map(pages.flatMap(item=>item.media??[]).map(asset=>[asset.src,asset]));
 for(const img of images){
  check(Boolean(img.width&&img.height&&img.alt!==undefined),path,'image-accessibility',img.src);
  if(img.src.startsWith('/'))check((await get(img.src)).status===200,path,'image-status',img.src);
  const source=assetBySrc.get(img.src);const widths=new Set();
  for(const candidate of (img.srcSet??img.srcset??'').split(',').map(x=>x.trim()).filter(Boolean)){
   const [src,descriptor]=candidate.split(/\s+/);const variant=assetBySrc.get(src);
   check(Boolean(variant&&source&&variant.alt===source.alt&&Math.abs(variant.width/variant.height-source.width/source.height)<.01),path,'image-family',{src,source:img.src});
   check(Boolean(variant&&descriptor===`${variant.width}w`&&!widths.has(descriptor)),path,'image-width-descriptor',{src,descriptor});widths.add(descriptor);
   if(src.startsWith('/'))check((await get(src)).status===200,path,'image-variant-status',src);
  }
 }
 if(page.type==='guide'&&page.media?.length){const article=entities.find(x=>x['@type']==='Article');const schemaImages=[article?.image].flat().filter(Boolean);check(images.some(img=>schemaImages.includes(origin+img.src)||schemaImages.includes(img.src)),path,'article-image-visible',schemaImages);}
 check(!plain(html).includes('Originali ImageGen iliustracija.'),path,'generator-badge','Unwanted generator badge');
 const articleText=plain(html.match(/<article[^>]*>([\s\S]*?)<\/article>/)?.[1]??'');
 pageEvidence.push({path,title,h1:h1s[0],canonical,schemaTypes:entities.map(x=>x['@type']),articleWords:articleText?articleText.split(/\s+/).length:0,anchors:anchors.length,images:images.length,dates:page.type==='guide'?nicheEditorialDates(page):undefined});
}
const sitemap=await get('/sitemap.xml');check(sitemap.status===200,'/sitemap.xml','status',sitemap.status);
const locs=[...sitemap.body.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>decode(m[1]));check(locs.length===pages.length,'/sitemap.xml','count',locs.length);
for(const p of pages)check(locs.includes(origin+(p.slug?`/${p.slug}`:'/')),'/sitemap.xml','public-url',p.slug);
const robots=await get('/robots.txt');check(robots.body.includes(`Sitemap: ${origin}/sitemap.xml`),'/robots.txt','sitemap',robots.body);
for(const path of ['/llms.txt','/llms-full.txt']){const r=await get(path);check(r.status===200,path,'status',r.status);for(const p of pages){check(r.body.includes(origin+(p.slug?`/${p.slug}`:'/')),path,'public-url',p.slug);if(path.endsWith('full.txt'))for(const link of p.externalLinks??[])check(r.body.includes(link.url),path,'source-url',link.url);}}
for(const path of ['/__audit_missing__',`/niche/${siteId}`]){const r=await get(path);check(r.status===404,path,'404',r.status);check(!r.body.includes('rel="canonical"'),path,'404-canonical','404 claims canonical');}
const slash=await get('/gidai/');const query=await get('/gidai?auditas=1');
const result={siteId,canonicalHost:pkg.canonicalHost,base,checkedAt:new Date().toISOString(),packageGeneratedAt:pkg.generatedAt,publicPages:pages.length,readOnly:true,requests:cache.size,pages:pageEvidence,externalUrls:[...external],urlVariants:{slash:{status:slash.status,location:slash.headers.location},query:{status:query.status,canonical:query.body.match(/<link rel="canonical" href="([^"]+)"/)?.[1]}},findings};
await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(result,null,2));console.log(JSON.stringify({output,pages:pages.length,requests:cache.size,findings:findings.length}));if(findings.length)process.exitCode=1;
