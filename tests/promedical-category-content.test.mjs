import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {hasPromedicalCategoryContent} from '../lib/promedical-category-content.mjs';

const pkg=JSON.parse(await fs.readFile(new URL('../content-packages/promedical/content-package.json',import.meta.url),'utf8'));
const protectedIds=['8ebc04dd-bcf8-43c7-8023-7493b622ee32','dad92f0f-0632-495d-a799-9e6eb85be5f2'];

test('category content is limited to the accepted 434 identities and Promedical FAQ route',()=>{
  const allowed=pkg.pages.filter(p=>hasPromedicalCategoryContent(pkg.siteId,p));
  assert.equal(allowed.length,434);
  assert.equal(pkg.pages.filter(p=>p.slug.startsWith('kategorijos/')).length,436);
  for(const id of protectedIds)assert.equal(hasPromedicalCategoryContent('promedical',pkg.pages.find(p=>p.id===id)),false);
  const p=allowed[0];
  for(const [site,page] of [['other',p],['promedical',{...p,id:randomUUID()}],['promedical',{...p,type:'product'}],['promedical',{...p,slug:'produktai'}]])assert.equal(hasPromedicalCategoryContent(site,page),false);
});

test('category SSR places ordered prose, linked text and sources after unchanged catalogue results',async()=>{
  const output=new URL(`../.sites-runtime/category-${randomUUID()}.mjs`,import.meta.url);
  await fs.mkdir(new URL('../.sites-runtime/',import.meta.url),{recursive:true});
  await build({entryPoints:[fileURLToPath(new URL('../components/niche/promedical-site.tsx',import.meta.url))],outfile:fileURLToPath(output),bundle:true,format:'esm',platform:'node',external:['react','react-dom'],loader:{'.css':'empty','.module.css':'empty'},jsx:'automatic',tsconfig:fileURLToPath(new URL('../tsconfig.json',import.meta.url)),plugins:[{name:'test-bindings',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'binding',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const env = {};'}));}}]});
  try{
    const {PromedicalSite}=await import(output.href);
    const original=pkg.pages.find(p=>hasPromedicalCategoryContent(pkg.siteId,p));
    const target=pkg.pages.find(p=>p.slug==='produktai');
    const page={...original,body:[{type:'paragraph',text:'Patikros pradžia.'},{type:'heading',level:2,text:'Pasirinkimo kriterijai'},{type:'paragraph',text:'Atverkite produktų katalogą.'},{type:'list',items:['Pirmasis kriterijus.','Antrasis kriterijus.']},{type:'heading',level:2,text:'Patikros pabaiga'}],links:[{targetPageId:target.id,label:'produktų katalogą',reason:'Patikros nuoroda'}],externalLinks:[{url:'https://example.org/manufacturer',label:'Gamintojo dokumentas',reason:'Techniniai duomenys.'}]};
    const pages=pkg.pages.map(p=>p.id===page.id?page:p),before=JSON.stringify(pages);
    const render=(p=page,query={},site=pkg.siteId)=>renderToStaticMarkup(React.createElement(PromedicalSite,{pkg:{...pkg,siteId:site},page:p,livePages:pages,query}));
    const html=render();
    assert.equal((html.match(/data-category-content/g)||[]).length,1);
    assert.ok(html.indexOf('Produktų paieškos rezultatai')<html.indexOf('data-category-content'));
    const content=html.slice(html.indexOf('data-category-content'));
    let position=-1;
    for(const value of ['Patikros pradžia.','<h2 id="skyrius-1">Pasirinkimo kriterijai</h2>','Atverkite','Pirmasis kriterijus.','Antrasis kriterijus.','<h2 id="skyrius-4">Patikros pabaiga</h2>','Šaltiniai ir dokumentai','https://example.org/manufacturer','Techniniai duomenys.']){const next=content.indexOf(value);assert.ok(next>position,value);position=next;}
    assert.match(content,/<a href="\/produktai">produktų katalogą<\/a>/);
    const searched=render(page,{q:'no-such-test-product'});
    assert.match(searched,/Pagal šią paiešką produktų neradome/);
    assert.match(searched,/data-category-content/);
    for(const id of protectedIds)assert.doesNotMatch(render({...page,id}),/data-category-content|Patikros pradžia\.|example.org\/manufacturer/);
    assert.doesNotMatch(render({...page,id:randomUUID()}),/data-category-content/);
    assert.doesNotMatch(render(page,{},'other'),/data-category-content/);
    const catalog=render({...page,slug:'produktai'});
    assert.match(catalog,/Patikros pradžia\./);
    assert.doesNotMatch(catalog,/data-category-content|example.org\/manufacturer/,'existing catalogue body remains unchanged');
    assert.equal(JSON.stringify(pages),before,'rendering must not mutate accepted data');
  }finally{await fs.unlink(output);}
});
