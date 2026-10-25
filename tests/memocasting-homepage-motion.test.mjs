import {test} from 'node:test';
import assert from 'node:assert/strict';
import {homepageFilmTime,homepageChapterProgress,homepageStoryMode,homepageWordProgress,homepageAdvanceFilm,homepageFilmProgress,mountMemoHomepage} from '../lib/memocasting-homepage-motion.mjs';
test('finite scroll story is monotone in both directions and chapter navigation lands on its actual frame',()=>{
 const end=20.041667-1/24,starts=[0,5,8.2,11.8,15.2,19.2];let previous=-1;
 for(let i=0;i<=1000;i++){const time=homepageFilmTime(i/1000,end);assert.ok(time>=previous);assert.ok(time<=end);previous=time;}
 starts.forEach((time,i)=>assert.equal(homepageFilmTime(homepageChapterProgress(i),end),time));
 assert.equal(homepageFilmTime(.95,end),end);assert.equal(homepageFilmTime(1,end),end);
 assert.ok(homepageFilmTime(.80,end)>homepageFilmTime(.16,end));
 assert.equal(homepageFilmTime(-1,end),0);assert.equal(homepageFilmTime(2,end),end);
});
test('wheel target jumps advance through bounded frames, settle and reverse without overshooting',()=>{
 let current=0;
 for(let i=0;i<1000;i++){const next=homepageAdvanceFilm(current,19.2,1/60);assert.ok(next>=current&&next<=19.2);assert.ok(next-current<=3/24);current=next;}
 assert.equal(current,19.2);
 const backward=homepageAdvanceFilm(current,5,1/60);assert.ok(backward<current&&backward>=5);assert.ok(current-backward<1/24);
 for(let i=0;i<1000;i++)current=homepageAdvanceFilm(current,5,1/60);
 assert.equal(current,5);assert.equal(homepageAdvanceFilm(5,5,1/60),5);
 assert.equal(homepageAdvanceFilm(0,20,0),0);assert.ok(homepageAdvanceFilm(0,20,10)<=3/24);
 const end=20.041667-1/24;
 [0,5,8.2,11.8,15.2,19.2].forEach((time,i)=>assert.equal(homepageFilmProgress(time,end),homepageChapterProgress(i)));
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
test('mounted wheel smoothing resumes after decoding temporarily drops media readiness',()=>{
 class Node extends EventTarget{
  constructor(){super();this.dataset={};this.attrs=new Map();this.children=[];const classes=new Set();this.classList={add:v=>classes.add(v),remove:v=>classes.delete(v),toggle:(v,on)=>on?classes.add(v):classes.delete(v),contains:v=>classes.has(v)};this.style={setProperty(){}};}
  setAttribute(k,v){this.attrs.set(k,v);} removeAttribute(k){this.attrs.delete(k);} getAttribute(k){return this.attrs.get(k)??null;} prepend(x){this.children.unshift(x);} after(){} remove(){} pause(){} load(){} focus(){} scrollIntoView(){}
 }
 const root=new Node(),story=new Node(),stage=new Node(),video=new Node(),surface=new Node(),poster=new Node(),frames=new Map(),globals=['document','window','location','innerWidth','innerHeight','scrollY','matchMedia','requestAnimationFrame','cancelAnimationFrame','scrollTo'],saved=new Map(globals.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 let top=0,id=0,time=0;story.getBoundingClientRect=()=>({top,bottom:top+5292,height:5292});stage.getBoundingClientRect=()=>({height:630});
 video.dataset={desktop:'/film.mp4',mobile:'/phone.mp4'};video.duration=20.041667;video.readyState=4;video.seeking=false;
 Object.defineProperty(video,'currentTime',{get:()=>time,set:v=>{time=v;video.readyState=0;video.seeking=true;}});
 const chapters=[0,5,8.2,11.8,15.2,19.2].map(start=>{const n=new Node();n.dataset={start:String(start),label:String(start)};return n;});
 const query=new Map([['.story',story],['.story-stage',stage],['#story-video',video],['.film-surface',surface],['#film-poster',poster]]);
 root.querySelector=s=>query.get(s)??null;root.querySelectorAll=s=>s==='.chapter'?chapters:[];
 const doc=new Node();doc.hidden=false;doc.createElement=()=>new Node();doc.createTextNode=text=>({textContent:text});
 const win=new Node();let cleanup;
 try{
  Object.assign(globalThis,{document:doc,window:win,location:{search:''},innerWidth:1280,innerHeight:630,scrollY:0,matchMedia:()=>Object.assign(new Node(),{matches:false}),requestAnimationFrame:cb=>{frames.set(++id,cb);return id;},cancelAnimationFrame:key=>frames.delete(key),scrollTo(){}});
  const tick=at=>{const next=frames.entries().next().value;assert.ok(next,'animation did not resume');frames.delete(next[0]);next[1](at);};
  cleanup=mountMemoHomepage(root);tick(0);top=-126;win.dispatchEvent(new Event('scroll'));tick(16.667);
  assert.ok(time>0);assert.equal(video.readyState,0);assert.equal(frames.size,0);
  const before=time;video.readyState=4;video.seeking=false;video.dispatchEvent(new Event('seeked'));
  assert.equal(frames.size,1,'decode must wake the unfinished wheel transition');tick(33.334);assert.ok(time>before);assert.ok(time-before<3/24);
  // A slow decoder may leave the eased target far ahead. Catch-up still cannot
  // turn one completed decode into a jump across many movie frames.
  top=-4500;video.readyState=4;video.seeking=true;win.dispatchEvent(new Event('scroll'));
  for(let i=0;i<60;i++)tick(50+i*16.667);
  const stalled=time;video.seeking=false;video.dispatchEvent(new Event('seeked'));
  assert.ok(time>stalled);assert.ok(time-stalled<=3/24+.000001);
 }finally{cleanup?.();for(const [key,descriptor] of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}}
});
