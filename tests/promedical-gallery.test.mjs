import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { publicGalleryImageUrls, galleryImageSitemapTags, promedicalProductSchema } from '../lib/niche-gallery.mjs';
import { projectPublicPages } from '../lib/niche-links.mjs';

const pkg = {siteId:'promedical',canonicalHost:'promedical.lt'};
const media = [
  {id:'a-small',familyId:'a',src:'/content-assets/promedical/a-360.webp',alt:'Tas pats aprašas',width:360,height:480},
  {id:'b-small',familyId:'b',src:'/content-assets/promedical/b-360.webp',alt:'Tas pats aprašas',width:360,height:480},
  {id:'a-big',familyId:'a',src:'/content-assets/promedical/a-1200.webp',alt:'Tas pats aprašas',width:1200,height:1600},
  {id:'b-big',familyId:'b',src:'/content-assets/promedical/b-1200.webp',alt:'Tas pats aprašas',width:1200,height:1600},
  {id:'c',familyId:'c',src:'/content-assets/promedical/c-640.webp',alt:'Modelio brėžinys',width:640,height:400},
];
const page = {siteId:'promedical',id:'product',type:'product',slug:'produktai/modelis',title:'Modelis',description:'Aprašas',media,links:[],publishAt:'2026-10-01T00:00:00.000Z',revisionHash:'r',approval:{status:'approved',revisionHash:'r',approvedAt:'2026-10-01T00:00:00.000Z'}};

// Compile the actual client component, retaining React's real SSR behavior.
// Only its CSS import is stubbed; no server-only Cloudflare environment needed.
const source = await readFile(new URL('../components/niche/promedical-gallery.tsx',import.meta.url),'utf8');
let compiled = ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
compiled = compiled.replaceAll('"@/lib/niche-media.mjs"',JSON.stringify(new URL('../lib/niche-media.mjs',import.meta.url).href))
  .replace(/import s from "\.\/promedical-gallery\.module\.css";/,'const s = new Proxy({}, {get: (_,name) => name});')
  .replaceAll('"react/jsx-runtime"',JSON.stringify(import.meta.resolve('react/jsx-runtime')))
  .replaceAll('"react"',JSON.stringify(import.meta.resolve('react')));
const { PromedicalGallery } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('SSR discovers every family through real image/link, not all responsive sizes or a JS-only details gate',()=>{
  const html = renderToStaticMarkup(React.createElement(PromedicalGallery,{media,title:page.title}));
  assert.equal((html.match(/class="thumbnail"/g)||[]).length,3);
  assert.ok(html.includes('Nuotrauka 1 iš 3'));
  for(const name of ['a-1200','b-1200','c-640']) assert.ok(html.includes(`href="/content-assets/promedical/${name}.webp"`));
  assert.ok(html.includes('a-360.webp 360w, /content-assets/promedical/a-1200.webp 1200w'));
  assert.ok(!html.includes('a-360.webp 360w, /content-assets/promedical/b'));
  assert.equal((html.match(/<img[^>]+fetchPriority="high"/g)||[]).length,1);
  assert.equal((html.match(/loading="lazy"/g)||[]).length,3);
  assert.ok(html.includes('sizes="80px"'));
  assert.ok(!html.includes('<details'));
  // Closed enlargement starts empty, avoiding a second full-resolution request.
  assert.match(html,/<dialog[^>]*><\/dialog>/);
});

test('one image has primary enlargement and count; no empty thumbnail rail or empty-image crash',()=>{
  const html=renderToStaticMarkup(React.createElement(PromedicalGallery,{media:[media[4]],title:page.title}));
  assert.ok(html.includes('Nuotrauka 1 iš 1'));
  assert.ok(!html.includes('<ol'));
  assert.equal(renderToStaticMarkup(React.createElement(PromedicalGallery,{media:[],title:page.title})), '');
});

test('Product.image and sitemap enumerate exactly the same public gallery representatives',()=>{
  const urls=publicGalleryImageUrls(pkg,page);
  assert.equal(urls.length,3);
  assert.deepEqual(promedicalProductSchema(pkg,page,'MODEL').image,urls);
  assert.equal((galleryImageSitemapTags(pkg,page).match(/<image:loc>/g)||[]).length,3);
  for(const url of urls) assert.ok(galleryImageSitemapTags(pkg,page).includes(`<image:loc>${url}</image:loc>`));
  const schema=promedicalProductSchema(pkg,page,'MODEL');
  assert.equal(schema.sku,'MODEL');
  for(const field of ['offers','aggregateRating','review']) assert.ok(!(field in schema));
});

test('public indexes exclude another site and private or noncanonical image sources',()=>{
  assert.deepEqual(publicGalleryImageUrls(pkg,{...page,siteId:'other'}),[]);
  for(const src of ['/content-assets/other/a.webp','https://klaro.cz/original.jpg','/originals/a.webp','/content-assets/promedical/../private.webp','//bad.test/a.webp','/content-assets/promedical/a.webp?secret=1']) {
    assert.deepEqual(publicGalleryImageUrls(pkg,{...page,media:[{...media[0],src}]}),[]);
  }
});

test('sitemap callers project approval/date/pause before indexing gallery media',()=>{
  const future={...page,id:'future',publishAt:'2030-01-01T00:00:00.000Z'};
  const unapproved={...page,id:'draft',approval:{...page.approval,status:'draft'}};
  const guide={...page,id:'guide',type:'guide',publishAt:'2026-10-20T00:00:00.000Z'};
  const packageWithPages={...pkg,schemaVersion:1,pages:[page,future,unapproved,guide]};
  const eligible=projectPublicPages(packageWithPages,[packageWithPages],{guidePublicationPausedAtBySite:{promedical:'2026-10-13T00:00:00.000Z'}},Date.parse('2026-10-21T00:00:00.000Z'));
  assert.deepEqual(eligible.map(item=>item.id),['product']);
  assert.equal(eligible.flatMap(item=>publicGalleryImageUrls(pkg,item)).length,3);
});
