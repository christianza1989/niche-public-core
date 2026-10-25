import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import catalogue from '../lib/memocasting-video-assets.json' with {type:'json'};
import manifest from '../lib/memocasting-homepage-assets.json' with {type:'json'};
import {memoHomepageAsset} from '../lib/memocasting-homepage-assets.mjs';
import pkg from '../content-packages/memocasting/content-package.json' with {type:'json'};

test('all owner video and responsive poster bytes match the exact admitted immutable assets; no upscaled posters or duplicate clips',async()=>{
 assert.equal(catalogue.items.length,24);assert.equal(new Set(catalogue.items.map(v=>v.id)).size,24);
 for(const item of catalogue.items){
  assert.ok(item.title&&item.alt&&item.duration>0);assert.match(item.durationLabel,/^\d+:\d{2}$/);assert.ok(item.variants.length);
  assert.ok(item.variants.every((v,i)=>v.width<=item.width&&(!i||v.width>item.variants[i-1].width)));
  for(const src of [item.src,...item.variants.map(v=>v.src)]){
   assert.match(src,/^\/memocasting-homepage\/v1\/media\/video-carousel-20261020\/moment-[a-f0-9]{12}(?:-\d+\.webp|\.mp4)$/);
   const asset=manifest.assets.find(v=>v.path===src);assert.ok(asset);
   const bytes=await readFile(new URL('../public'+src,import.meta.url));
   assert.equal(bytes.length,asset.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);
   if(src.endsWith('.mp4')){
    assert.equal(asset.type,'video/mp4');assert.ok(bytes.length<24*1024*1024);
    const atoms=[];let offset=0;while(offset+8<=bytes.length){const size=bytes.readUInt32BE(offset),type=bytes.toString('ascii',offset+4,offset+8);assert.ok(size>=8,'bounded MP4 atoms');atoms.push(type);offset+=size;}
    assert.equal(offset,bytes.length);assert.ok(atoms.indexOf('moov')>=0&&atoms.indexOf('moov')<atoms.indexOf('mdat'),'metadata must precede media for progressive playback');
   }else assert.equal(asset.type,'image/webp');
  }
 }
});
test('the new media cannot bypass existing site and eligible-homepage admission',()=>{
 const home=pkg.pages.find(page=>page.slug==='');assert.ok(home);
 for(const item of catalogue.items){
  for(const src of [item.src,...item.variants.map(v=>v.src)]){
   assert.ok(memoHomepageAsset(pkg,[home],src));
   assert.equal(memoHomepageAsset({siteId:'another-site'},[home],src),null);
   assert.equal(memoHomepageAsset({siteId:'memocasting'},[],src),null);
  }
 }
 assert.equal(memoHomepageAsset(pkg,[home],'/memocasting-homepage/v1/media/video-carousel-20261020/private-source.mp4'),null);
});
