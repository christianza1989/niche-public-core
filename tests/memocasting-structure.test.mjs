import {test} from 'node:test';
import assert from 'node:assert/strict';
import {memoBreadcrumbs,memoSchemaGraph,memoSectionId} from '../lib/memocasting-structure.mjs';
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
test('Lithuanian section identifiers are meaningful and independent of block positions',()=>{
  assert.equal(memoSectionId('Kurių skaičių negalima atspėti?'),'kuriu-skaiciu-negalima-atspeti');
  assert.equal(memoSectionId('Apdailos pasirinkimo lapas'),'apdailos-pasirinkimo-lapas');
});
test('localized section links retain Polish, Latvian and Estonian words',()=>{
  assert.equal(memoSectionId('Łączenie i suszenie odlewu'),'laczenie-i-suszenie-odlewu');
  assert.equal(memoSectionId('Atlējuma žāvēšana'),'atlejuma-zavesana');
  assert.equal(memoSectionId('Värvimine ja hooldus'),'varvimine-ja-hooldus');
});
