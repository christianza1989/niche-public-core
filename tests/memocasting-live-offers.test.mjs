import test from 'node:test';
import assert from 'node:assert/strict';
import {memoApplyProductContent} from '../lib/memocasting-product-content.mjs';
import {memoSchemaGraph} from '../lib/memocasting-structure.mjs';
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
 for(const c of [undefined,{...context,environment:'sandbox'},{...context,testOnly:true},{...context,publishOffers:false},{...context,productionReady:false},{...context,paymentEnvironment:'test'},{...context,paymentAccountVerified:false},{...context,eligibleCountries:['PL']},{...context,eligibleCountries:'LT'}])assert.equal(schema(memoApplyProductContent(page,product,c)).offers,undefined);
 for(const p of [{...product,enabled:false},{...product,available:-1},{...product,available:1.5},{...product,prices:{LT:0}},{...product,prices:{LT:'3200'}},{...product,prices:{LT:Number.MAX_SAFE_INTEGER+1}}])assert.equal(schema(memoApplyProductContent(page,p,context)).offers,undefined);
 const guide={...page,type:'guide',slug:'gidai/kaledines-dovanos'};
 assert.equal(memoApplyProductContent(guide,product,context),guide);
});
