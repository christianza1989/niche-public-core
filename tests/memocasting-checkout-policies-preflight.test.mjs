import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyCheckoutPolicies} from '../scripts/verify-memocasting-checkout-policies.mjs';
import {projectPublicPages} from '../lib/niche-links.mjs';
const revision='a'.repeat(64);
const page=()=>({id:'terms',siteId:'memocasting',slug:'naudojimo-salygos',type:'legal',publishAt:'2026-01-01T00:00:00Z',revisionHash:revision,approval:{status:'approved',revisionHash:revision},links:[],body:[],media:[]});
const markets={markets:[{country:'LT',checkoutEnabled:true,policyVersion:revision},{country:'PL',checkoutEnabled:false,policyVersion:'old'}]};
test('checkout policy preflight accepts exact current terms and ignores closed markets',()=>{
 assert.deepEqual(verifyCheckoutPolicies([page()],markets),[{country:'LT',policyVersion:revision,url:'/naudojimo-salygos'}]);
 assert.throws(()=>verifyCheckoutPolicies([page()],{markets:[]}),/checkout_no_enabled_market/);
 assert.throws(()=>verifyCheckoutPolicies([page(),page()],markets),/missing_or_duplicate/);
});
test('metadata-only approved revision drift is rejected rather than disabling checkout silently',()=>{
 const next={...page(),description:'Memory Casting pirkimo sąlygos',revisionHash:'b'.repeat(64),approval:{status:'approved',revisionHash:'b'.repeat(64)}};
 assert.throws(()=>verifyCheckoutPolicies([next],markets),/checkout_policy_mismatch:LT/);
});
test('checkout policy preflight reuses publication projection for future or unapproved terms',()=>{
 for(const patch of [{publishAt:'2027-01-01T00:00:00Z'},{approval:{status:'draft',revisionHash:revision}}]){
  const pkg={siteId:'memocasting',canonicalHost:'memocasting.lt',pages:[{...page(),...patch}]};
  assert.throws(()=>verifyCheckoutPolicies(projectPublicPages(pkg,[pkg],{},Date.parse('2026-10-26T06:00:00Z')),markets),/missing_or_duplicate/);
 }
});

