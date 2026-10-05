import test from 'node:test';
import assert from 'node:assert/strict';
import {imageSrcSet,visibleImageCredit} from '../lib/niche-media.mjs';
test('mixed page media never becomes a hero variant or duplicate width',()=>{
 const tyre={src:'/tyre.webp',alt:'Tyre',width:800,height:1000};
 const media=[tyre,{...tyre,src:'/tyre-small.webp',width:400,height:500},
  {...tyre,src:'/duplicate.webp'}, {src:'/field.webp',alt:'Tractor in field',width:1200,height:800},
  {...tyre,src:'/wrong-ratio.webp',width:1200,height:800}];
 assert.equal(imageSrcSet(media,tyre),'/tyre-small.webp 400w, /tyre.webp 800w');
});
test('generator metadata is not a visitor badge; real source credit is retained',()=>{
 assert.equal(visibleImageCredit({credit:'Original OpenAI ImageGen editorial illustration.'}),undefined);
 assert.equal(visibleImageCredit({credit:'Photo: A. Example, CC BY 4.0'}),'Photo: A. Example, CC BY 4.0');
 assert.equal(visibleImageCredit({credit:''}),undefined);
});
