import test from 'node:test';
import assert from 'node:assert/strict';
import {nicheIndexingAllowed} from '../lib/niche-indexability.mjs';
const pkg={canonicalHost:'public-shop.test'};
test('canonical public package allows indexing without a runtime activation flag',()=>{
  assert.equal(nicheIndexingAllowed(pkg,'public-shop.test'),true);
  assert.equal(nicheIndexingAllowed(pkg,'public-shop.test',true),true);
});
test('explicit loopback review mirrors canonical indexing without admitting preview deployments',()=>{
  for(const host of ['127.0.0.1','localhost']){
    assert.equal(nicheIndexingAllowed(pkg,host),false);
    assert.equal(nicheIndexingAllowed(pkg,host,true),true);
  }
  for(const host of ['foreign.test','public-shop.test.vercel.app','public-shop.test.attacker.test'])assert.equal(nicheIndexingAllowed(pkg,host,true),false);
});
test('placeholder and absent canonical identity cannot become indexable through the review flag',()=>{
  for(const canonicalHost of [undefined,'unfinished.example','localhost','127.0.0.1'])for(const host of [canonicalHost,'localhost'])assert.equal(nicheIndexingAllowed({canonicalHost},host,true),false);
});
