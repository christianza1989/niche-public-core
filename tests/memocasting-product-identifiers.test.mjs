import test from 'node:test';
import assert from 'node:assert/strict';
import {memoManufacturerIdentity,memoSchemaProductIdentity} from '../lib/memocasting-product-identifiers.mjs';
import registry from '../lib/memocasting-merchant-products.json' with {type:'json'};
const product=()=>({sku:'couple',optionGroups:Object.entries(registry.products[0].choices).map(([id,defaultValue])=>({id,defaultValue,values:[{id:defaultValue,enabled:true,prices:{LT:0}}]}))});
test('manufacturer identity belongs only to an unchanged confirmed white default, not extra configurations',()=>{
 const p=product();assert.deepEqual(memoManufacturerIdentity(p),{sku:'MC-COUPLE-WHITE',mpn:'MC-COUPLE-WHITE',color:'Balta'});
 p.optionGroups[0].defaultValue='gold';assert.equal(memoManufacturerIdentity(p),undefined);
 p.optionGroups=product().optionGroups;p.optionGroups.push({id:'extra',defaultValue:'none',values:[{id:'none',enabled:true,prices:{LT:0}}]});assert.equal(memoManufacturerIdentity(p),undefined);
 assert.equal(memoManufacturerIdentity({...product(),sku:'foreign'}),undefined);
});
test('schema cannot copy arbitrary runtime properties or another kit MPN',()=>{
 const identity=memoManufacturerIdentity(product());assert.deepEqual(memoSchemaProductIdentity({slug:'rinkinys-porai',seoProductIdentity:{...identity,gtin:'invented',price:'0.01'}}),identity);
 assert.equal(memoSchemaProductIdentity({slug:'seimos-rinkinys',seoProductIdentity:identity}),undefined);
 assert.equal(memoSchemaProductIdentity({slug:'gidai/dovana-porai',seoProductIdentity:identity}),undefined);
});
