import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {validateNichePathAliases,indexNichePathAliases,nichePathAliasDestination,legacyProductPaths} from '../lib/niche-path-aliases.mjs';
import {projectPublicPages} from '../lib/niche-links.mjs';
import {migrateInquiryItems} from '../lib/promedical-inquiry-paths.mjs';
const config=JSON.parse(await fs.readFile(new URL('../config/niche-path-aliases.json',import.meta.url)));
const pkg=JSON.parse(await fs.readFile(new URL('../content-packages/promedical/content-package.json',import.meta.url)));
const index=indexNichePathAliases(config),aliases=config.sites.promedical.redirects;
const all=()=>projectPublicPages(pkg,[pkg],{},Date.parse('2027-01-01T00:00:00Z'));
test('all1846 catalogue and retired duplicate paths point directly to their approved Lithuanian target and remain outside canonical inventory',()=>{
 validateNichePathAliases(config,[pkg]);assert.equal(aliases.length,1846);
 assert.equal(pkg.pages.filter(p=>p.type==='product').length,1407);
 assert.equal(pkg.pages.filter(p=>p.slug.startsWith('kategorijos/')).length,436);
 assert.equal(pkg.pages.length,1908);
 const destinations=new Set();
 for(const a of aliases){assert.equal(nichePathAliasDestination(pkg,index,all,a.from),a.to);assert.equal(nichePathAliasDestination(pkg,index,all,a.from+'/'),a.to);assert.equal(nichePathAliasDestination(pkg,index,all,a.to),null);destinations.add(a.to);assert.ok(a.to.length<=151);assert.doesNotMatch(a.to,/(?:^|[/-])(?:infuzni|voziky|zakladni|prislusenstvi|skrine|vyprodej|ukazka|zasuvka|modry|prevazovy|siti|pruhy)(?:[/-]|$)/);}
 assert.equal(destinations.size,1843);
});
test('redirects retain query values, translate old category filters and never expose future/revoked/foreign targets',()=>{
 const product=aliases.find(a=>a.from==='/produktai/nerez1002is'),category=aliases.find(a=>a.from==='/kategorijos/infuzni-stojany');
 const dest=nichePathAliasDestination(pkg,index,all,product.from,'?q=infuzij%C5%B3&q=stovas&utm_source=test');
 const query=new URL(dest,'https://promedical.lt');assert.deepEqual(query.searchParams.getAll('q'),['infuzijų','stovas']);assert.equal(query.searchParams.get('utm_source'),'test');assert.equal(query.pathname,product.to);
 const filtered=new URL(nichePathAliasDestination(pkg,index,all,'/produktai','?category=infuzni-stojany&q=NEREZ&p=2'),'https://promedical.lt');
 assert.equal(filtered.searchParams.get('category'),category.to.slice('/kategorijos/'.length));assert.equal(filtered.searchParams.get('q'),'NEREZ');assert.equal(filtered.searchParams.get('p'),'2');
 assert.equal(nichePathAliasDestination(pkg,index,()=>[],product.from),null);
 assert.equal(nichePathAliasDestination({...pkg,siteId:'other'},index,all,product.from),null);
 assert.equal(nichePathAliasDestination({...pkg,canonicalHost:'other.example'},index,all,product.from),null);
 assert.equal(nichePathAliasDestination(pkg,index,all,'/produktai/unknown'),null);
 const future={...pkg,pages:pkg.pages.map(p=>p.id===product.targetPageId?{...p,publishAt:'2027-01-01T00:00:00Z'}:p)};
 const futurePages=()=>projectPublicPages(future,[future],{},Date.parse('2026-10-13T20:00:00Z'));
 assert.equal(nichePathAliasDestination(future,index,futurePages,product.from),null);
 assert.equal(nichePathAliasDestination(future,index,()=>all().map(p=>p.id===product.targetPageId?{...p,slug:'produktai/later-migration'}:p),product.from),null);
});
test('registry validation rejects unsafe paths, canonical collisions, duplicate source, mismatched host and stale page identity',()=>{
 for(const mutate of [c=>c.sites.promedical.redirects[0].to='https://evil.example/',c=>c.sites.promedical.redirects[0].from='/api/private',c=>c.sites.promedical.redirects[0].from=c.sites.promedical.redirects[0].to,c=>c.sites.promedical.redirects.push(c.sites.promedical.redirects[0]),c=>c.sites.promedical.canonicalHost='other.example',c=>c.sites.promedical.redirects[0].targetPageId='unknown']){
  const changed=structuredClone(config);mutate(changed);assert.throws(()=>validateNichePathAliases(changed,[pkg]));
 }
});
test('saved inquiry paths migrate without duplicate items or mixing distinct variants with the same SKU',()=>{
 const paths=legacyProductPaths(pkg,all(),index);assert.equal(Object.keys(paths).length,1409);
 const a=aliases.find(a=>a.from==='/produktai/nerez1002is'),item={sku:'NEREZ1002IS',title:'Infuzijų stovas',path:a.from,quantity:2};
 const inputs=[item,{...item,path:a.to,quantity:3,title:'Current title'},{...item,path:'/produktai/distinct-variant',quantity:1}];
 const original=structuredClone(inputs),out=migrateInquiryItems(inputs,paths);
 assert.deepEqual(inputs,original);assert.equal(out.length,2);assert.equal(out[0].path,a.to);assert.equal(out[0].quantity,5);assert.equal(out[0].title,'Current title');assert.equal(out[1].quantity,1);
 assert.equal(migrateInquiryItems([{...item,quantity:999},{...item,path:a.to,quantity:999}],paths)[0].quantity,999);
 assert.deepEqual(legacyProductPaths(pkg,[],index),{});
 assert.equal(Object.keys(legacyProductPaths(pkg,all(),index,a.targetPageId)).length,1);
});
