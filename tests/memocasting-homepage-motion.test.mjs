import {test} from 'node:test';
import assert from 'node:assert/strict';
import {homepageFilmTime,homepageChapterProgress,homepageStoryMode,homepageWordProgress} from '../lib/memocasting-homepage-motion.mjs';
test('finite scroll story is monotone in both directions and chapter navigation lands on its actual frame',()=>{
 const end=20.041667-1/24,starts=[0,5,8.2,11.8,15.2,19.2];let previous=-1;
 for(let i=0;i<=1000;i++){const time=homepageFilmTime(i/1000,end);assert.ok(time>=previous);assert.ok(time<=end);previous=time;}
 starts.forEach((time,i)=>assert.equal(homepageFilmTime(homepageChapterProgress(i),end),time));
 assert.equal(homepageFilmTime(.95,end),end);assert.equal(homepageFilmTime(1,end),end);
 assert.ok(homepageFilmTime(.80,end)>homepageFilmTime(.16,end));
 assert.equal(homepageFilmTime(-1,end),0);assert.equal(homepageFilmTime(2,end),end);
});
test('short desktop keeps the scroll story; phones, reduced motion and actual media failure retain a usable alternative',()=>{
 assert.equal(homepageStoryMode({width:1280,height:630}),'scroll');
 assert.equal(homepageStoryMode({width:1280,height:500}),'scroll');
 assert.equal(homepageStoryMode({width:390,height:844}),'manual');
 assert.equal(homepageStoryMode({width:1280,motion:false}),'static');
 assert.equal(homepageStoryMode({width:1280,failed:true}),'static');
});
test('word reveal follows reading progress in both scroll directions and settles at either end',()=>{
 const forward=[700,490,300,100,-200].map(top=>homepageWordProgress(top,220,630));
 assert.equal(forward[0],0);assert.equal(forward.at(-1),1);
 forward.forEach((p,i)=>{if(i)assert.ok(p>=forward[i-1]);});
 assert.ok(homepageWordProgress(300,220,630)<homepageWordProgress(100,220,630));
});
