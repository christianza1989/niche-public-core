import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {memoRedirectPath,memoRedirectUrl} from '../lib/memocasting-routes.mjs';
import {memoLegacySitemapPaths} from '../lib/memocasting-legacy-redirects.mjs';
import {projectPublicPages} from '../lib/niche-links.mjs';

const pkg=JSON.parse(await readFile(new URL('../content-packages/memocasting/content-package.json',import.meta.url),'utf8'));
const liveAt=Date.parse('2026-10-25T08:00:00Z');
const visible=(at=liveAt,source=pkg)=>projectPublicPages(source,[source],{},at);
// These are the actual 17 GSC URL forms: slash and query variants are retained.
const immediate=[
 ['/en/','/'],['/en','/'],['/ru/','/'],
 ['/en/products/liejimo-rinkinys-porai','/rinkinys-porai'],
 ['/en/products/seimos-rinkinys-1','/seimos-rinkinys'],
 ['/en/password','/'],['/en/pages/d-u-k','/pagalba'],
 ['/en/collections','/ranku-liejimo-rinkiniai'],
 ['/en/collections/all','/ranku-liejimo-rinkiniai'],
 ['/products?page=3','/ranku-liejimo-rinkiniai'],
 ['/en/blogs/news','/gidai'],['/en/blogs/news?page=10','/gidai'],
 ['/en/collections/dovanos-poroms','/gidai/dovana-porai'],
 ['/collections/geriauios-kaledines-dovanos','/gidai/kaledines-dovanos'],
 ['/sitemap_products_1.xml?from=5906645745828&to=7494854344868','/sitemap.xml'],
 ['/sitemap_collections_1.xml?from=642577727811&to=642677408067','/sitemap.xml'],
 ['/sitemap_blogs_1.xml','/sitemap.xml'],
];
const scheduled=[
 ['/en/collections/dovana-teciui','gidai/dovanos-teciui'],
 ['/en/collections/dovana-dukrai','gidai/dovanos-dukrai'],
 ['/en/collections/dovanos-draugei','gidai/dovanos-draugei'],
 ['/en/collections/dovana-draugei-gimtadienio-proga','gidai/dovanos-draugei'],
 ['/en/collections/gimtadienio-dovanos','gidai/dovanos-gimtadienio-proga'],
 ['/blogs/praktiskos-dovanos','gidai/praktiskos-dovanos'],
 ['/en/blogs/praktiskos-dovanos','gidai/praktiskos-dovanos'],
 ['/en/blogs/news/dovanos-merginoms-jaunatviskos-ir-smagios-idejos','gidai/dovanos-merginai'],
 ['/en/blogs/dovanos-valentino-dienai?page=4','gidai/dovanos-valentino-dienai'],
 ['/blogs/dovanos-valentino-dienai?page=6','gidai/dovanos-valentino-dienai'],
 ['/blogs/dovanos-valentino-dienai?page=3','gidai/dovanos-valentino-dienai'],
 ['/en/blogs/gimtadienio-dovanos','gidai/dovanos-gimtadienio-proga'],
 ['/collections/dovana-sunui','gidai/dovanos-sunui'],
 ['/collections/jubiliejaus-dovanos','gidai/dovanos-jubiliejui'],
 ['/collections/dovana-dukrai','gidai/dovanos-dukrai'],
];

test('17 GSC forms are exact, single-target aliases to current public pages or the XML sitemap',()=>{
 const live=visible();
 assert.equal(immediate.length,17);
 assert.equal(new Set(immediate.map(([p])=>new URL(p,'https://memocasting.lt').pathname.replace(/\/$/,''))).size,15);
 for(const [source,target] of immediate){
  for(const method of ['GET','HEAD']){
   const moved=memoRedirectUrl('https://memocasting.lt'+source,live,method);
   assert.equal(moved?.pathname,target,source);
   assert.equal(memoRedirectPath(target,live,method),null,source+' has no second alias hop');
   if(target==='/sitemap.xml')assert.equal(moved.search,'','old Shopify sitemap range must not survive');
   else if(['/ranku-liejimo-rinkiniai','/gidai'].includes(target))assert.equal(moved.search,'','old index pagination must not survive');
   else assert.ok(live.some(p=>'/'+p.slug===target),source+' public target');
  }
 }
});

test('known index aliases drop only obsolete page while preserving attribution and other query meanings',()=>{
 const live=visible();
 for(const source of ['/products','/collections/all','/en/collections','/en/collections/all','/blogs/news','/en/blogs/news']){
  for(const method of ['GET','HEAD']){
   const moved=memoRedirectUrl('https://memocasting.lt'+source+'?utm_source=gift%20guide&page=3&utm_campaign=Christmas%202026&page=10&ref=partner%2Bfriend&Page=keep',live,method);
   assert.ok(moved,source);
   assert.equal(moved.searchParams.has('page'),false,source+' removes all old pagination values');
   assert.deepEqual([...moved.searchParams],[['utm_source','gift guide'],['utm_campaign','Christmas 2026'],['ref','partner+friend'],['Page','keep']],source+' preserves other parameters and values');
   assert.equal(memoRedirectUrl('https://memocasting.lt'+source+'?utm_source=gift%20guide&ref=a%2Bb',live,method).search,'?utm_source=gift%20guide&ref=a%2Bb',source+' query without page stays byte-for-byte');
  }
 }
 for(const source of ['/products/liejimo-rinkinys-porai','/en/products/seimos-rinkinys-1','/en/collections/dovanos-poroms']){
  const moved=memoRedirectUrl('https://memocasting.lt'+source+'?page=3&utm_source=gift',live);
  assert.equal(moved?.search,'?page=3&utm_source=gift',source+' is not an index alias');
 }
 for(const source of ['/ranku-liejimo-rinkiniai','/gidai'])assert.equal(memoRedirectUrl('https://memocasting.lt'+source+'?page=3&utm_source=gift',live),null,'native query handling is not replaced');
 const slug='gidai/dovanos-valentino-dienai',at=Date.parse(pkg.pages.find(p=>p.slug===slug).publishAt);
 assert.equal(memoRedirectUrl('https://memocasting.lt/en/blogs/dovanos-valentino-dienai?page=4&utm_source=gift',visible(at-1)),null);
 assert.equal(memoRedirectUrl('https://memocasting.lt/en/blogs/dovanos-valentino-dienai?page=4&utm_source=gift',visible(at)).search,'?page=4&utm_source=gift','scheduled article semantics are unchanged');
});

test('all 15 reported scheduled forms activate only at their actual target publication boundary',()=>{
 assert.equal(scheduled.length,15);
 for(const [source,slug] of scheduled){
  const page=pkg.pages.find(p=>p.slug===slug);assert.ok(page,slug);
  const at=Date.parse(page.publishAt);assert.ok(at>liveAt,slug+' must remain scheduled');
  assert.equal(memoRedirectUrl('https://memocasting.lt'+source,visible(at-1)),null,source+' before publication');
  assert.equal(memoRedirectUrl('https://memocasting.lt'+source,visible(at))?.pathname,'/'+slug,source+' at publication');
  for(const change of [{approval:{...page.approval,status:'revoked'}},{revisionHash:'changed-after-approval'}]){
   const hidden={...pkg,pages:pkg.pages.map(p=>p.id===page.id?{...p,...change}:p)};
   assert.equal(memoRedirectUrl('https://memocasting.lt'+source,visible(at,hidden)),null,source+' revoked/stale');
  }
 }
});

test('XML resources and exact language aliases preserve method, native-owner and privacy boundaries',()=>{
 const live=visible();
 for(const [source] of [...immediate,...scheduled])for(const method of ['POST','PUT','DELETE'])assert.equal(memoRedirectUrl('https://memocasting.lt'+source,live,method),null);
 for(const source of memoLegacySitemapPaths){
  assert.equal(memoRedirectPath('/'+source,[]),null);
  assert.equal(memoRedirectPath('/'+source,[{slug:'rinkinys-porai',type:'product'}]),null);
  assert.equal(memoRedirectPath('/'+source,[{slug:'',type:'home'},{slug:source,type:'faq'}]),null);
 }
 for(const [source] of immediate.filter(([s])=>!s.includes('.xml'))){
  const slug=new URL(source,'https://memocasting.lt').pathname.replace(/^\//,'').replace(/\/$/,'');
  assert.equal(memoRedirectUrl('https://memocasting.lt'+source,[...live,{slug,type:'faq'}]),null,'native route owns '+source);
 }
 for(const source of ['/en/password?password=private&return_url=https%3A%2F%2Fexample.com','/en/password/?token=private'])assert.equal(memoRedirectUrl('https://memocasting.lt'+source,live)?.href,'https://memocasting.lt/');
 for(const source of ['/en/unknown','/en/products/unrelated','/ru/products/seimos-rinkinys-1','/pl/en/products/liejimo-rinkinys-porai','/en/account/register','/cart/add','/${t}','/blogs/hand-casting','/en/collections/dovanos-senjorams','/sitemap_unknown.xml'])assert.equal(memoRedirectUrl('https://memocasting.lt'+source,live),null,source+' must not be guessed');
});

// An HTTP contract fixture exercises actual package eligibility and the shared
// resolver, not a framework build. Parent acceptance still checks the real
// proxy/normalization order and hosted XML handler after its final build.
test('HTTP contract: 17 current forms reach 200; 15 future forms are 404 before and 301 to 200 at publication',async()=>{
 let clock=liveAt;
 const server=createServer((req,res)=>{
  const url=new URL(req.url,'https://memocasting.lt'),live=visible(clock),moved=memoRedirectUrl(url,live,req.method);
  if(moved){res.writeHead(301,{Location:moved.pathname+moved.search+moved.hash});res.end();return;}
  const page=live.find(p=>'/'+p.slug===url.pathname);
  const sitemap=url.pathname==='/sitemap.xml'&&live.some(p=>p.type==='home'&&p.slug==='');
  res.writeHead(page||sitemap?200:404,{'content-type':sitemap?'application/xml':'text/html'});
  res.end(sitemap?'<urlset></urlset>':page?'<h1>'+page.title+'</h1>':'Not found');
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 try{
  const follow=async(source,expected)=>{
   const first=await fetch(base+source,{redirect:'manual'});assert.equal(first.status,301,source);
   const destination=first.headers.get('location');assert.ok(destination?.startsWith('/')&&!destination.startsWith('//'));
   if(expected)assert.equal(destination,expected,source+' exact redirect destination');
   const second=await fetch(base+destination,{redirect:'manual'});assert.equal(second.status,200,source+' target');
  };
  for(const [source,target] of immediate)await follow(source,target);
  await follow('/products?page=3&utm_source=gift','/ranku-liejimo-rinkiniai?utm_source=gift');
  await follow('/en/blogs/news?utm_source=gift&page=10','/gidai?utm_source=gift');
  for(const [source,slug] of scheduled){
   const at=Date.parse(pkg.pages.find(p=>p.slug===slug).publishAt);clock=at-1;
   assert.equal((await fetch(base+source,{redirect:'manual'})).status,404,source+' before');
   clock=at;await follow(source);
  }
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
