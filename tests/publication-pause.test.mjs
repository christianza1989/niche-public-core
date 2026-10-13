import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {projectPublicPages,publicationTime} from '../lib/niche-links.mjs';
const cutoff=Date.parse('2026-10-13T19:26:19.387Z');
const page=(id,at)=>({id,siteId:'a',slug:id,publishAt:new Date(at).toISOString(),revisionHash:id,approval:{status:'approved',revisionHash:id},links:[]});
test('pause retains due content, excludes future pages and their inline targets indefinitely',()=>{
 const current=page('current',cutoff),future=page('future',cutoff+1);current.links=[{targetPageId:'future',label:'Future'}];
 const pkg={siteId:'a',canonicalHost:'a.lt',pages:[current,future]},before=JSON.stringify(pkg),settings={publicationCutoffsBySite:{a:new Date(cutoff).toISOString()}};
 const projected=projectPublicPages(pkg,[pkg],settings,cutoff+10*365*86400000);
 assert.deepEqual(projected.map(p=>p.id),['current']);assert.deepEqual(projected[0].links,[]);assert.equal(JSON.stringify(pkg),before);
 assert.equal(projectPublicPages(pkg,[pkg],{},cutoff+100).length,2);
 assert.equal(projectPublicPages(pkg,[pkg],settings,cutoff-1).length,0);
});
test('a paused destination cannot leak through another site while other sites retain their schedule',()=>{
 const target=page('future',cutoff+1),b={siteId:'b',canonicalHost:'b.lt',pages:[{...page('source',cutoff),siteId:'b',externalLinks:[{url:'https://a.lt/future'}]}]},a={siteId:'a',canonicalHost:'a.lt',pages:[target]};
 const settings={networkDomains:['a.lt','b.lt'],networkLiveDomains:['a.lt'],publicationCutoffsBySite:{a:new Date(cutoff).toISOString()}};
 assert.equal(projectPublicPages(b,[a,b],settings,cutoff+100)[0].externalLinks.length,0);
 assert.equal(projectPublicPages(b,[a,b],{...settings,publicationCutoffsBySite:{}},cutoff+100)[0].externalLinks.length,1);
 assert.equal(publicationTime('b',settings,cutoff+100),cutoff+100);
});
test('a malformed configured cutoff fails closed; approval/hash guards still apply',()=>{
 assert.equal(publicationTime('a',{publicationCutoffsBySite:{a:'invalid'}},cutoff),-Infinity);
 const p=page('current',cutoff-1),pkg={siteId:'a',canonicalHost:'a.lt',pages:[p]};
 assert.equal(projectPublicPages(pkg,[pkg],{publicationCutoffsBySite:{a:'invalid'}},cutoff).length,0);
 p.approval.revisionHash='different';assert.equal(projectPublicPages(pkg,[pkg],{},cutoff).length,0);
});
test('actual StepOver pause preserves 24 pages after the final scheduled date without changing approved bytes',()=>{
 const pkg=JSON.parse(fs.readFileSync(new URL('../content-packages/parasoplansetes/content-package.json',import.meta.url))),settings=JSON.parse(fs.readFileSync(new URL('../config/niche-network.json',import.meta.url))),before=JSON.stringify(pkg);
 const today=projectPublicPages(pkg,[pkg],settings,cutoff),later=projectPublicPages(pkg,[pkg],settings,Date.parse('2035-01-01T00:00:00Z'));
 assert.equal(today.length,24);assert.deepEqual(later.map(p=>p.id),today.map(p=>p.id));assert.equal(JSON.stringify(pkg),before);
 assert.equal(projectPublicPages(pkg,[pkg],{...settings,publicationCutoffsBySite:{}},Date.parse('2035-01-01T00:00:00Z')).length,46);
});
