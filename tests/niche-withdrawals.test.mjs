import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {projectPublicPages} from '../lib/niche-links.mjs';
import {validatePageWithdrawals,pageWithdrawalDestination} from '../lib/niche-withdrawals.mjs';
import {indexNichePathAliases} from '../lib/niche-path-aliases.mjs';
const packages=JSON.parse(await readFile(new URL('../lib/generated/content-packages.json',import.meta.url)));
const settings=JSON.parse(await readFile(new URL('../config/niche-network.json',import.meta.url)));
const aliases=indexNichePathAliases(JSON.parse(await readFile(new URL('../config/niche-path-aliases.json',import.meta.url))));
const pkg=packages.find(p=>p.siteId==='promedical'),rule=settings.pageWithdrawalsBySite.promedical;
const beforeSettings={...settings};delete beforeSettings.pageWithdrawalsBySite;
const before=projectPublicPages(pkg,packages,beforeSettings),live=()=>projectPublicPages(pkg,packages,settings);

test('four withdrawn categories disappear from the shared projection and incoming links without changing raw records',()=>{
 const original=JSON.stringify(packages),ids=new Set(rule.pages.map(p=>p.pageId));
 validatePageWithdrawals(settings,packages);
 assert.equal(ids.size,4);assert.equal(before.length-live().length,4);
 for(const p of live()){assert(!ids.has(p.id));assert(p.links.every(l=>!ids.has(l.targetPageId)));}
 assert.deepEqual(live().map(p=>({...p,links:[]})),before.filter(p=>!ids.has(p.id)).map(p=>({...p,links:[]})));
 assert.equal(live().filter(p=>p.type==='guide').length,2);
 for(const other of packages.filter(p=>p!==pkg))assert.deepEqual(projectPublicPages(other,packages,settings),projectPublicPages(other,packages,beforeSettings));
 assert.equal(JSON.stringify(packages),original);
 const edited=structuredClone(pkg);edited.pages.find(p=>ids.has(p.id)).slug='kategorijos/changed-by-editor';
 assert(projectPublicPages(edited,[edited],settings).every(p=>!ids.has(p.id)),'hosted edits cannot revive a withdrawn identity');
});

test('current, trailing-slash and legacy routes redirect to catalogue; category query is cleared without loops',()=>{
 for(const entry of rule.pages){
  for(const path of[entry.path,entry.path+'/'])assert.equal(pageWithdrawalDestination(pkg,settings,aliases,live,path),'/produktai');
  const old=[...aliases.get(pkg.siteId).byFrom.values()].filter(a=>a.targetPageId===entry.pageId);assert(old.length>0);
  for(const a of old)assert.equal(pageWithdrawalDestination(pkg,settings,aliases,live,a.from),'/produktai');
  assert.equal(pageWithdrawalDestination(pkg,settings,aliases,live,'/produktai','?category='+entry.path.slice('/kategorijos/'.length)+'&p=2&q=ZV'),'/produktai?q=ZV');
 }
 assert.equal(pageWithdrawalDestination(pkg,settings,aliases,live,'/produktai'),null);
 assert.equal(pageWithdrawalDestination(pkg,settings,aliases,live,'/produktai','?q=ispardavimas'),null);
 assert.equal(pageWithdrawalDestination(pkg,settings,aliases,live,'/kategorijos/unknown'),null);
 assert.equal(pageWithdrawalDestination({...pkg,canonicalHost:'other.lt'},settings,aliases,live,rule.pages[0].path),null);
 assert.equal(pageWithdrawalDestination(pkg,settings,aliases,()=>[],rule.pages[0].path),null);
});

test('withdrawal configuration rejects unknown identities, host mismatches, product targets and unsafe destinations',()=>{
 for(const change of[r=>r.redirectTo='https://evil.example',r=>r.canonicalHost='other.lt',r=>r.pages.push({...r.pages[0]}),r=>r.pages[0].pageId='unknown',r=>r.pages[0].path='/api/secret',r=>{const p=pkg.pages.find(p=>p.type==='product');r.pages[0]={pageId:p.id,path:'/'+p.slug};}]){
  const s=structuredClone(settings);change(s.pageWithdrawalsBySite.promedical);assert.throws(()=>validatePageWithdrawals(s,packages));
 }
});
