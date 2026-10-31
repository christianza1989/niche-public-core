import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { createHash } from 'node:crypto';
const base=process.argv[2]||'http://127.0.0.1:8956';
const output=path.resolve(process.argv[3]||'../../output/signaturepads-migration-20261029');
const data=JSON.parse(await readFile('sites/signaturepads/migration/site-source.json','utf8'));
const original=JSON.parse(await readFile(path.join(output,'normalized-browser.json'),'utf8'));
const fragments=JSON.parse(await readFile(path.join(output,'fragments.json'),'utf8'));
const editorial=JSON.parse(await readFile('sites/signaturepads/migration/editorial-updates.json','utf8'));
const decisions=JSON.parse(await readFile('sites/signaturepads/migration/owner-decisions.json','utf8'));
const allowedIds=decisions.softwareDescriptionAuthoringException.productIds;
assert.equal(editorial.pages.length,6,'exactly the six authorized descriptions');
assert.deepEqual([...editorial.pages.map(p=>p.productId)].sort(),[...allowedIds].sort());
assert.equal(new Set(editorial.pages.map(p=>p.description)).size,6,'unique software metadata');
assert.deepEqual(data.routes.map(r=>r.path),original.routes.filter(r=>!decisions.retiredPaths.includes(r.path)).map(r=>r.path),'original active URLs and order');
for(const route of data.routes){
  const before=original.routes.find(r=>r.path===route.path);
  assert.equal(route.title,before.title,'original visible page title');
  assert.equal(route.canonical,before.canonical,'original canonical URL');
  if(allowedIds.includes(route.productId)){
    const update=editorial.pages.find(p=>p.productId===route.productId);
    assert.equal(route.html,update.html,'reviewed software description applied');
    assert.equal(route.description,update.description,'reviewed software metadata applied');
    assert.equal(update.review.status,'verified-local-draft');
    assert.equal(createHash('sha256').update(update.html).digest('hex'),update.review.htmlSha256,'review refers to this exact HTML');
    assert.equal(createHash('sha256').update(update.description).digest('hex'),update.review.metadataSha256,'review refers to this exact metadata');
    for(const source of update.provenance.sources){
      const bytes=await readFile(path.join(output,'editorial',source.rawArtifact));
      assert.equal(createHash('sha256').update(bytes).digest('hex'),source.rawSha256,'manufacturer evidence integrity');
    }
  }else{
    const fragment=fragments.find(f=>f.path===route.path);
    assert.equal(route.html,route.kind!=='catalog'&&fragment?fragment.html:before.html,`unchanged original body ${route.path}`);
  }
}
for(const product of data.products){
  const before=original.products.find(p=>p.id===product.id);
  assert.deepEqual(product.prices,before.prices,'original catalogue price');
  assert.equal(product.name,original.routes.find(r=>r.productId===product.id).title,'original product name');
}
assert.deepEqual(data.contact,{email:'sales@signaturepads.lt',phone:'+370 686 88369'},'original contacts');
assert.deepEqual(data.home.accordions,original.home.accordions,'unchanged homepage copy');
const records=[],references=new Set();
const normalizeHeadings=value=>value.replace(/<h[1-6](\s|>)/g,'<heading$1').replace(/<\/h[1-6]>/g,'</heading>');
for(const route of data.routes){
  const response=await fetch(base+route.path),body=await response.text();
  assert.equal(response.status,200,route.path);assert.ok(response.headers.get('x-robots-tag')?.includes('noindex'));
  assert.ok(body.includes(`href="${route.canonical}"`),`canonical ${route.path}`);
  assert.ok(route.description.trim(),`missing metadata ${route.path}`);
  assert.ok(!/\s[-–|]$/.test(route.metaTitle),`dangling title separator ${route.path}`);
  assert.ok(!/wp-content\/(?:plugins|themes)\//.test(body),`WordPress dependency ${route.path}`);
  if(route.kind==='product')assert.ok(body.includes(data.products.find(p=>p.id===route.productId).contentHtml),`product text ${route.path}`);
  if(route.kind==='category')assert.ok(body.includes(route.html),`category text ${route.path}`);
  if(route.kind==='page')assert.ok(normalizeHeadings(body).includes(normalizeHeadings(route.html)),`unchanged page words; leading heading promoted to H1 ${route.path}`);
  assert.equal([...body.matchAll(/<h1(?:\s|>)/g)].length,1,`one visible primary heading ${route.path}`);
  assert.ok(body.includes('class="sp-footer-brand"'),`restored footer logo ${route.path}`);
  assert.ok(body.includes('class="sp-top"'),`restored return-to-top link ${route.path}`);
  const illustration=route.kind==='category'&&route.images.find(i=>/Paraso-plansetes-signotec-1024x602\.jpg$|epsilon_produktbild_12-1\.png$/.test(i.src));
  if(illustration)assert.ok(body.includes(illustration.src),`restored category illustration ${route.path}`);
  if(route.kind==='home')for(const accordion of data.home.accordions)assert.ok(body.includes(accordion.html),'home copy');
  for(const match of body.matchAll(/\b(?:href|src)="(\/[^"\s]*)"/g))references.add(match[1].replaceAll('&amp;','&'));
  records.push({path:route.path,status:response.status,canonical:route.canonical,htmlBytes:Buffer.byteLength(body),text:allowedIds.includes(route.productId)?'owner-authorized reviewed software draft':'retained original source'});
}
// The stock WordPress Sample Page contains a login link. WordPress admin is
// not a public content URL and is deliberately not recreated by this preview.
const administrativeLinks=[...references].filter(href=>href.startsWith('/wp-admin/'));
for(const href of references){if(administrativeLinks.includes(href))continue;const response=await fetch(new URL(href,base),{method:'HEAD'});assert.equal(response.status,200,href);}
const unknown=await fetch(base+'/migration-does-not-exist/');assert.equal(unknown.status,404);assert.ok(!(await unknown.text()).includes('rel="canonical"'));
const legacy=await fetch(base+'/?p=488',{redirect:'manual'});assert.equal(legacy.status,301);assert.equal(legacy.headers.get('location'),'/produktas/paraso-plansete-signotec-sigma/');
const slash=await fetch(base+'/produktas/paraso-plansete-signotec-sigma',{redirect:'manual'});assert.equal(slash.status,308);assert.equal(slash.headers.get('location'),'/produktas/paraso-plansete-signotec-sigma/');
const pagination=await fetch(base+'/prekes/page/2/');assert.equal(pagination.status,200);
for(const route of data.retiredRoutes||[]){for(const suffix of [route.path,route.path.replace(/\/$/,'')]){const r=await fetch(base+suffix);assert.equal(r.status,410,suffix);assert.ok(!(await r.text()).includes('rel="canonical"'));}}
for(const alias of ['/?page_id=2','/?page_id=189','/cart/','/checkout/','/krepselis/','/atsiskaitymas/','/paysera/','/?add-to-cart=488','/?wc-api=WebToPay'])assert.equal((await fetch(base+alias)).status,410,alias);
const forbiddenPayment=await fetch(base+'/paysera/',{method:'POST',body:'test=blocked'});assert.equal(forbiddenPayment.status,410);
const search=await fetch(base+'/prekes/?s=Sigma');const searchBody=await search.text();assert.ok(searchBody.includes('Sigma'));assert.ok(!searchBody.includes('sp-card-category">Parašo planšetės</a><h3><a href="/produktas/paraso-plansete-signotec-omega/'));
const softwarePath='/iranga/programine-iranga/';
const sorted=await fetch(base+softwarePath+'?orderby=price-desc&min_price=80&max_price=100&product_count=24').then(r=>r.text());
const prices=[...sorted.matchAll(/class="sp-card-price">([^<]+)/g)].map(m=>Number(m[1].replace('€','').replace(/\s/g,'').replace(',','.')));
assert.ok(prices.length>1&&prices.every((price,index)=>price>=80&&price<=100&&(index===0||price<=prices[index-1])),'price filter and descending order jointly applied');
assert.ok(sorted.includes('name="orderby"')&&sorted.includes('value="price-desc" selected'),'visible sorting selection retained');
assert.ok(sorted.includes('type="range" name="min_price"')&&sorted.includes('type="range" name="max_price"'),'native dual range price control');
assert.ok(sorted.includes('name="product_count" value="24"'),'sorting/filter forms retain catalogue query');
const robots=await fetch(base+'/robots.txt').then(r=>r.text());assert.ok(robots.includes('Disallow: /'));
for(const route of ['/sitemap.xml','/sitemap_index.xml','/page-sitemap.xml','/product-sitemap.xml','/product_cat-sitemap.xml']){const r=await fetch(base+route);assert.equal(r.status,200);const xml=await r.text();for(const old of data.retiredRoutes||[])assert.ok(!xml.includes(data.origin+old.path),`retired URL in ${route}`);assert.ok(!xml.includes('wp-content/plugins/'),'legacy XSL dependency');}
const blockedHost=await new Promise((resolve,reject)=>{const u=new URL(base);const r=http.request({hostname:u.hostname,port:u.port,path:'/',headers:{Host:'signaturepads.lt'}},response=>{response.resume();resolve(response.statusCode);});r.on('error',reject);r.end();});assert.equal(blockedHost,403);
const badOrigin=await fetch(base+'/uzklausa',{method:'POST',headers:{Origin:'https://example.invalid','Content-Type':'application/x-www-form-urlencoded'},body:'name=Testas'});assert.equal(badOrigin.status,403);
const invalid=await fetch(base+'/uzklausa',{method:'POST',headers:{Origin:base,'Content-Type':'application/x-www-form-urlencoded'},body:'name=X&email=bad&message=short'});assert.equal(invalid.status,400);
const marker='SIGNATUREPADS_MIGRATION_QA_20261029';
const state=path.join(output,'preview-state/leads.jsonl');let prior='';try{prior=await readFile(state,'utf8');}catch{}
const valid=await fetch(base+'/uzklausa',{method:'POST',headers:{Origin:base,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({name:marker,email:'migration-test@example.invalid',phone:'',preference:'El. paštu',message:marker+' – izoliuotas vietinės užklausos patvarumo bandymas.'})});assert.equal(valid.status,200);const message=await valid.json();assert.ok(message.message.includes('tik šiame kompiuteryje'));
const persisted=await readFile(state,'utf8');assert.ok(persisted.includes(marker));
// Remove only this test's newly written marker; retain every other record.
const preserved=persisted.split('\n').filter((line,index)=>!line.includes(marker)||index<prior.split('\n').length-1).filter(Boolean).join('\n');await writeFile(state,preserved?preserved+'\n':'');
const report={checkedAt:new Date().toISOString(),scope:'local-unapproved-migration-preview',base,status:'PASS',routes:records,uniqueInternalTargets:references.size,administrativeLinksExcluded:administrativeLinks,retiredRoutes:data.retiredRoutes,softwareDescriptions:{completed:editorial.pages.length,expected:6,author:'Codex under direct owner exception',manufacturerEvidenceHashes:'PASS',reviewedHtmlHashes:'PASS'},checks:['all active captured routes 200','all unedited bodies compared to original capture','original product titles prices and contacts retained','six authorized reviewed descriptions and unique metadata applied','manufacturer evidence and reviewed HTML hashes verified','canonical URLs retained','all active metadata nonempty; dangling separators removed','no WordPress theme/plugin runtime','public internal page/asset targets 200','legacy ID and slash redirects','owner-retired pages 410','cart checkout Paysera and add-to-cart aliases disabled','retired pages removed from all sitemaps','catalogue pagination and search','404 without canonical','private robots','sitemap compatibility','public Host rejected','form origin rejection and validation','durable local form record and exact test cleanup'],productionCoreAdmission:'PENDING',productionEmail:'NOT_ENABLED',productionDeployment:'NOT_CHANGED'};
await writeFile(path.join(output,'PREVIEW-VERIFICATION.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({status:report.status,routes:records.length,internalTargets:references.size,checks:report.checks,report:path.join(output,'PREVIEW-VERIFICATION.json')},null,2));
