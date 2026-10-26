import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {projectPublicPages} from '../lib/niche-links.mjs';
import {memoCheckoutPolicies,memoResolveTerms} from '../lib/memocasting-checkout-policies.mjs';

// Operator release preflight. It never changes market configuration or terms.
export function verifyCheckoutPolicies(pages,envelope){
 assert.ok(Array.isArray(envelope?.markets),'checkout_markets_invalid');
 const enabled=envelope.markets.filter(m=>m?.checkoutEnabled===true);
 assert.ok(enabled.length,'checkout_no_enabled_market');
 assert.equal(new Set(enabled.map(m=>m.country)).size,enabled.length,'checkout_duplicate_market');
 const policies=memoCheckoutPolicies(pages);
 return enabled.map(m=>{
  const countryPolicies=policies.filter(p=>p.country===m.country);
  assert.equal(countryPolicies.length,1,'checkout_policy_missing_or_duplicate:'+m.country);
  const url=memoResolveTerms(policies,m);
  assert.ok(url,'checkout_policy_mismatch:'+m.country);
  return {country:m.country,policyVersion:m.policyVersion,url};
 });
}
export async function verifyHostedCheckoutPolicies({origin='https://memocasting.lt',fetchImpl=fetch,now=Date.now()}={}){
 assert.ok(['https://memocasting.lt','https://www.memocasting.lt'].includes(origin),'checkout_origin_invalid');
 const packages=JSON.parse(await fs.readFile(new URL('../lib/generated/content-packages.json',import.meta.url),'utf8'));
 const pkg=packages.find(p=>p.siteId==='memocasting'&&p.schemaVersion===1);
 const source=JSON.parse(await fs.readFile(new URL('../content-packages/memocasting/content-package.json',import.meta.url),'utf8'));
 assert.deepEqual(pkg,source,'checkout_source_package_not_compiled');
 const settings=JSON.parse(await fs.readFile(new URL('../config/niche-network.json',import.meta.url),'utf8'));
 const response=await fetchImpl(origin+'/prekyba/markets',{redirect:'manual',signal:AbortSignal.timeout(15000)});
 assert.equal(response.status,200,'checkout_markets_http');
 const policies=verifyCheckoutPolicies(projectPublicPages(pkg,packages,settings,now),await response.json());
 for(const p of policies){
  const response=await fetchImpl(origin+p.url,{redirect:'manual',signal:AbortSignal.timeout(15000)});
  assert.equal(response.status,200,'checkout_terms_http:'+p.country);
 }
 return {state:'CHECKOUT_POLICIES_VERIFIED',origin,policies,mutations:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{assert.equal(process.argv.length,2,'checkout_policy_arguments_invalid');console.log(JSON.stringify(await verifyHostedCheckoutPolicies(),null,2));}
 catch(error){console.error(JSON.stringify({state:'BLOCKED',reason:error.message}));process.exitCode=1;}
}

