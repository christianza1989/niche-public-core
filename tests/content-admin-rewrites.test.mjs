import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { testD1 } from './helpers/content-admin-d1.mjs';
import { revisionHash } from '../vendor/content-studio/authoring.mjs';
import { pageRecord,saveDraft,readPublishedEdits,listTexts } from '../lib/content-admin-store.mjs';
import { queueRewrite,getRewrite,importRewrite,listRewrites } from '../lib/content-admin-rewrites.mjs';
import { selectionChanges } from '../lib/content-rewrite-contract.mjs';
import { handleContentAdmin } from '../lib/content-admin-api.mjs';
import { passwordHash } from '../lib/content-admin-auth.mjs';

export function fixture(){
 const page={id:'fixture',siteId:'promedical',type:'product',slug:'produktai/fixture',title:'Spinta',description:'Spinta priemonėms laikyti.',body:[{type:'paragraph',text:'Pirma pastraipa.'},{type:'paragraph',text:'Antra pastraipa.'},{type:'list',items:['Vienas','Du']}],media:[],links:[],publishAt:'2026-01-01T10:00:10.793Z'};
 page.revisionHash=revisionHash(page);page.approval={status:'approved',revisionHash:page.revisionHash,actorId:'fixture'};
 return {siteId:'promedical',canonicalHost:'example.test',site:{name:'Fixture',timezone:'Europe/Vilnius'},pages:[page]};
}
const review={answerSha256:'a'.repeat(64),codexSha256:'b'.repeat(64),claudeSha256:'c'.repeat(64),codexReviewer:'Codex',claudeReviewer:'Claude',checks:{facts:true,core:true,links:true,language:true}};
const changes={title:'Nauja spinta',description:'Patikrintas aprašymas.',body:[{type:'paragraph',text:'Naujas tekstas.'}]};
async function setup(){const db=testD1(),pkg=fixture();await db.prepare('INSERT INTO content_admin_settings(site_id,context_json,paused_at,updated_at) VALUES(?,?,?,?)').bind(pkg.siteId,'{}','2026-01-02T00:00:00Z',1).run();return {db,pkg};}
async function job(db,pkg,overrides={}){const r=await pageRecord(db,pkg,'fixture');return queueRewrite(db,pkg,'fixture',{id:randomUUID(),etag:r.etag,mode:'whole',note:'Trumpiau.',...overrides},'owner@example.test');}

test('queue/export/review/import is durable, idempotent, draft-only and supersession-safe',async()=>{
 const {db,pkg}=await setup();try{
  const j=await job(db,pkg),input={etag:j.etag,changes,review};
  assert.equal((await listRewrites(db,pkg,{})).items[0].id,j.id);
  const duplicate=await queueRewrite(db,pkg,'fixture',{id:j.id,etag:j.etag,mode:'whole',note:'Trumpiau.'},'owner@example.test');assert.equal(duplicate.seq,j.seq);
  await assert.rejects(()=>queueRewrite(db,pkg,'fixture',{id:j.id,etag:j.etag,mode:'whole',note:'Kita.'},'owner'),{status:409});
  await assert.rejects(()=>importRewrite(db,pkg,j.id,{...input,review:{}},'bridge'),{status:400});
  const saved=await importRewrite(db,pkg,j.id,input,'bridge');assert.equal(saved.replayed,false);
  assert.equal((await importRewrite(db,pkg,j.id,input,'bridge')).replayed,true);
  assert.equal((await db.prepare('SELECT count(*) AS n FROM content_admin_history').first()).n,1);
  assert.deepEqual((await readPublishedEdits(db,pkg)).pkg,pkg);
  assert.equal((await pageRecord(db,pkg,'fixture')).draft.title,changes.title);
  assert.equal((await listTexts(db,pkg,new URLSearchParams({scope:'pending'}),pkg.pages)).total,1);
  const old=await job(db,pkg),newer=await job(db,pkg);
  assert.equal((await getRewrite(db,pkg,old.id)).state,'superseded');
  await assert.rejects(()=>importRewrite(db,pkg,old.id,{...input,etag:old.etag},'bridge'),{status:409});
  await saveDraft(db,pkg,'fixture',{title:'Rokas pataisė'},newer.etag,'owner');
  await assert.rejects(()=>importRewrite(db,pkg,newer.id,{...input,etag:newer.etag},'bridge'),{status:409});
  assert.equal((await pageRecord(db,pkg,'fixture')).draft.title,'Rokas pataisė');
  assert.equal((await db.prepare('SELECT version FROM content_admin_settings').first()).version,1);
 }finally{db.close();}
});
test('selection keeps exact outside text, structure/images and rejects obsolete or widened changes',async()=>{
 const {db,pkg}=await setup();try{
  const selection={from:'body.0.text',to:'body.1.text',start:6,end:5,quote:'pastraipa.\n\nAntra'};
  const j=await job(db,pkg,{mode:'selection',selection});
  await assert.rejects(()=>importRewrite(db,pkg,j.id,{etag:j.etag,changes,review},'bridge'),{status:400});
  await importRewrite(db,pkg,j.id,{etag:j.etag,replacement:'nauja dalis',review},'bridge');
  const p=(await pageRecord(db,pkg,'fixture')).draft;
  assert.equal(p.body[0].text,'Pirma nauja dalis pastraipa.');assert.deepEqual(p.body[1],pkg.pages[0].body[2]);
  assert.equal(p.title,pkg.pages[0].title);assert.equal(p.publishAt,pkg.pages[0].publishAt);
  assert.throws(()=>selectionChanges(pkg.pages[0],{...selection,quote:'neatitinka'},'new'));
  const withImage={...pkg.pages[0],body:[pkg.pages[0].body[0],{type:'image',assetId:'keep'},pkg.pages[0].body[1]]};
  assert(selectionChanges(withImage,{...selection,to:'body.2.text'},'nauja').body.some(b=>b.assetId==='keep'));
 }finally{db.close();}
});
test('atomic import guard rejects a superseded task between preflight and commit without history/audit writes',async()=>{
 const {db,pkg}=await setup();try{
  const j=await job(db,pkg);const realBatch=db.batch;let inject=true;
  db.batch=async statements=>{if(inject){inject=false;await db.prepare("UPDATE content_admin_rewrites SET state='superseded' WHERE id=?").bind(j.id).run();}return realBatch(statements)};
  await assert.rejects(()=>importRewrite(db,pkg,j.id,{etag:j.etag,changes,review},'bridge'),{status:409});
  for(const table of ['content_admin_edits','content_admin_history','content_admin_audit'])assert.equal((await db.prepare(`SELECT count(*) AS n FROM ${table}`).first()).n,0);
 }finally{db.close();}
});
test('HTTP owner CSRF/tenant boundary and independent machine capability cannot publish or widen DraftOnly',async()=>{
 const {db,pkg}=await setup(),key=randomBytes(32).toString('base64url'),oldKey=randomBytes(32).toString('base64url');
 const env={DB:db,CONTENT_ADMIN_ENABLED:'1',CONTENT_REWRITE_BRIDGE_TOKEN:key,CONTENT_ADMIN_DRAFT_TOKEN:oldKey};
 const call=(route,input,headers={},p=pkg)=>handleContentAdmin(new Request('https://example.test/admin/api/'+route,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(input)}),p,env,p=>p.pages,{});
 try{
  await db.prepare('INSERT INTO content_admin_accounts(site_id,email,password_hash,created_at) VALUES(?,?,?,?)').bind(pkg.siteId,'owner@example.test',await passwordHash('test-only password with length'),1).run();
  const login=await call('login',{email:'owner@example.test',password:'test-only password with length'},{origin:'https://example.test'}),session=await login.json(),cookie=login.headers.get('set-cookie').split(';')[0];
  const owner={cookie,origin:'https://example.test','x-admin-csrf':session.csrf};const input={id:randomUUID(),etag:(await pageRecord(db,pkg,'fixture')).etag,mode:'whole',note:''};
  assert.equal((await call('texts/fixture/rewrite',input,{...owner,'x-admin-csrf':'bad'})).status,403);
  assert.equal((await call('texts/fixture/rewrite',input,owner)).status,200);
  const auth={authorization:'Bearer '+key};assert.equal((await call('rewrite-bridge/list',{},auth)).status,200);
  assert.equal((await call('rewrite-bridge/list',{},{authorization:'Bearer '+oldKey})).status,401);
  assert.equal((await call('rewrite-bridge/list',{},owner)).status,403);
  assert.equal((await call('rewrite-bridge/list',{},auth,{...pkg,siteId:'other'})).status,404);
  assert.equal((await call('rewrite-bridge/list',{}, {...auth,origin:'https://example.test'})).status,403);
  for(const route of ['texts/fixture/publish','texts/fixture/save','policy'])assert.equal((await call(route,{},auth)).status,403);
  assert.equal((await call('drafts/fixture',{},{authorization:'Bearer '+oldKey})).status,404);
  const saved=await call(`rewrite-bridge/${input.id}/draft`,{etag:input.etag,changes,review},auth);assert.equal(saved.status,200);
  assert.deepEqual((await readPublishedEdits(db,pkg)).pkg,pkg);
 }finally{db.close();}
});

test('a concurrent reused request ID cannot acknowledge a different owner request',async()=>{
 const {db,pkg}=await setup();try{
  const input={id:randomUUID(),etag:(await pageRecord(db,pkg,'fixture')).etag,mode:'whole',note:'First request'},batch=db.batch;let racing=true;
  db.batch=async statements=>{if(racing){racing=false;await queueRewrite(db,pkg,'fixture',{...input,note:'Concurrent different request'},'owner')}return batch(statements)};
  await assert.rejects(()=>queueRewrite(db,pkg,'fixture',input,'owner'),{status:409});
  assert.equal((await getRewrite(db,pkg,input.id)).note,'Concurrent different request');
 }finally{db.close()}
});

test('a second guide stays queued until the owner resolves the existing guide draft',async()=>{
 const {db,pkg}=await setup();try{
  pkg.pages=pkg.pages.concat(['guide-a','guide-b'].map(id=>{const p={...pkg.pages[0],id,type:'guide',slug:'gidai/'+id};p.revisionHash=revisionHash(p);p.approval={...p.approval,revisionHash:p.revisionHash};return p}));
  await saveDraft(db,pkg,'guide-a',{title:'Pirmasis gido juodraštis'},(await pageRecord(db,pkg,'guide-a')).etag,'owner');
  const r=await pageRecord(db,pkg,'guide-b'),j=await queueRewrite(db,pkg,'guide-b',{id:randomUUID(),etag:r.etag,mode:'whole',note:''},'owner');
  await assert.rejects(()=>importRewrite(db,pkg,j.id,{etag:j.etag,changes,review},'bridge'),{status:409});
  assert.equal((await getRewrite(db,pkg,j.id)).state,'queued');assert.equal((await pageRecord(db,pkg,'guide-b')).draft.title,r.draft.title);
 }finally{db.close()}
});
