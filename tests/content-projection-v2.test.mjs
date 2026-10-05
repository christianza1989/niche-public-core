import test from 'node:test';
import assert from 'node:assert/strict';
import {projectContentPagesV2,commerceDestination,visibleContentTextV2,projectedSnapshotV2} from '../lib/content-projection-v2.mjs';
const now=Date.parse('2026-10-04T00:00:00Z');
const page=(id,publishAt='2026-10-01T00:00:00Z')=>({id,slug:id,siteId:'gift',type:'article',title:id,publishAt,revisionHash:'a'.repeat(64),approval:{status:'approved',revisionHash:'a'.repeat(64)},body:[],media:[],links:[],externalLinks:[],editorial:{authors:[],sources:[],commerceTargets:[],relatedPageIds:[],productRecommendation:false}});
const pkg={siteId:'gift',canonicalHost:'gift.example',pages:[page('visible'),page('future','2026-10-05T00:00:00Z')]};
const inline=t=>({type:'link',text:'tas pats',target:t});
test('future/missing/revoked inline destinations keep exact labels and only live pages/media project',()=>{
  const p=structuredClone(pkg);p.pages[0].body=[{type:'richParagraph',content:[inline({kind:'page',pageId:'future'}),{type:'text',text:' tarp '},inline({kind:'page',pageId:'visible'}),inline({kind:'page',pageId:'missing'})]}];p.pages[1].media=[{id:'future-secret'}];p.pages[0].editorial.relatedPageIds=['visible','future'];
  const raw=JSON.stringify(p),before=projectContentPagesV2(p,[p],{}, {},now);
  assert.equal(before.length,1);assert.equal(before[0].body[0].content[0].type,'text');assert.equal(before[0].body[0].content[2].href,'https://gift.example/visible');assert.equal(before[0].body[0].content[3].type,'text');assert.deepEqual(before[0].editorial.relatedPageIds,['visible']);assert.equal(JSON.stringify(p),raw);assert.doesNotMatch(JSON.stringify(before),/future-secret/);
  const at=projectContentPagesV2(p,[p],{}, {},Date.parse(p.pages[1].publishAt));assert.equal(at.length,2);assert.equal(at[0].body[0].content[0].href,'https://gift.example/future');
  p.pages[1].approval.status='revoked';assert.equal(projectContentPagesV2(p,[p],{}, {},Date.parse(p.pages[1].publishAt))[0].body[0].content[0].type,'text');
});
test('network deployment, owned aliases and private sources cannot bypass target readiness',()=>{
  const p=structuredClone(pkg),other={siteId:'other',canonicalHost:'other.example',pages:[page('target')]};other.pages[0].siteId='other';
  p.pages[0].body=[{type:'richList',ordered:true,items:[[inline({kind:'network',siteId:'other',pageId:'target'})],[inline({kind:'external',url:'https://www.other.example/target'})]]}];p.pages[0].editorial.sources=[{id:'private',public:false,url:'https://primary.example/'},{id:'public',public:true,url:'https://primary.example/'}];
  const settings={networkDomains:['gift.example','other.example'],ownedAliases:['www.other.example'],networkLiveDomains:[]};
  const before=projectContentPagesV2(p,[p,other],settings,{},now);assert.equal(before[0].body[0].items[0][0].type,'text');assert.equal(before[0].body[0].items[1][0].type,'text');assert.deepEqual(before[0].editorial.sources.map(s=>s.id),['public']);
  settings.networkLiveDomains=['other.example'];assert.equal(projectContentPagesV2(p,[p,other],settings,{},now)[0].body[0].items[0][0].href,'https://other.example/target');
});
test('commerce is verified separately: canonical destination, approved attribution, expiry and text projection',()=>{
  const snapshot={id:'info',url:'https://store.example/?utm_source=gift',label:'Apie rinkinį',relationship:'Informacija, ne checkout',verified:true,checkedAt:'2026-10-01T00:00:00Z'};
  const registry={targets:[{id:'info',status:'ready',canonicalUrl:'https://store.example/',allowedQueryParams:['utm_source'],verifiedAt:'2026-10-01T00:00:00Z',expiresAt:'2026-10-08T00:00:00Z'}]};
  assert.equal(commerceDestination(snapshot,registry,now),snapshot.url);
  for(const url of ['https://store.example/other','https://store.example/?redirect=https://evil.example','https://store.example/?utm_source=a&utm_source=b','https://user@store.example/','https://store.example/#buy'])assert.equal(commerceDestination({...snapshot,url},registry,now),null);
  assert.equal(commerceDestination(snapshot,registry,Date.parse('2026-10-08T00:00:00Z')),null);assert.equal(commerceDestination({...snapshot,verified:false},registry,now),null);
  const p=structuredClone(pkg);p.pages[0].editorial.commerceTargets=[snapshot];p.pages[0].editorial.productRecommendation=true;p.pages[0].body=[{type:'richParagraph',content:[inline({kind:'commerce',targetId:'info'})]}];
  const projected=projectContentPagesV2(p,[p],{networkDomains:['store.example']},registry,now)[0];assert.equal(projected.body[0].content[0].href,snapshot.url);assert.match(visibleContentTextV2(projected),/Informacija, ne checkout/);assert.doesNotMatch(visibleContentTextV2(projected),/\[object Object\]/);assert.equal(projectedSnapshotV2(projected).url,'https://gift.example/visible');
});
