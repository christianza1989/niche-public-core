import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
const base=process.argv[2]||'http://127.0.0.1:8956';
const output=path.resolve(process.argv[3]||'../../output/signaturepads-migration-20261029');
const data=JSON.parse(await readFile('sites/signaturepads/migration/site-source.json','utf8'));
const records=[],references=new Set();
for(const route of data.routes){
  const response=await fetch(base+route.path),body=await response.text();
  assert.equal(response.status,200,route.path);assert.ok(response.headers.get('x-robots-tag')?.includes('noindex'));
  assert.ok(body.includes(`href="${route.canonical}"`),`canonical ${route.path}`);
  assert.ok(!/wp-content\/(?:plugins|themes)\//.test(body),`WordPress dependency ${route.path}`);
  if(route.kind==='product')assert.ok(body.includes(data.products.find(p=>p.id===route.productId).contentHtml),`product text ${route.path}`);
  if(route.kind==='category')assert.ok(body.includes(route.html),`category text ${route.path}`);
  if(route.kind==='page')assert.ok(body.includes(route.html.replace(/<h1(\s|>)/g,'<h2$1').replaceAll('</h1>','</h2>')),`page text ${route.path}`);
  if(route.kind==='home')for(const accordion of data.home.accordions)assert.ok(body.includes(accordion.html),'home copy');
  for(const match of body.matchAll(/\b(?:href|src)="(\/[^"\s]*)"/g))references.add(match[1].replaceAll('&amp;','&'));
  records.push({path:route.path,status:response.status,canonical:route.canonical,htmlBytes:Buffer.byteLength(body),originalText:'PASS'});
}
// The stock WordPress Sample Page contains a login link. WordPress admin is
// not a public content URL and is deliberately not recreated by this preview.
const administrativeLinks=[...references].filter(href=>href.startsWith('/wp-admin/'));
for(const href of references){if(administrativeLinks.includes(href))continue;const response=await fetch(new URL(href,base),{method:'HEAD'});assert.equal(response.status,200,href);}
const unknown=await fetch(base+'/migration-does-not-exist/');assert.equal(unknown.status,404);assert.ok(!(await unknown.text()).includes('rel="canonical"'));
const legacy=await fetch(base+'/?p=488',{redirect:'manual'});assert.equal(legacy.status,301);assert.equal(legacy.headers.get('location'),'/produktas/paraso-plansete-signotec-sigma/');
const slash=await fetch(base+'/produktas/paraso-plansete-signotec-sigma',{redirect:'manual'});assert.equal(slash.status,308);assert.equal(slash.headers.get('location'),'/produktas/paraso-plansete-signotec-sigma/');
const pagination=await fetch(base+'/prekes/page/2/');assert.equal(pagination.status,200);
const search=await fetch(base+'/prekes/?s=Sigma');const searchBody=await search.text();assert.ok(searchBody.includes('Sigma'));assert.ok(!searchBody.includes('sp-card-category">Parašo planšetės</a><h3><a href="/produktas/paraso-plansete-signotec-omega/'));
const robots=await fetch(base+'/robots.txt').then(r=>r.text());assert.ok(robots.includes('Disallow: /'));
for(const route of ['/sitemap.xml','/sitemap_index.xml','/page-sitemap.xml','/product-sitemap.xml','/product_cat-sitemap.xml'])assert.equal((await fetch(base+route)).status,200);
const blockedHost=await new Promise((resolve,reject)=>{const u=new URL(base);const r=http.request({hostname:u.hostname,port:u.port,path:'/',headers:{Host:'signaturepads.lt'}},response=>{response.resume();resolve(response.statusCode);});r.on('error',reject);r.end();});assert.equal(blockedHost,403);
const badOrigin=await fetch(base+'/uzklausa',{method:'POST',headers:{Origin:'https://example.invalid','Content-Type':'application/x-www-form-urlencoded'},body:'name=Testas'});assert.equal(badOrigin.status,403);
const invalid=await fetch(base+'/uzklausa',{method:'POST',headers:{Origin:base,'Content-Type':'application/x-www-form-urlencoded'},body:'name=X&email=bad&message=short'});assert.equal(invalid.status,400);
const marker='SIGNATUREPADS_MIGRATION_QA_20261029';
const state=path.join(output,'preview-state/leads.jsonl');let prior='';try{prior=await readFile(state,'utf8');}catch{}
const valid=await fetch(base+'/uzklausa',{method:'POST',headers:{Origin:base,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({name:marker,email:'migration-test@example.invalid',phone:'',preference:'El. paštu',message:marker+' – izoliuotas vietinės užklausos patvarumo bandymas.'})});assert.equal(valid.status,200);const message=await valid.json();assert.ok(message.message.includes('tik šiame kompiuteryje'));
const persisted=await readFile(state,'utf8');assert.ok(persisted.includes(marker));
// Remove only this test's newly written marker; retain every other record.
const preserved=persisted.split('\n').filter((line,index)=>!line.includes(marker)||index<prior.split('\n').length-1).filter(Boolean).join('\n');await writeFile(state,preserved?preserved+'\n':'');
const report={checkedAt:new Date().toISOString(),scope:'local-unapproved-migration-preview',base,status:'PASS',routes:records,uniqueInternalTargets:references.size,administrativeLinksExcluded:administrativeLinks,checks:['all captured routes 200','original source text retained','canonical URLs retained','no WordPress theme/plugin runtime','public internal page/asset targets 200','legacy ID and slash redirects','catalogue pagination and search','404 without canonical','private robots','sitemap compatibility','public Host rejected','form origin rejection and validation','durable local form record and exact test cleanup'],productionCoreAdmission:'PENDING',productionEmail:'NOT_ENABLED',productionDeployment:'NOT_CHANGED'};
await writeFile(path.join(output,'PREVIEW-VERIFICATION.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({status:report.status,routes:records.length,internalTargets:references.size,checks:report.checks,report:path.join(output,'PREVIEW-VERIFICATION.json')},null,2));
