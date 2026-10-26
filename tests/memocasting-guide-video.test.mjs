import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {memoGuideVideo,memoGuideVideoSections} from '../lib/memocasting-guide-videos.mjs';

test('guide video requires the owned guide and its exact section; unrelated/translated surfaces stay untouched',()=>{
 const slug='gidai/kaledines-dovanos-mamai',heading=memoGuideVideoSections[slug][0],page={siteId:'memocasting',type:'guide',slug,body:[{type:'heading',level:2,text:heading}]};
 const item=memoGuideVideo(page,heading);assert.equal(item.id,'moment-c23ac33c4808');assert.ok(item.src.endsWith('.mp4'));assert.ok(item.poster.endsWith('-360.webp'));
 for(const next of [{...page,siteId:'other'},{...page,type:'product'},{...page,slug:'pl/'+slug},{...page,body:[]}])assert.equal(memoGuideVideo(next,heading),null);
 assert.equal(memoGuideVideo(page,'Unrelated section'),null);
});

test('all twelve reviewed guide sections bind to existing immutable owner video and poster files',async()=>{
 assert.equal(Object.keys(memoGuideVideoSections).length,12);
 for(const[slug,[heading]]of Object.entries(memoGuideVideoSections)){
  const item=memoGuideVideo({siteId:'memocasting',type:'guide',slug,body:[{type:'heading',text:heading}]},heading);
  assert.ok(item);for(const file of [item.src,item.poster])assert.ok((await readFile(new URL('../public'+file,import.meta.url))).length>0);
 }
});
