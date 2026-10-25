import test from 'node:test';
import assert from 'node:assert/strict';
import {memoApplyProductContent} from '../lib/memocasting-product-content.mjs';
import {memoSchemaGraph} from '../lib/memocasting-structure.mjs';
import homepageAssets from '../lib/memocasting-homepage-assets.json' with {type:'json'};
const page={id:'p',type:'product',slug:'rinkinys-porai',title:'Porai',description:'Rinkinys',body:[],media:[],links:[],publishAt:'2026-10-01',approval:{approvedAt:'2026-10-01'}};
const product={sku:'couple',title:'Rinkinys porai',enabled:true,available:4,prices:{LT:3200},content:{summary:'Su baltais dažais'}};
const context={schemaVersion:1,environment:'production',testOnly:false,paymentConnected:true,paymentEnvironment:'live',paymentAccountVerified:true,productionReady:true,publishOffers:true,eligibleCountries:['LT']};
const pkg={canonicalHost:'memocasting.lt',locale:'lt-LT',site:{name:'Memocasting',contact:{email:'info@memorycasting.lt'}}};
const schema=p=>memoSchemaGraph(pkg,p,[p],'MB Memocasting')['@graph'].find(n=>n['@type']==='Product');
test('live default product offer uses current catalog cents, not editorial description prices',()=>{
 const result=memoApplyProductContent({...page,description:'Sena 99 EUR kaina'},product,context);
 assert.equal(schema(result).offers.price,'32.00');
 assert.equal(schema(result).offers.priceCurrency,'EUR');
 assert.equal(schema(result).offers.availability,'https://schema.org/InStock');
 assert.equal(schema(result).offers.url,'https://memocasting.lt/rinkinys-porai');
 const changed=memoApplyProductContent(page,{...product,prices:{LT:3500}},context);
 assert.equal(schema(changed).offers.price,'35.00');
 assert.equal(schema(memoApplyProductContent(page,{...product,available:0},context)).offers.availability,'https://schema.org/OutOfStock');
 const configured={...product,optionGroups:[{id:'finish',label:'Spalva',defaultValue:'gold',values:[{id:'gold',label:'Auksinė',enabled:true,prices:{LT:300}}]}]};
 assert.equal(schema(memoApplyProductContent(page,configured,context)).offers.price,'35.00');
});
test('closed, sandbox, unverifiable or other-market data cannot become a live Offer',()=>{
 for(const c of [undefined,{...context,environment:'sandbox'},{...context,testOnly:true},{...context,publishOffers:false},{...context,productionReady:false},{...context,paymentEnvironment:'test'},{...context,paymentAccountVerified:false},{...context,eligibleCountries:['PL']},{...context,eligibleCountries:'LT'}])assert.equal(schema(memoApplyProductContent(page,product,c)),undefined);
 for(const p of [{...product,enabled:false},{...product,available:-1},{...product,available:1.5},{...product,prices:{LT:0}},{...product,prices:{LT:'3200'}},{...product,prices:{LT:Number.MAX_SAFE_INTEGER+1}}])assert.equal(schema(memoApplyProductContent(page,p,context)),undefined);
 const guide={...page,type:'guide',slug:'gidai/kaledines-dovanos'};
 assert.equal(memoApplyProductContent(guide,product,context),guide);
});

test('nine offerless live product pages remain WebPages without incomplete rich Products',()=>{
 const slugs=['products/seimos-rinkinys','products/alginato-papildymas-650g-dvieju-ranku-rinkiniui','products/alginato-papildymas-1100g-keturiu-ranku-rinkiniui',...['pl','lv','et'].flatMap(locale=>[`${locale}/products/liejimo-rinkinys-porai`,`${locale}/products/seimos-rinkinys-1`])];
 assert.equal(slugs.length,9);
 for(const slug of slugs){
  const p={...page,slug},graph=memoSchemaGraph(pkg,p,[p],'MB Memocasting')['@graph'];
  assert.equal(graph.find(e=>e['@type']==='Product'),undefined,slug);
  const web=graph.find(e=>e['@type']==='WebPage');
  assert.equal(web.url,`https://memocasting.lt/${slug}`);
  assert.equal(web.mainEntity,undefined);
  assert.ok(graph.some(e=>e['@type']==='BreadcrumbList'));
 }
});

test('five admitted LT offers retain catalog prices and actual stock states',()=>{
 const cases=[['couple','rinkinys-porai',3200,4,true],['family','seimos-rinkinys',4800,3,true],['wooden_base','products/isdziovintas-uosinis-padeklas',800,0,false],['baby_feet','products/kudikio-pedutes',2599,0,false],['baby_frame','products/kudiko-ispaudu-rinkinys-su-remeliu',2299,0,false]];
 for(const [sku,slug,cents,available,enabled] of cases){
  const projected=memoApplyProductContent({...page,slug},{...product,sku,prices:{LT:cents},available,enabled},context);
  const graph=memoSchemaGraph(pkg,projected,[projected],'MB Memocasting')['@graph'],rich=graph.find(e=>e['@type']==='Product');
  assert.equal(rich.offers.price,(cents/100).toFixed(2));
  assert.equal(rich.offers.availability,`https://schema.org/${available?'InStock':'OutOfStock'}`);
  assert.equal(rich.offers.url,`https://memocasting.lt/${slug}`);
  assert.deepEqual(graph.find(e=>e['@type']==='WebPage').mainEntity,{'@id':rich['@id']});
  assert.equal(rich.review,undefined);assert.equal(rich.aggregateRating,undefined);assert.equal(rich.gtin,undefined);
 }
});

test('malformed or unsupported price and availability cannot complete a rich Product',()=>{
 const offer={'@type':'Offer',price:'32.00',priceCurrency:'EUR',availability:'https://schema.org/InStock'};
 const bad=[{},[],{...offer,'@type':'AggregateOffer'},...['',null,32,'0.00','-1.00','32','32.000','1e3','Infinity','NaN','90071992547410.00'].map(price=>({...offer,price})),...['',undefined,'USD'].map(priceCurrency=>({...offer,priceCurrency})),...['',undefined,'InStock','https://schema.org/PreOrder'].map(availability=>({...offer,availability}))];
 for(const seoOffer of bad)assert.equal(schema({...page,seoOffer}),undefined,JSON.stringify(seoOffer));
 assert.equal(schema({...page,type:'guide',slug:'gidai/dovana-porai',seoOffer:offer}),undefined);
});

test('organization uses the verified legal address and homepage identity across page roles',()=>{
 const about={...page,type:'service',slug:'apie-projekta',body:[{type:'list',items:['Įmonės kodas: 306026827.','Kontaktinis ir grąžinimo adresas: Molynės g. 2C, Vilnius, LT-02211.']}]};
 const logo=homepageAssets.assets.find(asset=>asset.path==='/memocasting-homepage/v1/media/logo.webp');assert.ok(logo);
 for(const p of [{...page,type:'home',slug:''},{...page,type:'guide',slug:'gidai/dovana-porai'},{...page,type:'service',slug:'pl/privatumas'}]){
  const graph=memoSchemaGraph(pkg,p,[about,p],'MB Memocasting')['@graph'],org=graph.find(e=>e['@type']==='Organization');
  assert.equal(org.url,'https://memocasting.lt/');assert.equal(org.name,'Memory Casting');assert.equal(org.legalName,'MB Memocasting');
  assert.equal(org.logo,`https://memocasting.lt${logo.path}`);
  assert.deepEqual(org.sameAs,['https://www.instagram.com/memocasting.lt/']);
  assert.deepEqual(org.address,{'@type':'PostalAddress',streetAddress:'Pupinės g. 10-55',addressLocality:'Vilnius',postalCode:'LT-02206',addressCountry:'LT'});
  assert.equal(org.identifier.value,'306026827');assert.ok(!JSON.stringify(org.address).includes('Molynės'));
  assert.ok(!graph.some(e=>e['@type']==='Person'));
  const article=graph.find(e=>e['@type']==='Article');
  if(article){assert.deepEqual(article.author,{'@id':org['@id']});assert.equal(org.legalName,'MB Memocasting');assert.equal(article.publisher['@id'],org['@id']);assert.equal(article.datePublished,p.publishAt);assert.equal(article.mainEntityOfPage['@id'],'https://memocasting.lt/gidai/dovana-porai#webpage');}
 }
});
