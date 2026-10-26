import test from 'node:test';
import assert from 'node:assert/strict';
import {memoCheckoutPolicies,memoResolveTerms} from '../lib/memocasting-checkout-policies.mjs';
import {memoLeadContext,memoLeadText} from '../lib/memocasting-lead-response.mjs';
import {memoAvailableExtra,memoAvailableProduct,memoMarketCurrency} from '../lib/memocasting-catalog-options.mjs';
import {memoLanguageLinks} from '../lib/memocasting-locales.mjs';
const pages=['','pl/','lv/','et/'].flatMap(prefix=>['kontaktai','privatumas','naudojimo-salygos'].map(slug=>({slug:prefix+slug,revisionHash:prefix+'revision'})));
test('product options read currency from the canonical markets envelope, with no guessed fallback',()=>{
 assert.equal(memoMarketCurrency({markets:[{country:'LT',currency:'EUR'},{country:'PL',currency:'PLN'}]},'PL'),'PLN');
 for(const value of [null,[],{markets:[]},{markets:[null,{}]},{markets:[{country:'LT',currency:'eur'}]}])assert.equal(memoMarketCurrency(value,'LT'),'');
});
test('language navigation preserves the reader job and excludes absent equivalents, including functional carts',()=>{
 const current={slug:'pl/cart',type:'faq'},lt={slug:'cart',type:'faq'},different={slug:'et/kontaktai',type:'faq'};
 assert.deepEqual(memoLanguageLinks(current,[current,lt,different]).map(p=>p.path),['/cart','/pl/cart']);
 assert.equal(memoLanguageLinks(current,[current,lt])[1].current,true);
 assert.deepEqual(memoLanguageLinks({slug:'',type:'home'},[{slug:'',type:'home'},{slug:'et',type:'faq'}]).map(p=>p.path),['/','/et']);
});
test('an extra opens only with actual enabled stock, country price, kit relation and measured package',()=>{
 const item={sku:'white_paint',enabled:true,available:1,prices:{LT:300},addonFor:['couple'],package:{weightGrams:100,dimensionsMm:[50,50,50]}};
 assert.equal(memoAvailableExtra([item],'white_paint','couple','LT'),item);
 for(const change of [{enabled:false},{available:0},{package:null},{prices:{PL:300}},{addonFor:['family']}])assert.equal(memoAvailableExtra([{...item,...change}],'white_paint','couple','LT'),null);
});

test('a base kit cannot be added without an enabled, available, priced and measured catalog entry',()=>{
 const item={sku:'couple',enabled:true,available:2,prices:{LT:3200},package:{weightGrams:2000,dimensionsMm:[200,200,170]}};
 assert.equal(memoAvailableProduct([item],'couple','LT'),item);
 for(const change of [{enabled:false},{available:0},{available:-1},{available:1.5},{prices:{PL:3200}},{package:{weightGrams:0,dimensionsMm:[200,200,170]}}])assert.equal(memoAvailableProduct([{...item,...change}],'couple','LT'),null);
 for(const catalog of [[],null,{},[null,{}]])assert.equal(memoAvailableProduct(catalog,'couple','LT'),null);
});
test('country terms require the exact currently supplied revision; stale/missing policy has no substitute',()=>{
 const policies=memoCheckoutPolicies(pages);
 assert.equal(memoResolveTerms(policies,{country:'PL',policyVersion:'pl/revision'}),'/pl/naudojimo-salygos');
 assert.equal(memoResolveTerms(policies,{country:'PL',policyVersion:'revision'}),null);
 assert.equal(memoResolveTerms(policies.filter(p=>p.country!=='EE'),{country:'EE',policyVersion:'et/revision'}),null);
});
test('contact locale requires an eligible contact and privacy pair, not an arbitrary language or external path',()=>{
 assert.deepEqual(memoLeadContext(pages,'/et/kontaktai'),{language:'et',home:'/et'});
 assert.equal(memoLeadContext(pages.filter(p=>p.slug!=='pl/privatumas'),'/pl/kontaktai'),null);
 for(const path of ['/pl/cart','https://other.test/pl/kontaktai','/fr/kontaktai','/pl/kontaktai?language=lv'])assert.equal(memoLeadContext(pages,path),null);
 const copy=memoLeadText('Tai vietinės peržiūros bandymas: žinutė išsaugota tik šiame kompiuteryje, o tikras el. laiškas neišsiųstas.',200,memoLeadContext(pages,'/pl/kontaktai'));
 assert.equal(copy.language,'pl');assert.match(copy.message,/Prawdziwy e-mail nie został wysłany/);
 assert.equal(memoLeadText('Lietuviškas tekstas',400,null).message,'Lietuviškas tekstas');
});
