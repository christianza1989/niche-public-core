import {test} from 'node:test';
import assert from 'node:assert/strict';
import {homepagePriceState,mountHomepageCatalogue} from '../lib/memocasting-homepage-catalogue.mjs';
const markets={markets:[{country:'LT',currency:'EUR'}]},item={sku:'couple',enabled:true,available:2,prices:{LT:3200},package:{weightGrams:2000,dimensionsMm:[200,200,170]}};
test('homepage uses admitted native market price and closes incomplete/unavailable catalogue states',()=>{
 assert.deepEqual(homepagePriceState([item],markets,'couple'),{state:'ready',text:new Intl.NumberFormat('lt-LT',{style:'currency',currency:'EUR'}).format(32)});
 for(const bad of [{...item,enabled:false},{...item,available:0},{...item,prices:{PL:1}},{...item,package:null}])assert.equal(homepagePriceState([bad],markets,'couple').state,'unavailable');
 assert.equal(homepagePriceState([item],{},'couple').state,'unavailable');
});
test('late catalogue response cannot mutate a homepage that has unmounted',async()=>{
 const el={textContent:'',dataset:{priceSku:'couple'}},root={querySelectorAll:selector=>selector==='[data-price-sku]'?[el]:[]},pending=[];
 const cleanup=mountHomepageCatalogue(root,{request:()=>new Promise(resolve=>pending.push(resolve))});
 assert.equal(el.dataset.state,'loading');cleanup();pending[0]([item]);pending[1](markets);await new Promise(resolve=>setImmediate(resolve));
 assert.equal(el.dataset.state,'loading');assert.equal(el.textContent,'Kainą tikriname…');
});
