import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {memoHomepageBlocks,memoHomepageAdmitted} from '../lib/memocasting-homepage-markup.mjs';
import {memoHomepageAsset,memoHomepageProductStory} from '../lib/memocasting-homepage-assets.mjs';
import {projectPublicPages} from '../lib/niche-links.mjs';
import manifest from '../lib/memocasting-homepage-assets.json' with {type:'json'};
const home={id:'home',type:'home',slug:'',body:memoHomepageBlocks,links:[],media:[],publishAt:'2026-10-01T00:00:00Z',revisionHash:'current',approval:{status:'approved',revisionHash:'current'}},pkg={siteId:'memocasting',pages:[home]},assetPath=manifest.assets[0].path;
test('design assets require the exact admitted homepage, same site, current revision and allowlisted path',()=>{
 const project=p=>projectPublicPages(p,[p],{},Date.parse('2026-10-13T00:00:00Z'));
 assert.ok(memoHomepageAdmitted(home));assert.ok(memoHomepageAsset(pkg,project(pkg),assetPath));
 assert.equal(memoHomepageAsset({...pkg,siteId:'other'},[home],assetPath),null);
 assert.equal(memoHomepageAsset(pkg,[home],'/memocasting-homepage/v1/private.mp4'),null);
 for(const changed of [{...home,publishAt:'2030-01-01T00:00:00Z'},{...home,approval:{status:'revoked',revisionHash:'current'}},{...home,revisionHash:'edited'},{...home,body:[{type:'paragraph',text:'changed'},...memoHomepageBlocks.slice(1)]}]){const candidate={...pkg,pages:[changed]};assert.equal(memoHomepageAsset(candidate,project(candidate),assetPath),null);}
 assert.equal(memoHomepageAsset(pkg,[{...home,slug:'pl'}],assetPath),null);
});
test('product CTAs use only supplied LT equivalents; a missing/future target never gets a fake clickable action',()=>{
 const pair={id:'pair',slug:'rinkinys-porai'},family={id:'family',slug:'seimos-rinkinys'};
 const story=memoHomepageProductStory([pair,family]);assert.ok(story.includes('href="/rinkinys-porai"'));assert.ok(story.includes('href="/seimos-rinkinys"'));assert.ok(!story.includes('@@'));
 const missing=memoHomepageProductStory([{...pair,slug:'pl/products/liejimo-rinkinys-porai'},family]);assert.ok(!missing.includes('href="/rinkinys-porai"'));assert.ok(missing.includes('Rinkinys šiuo metu nerodomas.'));assert.ok(missing.includes('href="/seimos-rinkinys"'));
});
test('all selected design asset bytes match the narrow manifest including both original film sizes',async()=>{
 for(const asset of manifest.assets){const bytes=await fs.readFile(new URL('../public'+asset.path,import.meta.url));assert.equal(bytes.length,asset.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);}
 assert.equal(manifest.assets.find(a=>a.path.endsWith('/desktop.mp4')).bytes,8587634);assert.equal(manifest.assets.find(a=>a.path.endsWith('/mobile.mp4')).bytes,3668917);
});
