import test from 'node:test';
import assert from 'node:assert/strict';
import {selectValidatedBuild} from '../lib/niche-build-scope.mjs';
import {projectPublicPages,validateGuidePublicationPauses} from '../lib/niche-links.mjs';
const now=Date.parse('2026-10-30T00:00:00Z'),cutoff='2026-10-01T00:00:00.000Z';
const page=(id,date)=>({id,type:'guide',slug:id,publishAt:date,revisionHash:id,approval:{status:'approved',revisionHash:id},links:[]});
const packages=['o3tech','promedical'].map(siteId=>({siteId,schemaVersion:1,canonicalHost:siteId+'.lt',pages:[page('old','2026-09-01'),page('new','2026-10-15')]}));
const settings={guidePublicationPausedAtBySite:{promedical:cutoff},networkDomains:[]};
test('single-site artifacts retain exactly the canonical publication pause behavior',()=>{
 validateGuidePublicationPauses(settings,packages);
 for(const pkg of packages){
  const scoped=selectValidatedBuild(packages,{},settings,pkg.siteId);
  assert.deepEqual(projectPublicPages(pkg,scoped.packages,scoped.network,now),projectPublicPages(pkg,packages,settings,now));
 }
 assert.throws(()=>projectPublicPages(packages[0],[packages[0]],settings,now),/Unknown guide publication pause site/,'unknown pause remains fail-closed');
 assert.deepEqual(settings.guidePublicationPausedAtBySite,{promedical:cutoff},'source policy is not mutated');
});
test('default registry stays unchanged; invalid or missing selected sites cannot compile',()=>{
 assert.equal(selectValidatedBuild(packages,{},settings).packages,packages);
 for(const site of ['../o3tech','missing'])assert.throws(()=>selectValidatedBuild(packages,{},settings,site));
 const admitted=selectValidatedBuild(packages,{o3tech:{scope:'accepted'},promedical:{scope:'other'}},settings,'o3tech');
 assert.deepEqual(Object.keys(admitted.admissions),['o3tech']);
});
