import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {memoSeoMetadata,memoPageImage,memoSeoOffer} from '../lib/memocasting-seo-metadata.mjs';
import {memoCompany,memoSchemaGraph} from '../lib/memocasting-structure.mjs';
import {memoApplyProductContent,memoProductSku} from '../lib/memocasting-product-content.mjs';
import {memoHomepageBlocks,memoHomepageStory} from '../lib/memocasting-homepage-markup.mjs';
import {memoRoute,memoAlternates} from '../lib/memocasting-locales.mjs';
import {memoFunctionalPage} from '../lib/memocasting-content.mjs';
import {memoFaviconHref} from '../lib/memocasting-favicon.mjs';
import {projectPublicPages} from '../lib/niche-links.mjs';
import {catalogueCanonical} from '../lib/product-catalogue-query.mjs';
import {uniqueImageFamilies} from '../lib/niche-media.mjs';

const now=Date.parse('2026-10-25T07:00:00Z'),nativeRequire=createRequire(import.meta.url);
const page=(slug,type='faq')=>({siteId:'memocasting',id:slug||'home',slug,type,title:'Puslapio pavadinimas',description:'Patvirtintas aprašymas.',body:[],media:[],links:[],publishAt:'2026-10-01T00:00:00Z',revisionHash:'current',approval:{status:'approved',revisionHash:'current',approvedAt:'2026-10-01T00:00:00Z'}});
const home={...page('','home'),body:memoHomepageBlocks};
const about={...page('apie-projekta','service'),body:[{type:'paragraph',text:'Svetainę ir parduotuvę valdo MB Memocasting, įmonės kodas 306026827.'}]};
const pkg={siteId:'memocasting',canonicalHost:'memocasting.lt',locale:'lt-LT',site:{name:'Memory Casting',offer:'Rankų liejimo rinkiniai ir kūryba kartu.',contact:{email:'info@memorycasting.lt'},timezone:'Europe/Vilnius'},pages:[home,page('rinkinys-porai','product'),page('seimos-rinkinys','product'),about,page('redakcija','service')]};
const project=(candidate=pkg)=>projectPublicPages(candidate,[candidate],{},now);
const context={schemaVersion:1,environment:'production',testOnly:false,paymentConnected:true,paymentEnvironment:'live',paymentAccountVerified:true,productionReady:true,publishOffers:true,eligibleCountries:['LT']};
const catalog=()=>[{sku:'couple',title:'Rankų liejimo rinkinys porai',enabled:true,available:8,prices:{LT:3200},content:{summary:'Poros rinkinys su baltais dažais.',seoTitle:'Rankų liejimo rinkinys porai | Memory Casting',seoDescription:'Paskelbtas poros rinkinio SEO aprašymas.',images:[{id:'white',src:'/prekyba/catalog-media/white',alt:'Baltas poros rankų liejinys',width:1122,height:1402}]}},{sku:'family',title:'Šeimos rankų liejimo rinkinys',enabled:true,available:5,prices:{LT:4800},content:{summary:'Šeimos rinkinys su baltais dažais.'}}];
const published=(pages=project(),products=catalog(),shopContext=context)=>pages.map(p=>memoApplyProductContent(p,products.find(product=>product.sku===memoProductSku(p)),shopContext));
const metadata=(p,pages=published())=>memoSeoMetadata(pkg,p,pages,p?'https://memocasting.lt/'+p.slug:undefined);

test('homepage plural title and singular description use both actual live offers or no prices',()=>{
 const current=metadata(home);
 assert.equal(current.title,'Rankų liejimo rinkiniai porai ir šeimai | Memory Casting');assert.match(current.description,/Rankų liejimo rinkinys porai/);
 assert.match(current.description,/32\s*€/);assert.match(current.description,/48\s*€/);assert.ok(current.description.includes('Balti dažai įeina į abu rinkinius.'));
 const changed=catalog();changed[0].prices.LT=3550;changed[1].prices.LT=5100;
 assert.match(metadata(home,published(project(),changed)).description,/35,5\s*€/);assert.match(metadata(home,published(project(),changed)).description,/51\s*€/);
 for(const pages of [published(project().filter(p=>p.slug!=='seimos-rinkinys')),published(project(),catalog(),{...context,paymentEnvironment:'test'}),project()]){
  const fallback=metadata(home,pages);assert.ok(!/\d|€/.test(fallback.description));assert.match(fallback.description,/Rankų liejimo rinkinys porai ar šeimai/);
 }
});

test('page channels use runtime SEO overrides, brand once, actual price and current product image',()=>{
 const pages=published(),product=pages.find(p=>p.slug==='rinkinys-porai'),result=metadata(product,pages);
 assert.equal(result.title,'Rankų liejimo rinkinys porai | Memory Casting');assert.equal(result.description,'Paskelbtas poros rinkinio SEO aprašymas.');assert.equal(result.siteName,'Memory Casting');assert.equal(result.offer.price,'32.00');assert.equal(result.type,'product');
 assert.equal(result.image.src,'/prekyba/catalog-media/white');assert.equal((result.title.match(/Memory Casting/g)||[]).length,1);
 const changed={...product,seoTitle:'Rankų liejimo rinkinys porai | Memocasting'};assert.equal(metadata(changed,pages).title,result.title);
 assert.match(result.robots,/max-image-preview:large/);assert.match(result.robots,/max-snippet:-1/);
});

test('primary images choose the largest admitted family and the exact visible admitted home hero',()=>{
 const guide={...page('gidai/dovana-mamai','guide'),media:[640,1600].map(width=>({id:'photo'+width,familyId:'same-photo',src:'/content-assets/memocasting/photo-'+width+'.webp',width,height:width/2,alt:'Dovanos mamai idėja'}))};
 assert.equal(memoPageImage(pkg,guide,[guide]).width,1600);
 const image=memoPageImage(pkg,home,[home]);assert.equal(image.width,1536);assert.equal(image.height,1024);assert.ok(memoHomepageStory.includes('src="'+image.src+'"'));assert.ok(memoHomepageStory.includes('alt="'+image.alt+'"'));
 assert.equal(memoPageImage(pkg,{...home,body:[]},[{...home,body:[]}]),null);
 const hub=page('pages/instrukcija'),pages=[hub,...published().filter(p=>p.type==='product')];assert.equal(memoPageImage(pkg,hub,pages).src,'/prekyba/catalog-media/white');
 assert.equal(memoPageImage(pkg,hub,[hub]),null);assert.equal(memoPageImage(pkg,page('kontaktai'),[page('kontaktai'),...pages]),null);
});

test('future/private pages, future kit prices and functional URLs do not acquire indexable rich metadata',()=>{
 const future={...page('gidai/private','guide'),title:'Slaptas būsimas tekstas',publishAt:'2030-01-01T00:00:00Z',media:[{src:'/content-assets/private.webp',width:1600,height:900}]};
 const candidate={...pkg,pages:[...pkg.pages,future]},pages=project(candidate),result=metadata(future,pages);
 assert.equal(result.title,'Memory Casting');assert.equal(result.image,null);assert.equal(result.offer,null);assert.equal(result.robots,'noindex, nofollow');assert.ok(!JSON.stringify(result).includes('Slaptas'));
 const familyFuture={...pkg,pages:pkg.pages.map(p=>p.slug==='seimos-rinkinys'?{...p,publishAt:'2030-01-01T00:00:00Z'}:p)};
 assert.ok(!/€/.test(metadata(home,published(project(familyFuture))).description));
 for(const slug of ['cart','checkout','uzsakymas','pl/cart']){const functional=page(slug),meta=metadata(functional,[functional]);assert.equal(meta.robots,'noindex, nofollow');assert.equal(meta.image,null);assert.ok(!meta.robots.includes('index, follow'));}
 assert.equal(memoSeoMetadata({...pkg,siteId:'other'},home,[home],'https://memocasting.lt/'),null);assert.equal(memoSeoMetadata({...pkg,canonicalHost:'other.lt'},home,[home],'https://other.lt/'),null);
});

test('schema separates brand and legal author, keeps Product offers on canonical products, and shares primary image',()=>{
 const pages=published(),homeGraph=memoSchemaGraph(pkg,home,pages,'MB Memocasting')['@graph'];
 const site=homeGraph.find(e=>e['@type']==='WebSite'),org=homeGraph.find(e=>e['@type']==='Organization');
 assert.equal(site.name,'Memory Casting');assert.equal(site.alternateName,'Memocasting');assert.equal(org.name,'Memory Casting');assert.equal(org.legalName,'MB Memocasting');assert.equal(org.identifier.value,'306026827');
 assert.ok(!homeGraph.some(e=>e['@type']==='Product'));assert.equal(homeGraph.find(e=>e['@type']==='WebPage').primaryImageOfPage.width,1536);
 const product=pages.find(p=>p.slug==='rinkinys-porai'),graph=memoSchemaGraph(pkg,product,pages,'MB Memocasting')['@graph'];
 const rich=graph.find(e=>e['@type']==='Product'),web=graph.find(e=>e['@type']==='WebPage');assert.equal(rich.offers.price,'32.00');assert.equal(rich.brand.name,'Memory Casting');assert.equal(web.primaryImageOfPage.url,rich.image[0]);
 const guide=page('gidai/dovana-mamai','guide'),article=memoSchemaGraph(pkg,guide,[...pages,guide],'MB Memocasting')['@graph'].find(e=>e['@type']==='Article');
 assert.equal(article.author.name,'MB Memocasting');assert.equal(article.author['@type'],'Organization');assert.equal(article.author.url,'https://memocasting.lt/redakcija');assert.equal(article.publisher['@id'],org['@id']);
});

test('company registration is extracted only from explicit eligible about-page prose or lists',()=>{
 assert.equal(memoCompany(pkg,[about]).code,'306026827');
 assert.equal(memoCompany(pkg,[{...about,body:[{type:'list',items:['Įmonės kodas: 306026827.','Kontaktinis ir grąžinimo adresas: Molynės g. 2C, Vilnius, LT-02211.']}]}]).code,'306026827');
 assert.equal(memoCompany(pkg,[{...about,slug:'kontaktai'}]).code,undefined);assert.equal(memoCompany(pkg,[{...about,body:[{type:'paragraph',text:'Numeris 306026827.'}]}]).code,undefined);
 const future={...pkg,pages:[{...about,publishAt:'2030-01-01T00:00:00Z'}]};assert.equal(memoCompany(future,project(future)).code,undefined);
});

async function layout(candidate=pkg,{pathname='/',products=catalog(),shopContext=context}={}){
 const eligible=project(candidate),requestHeaders=new Headers({host:candidate.canonicalHost,'x-niche-original-path':pathname});
 const modules={
  '@/lib/memocasting-favicon.mjs':{memoFaviconHref},
  '@/lib/memocasting-product-server':{memoPublishedProductPage:async p=>p?memoApplyProductContent(p,products.find(product=>product.sku===memoProductSku(p)),shopContext):p,memoPublishedProductPages:async pages=>published(pages,products,shopContext)},
  '@/lib/memocasting-seo-metadata.mjs':{memoBrandName:'Memory Casting',memoSeoMetadata},
  'next/headers':{headers:async()=>requestHeaders},
  '@/lib/site-config':{resolveSite:()=>{throw Error('Unexpected legacy fallback');}},
  '@/lib/niche-sites':{nicheSiteByHost:()=>candidate,nicheOrigin:p=>'https://'+p.canonicalHost,publicNichePage:(_p,slug)=>eligible.find(p=>p.slug===slug),publicNichePages:()=>eligible},
  '@/lib/content-model-v2':{contentPackageByHost:()=>null},
  '@/lib/memocasting-locales.mjs':{memoRoute,memoAlternates},'@/lib/memocasting-content.mjs':{memoFunctionalPage},
  '@/lib/product-catalogue-query.mjs':{catalogueCanonical},'@/lib/niche-media.mjs':{uniqueImageFamilies},
  '@/components/niche/niche-styles':{NicheStyles:()=>null},
 };
 const source=await readFile(new URL('../app/layout.tsx',import.meta.url),'utf8'),javascript=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,exports={};
 runInNewContext(javascript,{exports,require:name=>name in modules?modules[name]:nativeRequire(name),URL,Headers,Intl,Date});
 const tree=await exports.default({children:React.createElement('main',null,'Server-rendered content')});
 return {html:renderToStaticMarkup(tree),generated:await exports.generateMetadata()};
}
const values=(html,key)=>[...html.matchAll(/<meta\b[^>]*>/g)].map(match=>match[0]).filter(tag=>tag.includes(`name="${key}"`)||tag.includes(`property="${key}"`)).map(tag=>tag.match(/content="([^"]*)"/)?.[1]);

test('actual layout server HTML has one consistent title, description, OG/Twitter image and price without JS',async()=>{
 const {html,generated}=await layout(pkg,{pathname:'/rinkinys-porai'});
 assert.equal((html.match(/<title>/g)||[]).length,1);assert.ok(html.includes('<title>Rankų liejimo rinkinys porai | Memory Casting</title>'));
 assert.deepEqual(values(html,'description'),values(html,'og:description'));assert.deepEqual(values(html,'description'),values(html,'twitter:description'));
 assert.deepEqual(values(html,'og:title'),values(html,'twitter:title'));assert.deepEqual(values(html,'og:site_name'),['Memory Casting']);
 assert.deepEqual(values(html,'product:price:amount'),['32.00']);assert.deepEqual(values(html,'product:price:currency'),['EUR']);assert.deepEqual(values(html,'og:image'),['https://memocasting.lt/prekyba/catalog-media/white']);
 assert.deepEqual(values(html,'twitter:image'),values(html,'og:image'));assert.equal(values(html,'robots').length,1);assert.ok(html.includes('rel="canonical" href="https://memocasting.lt/rinkinys-porai"'));assert.equal(generated.applicationName,'Memory Casting');
 assert.ok(!html.includes('<script'));assert.ok(html.includes('Server-rendered content'));
 const changed=catalog();changed[0].prices.LT=3500;assert.deepEqual(values((await layout(pkg,{pathname:'/rinkinys-porai',products:changed})).html,'product:price:amount'),['35.00']);
});

test('actual home SSR uses live prices and visible hero; unavailable offers and future pages remain honest',async()=>{
 const {html}=await layout();assert.ok(html.includes('<title>Rankų liejimo rinkiniai porai ir šeimai | Memory Casting</title>'));assert.equal(values(html,'og:image:width')[0],'1536');assert.equal(values(html,'og:image:height')[0],'1024');
 assert.deepEqual(values(html,'description'),values(html,'og:description'));assert.deepEqual(values(html,'description'),values(html,'twitter:description'));assert.match(values(html,'description')[0],/32\s*€/);assert.equal(values(html,'product:price:amount').length,0);
 const fallback=(await layout(pkg,{shopContext:{...context,publishOffers:false}})).html;assert.ok(!/€/.test(values(fallback,'description')[0]));
 const future={...page('gidai/private','guide'),title:'SLAPTAS BŪSIMAS TEKSTAS',publishAt:'2030-01-01T00:00:00Z'},candidate={...pkg,pages:[...pkg.pages,future]};
 const hidden=(await layout(candidate,{pathname:'/gidai/private'})).html;assert.ok(!hidden.includes('SLAPTAS'));assert.deepEqual(values(hidden,'robots'),['noindex, nofollow']);assert.equal(values(hidden,'og:image').length,0);assert.ok(!hidden.includes('rel="canonical"'));
});

test('actual functional SSR has one noindex directive and another tenant retains its metadata behavior',async()=>{
 const cart=page('cart'),functional={...pkg,pages:[...pkg.pages,cart]},html=(await layout(functional,{pathname:'/cart'})).html;
 assert.deepEqual(values(html,'robots'),['noindex, nofollow']);assert.equal(values(html,'product:price:amount').length,0);assert.equal(values(html,'og:image').length,0);
 const otherPage={...page('item'),siteId:'other',title:'Other title',description:'Other description'},other={...pkg,siteId:'other',canonicalHost:'other.lt',site:{...pkg.site,name:'Other site'},pages:[otherPage]};
 const result=await layout(other,{pathname:'/item'});assert.ok(result.html.includes('<title>Other title</title>'));assert.deepEqual(values(result.html,'og:site_name'),['Other site']);assert.deepEqual(values(result.html,'description'),['Other description']);assert.equal(values(result.html,'robots').length,0);assert.ok(!result.html.includes('Memory Casting'));assert.equal(result.generated.applicationName,undefined);
});
