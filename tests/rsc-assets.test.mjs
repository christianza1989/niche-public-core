import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {missingRscAssets} from '../scripts/check-rsc-assets.mjs';

test('RSC gate rejects removed CSS-only JS chunks even when their stylesheet exists',()=>{
 const root=resolve('fixture/client'),present=new Set([resolve(root,'_next/static/reviews.css'),resolve(root,'_next/static/reviews-real.js')]);
 const manifest={clientReferenceDeps:{x:{js:['/_next/static/reviews-real.js','/_next/static/reviews-removed.js'],css:['/_next/static/reviews.css']}}};
 assert.deepEqual(missingRscAssets(manifest,root,file=>present.has(file)),['/_next/static/reviews-removed.js']);
 assert.deepEqual(missingRscAssets({bootstrapScriptContent:'import("/external")'},root,()=>false),[]);
});
test('RSC gate checks nested dependency entries and deduplicates failures',()=>{
 assert.deepEqual(missingRscAssets({a:['/_next/a.js'],b:{css:['/_next/a.js','/_next/missing.css']}},'.',()=>false),['/_next/a.js','/_next/missing.css']);
});
