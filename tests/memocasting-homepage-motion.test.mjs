import {test} from 'node:test';
import assert from 'node:assert/strict';
import {homepageFilmTime,homepageChapterProgress} from '../lib/memocasting-homepage-motion.mjs';
test('finite scroll story is monotone in both directions and chapter navigation lands on its actual frame',()=>{
 const end=20.041667-1/24,starts=[0,5,8.2,11.8,15.2,19.2];let previous=-1;
 for(let i=0;i<=1000;i++){const time=homepageFilmTime(i/1000,end);assert.ok(time>=previous);assert.ok(time<=end);previous=time;}
 starts.forEach((time,i)=>assert.equal(homepageFilmTime(homepageChapterProgress(i),end),time));
 assert.equal(homepageFilmTime(.95,end),end);assert.equal(homepageFilmTime(1,end),end);
 assert.ok(homepageFilmTime(.80,end)>homepageFilmTime(.16,end));
 assert.equal(homepageFilmTime(-1,end),0);assert.equal(homepageFilmTime(2,end),end);
});
