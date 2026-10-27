import test from 'node:test';
import assert from 'node:assert/strict';
import {memoHomepageBlocks} from '../lib/memocasting-homepage-markup.mjs';
import {memoBrandSectionHeading,memoHomepageBrand} from '../lib/memocasting-homepage-brand.mjs';

test('native brand copy appears once, preserves surrounding content and only links eligible pages',()=>{
 const before={type:'paragraph',text:'Existing information.'},after={type:'heading',level:2,text:'Following section'};
 const body=[...memoHomepageBlocks,before,{type:'heading',level:2,text:memoBrandSectionHeading},{type:'paragraph',text:'Reviewed business truth.'},after];
 const page={slug:'',body},r=memoHomepageBrand(page,[{slug:'apie-projekta'},{slug:'pages/instrukcija'}]);
 assert.deepEqual(r.section.paragraphs,['Reviewed business truth.']);assert.deepEqual(r.remainder,[before,after]);
 assert.deepEqual(r.section.links.map(l=>l.href),['/apie-projekta','/pages/instrukcija']);
 const missing=memoHomepageBrand({...page,body:[...memoHomepageBlocks,before]},[]);assert.equal(missing.section,null);assert.deepEqual(missing.remainder,[before]);
 const altered=memoHomepageBrand({...page,body:[{type:'paragraph',text:'Altered admission'},...body.slice(1)]},[]);assert.equal(altered.section,null);
 assert.equal(memoHomepageBrand({...page,slug:'pl'},[]).section,null);
});
