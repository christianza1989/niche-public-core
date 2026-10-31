import test from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import{createRequire}from'node:module';import{runInNewContext}from'node:vm';import ts from'typescript';import React from'react';import{renderToStaticMarkup}from'react-dom/server';
import pkg from'../content-staging/signaturepads/content-package.json'with{type:'json'};import layout from'../sites/signaturepads/migration/core-layout.json'with{type:'json'};import{projectContentPagesV2}from'../lib/content-projection-v2.mjs';import{uniqueImageFamilies}from'../lib/niche-media.mjs';
const realRequire=createRequire(import.meta.url),now=Math.max(...pkg.pages.map(p=>Date.parse(p.publishAt)))+1000,pages=projectContentPagesV2(pkg,[pkg],{},undefined,now);
async function head(path='/',eligible=pages){
 const modules={'next/headers':{headers:async()=>new Headers({host:pkg.canonicalHost,'x-gift-original-path':path})},'@/lib/niche-sites':{nicheSiteByHost:()=>null},'@/lib/content-model-v2':{contentPackageByHost:()=>pkg,publicContentPages:()=>eligible,localContentAdmission:()=>true},'@/lib/content-renderers.mjs':{contentRenderer:()=> 'signaturepads'},'@/sites/signaturepads/migration/core-layout.json':layout,'@/lib/niche-media.mjs':{uniqueImageFamilies}};
 const source=await readFile(new URL('../app/layout.tsx',import.meta.url),'utf8'),code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,exports={};runInNewContext(code,{exports,require:name=>modules[name]||name.startsWith('@/')&&{}||realRequire(name),URL,Headers,Intl,Date});return renderToStaticMarkup(await exports.default({children:React.createElement('main',null,'Head fixture')}));
}
test('actual Signaturepads SSR head discovers the rendered hero family and preserves its public ownership token',async()=>{
 const home=pages.find(p=>p.slug===''),background=uniqueImageFamilies(home.media).find(m=>m.familyId===layout.home.background);assert.ok(background);assert.notEqual(background.id,layout.home.background,'the layout stores a family ID, not a variant ID');const html=await head(),links=html.match(/<link\b[^>]*>/g)||[];
 assert.equal(links.filter(t=>t.includes('rel="preload"')&&t.includes('as="image"')&&t.includes(background.src)&&t.includes('fetchPriority="high"')).length,1);
 assert.equal((html.match(/name="google-site-verification"/g)||[]).length,1);
 const favicon=home.media.find(m=>m.id===layout.home.favicon);assert.ok(favicon);assert.ok(links.some(t=>t.includes('rel="icon"')&&t.includes(favicon.src)&&t.includes('image/webp')),'favicon layout binding is an explicit asset ID');
});
test('unpublished or non-home content never emits the homepage background resource hint',async()=>{
 for(const [path,eligible]of[['/iranga/programine-iranga/',pages],['/',pages.filter(p=>p.slug!=='')]]){const html=await head(path,eligible);assert.equal((html.match(/as="image"/g)||[]).length,0);}
});
