import test from 'node:test';
import assert from 'node:assert/strict';
import pkg from '../content-staging/signaturepads/content-package.json' with {type:'json'};
import layout from '../sites/signaturepads/migration/core-layout.json' with {type:'json'};
import { projectContentPagesV2 } from '../lib/content-projection-v2.mjs';
import { signaturepadsSnapshot } from '../lib/signaturepads-content.mjs';
import { renderSignaturepads } from '../components/niche/signaturepads/render.mjs';
import aliases from '../config/content-media-aliases.json' with {type:'json'};
import { visibleMediaAlias } from '../lib/content-media-aliases.mjs';

const now=Math.max(...pkg.pages.map(p=>Date.parse(p.publishAt)))+1000;
const project=value=>projectContentPagesV2(value,[value],{},undefined,now);
const dataFor=value=>signaturepadsSnapshot(value,project(value),layout);
const render=(data,path,query='')=>renderSignaturepads(data,data.routes.find(r=>r.path===path),new URLSearchParams(query));
const cardPaths=html=>[...html.matchAll(/<h[23]><a href="([^"]+)">/g)].map(m=>m[1]);

test('catalogue cards descend from page H1 to H2 while related products remain under their H2 section',()=>{
 const data=dataFor(pkg),catalog=render(data,'/iranga/programine-iranga/');assert.match(catalog,/<h2><a href="\/produktas\//);assert.doesNotMatch(catalog,/<h3><a href="\/produktas\//);
 const product=data.routes.find(r=>r.kind==='product');assert.match(render(data,product.path),/<h3><a href="\/produktas\//);
});

test('original homepage responsive image URLs resolve only while their native home revision is public',()=>{
  // Original img/srcset paths omitted by the initial single-size inventory.
  const paths=[
    '2026/01/ant-delno2-1-300x248.png','2026/01/ant-delno2-1-1024x846.png',
    '2026/01/ant-delno2-1-600x496.png','2026/01/ant-delno2-1.png',
    '2023/10/Paraso-plansetes-menu-300x200.jpg','2023/10/monitoriaus-ispletimas-300x200.jpg',
    '2023/10/mobilus-sprendimai-300x200.jpg','2023/10/programine-iranga-300x200.jpg',
    '2023/11/signoSign_2_SoftwareBox-300x242.jpg','2023/11/signoSign_2_SoftwareBox-600x484.jpg',
    '2023/11/signoSign_2_SoftwareBox.jpg',
  ].map(p=>'/wp-content/uploads/'+p);
  const pages=project(pkg),changed=structuredClone(pkg);changed.pages.find(p=>p.id==='sp-home').approval.status='revoked';
  const publicHome=pages.find(p=>p.id==='sp-home');
  for(const pathname of paths){
    const target=visibleMediaAlias(pkg,pages,aliases,pathname);
    assert.ok(publicHome.media.some(m=>m.src===target),pathname+' uses admitted home media');
    assert.equal(visibleMediaAlias(changed,project(changed),aliases,pathname),null);
    assert.equal(visibleMediaAlias({...pkg,siteId:'foreign'},pages,aliases,pathname),null);
  }
});

test('equipment remains a navigable parent link beside each native submenu disclosure',()=>{
  const html=render(dataFor(pkg),'/');
  assert.equal((html.match(/<div class="sp-nav-group"><a href="\/iranga\/paraso-plansetes\/"/g)||[]).length,2);
  assert.equal((html.match(/<details class="sp-dropdown"><summary aria-label="ĮRANGA">/g)||[]).length,2);
  assert.ok(html.includes('class="sp-category-grid" data-sp-reveal'));
  const withdrawn=structuredClone(pkg);withdrawn.pages.find(p=>p.slug==='iranga/paraso-plansetes').approval.status='revoked';
  assert.doesNotMatch(render(dataFor(withdrawn),'/'),/href="\/iranga\/paraso-plansetes\/"/);
});

test('legacy newest and original popularity/rating links keep their published product sequences',()=>{
  const data=dataFor(pkg);
  assert.match(cardPaths(render(data,'/iranga/programine-iranga/','orderby=date'))[0],/stepover-esignatureoffice/);
  assert.match(cardPaths(render(data,'/prekes/','orderby=popularity'))[0],/signotec-sigma-lite/);
  assert.equal(cardPaths(render(data,'/prekes/','orderby=date&products-per-page=all')).length,19);
  for(const key of ['products-per-page','product_count']){
    assert.equal(cardPaths(render(data,'/prekes/',key+'=all')).length,19);
    assert.equal(cardPaths(render(data,'/prekes/',key+'=12&paged=2')).length,7);
  }
  const html=render(data,'/iranga/programine-iranga/','orderby=date&products-per-page=all&min_price=90&max_price=100');
  assert.equal(cardPaths(html).length,3);
  assert.match(html,/name="products-per-page" value="all"/);
  assert.match(html,/<option value="date" selected>/);
});

test('legacy ranks cannot reintroduce a withdrawn product or its unpublished prose',()=>{
  const changed=structuredClone(pkg),withdrawn=changed.pages.find(p=>p.id==='sp-product-7084');
  withdrawn.approval.status='revoked';withdrawn.body.push({type:'paragraph',text:'UNREVIEWED-PARITY-PROBE'});
  const data=dataFor(changed),html=render(data,'/iranga/programine-iranga/','orderby=date&products-per-page=all');
  assert.equal(cardPaths(html).some(p=>p.includes('stepover-esignatureoffice')),false);
  assert.doesNotMatch(html,/UNREVIEWED-PARITY-PROBE/);
});

test('Sigma native revision removes only the repeated delivery paragraph and keeps the price binding',()=>{
  const data=dataFor(pkg),sigma=data.products.find(p=>p.id===488);
  assert.equal((sigma.contentHtml.match(/Pristatymas 5-8 d\.d\./g)||[]).length,1);
  assert.equal(sigma.prices.price,'18900');
  assert.equal(sigma.images.length,3);
  assert.equal(sigma.images[0].displayWidth,300);
  assert.equal(sigma.images[1].displayWidth,550);
});

test('software background is bound to reviewed home media without a source-image fallback',()=>{
  const data=dataFor(pkg),home=pkg.pages.find(p=>p.id==='sp-home');
  const primary=home.media.filter(m=>m.familyId===layout.home.softwareBackground).sort((a,b)=>b.width-a.width)[0];
  assert.ok(primary,'Reviewed original software photograph is assigned');
  assert.equal(data.home.softwareBackground,primary.src);
  assert.ok(render(data,'/').includes(`--sp-software-image:url('${primary.src}')`));
  const unbound=structuredClone(layout);delete unbound.home.softwareBackground;
  assert.doesNotMatch(render(signaturepadsSnapshot(pkg,project(pkg),unbound),'/'),/--sp-software-image/);
  const withdrawn=structuredClone(pkg);withdrawn.pages.find(p=>p.id==='sp-home').approval.status='revoked';
  assert.equal(dataFor(withdrawn),null);
});

test('catalogue layouts retain usable page links and two independently named modal surfaces',()=>{
  const data=dataFor(pkg),html=render(data,'/prekes/');
  assert.doesNotMatch(html,/class="sp-sidebar"/);
  assert.match(html,/<h1 class="sp-sr">Prekės<\/h1>/);
  assert.equal((html.match(/<dialog\b/g)||[]).length,2);
  assert.equal((html.match(/aria-label="Greita peržiūra"/g)||[]).length,2);
  assert.match(html,/href="\/produktas\/[^"]+" data-quick/);
  const product=render(data,'/produktas/programine-iranga-signotec-adobe-acrobat-reader-plug-in/');
  assert.doesNotMatch(product,/class="sp-thumbnails"/);
  assert.match(product,/href="\/#kontaktai"/);
});
