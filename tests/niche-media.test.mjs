import test from 'node:test';
import assert from 'node:assert/strict';
import {imageSrcSet,visibleImageCredit,uniqueImageFamilies,imageFamilyKey} from '../lib/niche-media.mjs';
test('mixed page media never becomes a hero variant or duplicate width',()=>{
 const tyre={src:'/tyre.webp',alt:'Tyre',width:800,height:1000};
 const media=[tyre,{...tyre,src:'/tyre-small.webp',width:400,height:500},
  {...tyre,src:'/duplicate.webp'}, {src:'/field.webp',alt:'Tractor in field',width:1200,height:800},
  {...tyre,src:'/wrong-ratio.webp',width:1200,height:800}];
 assert.equal(imageSrcSet(media,tyre),'/tyre-small.webp 400w, /tyre.webp 800w');
});
test('explicit families isolate frames with identical alt and keep primary order',()=>{
 const front={familyId:'front',src:'/front-360.webp',alt:'Same product',width:360,height:240};
 const rear={...front,familyId:'rear',src:'/rear-800.webp',width:800,height:533};
 const large={...front,src:'/front-1200.webp',width:1200,height:800};
 const legacy={...front,src:'/legacy.webp'};delete legacy.familyId;
 const media=[front,rear,large,legacy];
 assert.equal(imageSrcSet(media,front),'/front-360.webp 360w, /front-1200.webp 1200w');
 assert.deepEqual(uniqueImageFamilies(media),[large,rear,legacy]);
 assert.equal(imageFamilyKey(large),'family:front');
 assert.equal(imageSrcSet(media,legacy),'/legacy.webp 360w');
});
test('legacy representative selection handles rounding and aspect-separated frames',()=>{
 const first={src:'/legacy-small.webp',alt:'Legacy',width:360,height:240};
 const large={...first,src:'/legacy-large.webp',width:800,height:533};
 const portrait={...first,src:'/portrait.webp',width:400,height:800};
 assert.deepEqual(uniqueImageFamilies([first,large,portrait]),[large,portrait]);
 assert.deepEqual(uniqueImageFamilies([]),[]);
});
test('generator metadata is not a visitor badge; real source credit is retained',()=>{
 assert.equal(visibleImageCredit({credit:'Original OpenAI ImageGen editorial illustration.'}),undefined);
 assert.equal(visibleImageCredit({credit:'Photo: A. Example, CC BY 4.0'}),'Photo: A. Example, CC BY 4.0');
 assert.equal(visibleImageCredit({credit:''}),undefined);
});
