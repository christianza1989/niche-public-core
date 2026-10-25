import {test} from 'node:test';
import assert from 'node:assert/strict';
import {memoBreadcrumbs,memoSchemaGraph,memoSectionId,memoGuideSections} from '../lib/memocasting-structure.mjs';
import {projectPublicPages} from '../lib/niche-links.mjs';
const pkg={canonicalHost:'memocasting.lt',locale:'lt-LT',site:{name:'Memocasting',offer:'Rinkiniai',contact:{email:'info@pinet.lt'}}};
const product={type:'product',slug:'rinkinys-porai',title:'Porai',description:'Rinkinys',publishAt:'2026-10-11T00:00:00Z',approval:{approvedAt:'2026-10-11T00:00:00Z'},media:[]};
const hub={...product,type:'faq',slug:'ranku-liejimo-rinkiniai',title:'Rinkiniai'};
test('product visible trail and schema reference an eligible catalogue only',()=>{
  const pages=[hub,product];
  const trail=memoBreadcrumbs(pkg,product,pages);
  assert.deepEqual(trail.map(p=>p.path),['/','/ranku-liejimo-rinkiniai','/'+product.slug]);
  const graph=memoSchemaGraph(pkg,product,pages,'MB Memocasting')['@graph'];
  assert.deepEqual(graph.find(e=>e['@type']==='BreadcrumbList').itemListElement.map(e=>new URL(e.item).pathname),trail.map(p=>p.path));
  assert.equal(memoBreadcrumbs(pkg,product,[product]).length,2);
  assert.ok(!graph.some(e=>['Offer','AggregateRating'].includes(e['@type'])));
});
test('catalogue schema excludes future or revoked products not in the supplied projection',()=>{
  const graph=memoSchemaGraph({...pkg,pages:[hub,product,{...product,slug:'private'}]},hub,[hub,product],'MB Memocasting')['@graph'];
  assert.deepEqual(graph.find(e=>e['@type']==='CollectionPage').hasPart,[{'@type':'WebPage',name:'Porai',url:'https://memocasting.lt/'+product.slug}]);
});

test('organization return policy follows eligible page at its boundary and after revocation',()=>{
 const policy={...product,id:'returns',type:'faq',slug:'grazinimas',body:[],links:[],revisionHash:'policy-current',publishAt:'2026-10-19T07:00:00Z',approval:{status:'approved',revisionHash:'policy-current',approvedAt:'2026-10-19T06:00:00Z'}};
 const source={...pkg,pages:[policy]};
 for(const [time,expected] of [['2026-10-19T06:59:59Z',false],['2026-10-19T07:00:00Z',true]]){
  const eligible=projectPublicPages(source,[source],{},Date.parse(time));
  const graph=memoSchemaGraph(source,product,eligible,'MB Memocasting')['@graph'];
  const organization=graph.find(e=>e['@type']==='Organization');
  assert.deepEqual(organization.hasMerchantReturnPolicy,expected?{'@type':'MerchantReturnPolicy',merchantReturnLink:'https://memocasting.lt/grazinimas'}:undefined);
  assert.ok(!graph.some(e=>e['@type']==='Offer'));
 }
 const changed={...source,pages:[{...policy,revisionHash:'edited'}]};
 const eligible=projectPublicPages(changed,[changed],{},Date.parse('2026-10-19T08:00:00Z'));
 assert.equal(memoSchemaGraph(changed,product,eligible,'MB Memocasting')['@graph'].find(e=>e['@type']==='Organization').hasMerchantReturnPolicy,undefined);
});
test('Lithuanian section identifiers are meaningful and independent of block positions',()=>{
  assert.equal(memoSectionId('Kurių skaičių negalima atspėti?'),'kuriu-skaiciu-negalima-atspeti');
  assert.equal(memoSectionId('Apdailos pasirinkimo lapas'),'apdailos-pasirinkimo-lapas');
});
test('localized section links retain Polish, Latvian and Estonian words',()=>{
  assert.equal(memoSectionId('Łączenie i suszenie odlewu'),'laczenie-i-suszenie-odlewu');
  assert.equal(memoSectionId('Atlējuma žāvēšana'),'atlejuma-zavesana');
  assert.equal(memoSectionId('Värvimine ja hooldus'),'varvimine-ja-hooldus');
});

const guide=slug=>({...product,id:slug,type:'guide',slug,title:slug,body:[],links:[],revisionHash:'current',approval:{status:'approved',revisionHash:'current',approvedAt:product.publishAt}});
test('expanding archive discovers every eligible guide exactly once, including unknown topics',()=>{
 const guides=['gidai/kaledines-dovanos-mamai','gidai/advento-kalendoriaus-dovanos','gidai/dovanos-seneliui','gidai/dovanos-gimtadienio-proga','gidai/patirties-dovanos','gidai/kaip-isrinkti-dovana','gidai/suluzes-ranku-liejinys','gidai/ranku-pozos','pagalba','gidai/new-approved-topic'].map(guide);
 const groups=memoGuideSections([...guides,guides[0],guide('pl/gidai/dovanos-mamai'),product],'lt');
 assert.deepEqual(groups.map(g=>g.id),['kaledos','gavejai','progos','pobudis','naudojimas','dovanos']);
 const rendered=groups.flatMap(g=>g.pages.map(p=>p.slug));
 assert.deepEqual([...rendered].sort(),guides.map(p=>p.slug).sort());
 const gift=memoGuideSections(guides,'lt',{giftOnly:true}).flatMap(g=>g.pages.map(p=>p.slug));
 assert.ok(gift.includes('gidai/new-approved-topic'));
 assert.ok(!gift.includes('pagalba')&&!gift.includes('gidai/suluzes-ranku-liejinys')&&!gift.includes('gidai/ranku-pozos'));
 assert.ok(groups.find(g=>g.id==='naudojimas').pages.some(p=>p.slug==='gidai/ranku-pozos'));
});
test('archive cards and CollectionPage parts follow the same due revision at the boundary',()=>{
 const index={...guide('gidai'),type:'service'},gifts={...guide('dovanos'),type:'faq'},ready=guide('gidai/dovanos-mamai'),care=guide('gidai/dziovinimas-ir-isemimas');
 const future={...guide('gidai/kaledines-dovanos'),publishAt:'2026-10-15T07:00:00Z'},revoked={...guide('gidai/hidden'),revisionHash:'edited'};
 const source={...pkg,pages:[index,gifts,ready,care,future,revoked]};
 for(const [time,hasFuture] of [['2026-10-15T06:59:59Z',false],['2026-10-15T07:00:00Z',true]]){
  const eligible=projectPublicPages(source,[source],{},Date.parse(time));
  for(const hub of [index,gifts]){
   const slugs=memoGuideSections(eligible,'lt',{giftOnly:hub.slug==='dovanos'}).flatMap(g=>g.pages.map(p=>p.slug));
   const graph=memoSchemaGraph(source,hub,eligible,'MB Memocasting')['@graph'];
   const collection=graph.find(e=>e['@type']==='CollectionPage');
   assert.deepEqual(collection.hasPart.map(p=>new URL(p.url).pathname.slice(1)),slugs);
   assert.equal(slugs.includes(future.slug),hasFuture);assert.ok(!slugs.includes(revoked.slug));
   assert.equal(slugs.includes(care.slug),hub.slug==='gidai');
  }
 }
});
test('translated archive keeps local planning and care sections and never borrows LT cards',()=>{
 for(const language of ['pl','lv','et']){
  const local=[guide(language+'/gidai/dovana-porai'),guide(language+'/gidai/dziovinimas-ir-isemimas'),guide(language+'/gidai/new-topic')];
  const groups=memoGuideSections([...local,guide('gidai/kaledines-dovanos')],language);
  assert.deepEqual(groups.map(g=>g.id),['dovanos','naudojimas']);
  assert.deepEqual(groups.flatMap(g=>g.pages.map(p=>p.slug)).sort(),local.map(p=>p.slug).sort());
  assert.ok(groups.every(g=>g.title&&!g.title.includes('Kalėd')));
 }
});
