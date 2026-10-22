import {test} from 'node:test';
import assert from 'node:assert/strict';
import {memoFooterGroups,memoFooterCopy} from '../lib/memocasting-footer.mjs';
import {memoHomepageBlocks} from '../lib/memocasting-homepage-markup.mjs';
const home={slug:'',body:memoHomepageBlocks};
const page=slug=>({slug});
const hrefs=groups=>groups.flatMap(g=>g.links.map(l=>l.href));

test('footer sections from an inner page navigate to the admitted homepage, not local fragments',()=>{
 const live=[home,page('ranku-liejimo-rinkiniai'),page('rinkinys-porai'),page('gidai'),page('pristatymas')];
 assert.deepEqual(memoFooterGroups(home,live),memoFooterGroups(page('gidai/a'),live));
 const links=hrefs(memoFooterGroups(page('gidai/a'),live));
 assert.ok(links.includes('/#galerija'));assert.ok(links.includes('/#skulpturos'));
 assert.ok(links.includes('/rinkinys-porai'));assert.ok(!links.includes('/seimos-rinkinys'));
 assert.ok(!links.some(l=>l.startsWith('#')));
});
test('footer never emits absent or not-yet-admitted destinations or homepage anchors',()=>{
 const links=hrefs(memoFooterGroups(page('pristatymas'),[page('pristatymas')]));
 assert.deepEqual(links,['/pristatymas']);
 assert.deepEqual(memoFooterGroups(home,[]),[]);
});
test('translated footer destinations and payment copy stay in the active market',()=>{
 for(const language of ['pl','lv','et']){
  const live=[home,page('ranku-liejimo-rinkiniai'),page(language),page(language+'/collections/all'),page(language+'/pristatymas')];
  const groups=memoFooterGroups(page(language),live);
  assert.deepEqual(hrefs(groups),['/'+language+'/collections/all','/'+language+'/pristatymas']);
  assert.notEqual(groups[0].title,'Atraskite');
  for(const state of ['payment','available','test','unavailable'])assert.notEqual(memoFooterCopy(language)[state],memoFooterCopy('lt')[state]);
 }
});
