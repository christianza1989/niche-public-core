import test from 'node:test';
import assert from 'node:assert/strict';
import {projectPublicPages} from '../lib/niche-links.mjs';
const page=(id,type,date)=>({id,type,slug:id,publishAt:date,revisionHash:id,approval:{status:'approved',revisionHash:id},links:[],externalLinks:[]});
const before='2026-10-12T10:00:00.000Z',after='2026-10-14T10:00:00.000Z';
const pkg={schemaVersion:1,siteId:'fixture',canonicalHost:'fixture.example',pages:[page('home','home',before),page('early','guide',before),page('held','guide',after),page('product','product',after)]};
const now=Date.parse('2026-11-01T10:00:00Z');
test('guide pause preserves public earlier guide, holds later guides, and leaves other page types on the request clock',()=>{
 const settings={guidePublicationPausedAtBySite:{fixture:'2026-10-13T19:26:54.000Z'}};
 const input=structuredClone(pkg);input.pages[0].links=[{targetPageId:'held',label:'held'}];input.pages[0].externalLinks=[{url:'https://fixture.example/held',label:'held'}];
 const result=projectPublicPages(input,[input],settings,now);
 assert.deepEqual(result.map(p=>p.id),['home','early','product']);assert.deepEqual(result[0].links,[]);assert.deepEqual(result[0].externalLinks,[]);
 assert.equal(input.pages[0].links.length,1,'projection leaves approved bytes untouched');
 assert.deepEqual(projectPublicPages(pkg,[pkg],{},now).map(p=>p.id),['home','early','held','product']);
});
test('invalid pause timestamps and unknown sites fail closed instead of silently unpausing content',()=>{
 for(const pauses of [{fixture:'invalid'},{missing:'2026-10-13T19:26:54.000Z'},[],null])assert.throws(()=>projectPublicPages(pkg,[pkg],{guidePublicationPausedAtBySite:pauses},now));
});
