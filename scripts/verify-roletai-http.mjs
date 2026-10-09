import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {request} from 'node:http';
import assert from 'node:assert/strict';
import {projectPublicPages} from '../lib/niche-links.mjs';
const mode=process.argv[2]||'before',base='http://127.0.0.1:8794',bytes=await readFile('content-packages/roletaiklaipedoje/content-package.json'),pkg=JSON.parse(bytes),packages=JSON.parse(await readFile('lib/generated/content-packages.json','utf8')),settings=JSON.parse(await readFile('config/niche-network.json','utf8')),now=Date.now(),pages=projectPublicPages(pkg,packages,settings,now),future=pkg.pages.find(p=>p.slug==='gidai/pasiulymu-palyginimas');
assert.equal(mode==='before'?now<Date.parse(future.publishAt):now>=Date.parse(future.publishAt),true,'Real wall clock must be on the requested side of publishAt. No fake clock.');
const observations=[];
function get(path,host=pkg.canonicalHost){return new Promise((resolve,reject)=>{request(new URL(path,base),{headers:{host},agent:false},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{const body=Buffer.concat(chunks);observations.push({path,host,status:res.statusCode,contentType:res.headers['content-type'],noindex:res.headers['x-robots-tag'],bytes:body.length,sha256:createHash('sha256').update(body).digest('hex')});resolve({status:res.statusCode,headers:res.headers,text:body.toString()});});}).on('error',reject).end();});}
const escape=t=>t.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');
for(const p of pages){const r=await get(p.slug?'/'+p.slug:'/');assert.equal(r.status,200,p.slug);assert.equal((r.text.match(/<h1(?:\s|>)/g)||[]).length,1,p.slug);assert.ok(r.text.includes(`<link rel="canonical" href="https://${pkg.canonicalHost}/${p.slug}"`),p.slug);assert.ok(r.text.includes('type="application/ld+json"'));assert.ok(r.text.includes(escape(p.title)));await mkdir('output/audits/roletai/html',{recursive:true});await writeFile(`output/audits/roletai/html/${p.slug.replaceAll('/','-')||'home'}.html`,r.text);}
for(const path of ['/sitemap.xml','/llms.txt','/llms-full.txt']){const r=await get(path);assert.equal(r.status,200);for(const p of pages)assert.ok(r.text.includes(`https://${pkg.canonicalHost}/${p.slug}`),path+p.slug);assert.equal(r.text.includes('/gidai/pasiulymu-palyginimas'),mode==='after',path);if(path==='/llms-full.txt')for(const p of pages)for(const b of p.body)if(b.type==='paragraph')assert.ok(r.text.includes(b.text),`Full reading body ${p.slug}`);await writeFile('output/audits/roletai/'+mode+'-'+path.slice(1),r.text);}
const robots=await get('/robots.txt');assert.ok(robots.text.includes('Sitemap: https://roletaiklaipedoje.lt/sitemap.xml'));
const local=await get('/','127.0.0.1:8794');assert.match(local.headers['x-robots-tag'],/noindex/);
assert.ok((await get('/robots.txt','127.0.0.1:8794')).text.includes('Disallow: /'));
assert.equal((await get('/gidai/pasiulymu-palyginimas')).status,mode==='after'?200:404);
for(const m of future.media)assert.equal((await get(m.src)).status,mode==='after'?200:404,m.src);
for(const p of pages)for(const m of p.media)assert.equal((await get(m.src)).status,200,m.src);
for(const path of ['/neegzistuoja','/gidai/pelesis','/roletai-diena-naktis','/akcijos','/produktas/senas','/content-studio/data/sites/roletaiklaipedoje.json','/sites/roletaiklaipedoje/WRITER_RUNS.json','/release-manifest.json','/.dev.vars','/api/ingest/articles','/niche/roletaiklaipedoje','/content-assets/roletaiklaipedoje/776df12d-2b06-4ad8-982f-1697e692baaa.webp'])assert.equal((await get(path)).status,404,path);
const legacySlash=await get('/roletai-diena-naktis/');assert.equal(legacySlash.status,308);assert.equal(new URL(legacySlash.headers.location,base).pathname,'/roletai-diena-naktis');assert.equal((await get('/roletai-diena-naktis')).status,404);
assert.equal((await get('/','unknown-domain.example')).status,404);
assert.equal((await get(pages[0].media[0].src,'akmenas.lt')).status,404);
for(const path of ['/gidai/','/gidai?tema=sviesa']){const r=await get(path);assert.ok([200,301,308].includes(r.status));if(r.status===200)assert.ok(r.text.includes('href="https://roletaiklaipedoje.lt/gidai"'));}
for(const path of ['/favicon.svg','/favicon.ico']){const r=await get(path);assert.equal(r.status,200);assert.match(r.text,/M5 40V4/);}
const report={mode,observedAt:new Date(now).toISOString(),futurePublishAt:future.publishAt,clock:'actual-wall-clock',packageSha256:createHash('sha256').update(bytes).digest('hex'),eligible:pages.length,requests:observations.length,observations};await writeFile(`output/audits/roletai/http-${mode}.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({...report,observations:undefined}));
