import test from 'node:test';import assert from 'node:assert/strict';
import {memoProducts,memoProductForSlug} from '../lib/memocasting-products.mjs';
import {memoProductSku,memoApplyProductContent,memoProductContents} from '../lib/memocasting-product-content.mjs';
import {memoAvailableProduct} from '../lib/memocasting-catalog-options.mjs';
import {resolveCatalogSelection} from '../vendor/commerce-core/commerce-client.mjs';
const context={schemaVersion:1,environment:'production',testOnly:false,paymentConnected:true,paymentEnvironment:'live',paymentAccountVerified:true,productionReady:true,publishOffers:true,eligibleCountries:['LT']};
test('eight exact owned products distinguish mother-child from family and cannot claim translated pages',()=>{
 assert.equal(memoProducts.length,8);assert.equal(new Set(memoProducts.map(p=>p.sku)).size,8);
 assert.equal(memoProductForSlug('products/seimos-rinkinys').sku,'mother_child');
 assert.equal(memoProductForSlug('seimos-rinkinys').sku,'family');
 assert.equal(memoProductSku({slug:'pl/products/seimos-rinkinys'}),null);
 assert.equal(memoProductSku({slug:'gidai/seimos-rinkinys'}),null);
});
test('sold-out owned products expose truthful stock schema but remain impossible to purchase',()=>{
 for(const entry of memoProducts.filter(p=>p.state==='soldout')){
  const page={type:'product',slug:entry.slug,body:[],media:[],publishAt:'2026-10-23'},product={sku:entry.sku,title:entry.sku,enabled:false,available:0,package:null,prices:{LT:800},content:{summary:'Išparduota'}};
  const projected=memoApplyProductContent(page,product,context);
  assert.equal(projected.seoOffer.availability,'https://schema.org/OutOfStock');
  assert.equal(memoAvailableProduct([product],product.sku,'LT'),null);
  assert.equal(memoApplyProductContent(page,product,{...context,publishOffers:false}).seoOffer,undefined);
 }
 const inquiry=memoProducts.find(p=>p.state==='inquiry'),page={slug:inquiry.slug,body:[],media:[]};
 assert.equal(memoApplyProductContent(page,{sku:inquiry.sku,enabled:false,available:0,prices:{LT:1200}},context).seoOffer,undefined);
});
test('a saved old wood selection is rejected after owner marks the base sold out',()=>{
 const product={prices:{LT:3200},optionGroups:[{id:'base',defaultValue:'none',values:[{id:'none',enabled:true,prices:{LT:0}},{id:'wood',enabled:false,prices:{LT:1200}}]}]};
 assert.equal(resolveCatalogSelection(product,'LT',{}).amount,3200);
 assert.throws(()=>resolveCatalogSelection(product,'LT',{base:'wood'}));
});
test('kit comparison uses contents rather than an earlier process checklist',()=>{
 assert.deepEqual(memoProductContents({body:[{type:'list',items:['Paruoškite mišinį']},{type:'heading',text:'Kas įeina į rinkinį?'},{type:'list',items:['Alginatas','Gipsas']}]}),['Alginatas','Gipsas']);
 for(const text of ['Potwierdzona zawartość','Apstiprinātā komplektācija','Kinnitatud komplekti sisu'])assert.deepEqual(memoProductContents({body:[{type:'heading',text},{type:'list',items:['content']}]}),['content']);
});
