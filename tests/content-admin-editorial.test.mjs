import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {testD1} from './helpers/content-admin-d1.mjs';
import {revisionHash} from '../vendor/content-studio/authoring.mjs';
import {pageRecord,saveDraft,publishDraft,readPublishedEdits} from '../lib/content-admin-store.mjs';
import {saveEditorialRule,editorialRules,editorialIssues,deactivateEditorialRule} from '../lib/content-admin-editorial.mjs';
import {queueRewrite,editorialMatches,queueEditorialMatches,importRewrite,getRewrite} from '../lib/content-admin-rewrites.mjs';
import {selectionChanges} from '../lib/content-rewrite-contract.mjs';
const review={answerSha256:'a'.repeat(64),codexSha256:'b'.repeat(64),claudeSha256:'c'.repeat(64),codexReviewer:'Codex',claudeReviewer:'Claude',checks:{facts:true,core:true,links:true,language:true}};
function fixture(){
 const pages=['one','two','three'].map(id=>{const p={id,siteId:'promedical',type:'product',slug:'produktai/'+id,title:'Spinta '+id,description:'Priemonėms laikyti.',body:[{type:'heading',level:2,text:'Kreipiančiųjų bėgelių tipai'},{type:'paragraph',text:'Krepšiai įstatomi į kreipiančiąsias.'},{type:'paragraph',text:'Šio teksto keisti negalima.'},{type:'list',items:['Nekeisti 1','Nekeisti 2']}],media:[],links:[],publishAt:'2026-01-01T10:00:00.000Z'};p.revisionHash=revisionHash(p);p.approval={status:'approved',revisionHash:p.revisionHash,actorId:'fixture'};return p});
 return {siteId:'promedical',canonicalHost:'example.test',site:{timezone:'Europe/Vilnius'},pages};
}
const ruleInput=()=>({id:randomUUID(),term:'kreipianč',instruction:'Šio projekto tekstuose vartoti įprastą terminą „bėgeliai“, pritaikant sakinį.'});

test('site feedback finds latest drafts, snapshots rules, queues only chosen pages and imports bounded, reviewed fragments',async()=>{
 const db=testD1(),pkg=fixture();try{
  await db.prepare('INSERT INTO content_admin_settings(site_id,context_json,paused_at,updated_at) VALUES(?,?,?,?)').bind(pkg.siteId,'{}',null,1).run();
  const rule=await saveEditorialRule(db,pkg.siteId,ruleInput(),'owner');
  assert.deepEqual(await editorialRules(db,'foreign'),[]);
  const matches=await editorialMatches(db,pkg,rule.id);assert.equal(matches.items.length,3);assert.equal(matches.items[0].selection.ranges.length,2);
  const input={id:randomUUID(),pages:matches.items.slice(0,2).map(p=>({pageId:p.pageId,etag:p.etag}))};
  const queued=await queueEditorialMatches(db,pkg,rule.id,input,'owner');assert(queued.results.every(r=>r.job));assert.equal((await queueEditorialMatches(db,pkg,rule.id,input,'owner')).results[0].job.id,queued.results[0].job.id);
  assert.equal((await db.prepare('SELECT count(*) n FROM content_admin_rewrites').first()).n,2);
  const job=queued.results[0].job;assert.deepEqual(job.rules,[rule]);
  await assert.rejects(importRewrite(db,pkg,job.id,{etag:job.etag,replacement:['Kreipiančiųjų bėgeliai','Krepšiai įstatomi į bėgelius.'],review},'bridge'),e=>e.status===409);
  assert.equal((await db.prepare('SELECT count(*) n FROM content_admin_history').first()).n,0);
  await importRewrite(db,pkg,job.id,{etag:job.etag,replacement:['Bėgelių tipai','Krepšiai įstatomi į bėgelius.'],review},'bridge');
  const after=(await pageRecord(db,pkg,'one')).draft;
  assert.deepEqual(after.body.map(b=>b.type),pkg.pages[0].body.map(b=>b.type));assert.deepEqual(after.body.slice(2),pkg.pages[0].body.slice(2));assert.equal(after.title,pkg.pages[0].title);assert.deepEqual((await readPublishedEdits(db,pkg)).pkg,pkg);
  assert.equal((await editorialMatches(db,pkg,rule.id)).items.some(p=>p.pageId==='one'),false);
  assert.equal((await pageRecord(db,pkg,'three')).row,null);
 }finally{db.close()}
});
test('latest rules block import and owner publication; removing a rule leaves historical job rules intact',async()=>{
 const db=testD1(),pkg=fixture();try{
  await db.prepare('INSERT INTO content_admin_settings(site_id,context_json,paused_at,updated_at) VALUES(?,?,?,?)').bind(pkg.siteId,'{}',null,1).run();
  const before=await pageRecord(db,pkg,'one'),job=await queueRewrite(db,pkg,'one',{id:randomUUID(),etag:before.etag,mode:'whole',note:''},'owner');assert.deepEqual(job.rules,[]);
  const rule=await saveEditorialRule(db,pkg.siteId,ruleInput(),'owner');
  await assert.rejects(importRewrite(db,pkg,job.id,{etag:job.etag,changes:{title:'Naujas',description:before.draft.description,body:before.draft.body},review},'bridge'),e=>e.status===409);
  await assert.rejects(publishDraft(db,pkg,'one',{},before.etag,'owner',()=>{throw Error('must not reach media')},()=>{}),e=>e.status===409);
  const newer=await queueRewrite(db,pkg,'one',{id:randomUUID(),etag:before.etag,mode:'whole',note:''},'owner');
  await deactivateEditorialRule(db,pkg.siteId,rule.id);assert.deepEqual(await editorialRules(db,pkg.siteId),[]);assert.equal((await getRewrite(db,pkg,newer.id)).rules[0].term,'kreipianč');
  assert.deepEqual((await readPublishedEdits(db,pkg)).pkg,pkg);
 }finally{db.close()}
});
test('cross-page requests reject stale pages, preserve existing queued work and atomically avoid a concurrent supersession',async()=>{
 const db=testD1(),pkg=fixture();try{
  const rule=await saveEditorialRule(db,pkg.siteId,ruleInput(),'owner'),matches=await editorialMatches(db,pkg,rule.id);
  await saveDraft(db,pkg,'one',{title:'Owner changed'},matches.items[0].etag,'owner');
  const queued=await queueEditorialMatches(db,pkg,rule.id,{id:randomUUID(),pages:[{pageId:'one',etag:matches.items[0].etag}]},'owner');assert(queued.results[0].error);
  const batch=db.batch;let concurrent;
  db.batch=async sql=>{if(!concurrent){concurrent=true;concurrent=await queueRewrite(db,pkg,'two',{id:randomUUID(),etag:matches.items[1].etag,mode:'whole',note:'Other owner work'},'owner');}return batch(sql)};
  const raced=await queueEditorialMatches(db,pkg,rule.id,{id:randomUUID(),pages:[{pageId:'two',etag:matches.items[1].etag}]},'owner');assert(raced.results[0].error);assert.equal((await getRewrite(db,pkg,concurrent.id)).state,'queued');
 }finally{db.close()}
});
test('multiple exact ranges preserve Unicode offsets and untouched text; overlapping, forged or incomplete replacements fail',()=>{
 const p=fixture().pages[0];p.body[0].text='🙂 Antraštė ir pabaiga';
 const a={from:'body.0.text',to:'body.0.text',start:3,end:11,quote:'Antraštė'},b={from:'body.3.items.1',to:'body.3.items.1',start:9,end:10,quote:'2'};
 const changed=selectionChanges(p,{ranges:[a,b]},['Tema','3']);assert.equal(changed.body[0].text,'🙂 Tema ir pabaiga');assert.equal(changed.body[0].level,2);assert.deepEqual(changed.body[3].items,['Nekeisti 1','Nekeisti 3']);
 assert.throws(()=>selectionChanges(p,{ranges:[a,a]},['x','y']));assert.throws(()=>selectionChanges(p,{ranges:[a,b]},['x']));assert.throws(()=>selectionChanges(p,{ranges:[{...a,quote:'forged'}]},['x']));
 assert.equal(editorialIssues(p,[{term:'KREIPIANČ',instruction:'fixture'}]).length,1);
});
