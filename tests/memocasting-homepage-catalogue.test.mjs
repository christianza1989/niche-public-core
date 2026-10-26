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

test('actual rating data stays in its dedicated slot, with proportional stars and no price-row insertion',async t=>{
 const prior=globalThis.document;
 const element=tag=>({tag,children:[],attributes:{},classList:{add(){}},setAttribute(k,v){this.attributes[k]=v;},append(...children){this.children.push(...children);for(const c of children)c.parent=this;},remove(){this.parent.children=this.parent.children.filter(c=>c!==this);}});
 globalThis.document={createElement:element,createElementNS:(_,tag)=>element(tag)};t.after(()=>{globalThis.document=prior;});
 const price={dataset:{priceSku:'couple'},textContent:'',after(){throw Error('Rating inserted beside price');}},slot={...element('div'),dataset:{ratingSku:'couple'}},root={querySelectorAll:s=>s==='[data-price-sku]'?[price]:s==='[data-rating-sku]'?[slot]:[]};
 const cleanup=mountHomepageCatalogue(root,{request:async path=>path==='/api/reviews'?{stats:[{sku:'couple',count:166,average:4.86}]}:path==='/api/catalog'?[item]:markets});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(price.dataset.state,'ready');assert.equal(slot.children.length,1);
 const link=slot.children[0];assert.equal(link.href,'/rinkinys-porai#atsiliepimai');assert.match(link.attributes['aria-label'],/166/);assert.match(link.children[1].textContent,/4,86\/5 \(166\)/);
 const svg=link.children[0];assert.equal(svg.attributes.viewBox,'0 0 120 24');assert.equal(svg.children[0].children[0].children.length,5);assert.equal(Number(svg.children[1].children[1].attributes.width),4.86*24);
 cleanup();assert.equal(slot.children.length,0);
});

test('missing or invalid review ratings do not invent homepage stars',async t=>{
 const prior=globalThis.document;let attempted=0;t.after(()=>{globalThis.document=prior;});globalThis.document={createElement(){attempted++;throw Error('Invalid review score rendered');}};
 for(const stat of [{sku:'couple',count:0,average:5},{sku:'couple',count:2,average:6},{sku:'couple',count:2,average:NaN},null]){
  const slot={dataset:{ratingSku:'couple'}},root={querySelectorAll:s=>s==='[data-rating-sku]'?[slot]:[]};
  const cleanup=mountHomepageCatalogue(root,{request:async path=>path==='/api/reviews'?{stats:stat?[stat]:[]}:[]});await new Promise(resolve=>setImmediate(resolve));cleanup();assert.equal(attempted,0);
 }
});
