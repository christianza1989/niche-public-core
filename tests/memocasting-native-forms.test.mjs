import test from 'node:test';
import assert from 'node:assert/strict';
import {memoCheckoutPolicies,memoResolveTerms} from '../lib/memocasting-checkout-policies.mjs';
import {memoLeadContext,memoLeadText} from '../lib/memocasting-lead-response.mjs';
import {memoAvailableExtra} from '../lib/memocasting-catalog-options.mjs';
const pages=['','pl/','lv/','et/'].flatMap(prefix=>['kontaktai','privatumas','naudojimo-salygos'].map(slug=>({slug:prefix+slug,revisionHash:prefix+'revision'})));
test('an extra opens only with actual enabled stock, country price, kit relation and measured package',()=>{
 const item={sku:'white_paint',enabled:true,available:1,prices:{LT:300},addonFor:['couple'],package:{weightGrams:100,dimensionsMm:[50,50,50]}};
 assert.equal(memoAvailableExtra([item],'white_paint','couple','LT'),item);
 for(const change of [{enabled:false},{available:0},{package:null},{prices:{PL:300}},{addonFor:['family']}])assert.equal(memoAvailableExtra([{...item,...change}],'white_paint','couple','LT'),null);
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
