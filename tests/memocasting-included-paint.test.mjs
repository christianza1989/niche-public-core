import {test} from 'node:test';import assert from 'node:assert/strict';import pkg from '../content-packages/memocasting/content-package.json' with {type:'json'};
import {memoHomepageAdmitted,memoHomepageStory} from '../lib/memocasting-homepage-markup.mjs';import {memoSelectionTotal} from '../lib/memocasting-storefront.mjs';import {memoNormalizeCart} from '../lib/memocasting-cart.mjs';
test('both approved kits in all four languages include paint and the active homepage matches its unchanged structure',()=>{
 const labels={lt:'Balti dažai.',pl:'Biała farba.',lv:'Balta krāsa.',et:'Valge värv.'};let count=0;
 for(const page of pkg.pages){const language=/^(pl|lv|et)(?:\/|$)/.exec(page.slug)?.[1]??'lt';if(!/^(?:pl\/|lv\/|et\/)?(?:rinkinys-porai|seimos-rinkinys|products\/liejimo-rinkinys-porai|products\/seimos-rinkinys-1)$/.test(page.slug))continue;
  const items=page.body.find(b=>b.type==='list').items;assert.equal(items.filter(x=>x===labels[language]).length,1,page.slug);count++;
 }
 assert.equal(count,8);assert.ok(memoHomepageAdmitted(pkg.pages.find(p=>p.slug==='')));
 assert.ok(memoHomepageStory.includes('Balti dažai įeina į poros ir šeimos rinkinius.'));
 // Gift guides may legitimately discuss a 3 € card or a 35 € budget. The
 // removed paint surcharge applies to the kit offer, not every gift price.
 for(const page of pkg.pages.filter(p=>p.type==='product'||p.type==='home'))assert.ok(!/(?<!\d)(?:35|3)\s*€/.test(JSON.stringify({description:page.description,body:page.body})),page.slug+' stale kit surcharge');
});
test('legacy unsent paint selections cannot add a surcharge to either kit',()=>{
 const item=(sku,cents)=>({sku,enabled:true,available:5,prices:{LT:cents},package:{weightGrams:100,dimensionsMm:[10,10,10]}}),markets={markets:[{country:'LT',currency:'EUR'}]},catalog=[item('couple',3200),item('family',4800),{...item('white_paint',300),addonFor:['couple','family']}];
 assert.deepEqual(memoNormalizeCart([{sku:'couple_white',quantity:1},{sku:'white_paint',quantity:2},{sku:'family',quantity:1}]),[{sku:'couple',quantity:1},{sku:'family',quantity:1}]);
 assert.deepEqual(memoSelectionTotal(catalog,markets,'couple','LT',2,['white_paint']),{currency:'EUR',cents:6400});
 assert.deepEqual(memoSelectionTotal(catalog,markets,'family','LT',1,['white_paint']),{currency:'EUR',cents:4800});
});
