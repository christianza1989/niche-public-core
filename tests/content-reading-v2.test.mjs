import test from 'node:test';
import assert from 'node:assert/strict';
import {projectContentPagesV2} from '../lib/content-projection-v2.mjs';
import {contentSeoV2} from '../lib/content-seo-v2.mjs';
const article=(id,publishAt)=>({id,slug:id,siteId:'sample',type:'article',title:id,description:'Actual useful content',publishAt,revisionHash:'a'.repeat(64),approval:{status:'approved',revisionHash:'a'.repeat(64)},
  body:[{type:'paragraph',text:'Current body '+id}],media:[],links:[],externalLinks:[],editorial:{authors:[],sources:[],commerceTargets:[],relatedPageIds:[],productRecommendation:false,datePublished:publishAt,dateModified:null}});
const pkg=()=>({siteId:'sample',canonicalHost:'sample.example',site:{name:'Actual site',offer:'Useful selection help',contact:{email:'editor@example.org'}},pages:[article('current','2026-10-01T07:00:00Z'),article('future','2026-10-13T07:00:00Z')]});
const exportsAt=(p,time)=>{
  const pages=projectContentPagesV2(p,[p],{}, {},Date.parse(time));
  return {pages,index:contentSeoV2(p,pages,'llms').body,full:contentSeoV2(p,pages,'llms-full').body,sitemap:contentSeoV2(p,pages,'sitemap').body};
};
test('scheduled appearance and revocation update all exports without rewriting a file or package',()=>{
  const p=pkg();p.pages[0].links=[{targetPageId:'future',label:'Another useful answer'}];const raw=JSON.stringify(p);
  const before=exportsAt(p,'2026-10-13T06:59:59.999Z');
  for(const value of [before.index,before.full,before.sitemap])assert.doesNotMatch(value,/https:\/\/sample.example\/future/);
  const at=exportsAt(p,'2026-10-13T07:00:00Z');
  for(const value of [at.index,at.full,at.sitemap])assert.match(value,/https:\/\/sample.example\/future/);
  assert.match(at.full,/Susijęs atsakymas: \[Another useful answer\]/);assert.equal(JSON.stringify(p),raw);
  p.pages[1].approval.status='revoked';const revoked=exportsAt(p,'2026-10-13T07:00:01Z');
  for(const value of [revoked.index,revoked.full,revoked.sitemap])assert.doesNotMatch(value,/https:\/\/sample.example\/future/);
});
test('only approved date semantics, profile and projected sources are exported',()=>{
  const p=pkg(),a={id:'real-editor',name:'Actual editorial team',role:'Editorial review',bio:'Actual responsibility',kind:'organization',sameAs:[]};
  p.pages[0].editorial.authors=[a];p.pages[0].editorial.dateModified='2026-10-05T07:00:00Z';
  p.pages.push({...article('team','2026-10-01T07:00:00Z'),type:'author',editorial:{...article('x','2026-10-01T07:00:00Z').editorial,authors:[a]}});
  p.pages[0].externalLinks=[{url:'https://primary.example/source',label:'Primary document',reason:'Explains the actual method'}];
  p.pages[0].editorial.sources=[{id:'private',url:'https://private.example/source',title:'Private note',public:false},{id:'public',url:'https://primary.example/source',title:'Primary document',public:true}];
  const x=exportsAt(p,'2026-10-07T00:00:00Z');
  assert.match(x.full,/Publikavimo data: 2026-10-01T07:00:00Z/);assert.match(x.full,/Turinio atnaujinimo data: 2026-10-05T07:00:00Z/);
  assert.match(x.full,/Autoriaus profilis: \[Actual editorial team\]\(https:\/\/sample.example\/team\)/);
  assert.match(x.full,/Explains the actual method/);assert.doesNotMatch(x.full,/private.example/);
  p.pages[0].editorial.datePublished=null;p.pages[0].editorial.dateModified=null;
  const projected=projectContentPagesV2(p,[p],{}, {},Date.parse('2026-10-07T00:00:00Z')).filter(p=>p.type==='article');
  assert.doesNotMatch(contentSeoV2(p,projected,'llms-full').body,/Publikavimo data:|Turinio atnaujinimo data:/);
});
test('canonical identity, concise index and updated content stay site scoped',()=>{
  for(const host of ['beauty.example','equipment.example']){
    const p=pkg();p.canonicalHost=host;
    const x=exportsAt(p,'2026-10-07T00:00:00Z');assert.match(x.index,/^# Actual site\n\n> Useful selection help/);
    assert.ok(x.index.includes(`https://${host}/llms-full.txt`));assert.ok(!x.index.includes('Current body'));
    assert.ok(x.full.includes(`URL: https://${host}/current`));assert.ok(!x.full.includes('sample.example'));
    p.pages[0].body[0].text='Meaningfully revised body';
    const updated=exportsAt(p,'2026-10-07T00:00:00Z');assert.match(updated.full,/Meaningfully revised body/);assert.doesNotMatch(updated.full,/Current body current/);
  }
});
