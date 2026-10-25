import test from 'node:test';
import assert from 'node:assert/strict';
import {renderMemoPayment} from '../lib/memocasting-embedded-checkout.mjs';

class Element{
 constructor(tag){this.tag=tag;this.children=[];this.attrs={};}
 setAttribute(key,value){this.attrs[key]=value;}
 append(...items){for(const item of items){item.parent=this;this.children.push(item);}}
 replaceChildren(){this.children=[];}
 remove(){this.parent.children=this.parent.children.filter(item=>item!==this);}
}
async function withDom(task){const previous=globalThis.document;globalThis.document={createElement:tag=>new Element(tag)};try{await task();}finally{globalThis.document=previous;}}
test('payment mounts the authenticated embedded Session, completion reads server state once and disposal destroys the iframe',()=>withDom(async()=>{
 const target=new Element('div'),controller=new AbortController();let completed=0,destroyed=0,options,mounted;
 const details={uiMode:'embedded',clientSecret:'cs_test_fixture_secret_local',publishableKey:'pk_test_fixture'};
 const clean=await renderMemoPayment({target,signal:controller.signal,client:{checkoutDetails:async input=>{assert.deepEqual(input,{uiMode:'embedded'});return details;}},onComplete:async()=>completed++,loadStripe:async()=>key=>{assert.equal(key,details.publishableKey);return {createEmbeddedCheckoutPage:async value=>{options=value;return{mount:el=>{mounted=el;},destroy:()=>destroyed++};}};}});
 assert.equal(mounted.className,'checkout-stripe-frame');assert.equal(await options.fetchClientSecret(),details.clientSecret);
 options.onComplete();options.onComplete();await Promise.resolve();assert.equal(completed,1);
 clean();assert.equal(destroyed,1);
}));
test('existing hosted Sessions retain their original payment link without loading a different Stripe Session',()=>withDom(async()=>{
 const target=new Element('div');let loads=0;
 await renderMemoPayment({target,client:{checkoutDetails:async()=>({uiMode:'hosted',url:'https://checkout.stripe.com/c/pay/fixture'})},onComplete:async()=>{},loadStripe:async()=>{loads++;}});
 assert.equal(loads,0);assert.equal(target.children.find(n=>n.tag==='a').href,'https://checkout.stripe.com/c/pay/fixture');
}));
test('late Stripe initialization after navigation destroys its instance without mounting it',()=>withDom(async()=>{
 const target=new Element('div'),controller=new AbortController();let resolve,mounts=0,destroys=0;
 const pending=renderMemoPayment({target,signal:controller.signal,client:{checkoutDetails:async()=>({uiMode:'embedded',clientSecret:'fixture',publishableKey:'fixture'})},onComplete:async()=>{},loadStripe:async()=>()=>({createEmbeddedCheckoutPage:()=>new Promise(done=>{resolve=done;})})});
 await Promise.resolve();await Promise.resolve();controller.abort();resolve({mount:()=>mounts++,destroy:()=>destroys++});await pending;
 assert.equal(mounts,0);assert.equal(destroys,1);
}));
