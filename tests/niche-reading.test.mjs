import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {nicheReadingBody} from '../lib/niche-reading-core.mjs';

test('StepOver native homepage exports its real approved process and sector-independent facts', async () => {
  const pkg=JSON.parse(await readFile(new URL('../content-packages/parasoplansetes/content-package.json',import.meta.url),'utf8'));
  const home=pkg.pages.find(p=>p.type==='home');
  assert.equal(home.approval.revisionHash,home.revisionHash);
  const body=nicheReadingBody(pkg.siteId,home).join('\n');
  for(const fact of home.body.flatMap(b=>b.type==='list'?b.items:b.text?[b.text]:[])) assert.ok(body.includes(fact),fact);
  assert.ok(home.body.some(block=>block.type==='paragraph'));
  assert.ok(home.body.some(block=>block.type==='list'));
});
test('Legacy custom-home hidden body remains excluded; existing tractor adapter keeps its body',()=>{
  const home={type:'home',body:[{type:'paragraph',text:'Native process answer'}]};
  assert.deepEqual(nicheReadingBody('greitossvetaines',home),[]);
  assert.deepEqual(nicheReadingBody('unregistered',home),[]);
  assert.deepEqual(nicheReadingBody('traktoriupadangos',home),['Native process answer']);
});
test('Every article exports headings, list answers and paragraphs, never media-only or alternative claims',()=>{
  const page={type:'guide',body:[{type:'heading',level:2,text:'Document route'},{type:'list',items:['Read','Sign']},{type:'paragraph',text:'Verify archived file'},{type:'image',assetId:'private-id'}]};
  assert.deepEqual(nicheReadingBody('any-niche',page),['## Document route','- Read\n- Sign','Verify archived file']);
});
