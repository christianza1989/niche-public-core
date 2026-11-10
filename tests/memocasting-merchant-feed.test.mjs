import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import registry from '../lib/memocasting-merchant-products.json' with {type:'json'};
import {memoMerchantFeedXml,serveMemoMerchantFeed} from '../lib/memocasting-merchant-feed.mjs';
import {memoApplyProductContent,memoProductSku} from '../lib/memocasting-product-content.mjs';
import {projectPublicPages} from '../lib/niche-links.mjs';

const now=Date.parse('2026-10-25T07:00:00Z');
const page=(slug,title)=>({siteId:'memocasting',id:slug,type:'product',slug,title,description:'Sena redakcinė 99 € kaina',body:[],media:[],links:[],publishAt:'2026-10-01T00:00:00Z',revisionHash:'current',approval:{status:'approved',revisionHash:'current',approvedAt:'2026-10-01T00:00:00Z'}});
const pkg={siteId:'memocasting',canonicalHost:'memocasting.lt',locale:'lt-LT',pages:[page('rinkinys-porai','Rinkinys porai'),page('seimos-rinkinys','Šeimos rinkinys')]};
const context={schemaVersion:1,environment:'production',testOnly:false,paymentConnected:true,paymentEnvironment:'live',paymentAccountVerified:true,productionReady:true,publishOffers:true,eligibleCountries:['LT']};
const product=(sku,cents,weightGrams)=>({sku,title:sku==='couple'?'Rankų liejimo rinkinys porai':'Rankų liejimo rinkinys šeimai',enabled:true,available:4,prices:{LT:cents},package:{weightGrams,dimensionsMm:[200,200,170]},
 optionGroups:[{id:'finish',label:'Dažų spalva',defaultValue:'white',values:[{id:'white',label:'Balta',enabled:true,prices:{LT:0},imageId:sku+'_white'},{id:'gold',label:'Auksinė',enabled:true,prices:{LT:300},imageId:sku+'_gold'}]},
 {id:'base',label:'Padėklas',defaultValue:'none',values:[{id:'none',label:'Be padėklo',enabled:true,prices:{LT:0}},{id:'wood',label:'Medinis',enabled:false,prices:{LT:1200}}]}],
 content:{summary:'Rinkinys su baltais dažais.',images:[{id:sku+'_white',src:'/prekyba/catalog-media/'+sku+'_white',width:1122,height:1402,choices:{finish:'white',base:'none'}},{id:sku+'_gold',src:'/prekyba/catalog-media/'+sku+'_gold',width:1122,height:1402,choices:{finish:'gold'}}]}});
const shop=()=>({products:[product('couple',3200,2200),product('family',4800,4500)],context:structuredClone(context)});
const project=(candidate=pkg)=>projectPublicPages(candidate,[candidate],{},now);
const request=({host='memocasting.lt',method='GET',url='https://'+host+'/prekiu-srautas.xml',headers={}}={})=>new Request(url,{method,headers:{host,...headers}});
const options=(snapshot=shop(),candidate=pkg)=>({pkg:candidate,eligiblePages:project(candidate),loadCatalog:async()=>snapshot});
const items=output=>output.match(/<item>[\s\S]*?<\/item>/g)??[];

test('manufacturer registry assigns two stable MPNs only to white kits without a base',()=>{
 assert.deepEqual(registry.products.map(p=>[p.sku,p.mpn]),[['couple','MC-COUPLE-WHITE'],['family','MC-FAMILY-WHITE']]);
 assert.equal(new Set(registry.products.map(p=>p.mpn)).size,2);assert.equal(registry.brand,'Memory Casting');
 for(const entry of registry.products){assert.equal(entry.gtinAssigned,false);assert.deepEqual(entry.choices,{finish:'white',base:'none'});}
});

test('RSS uses actual native product projection, live prices, selected white images and package weights',()=>{
 const snapshot=shop(),output=memoMerchantFeedXml(pkg,project(),snapshot),entries=items(output);
 assert.equal(entries.length,2);assert.match(output,/^<\?xml version="1.0" encoding="UTF-8"\?>/);assert.ok(output.includes('xmlns:g="http://base.google.com/ns/1.0"'));
 for(const [index,entry] of entries.entries()){
  const expected=memoApplyProductContent(pkg.pages[index],snapshot.products[index],snapshot.context);
  assert.ok(entry.includes('<g:title>'+expected.title+'</g:title>'));assert.ok(entry.includes('<g:description>'+expected.description+'</g:description>'));
  assert.ok(entry.includes('<g:link>https://memocasting.lt/'+expected.slug+'</g:link>'));
  assert.ok(entry.includes('<g:price>'+expected.seoOffer.price+' EUR</g:price>'));
  assert.ok(entry.includes('<g:image_link>https://memocasting.lt/prekyba/catalog-media/'+snapshot.products[index].sku+'_white</g:image_link>'));
  assert.ok(entry.includes('<g:availability>in_stock</g:availability>'));assert.ok(entry.includes('<g:brand>Memory Casting</g:brand>'));assert.ok(entry.includes('<g:condition>new</g:condition>'));
 }
 assert.ok(output.includes('<g:shipping_weight>2.2 kg</g:shipping_weight>'));assert.ok(output.includes('<g:shipping_weight>4.5 kg</g:shipping_weight>'));
 assert.ok(!output.includes('99'));assert.ok(!output.includes('_gold'));assert.ok(!output.includes('<g:shipping>'));
 assert.ok(!output.includes('<g:gtin>'));assert.ok(!output.includes('identifier_exists'));assert.ok(!output.includes('gtinAssigned'));assert.ok(!output.includes('testOnly'));
});

test('price, stock, image and weight changes come from each current published snapshot',()=>{
 const snapshot=shop();snapshot.products[0].prices.LT=3500;snapshot.products[0].available=0;snapshot.products[0].package.weightGrams=2250;
 const replacement={...snapshot.products[0].content.images[0],id:'new_white',src:'/prekyba/catalog-media/new_white'};
 snapshot.products[0].content.images=[replacement];snapshot.products[0].optionGroups[0].values[0].imageId=replacement.id;
 const output=memoMerchantFeedXml(pkg,project(),snapshot),entry=items(output)[0];
 assert.ok(entry.includes('<g:price>35.00 EUR</g:price>'));assert.ok(entry.includes('<g:availability>out_of_stock</g:availability>'));
 assert.ok(entry.includes('/prekyba/catalog-media/new_white'));assert.ok(entry.includes('<g:shipping_weight>2.25 kg</g:shipping_weight>'));
 assert.ok(!entry.includes('32.00'));delete snapshot.products[0].package;
 assert.ok(!items(memoMerchantFeedXml(pkg,project(),snapshot))[0].includes('shipping_weight'));
});

test('future, revoked, edited, foreign and raw-package-only products cannot enter the feed',()=>{
 for(const change of [{publishAt:'2030-01-01T00:00:00Z'},{revisionHash:'edited'},{approval:{status:'revoked',revisionHash:'current'}},{siteId:'other'}]){
  const candidate={...pkg,pages:[{...pkg.pages[0],...change},pkg.pages[1]]},output=memoMerchantFeedXml(candidate,project(candidate),shop());
  assert.equal(items(output).length,1);assert.ok(!output.includes('MC-COUPLE-WHITE'));
 }
 assert.equal(memoMerchantFeedXml(pkg,[],shop()),null,'raw pkg.pages are never a fallback');
 const translated={...pkg,pages:[{...pkg.pages[0],slug:'pl/products/liejimo-rinkinys-porai'},pkg.pages[1]]};
 assert.ok(!memoMerchantFeedXml(translated,project(translated),shop()).includes('MC-COUPLE-WHITE'));
 for(const candidate of [{...pkg,siteId:'other'},{...pkg,canonicalHost:'other.lt'},{...pkg,locale:'pl-PL'},null])assert.equal(memoMerchantFeedXml(candidate,project(),shop()),null);
 const extra={...pkg,pages:[...pkg.pages,page('products/kudikio-pedutes','Pėdutės'),page('products/seimos-rinkinys','Mamos ir vaiko rinkinys')]};
 const snapshot=shop();snapshot.products.push(product('baby_feet',2599,2200),product('mother_child',3299,2200));
 assert.equal(items(memoMerchantFeedXml(extra,project(extra),snapshot)).length,2);
});

test('the assigned MPN cannot be reused for a changed default, extra option or wrong/private image',()=>{
 const changes=[p=>p.optionGroups[0].defaultValue='gold',p=>p.optionGroups[1].defaultValue='wood',p=>p.optionGroups.pop(),p=>p.optionGroups.push({id:'wrapping',defaultValue:'none',values:[{id:'none',enabled:true,prices:{LT:0}}]}),p=>p.optionGroups[0].values[0].enabled=false,p=>delete p.optionGroups[0].values[0].prices.LT,
 p=>p.content.images=[],p=>p.content.images[0].src='https://other.lt/image.webp',p=>p.content.images[0].src='/prekyba/operator/private-image',p=>p.content.images[0].choices={finish:'gold'},p=>p.content.images[0].width=20];
 for(const change of changes){const snapshot=shop();change(snapshot.products[0]);const output=memoMerchantFeedXml(pkg,project(),snapshot);assert.equal(items(output).length,1);assert.ok(!output.includes('MC-COUPLE-WHITE'));}
});

test('sandbox, disconnected, disabled and invalid prices cannot leak as LIVE feed offers',()=>{
 for(const change of [{environment:'sandbox'},{testOnly:true},{productionReady:false},{paymentEnvironment:'test'},{publishOffers:false},{eligibleCountries:['PL']}])assert.equal(memoMerchantFeedXml(pkg,project(),{...shop(),context:{...context,...change}}),null);
 for(const change of [{enabled:false},{prices:{LT:0}},{prices:{LT:'3200'}},{available:-1}]){
  const snapshot=shop();Object.assign(snapshot.products[0],change);assert.ok(!memoMerchantFeedXml(pkg,project(),snapshot).includes('MC-COUPLE-WHITE'));
 }
});

test('XML escapes catalog text without adding HTML or private provenance',()=>{
 const snapshot=shop();snapshot.products[0].title='Porai & šeimai <viena> "akimirka"';snapshot.products[0].content.summary="Balti dažai & rankų forma <3; Jūsų 'prisiminimas'.\u0001";
 const output=memoMerchantFeedXml(pkg,project(),snapshot);
 assert.ok(output.includes('Porai &amp; šeimai &lt;viena&gt; &quot;akimirka&quot;'));assert.ok(output.includes('forma &lt;3; Jūsų &apos;prisiminimas&apos;.'));
 assert.ok(!output.includes('\u0001'));assert.ok(!output.includes('<viena>'));assert.ok(!output.includes('prices.LT'));assert.ok(!output.includes('revisionHash'));
});

test('GET and HEAD share a noncached feed; unavailable snapshots fail 503 rather than an empty 200',async()=>{
 const get=await serveMemoMerchantFeed(request(),options());assert.equal(get.status,200);assert.equal(items(await get.text()).length,2);
 assert.equal(get.headers.get('Content-Type'),'application/xml; charset=utf-8');assert.match(get.headers.get('Cache-Control'),/no-store/);assert.equal(get.headers.get('X-Robots-Tag'),'noindex');
 const head=await serveMemoMerchantFeed(request({method:'HEAD'}),options());assert.equal(head.status,200);assert.equal(await head.text(),'');
 for(const snapshot of [null,{}, {products:[]}, {products:shop().products,context:null}]){
  const result=await serveMemoMerchantFeed(request(),options(snapshot));assert.equal(result.status,503);assert.equal(result.headers.get('Retry-After'),'300');assert.ok(!(await result.text()).includes('<channel>'));
 }
 const missingHead=await serveMemoMerchantFeed(request({method:'HEAD'}),options(null));assert.equal(missingHead.status,503);assert.equal(await missingHead.text(),'');
 const failed=await serveMemoMerchantFeed(request(),{...options(),loadCatalog:async()=>{throw Error('private provider details');}});assert.equal(failed.status,503);assert.ok(!(await failed.text()).includes('private provider'));
});

test('exact host and read-only method guards execute before the catalog loader',async()=>{
 let loaded=0;const opts={...options(),loadCatalog:async()=>{loaded++;return shop();}};
 for(const incoming of [request({host:'other.lt'}),request({host:'www.memocasting.lt'}),request({host:'localhost'}),request({host:'memocasting.lt:444'}),request({headers:{host:'other.lt'}}),request({url:'http://memocasting.lt/prekiu-srautas.xml'})])assert.equal((await serveMemoMerchantFeed(incoming,opts)).status,404);
 const write=await serveMemoMerchantFeed(request({method:'POST'}),opts);assert.equal(write.status,405);assert.equal(write.headers.get('Allow'),'GET, HEAD');assert.equal(loaded,0);
});

async function loadModule(path,modules,globals={}){
 const source=await readFile(new URL(path,import.meta.url),'utf8'),javascript=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,exports={};
 runInNewContext(javascript,{exports,require:name=>{assert.ok(name in modules,'Unexpected dependency '+name);return modules[name];},Request,Response,Headers,URL,Map,Set,AbortSignal,...globals});return exports;
}

test('route reads actual eligible native pages and the existing catalog loader',async()=>{
 let loads=0;const candidate={...pkg,pages:[{...pkg.pages[0],publishAt:'2030-01-01T00:00:00Z'},pkg.pages[1]]};
 const route=await loadModule('../app/niche/memocasting/merchant-feed/route.ts',{
  '@/lib/niche-sites':{nicheSiteByHost:host=>host==='memocasting.lt'?candidate:undefined,publicNichePages:project},
  '@/lib/memocasting-product-server':{memoPublishedCatalog:async host=>{loads++;assert.equal(host,'memocasting.lt');return shop();}},
  '@/lib/memocasting-merchant-feed.mjs':{serveMemoMerchantFeed},
 });
 assert.equal(route.dynamic,'force-dynamic');const result=await route.GET(request());assert.equal(result.status,200);assert.equal(items(await result.text()).length,1);assert.equal(loads,1);
 assert.equal((await route.GET(request({host:'other.lt'}))).status,404);assert.equal(loads,1);
});

test('published catalog export reuses the actual service-binding catalog and LIVE context reads',async()=>{
 const snapshot=shop(),paths=[];
 const loadedModule=await loadModule('../lib/memocasting-product-server.ts',{
  react:{cache:fn=>fn},'cloudflare:workers':{env:{MEMO_COMMERCE:{fetch:async request=>{paths.push(new URL(request.url).pathname);return Response.json(request.url.endsWith('/catalog')?snapshot.products:snapshot.context);}}}},
  './memocasting-product-content.mjs':{memoProductSku,memoApplyProductContent},
  './memocasting-reviews.mjs':await import('../lib/memocasting-reviews.mjs'),
 },{process:{env:{}},fetch:()=>{throw Error('Unexpected public-network loader');}});
 const current=await loadedModule.memoPublishedCatalog('memocasting.lt');assert.deepEqual(paths.sort(),['/api/catalog','/api/storefront-context']);
 assert.equal(memoMerchantFeedXml(pkg,project(),current).includes('<g:price>32.00 EUR</g:price>'),true);
 const [projected]=await loadedModule.memoPublishedProductPages([pkg.pages[0]],'memocasting.lt');assert.equal(projected.seoOffer.price,'32.00');
});

test('actual proxy reserves the feed before foreign gift, legacy and preview fallbacks',async()=>{
 const modules={
  'next/server':{NextResponse:{next:()=>new Response('fallback'),rewrite:url=>new Response(null,{headers:{'x-test-rewrite':url.href}}),redirect:(url,status)=>new Response(null,{status,headers:{Location:url.href}})}},
  '@/lib/niche-sites':{normalizedHost:host=>(host??'').split(',')[0].trim().toLowerCase().replace(/:\d+$/,''),nicheSiteByHost:host=>host==='memocasting.lt'?pkg:host==='other.lt'?{siteId:'other',canonicalHost:'other.lt'}:null,publicNichePages:project},
  '@/lib/site-config':{SITE_CONFIGS:{legacy:{domains:['legacy.test']}}},
  '@/lib/content-model-v2':{hasLocalPreviewContent:()=>false,contentPackageByHost:()=>{throw Error('Feed reached foreign fallback');}},
  '@/config/content-media-aliases.json':[],'@/lib/content-media-aliases.mjs':{visibleMediaAlias:()=>null},
  '@/lib/memocasting-routes.mjs':{memoRedirectUrl:()=>null},'@/lib/memocasting-homepage-assets.mjs':{memoHomepageAsset:()=>null},'@/lib/memocasting-homepage-markup.mjs':{memoHomepageAdmitted:()=>false},
  '@/lib/memocasting-instruction-documents.mjs':{memoInstructionDocument:()=>null,memoInstructionDocumentAlias:()=>false,memoInstructionRawDocumentPath:()=>false},
  '@/lib/memocasting-instagram-bridge.mjs':{instagramAction:()=>false},'@/config/niche-path-aliases.json':[],
  '@/lib/o3tech-brand.mjs':await import('../lib/o3tech-brand.mjs'),
  '@/lib/niche-path-aliases.mjs':{indexNichePathAliases:()=>new Map(),nichePathAliasDestination:()=>null},
 };
 const {proxy}=await loadModule('../proxy.ts',modules);
 const incoming=options=>{const req=request(options),nextUrl=new URL(req.url);nextUrl.clone=()=>new URL(nextUrl);req.nextUrl=nextUrl;return req;};
 for(const method of ['GET','HEAD']){const result=proxy(incoming({method}));assert.equal(result.status,200);assert.equal(result.headers.get('x-test-rewrite'),'https://memocasting.lt/niche/memocasting/merchant-feed');}
 assert.equal(proxy(incoming({url:'https://memocasting.lt/prekiu-srautas.xml?country=PL&draft=1'})).headers.get('x-test-rewrite'),'https://memocasting.lt/niche/memocasting/merchant-feed');
 assert.equal(proxy(incoming({url:'https://memocasting.lt/niche/memocasting/merchant-feed'})).status,404,'internal route has no public bypass');
 for(const host of ['other.lt','legacy.test','gift.test','unknown.test','localhost','memocasting.lt:444'])assert.equal(proxy(incoming({host})).status,404,host);
 assert.equal(proxy(incoming({method:'POST'})).status,405);assert.equal(proxy(incoming({headers:{host:'other.lt'}})).status,404);
 assert.equal(proxy(incoming({url:'http://memocasting.lt/prekiu-srautas.xml'})).status,404);
 const www=proxy(incoming({host:'www.memocasting.lt'}));assert.equal(www.status,308);assert.equal(www.headers.get('Location'),'https://memocasting.lt/prekiu-srautas.xml');
});
