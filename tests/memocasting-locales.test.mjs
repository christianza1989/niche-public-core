import {test} from 'node:test';
import assert from 'node:assert/strict';
import {memoMarkets,memoRoute,memoPath,memoAlternates} from '../lib/memocasting-locales.mjs';
import {memoIndexablePages} from '../lib/memocasting-content.mjs';
import {memoSchemaGraph,memoBreadcrumbs,memoProfilePath} from '../lib/memocasting-structure.mjs';
const pkg={siteId:'memocasting',canonicalHost:'memocasting.lt',locale:'lt-LT',site:{name:'Memocasting',offer:'Rinkiniai',contact:{email:'info@pinet.lt'}}};
const page=(slug,type='product')=>({slug,type,title:slug,description:'Information',publishAt:'2026-10-12T00:00:00Z',approval:{approvedAt:'2026-10-12T00:00:00Z'},media:[]});
test('four market routes use proper language codes and exclude localized functional pages',()=>{
 assert.deepEqual(memoMarkets.map(m=>[m.country,m.locale]),[['LT','lt-LT'],['PL','pl-PL'],['LV','lv-LV'],['EE','et-EE']]);
 assert.equal(memoRoute(page('et/gidai')).language,'et');assert.equal(memoPath(memoRoute(page('pl')), 'gidai'),'/pl/gidai');
 assert.deepEqual(memoIndexablePages(pkg,[page('cart'),page('pl/cart'),page('lv/checkout'),page('et/uzsakymas'),page('gidai')]).map(p=>p.slug),['gidai']);
});
test('hreflang contains only same-role equivalents supplied by the eligible projection',()=>{
 const lt=page('products/a'),pl=page('pl/products/a'),lv=page('lv/products/a');
 assert.deepEqual(memoAlternates(pkg,lt,[lt]),[]);
 assert.deepEqual(memoAlternates({...pkg,pages:[lt,pl,lv]},pl,[lt,pl]).map(a=>a.language),['lt-LT','pl-PL','x-default']);
 assert.equal(memoAlternates(pkg,page('pl/cart'),[page('cart'),page('pl/cart')]).length,0);
 // V1 reserves home/empty slug. Localized landings use the existing FAQ bucket.
 assert.deepEqual(memoAlternates(pkg,page('pl','faq'),[page('','home'),page('pl','faq')]).map(a=>a.language),['lt-LT','pl-PL','x-default']);
 assert.equal(memoBreadcrumbs(pkg,page('pl','faq'),[page('pl','faq')]).length,1);
});
test('locale schema and breadcrumbs never borrow the catalogue of another market',()=>{
 const lt=page('ranku-liejimo-rinkiniai','faq'),pl=page('pl/collections/all','faq'),prod=page('pl/products/a');
 assert.deepEqual(memoBreadcrumbs(pkg,prod,[lt,prod]).map(e=>e.path),['/','/pl/products/a']);
 assert.deepEqual(memoBreadcrumbs(pkg,prod,[lt,pl,prod]).map(e=>e.path),['/','/pl/collections/all','/pl/products/a']);
 const graph=memoSchemaGraph(pkg,pl,[lt,pl,prod],'MB Memocasting')['@graph'];
 const collection=graph.find(e=>e['@type']==='CollectionPage');assert.equal(collection.inLanguage,'pl-PL');assert.deepEqual(collection.hasPart.map(e=>e.url),['https://memocasting.lt/pl/products/a']);
});
test('localized policy is informational and the author profile follows eligible locale only',()=>{
 const ltProfile=page('redakcija','service'),plProfile=page('pl/redakcija','service'),policy=page('pl/privatumas','service');
 assert.equal(memoProfilePath(policy,[ltProfile]),'/redakcija');assert.equal(memoProfilePath(policy,[ltProfile,plProfile]),'/pl/redakcija');
 const graph=memoSchemaGraph(pkg,policy,[ltProfile,plProfile,policy],'MB Memocasting')['@graph'];
 assert.ok(!graph.some(e=>e['@type']==='Service'));assert.equal(graph.find(e=>e['@type']==='Organization').url,'https://memocasting.lt/pl/redakcija');
 const profileGraph=memoSchemaGraph(pkg,plProfile,[ltProfile,plProfile],'MB Memocasting')['@graph'];
 assert.equal(profileGraph.find(e=>e['@type']==='ProfilePage').mainEntity['@id'],'https://memocasting.lt/#organization');
});
