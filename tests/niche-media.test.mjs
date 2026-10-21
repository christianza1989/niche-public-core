import test from 'node:test';
import assert from 'node:assert/strict';
import {imageSrcSet,visibleImageCredit,uniqueImageFamilies,imageFamilyKey,responsiveImageVariants} from '../lib/niche-media.mjs';
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
test('explicit family identity keeps panoramas together across integer rounding',()=>{
 const sizes=[[1280,60],[1200,56],[800,38],[360,17]];
 const frames=sizes.map(([width,height])=>({id:`p-${width}`,familyId:'panorama',src:`/content-assets/sample/p-${width}.webp`,alt:'Same frame',width,height}));
 const other={...frames[0],id:'other',familyId:'different-frame',src:'/content-assets/sample/other.webp'};
 const legacy={...frames[0],id:'legacy',src:'/content-assets/sample/legacy.webp'};delete legacy.familyId;
 const media=[frames[3],other,frames[2],frames[1],frames[0],legacy];
 const before=JSON.stringify(media);
 assert.deepEqual(uniqueImageFamilies(media),[frames[0],other,legacy]);
 for(const frame of frames) {
  assert.deepEqual(responsiveImageVariants(media,frame),[frames[3],frames[2],frames[1],frames[0]]);
  assert.equal(imageSrcSet(media,frame),'/content-assets/sample/p-360.webp 360w, /content-assets/sample/p-800.webp 800w, /content-assets/sample/p-1200.webp 1200w, /content-assets/sample/p-1280.webp 1280w');
 }
 assert.equal(JSON.stringify(media),before);
});
test('explicit tall family ignores rounded aspect and alt differences while legacy stays aspect filtered',()=>{
 const sizes=[[60,1280],[56,1200],[38,800],[17,360]];
 const tall=sizes.map(([width,height],i)=>({id:`t-${width}`,familyId:'tall',src:`/content-assets/sample/t-${width}.webp`,alt:`Reviewed frame ${i}`,width,height}));
 assert.deepEqual(uniqueImageFamilies(tall),[tall[0]]);
 assert.deepEqual(responsiveImageVariants(tall,tall[0]),[tall[3],tall[2],tall[1],tall[0]]);
 const legacy=tall.map(({familyId,...rest})=>({...rest,alt:'Legacy'}));
 const wrong={...legacy[0],id:'wrong',src:'/wrong.webp',width:800,height:400};
 assert.ok(!responsiveImageVariants([...legacy,wrong],legacy[0]).includes(wrong));
 const unmarked={...tall[0]};delete unmarked.familyId;
 assert.deepEqual(responsiveImageVariants([...tall,unmarked],unmarked),[unmarked]);
});
