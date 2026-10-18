// Synthetic language fixtures; no business facts, source media or product package.
import test from 'node:test';
import assert from 'node:assert/strict';
import {pageAlternates,pageLanguage,pageRole,translationKey,localizedRolePage} from '../lib/niche-languages.mjs';
import {nicheBreadcrumbs} from '../lib/niche-schema-core.mjs';
const pkg={siteId:'wildtubs-europe',locale:'en-GB'};
const page=(id,slug,type='service')=>({id,slug,type});
const pages=[page('en-home','','home'),page('de-home','de'),page('pl-home','pl'),page('en-guides','en/guides'),page('de-guides','de/ratgeber'),page('en-article','en/guides/plan-your-delivery','guide'),page('de-article','de/ratgeber/lieferung-planen','guide')];
test('localized homes, hubs and article languages share one configured site identity',()=>{assert.equal(pageLanguage(pkg,pages[0]),'en-GB');assert.equal(pageLanguage(pkg,pages[1]),'de-DE');assert.equal(pageRole(pkg,pages[3]),'guides');assert.equal(localizedRolePage(pkg,'guides',pages[6],pages).id,'de-guides');assert.equal(localizedRolePage(pkg,'home',pages[6],pages).id,'de-home');});
test('alternates use only the supplied eligible projection; an absent translation is never invented',()=>{assert.equal(translationKey(pkg,pages[5]),translationKey(pkg,pages[6]));assert.deepEqual(pageAlternates(pkg,pages[5],pages).map(a=>a.locale),['en-GB','de-DE']);assert.equal(pageAlternates(pkg,pages[5],pages.filter(p=>p.id!=='de-article')).length,1);assert.equal(pageAlternates(pkg,undefined,pages).length,0);});
test('legacy sites keep their original language and unconfigured role fallbacks',()=>{const old={siteId:'synthetic-unconfigured',locale:'lt-LT'};assert.equal(pageLanguage(old,page('old','gidai')),'lt-LT');assert.equal(pageRole(old,page('old','gidai')),'guides');assert.deepEqual(pageAlternates(old,pages[0],pages),[]);});
test('translated home has one crumb and a product uses its actual eligible category',()=>{const p={...pkg,site:{name:'Synthetic'}},category={...page('category','de/badezuber'),title:'Category'},product={...page('product','de/badezuber/synthetic','product'),title:'Product'};assert.equal(nicheBreadcrumbs(p,pages[1],pages).length,1);assert.deepEqual(nicheBreadcrumbs(p,product,[...pages,category]).map(c=>c.path),['/de','/de/badezuber','/de/badezuber/synthetic']);assert.deepEqual(nicheBreadcrumbs(p,product,pages).map(c=>c.path),['/de','/de/badezuber/synthetic']);});
