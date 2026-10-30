import { createHash } from 'node:crypto';
import { authError } from './content-admin-auth.mjs';
import { authenticateDraftWriter, draftChanges } from './content-admin-draft-auth.mjs';
import { pageRecord, contentKind, saveRewriteDraft } from './content-admin-store.mjs';
import { selectedText, selectionChanges } from './content-rewrite-contract.mjs';
import {editorialRules,matchingRanges} from './content-admin-editorial.mjs';

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const validId=id=>typeof id==='string'&&/^[a-z0-9-]{16,80}$/.test(id);
const exact=(input,keys)=>{if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!keys.includes(k)))throw authError(400,'Netinkami užklausos laukai.');};
const output=row=>({id:row.id,seq:row.seq,pageId:row.page_id,etag:row.etag,mode:row.mode,selection:JSON.parse(row.selection_json||'null'),note:row.note,state:row.state,createdAt:row.created_at,snapshot:JSON.parse(row.snapshot_json),resultHash:row.result_hash,draftEtag:row.draft_etag});
export function authenticateRewriteBridge(request,bindings,host) {
  // Independent secret: the old guide/category DraftOnly capability never expands.
  authenticateDraftWriter(request,{CONTENT_ADMIN_DRAFT_TOKEN:bindings.CONTENT_REWRITE_BRIDGE_TOKEN},host);
  return 'automation:codex-reviewed-rewrite';
}
export async function getRewrite(db,pkg,id) {
  if(!validId(id))throw authError(404,'Užduotis nerasta.');
  const row=await db.prepare('SELECT * FROM content_admin_rewrites WHERE site_id=? AND id=?').bind(pkg.siteId,id).first();
  if(!row)throw authError(404,'Užduotis nerasta.');
  const rules=await db.prepare('SELECT rules_json FROM content_admin_rewrite_rules WHERE site_id=? AND job_id=?').bind(pkg.siteId,id).first();
  return {...output(row),rules:JSON.parse(rules?.rules_json||'[]')};
}
export async function queueRewrite(db,pkg,pageId,input,actor,preservePending=false) {
  exact(input,['id','etag','mode','selection','note']);
  if(!validId(input.id)||!['whole','selection'].includes(input.mode)||typeof input.note!=='string'||input.note.length>4000)throw authError(400,'Patikrinkite užduoties duomenis. Pastaba gali būti iki 4000 simbolių.');
  const requestHash=hash({pageId,...input});
  const existing=await db.prepare('SELECT * FROM content_admin_rewrites WHERE site_id=? AND id=?').bind(pkg.siteId,input.id).first();
  if(existing){if(existing.request_hash!==requestHash)throw authError(409,'Šis užduoties numeris jau panaudotas kitam tekstui.');return getRewrite(db,pkg,input.id);}
  const r=await pageRecord(db,pkg,pageId);
  if(!['guide','category','product'].includes(contentKind(r.base)))throw authError(400,'Perrašomi gidai, kategorijos ir produktai.');
  if(r.conflict||r.etag!==input.etag)throw authError(409,'Tekstas pasikeitė. Atverkite naujausią versiją.');
  try{if(input.mode==='selection')selectedText(r.draft,input.selection);else if(input.selection!=null)throw Error('Viso teksto užduočiai pažymėjimo nereikia.');}catch(e){throw authError(400,e.message)}
  // CAS in the INSERT as well as in the read above: a concurrent manual save cannot
  // create a task pointing at a newer, different revision. New requests supersede old ones.
  const rules=await editorialRules(db,pkg.siteId);
  const result=await db.batch([
    db.prepare(`INSERT INTO content_admin_rewrites(site_id,id,page_id,request_hash,etag,snapshot_json,mode,selection_json,note,actor_email,created_at)
      SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE COALESCE((SELECT version FROM content_admin_edits WHERE site_id=? AND page_id=?),0)=?
      AND NOT EXISTS(SELECT 1 FROM content_admin_edits WHERE site_id=? AND page_id=? AND base_revision<>?)
      AND (?=0 OR NOT EXISTS(SELECT 1 FROM content_admin_rewrites WHERE site_id=? AND page_id=? AND state='queued'))
      ON CONFLICT(site_id,id) DO NOTHING`).bind(pkg.siteId,input.id,pageId,requestHash,r.etag,JSON.stringify(r.draft),input.mode,JSON.stringify(input.selection||null),input.note.trim(),actor,Date.now(),pkg.siteId,pageId,r.row?.version||0,pkg.siteId,pageId,r.base.revisionHash,preservePending?1:0,pkg.siteId,pageId),
    db.prepare(`INSERT INTO content_admin_rewrite_rules(site_id,job_id,rules_json)
      SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM content_admin_rewrites WHERE site_id=? AND id=? AND request_hash=?)
      ON CONFLICT(site_id,job_id) DO NOTHING`).bind(pkg.siteId,input.id,JSON.stringify(rules),pkg.siteId,input.id,requestHash),
    db.prepare(`UPDATE content_admin_rewrites SET state='superseded' WHERE site_id=? AND page_id=? AND state='queued'
      AND seq<(SELECT seq FROM content_admin_rewrites WHERE site_id=? AND id=? AND request_hash=?)`).bind(pkg.siteId,pageId,pkg.siteId,input.id,requestHash)
  ]);
  if(!result[0].meta.changes){
    const retry=await db.prepare('SELECT request_hash FROM content_admin_rewrites WHERE site_id=? AND id=?').bind(pkg.siteId,input.id).first();
    if(!retry||retry.request_hash!==requestHash)throw authError(409,'Tekstas pasikeitė arba užduoties numeris jau panaudotas. Atverkite naujausią versiją.');
  }
  return getRewrite(db,pkg,input.id);
}
export async function listRewrites(db,pkg,input) {
  exact(input,['after']);const after=input.after??0;
  if(!Number.isSafeInteger(after)||after<0)throw authError(400,'Netinkamas eilės žymeklis.');
  const rows=(await db.prepare("SELECT * FROM content_admin_rewrites WHERE site_id=? AND state='queued' AND seq>? ORDER BY seq LIMIT 10").bind(pkg.siteId,after).all()).results;
  return {items:await Promise.all(rows.map(r=>getRewrite(db,pkg,r.id))),next:rows.length?rows.at(-1).seq:null};
}
export async function editorialMatches(db,pkg,ruleId) {
  const rule=(await editorialRules(db,pkg.siteId)).find(r=>r.id===ruleId);if(!rule)throw authError(404,'Taisyklė nerasta.');
  const edits=new Map((await db.prepare('SELECT page_id,draft_json,version,base_revision FROM content_admin_edits WHERE site_id=?').bind(pkg.siteId).all()).results.map(r=>[r.page_id,r]));
  const pending=new Set((await db.prepare("SELECT page_id FROM content_admin_rewrites WHERE site_id=? AND state='queued'").bind(pkg.siteId).all()).results.map(r=>r.page_id));
  const items=pkg.pages.filter(p=>['guide','category','product'].includes(contentKind(p))).flatMap(base=>{
    const row=edits.get(base.id),page=row?JSON.parse(row.draft_json):base,ranges=matchingRanges(page,rule.term);
    return ranges.length?[{pageId:base.id,title:page.title,slug:page.slug,kind:contentKind(page),etag:`${base.revisionHash}:${row?.version||0}`,conflict:Boolean(row&&row.base_revision!==base.revisionHash),pending:pending.has(base.id),selection:{ranges}}]:[];
  });return {rule,items};
}
export async function queueEditorialMatches(db,pkg,ruleId,input,actor) {
  exact(input,['id','pages']);
  if(!validId(input.id)||!Array.isArray(input.pages)||!input.pages.length||input.pages.length>50||input.pages.some(p=>!p||typeof p.pageId!=='string'||typeof p.etag!=='string')||new Set(input.pages.map(p=>p.pageId)).size!==input.pages.length)throw authError(400,'Pasirinkite 1–50 skirtingų puslapių.');
  const {rule,items}=await editorialMatches(db,pkg,ruleId),results=[];
  for(const target of input.pages){
    exact(target,['pageId','etag']);
    const id=hash({request:input.id,ruleId,pageId:target.pageId}).slice(0,40);
    try{
      const previous=await db.prepare('SELECT id FROM content_admin_rewrites WHERE site_id=? AND id=?').bind(pkg.siteId,id).first();
      if(previous){const job=await getRewrite(db,pkg,id);if(job.etag!==target.etag)throw authError(409,'Pasikeitė pasirinkta versija.');results.push({pageId:target.pageId,job});continue;}
      const item=items.find(i=>i.pageId===target.pageId);
      if(!item||item.conflict||item.etag!==target.etag)throw authError(409,'Tekstas pasikeitė. Pakartokite paiešką.');
      // Do not silently supersede unrelated owner work on another page.
      if(item.pending)throw authError(409,'Šis puslapis jau turi laukiančią užduotį.');
      const job=await queueRewrite(db,pkg,item.pageId,{id,etag:item.etag,mode:'selection',selection:item.selection,note:rule.instruction},actor,true);
      results.push({pageId:item.pageId,job});
    }catch(e){results.push({pageId:target.pageId,error:e.message});}
  }return {results};
}
export async function importRewrite(db,pkg,id,input,actor) {
  exact(input,['etag','changes','replacement','review']);
  const job=await getRewrite(db,pkg,id),review=input.review;
  exact(review,['answerSha256','codexSha256','claudeSha256','codexReviewer','claudeReviewer','checks']);
  if(!['answerSha256','codexSha256','claudeSha256'].every(k=>/^[a-f0-9]{64}$/.test(review[k]||''))||review.codexReviewer!=='Codex'||review.claudeReviewer!=='Claude'||!['facts','core','links','language'].every(k=>review.checks?.[k]===true))throw authError(400,'Reikia šio atsakymo Codex patikros ir Claude patvirtinimo.');
  if(input.etag!==job.etag)throw authError(409,'Atsakymas skirtas kitai teksto versijai.');
  let changes;
  if(job.mode==='selection'){
    if(input.changes!==undefined)throw authError(400,'Galima pakeisti tik pažymėtą dalį.');
    try{changes=selectionChanges(job.snapshot,job.selection,input.replacement)}catch(e){throw authError(400,e.message)}
  }else{
    if(input.replacement!==undefined)throw authError(400,'Reikia viso teksto atsakymo.');changes=draftChanges(input.changes);
    if(!['title','description','body'].every(k=>Object.hasOwn(changes,k)))throw authError(400,'Trūksta viso teksto laukų.');
    if(typeof changes.description!=='string'||changes.description.length>155)throw authError(400,'Meta aprašymas turi tilpti į 155 simbolius.');
    // A prose rewrite cannot silently discard or replace an existing body image.
    const images=body=>body.filter(b=>b.type==='image').map(b=>b.assetId);
    if(!Array.isArray(changes.body)||JSON.stringify(images(changes.body))!==JSON.stringify(images(job.snapshot.body)))throw authError(400,'Išsaugokite esamus teksto vaizdus.');
  }
  const resultHash=hash({etag:job.etag,changes,review});
  if(job.state==='drafted'){if(job.resultHash!==resultHash)throw authError(409,'Šiai užduočiai jau įkeltas kitas atsakymas.');return {id,state:'drafted',etag:job.draftEtag,replayed:true};}
  if(job.state!=='queued')throw authError(409,'Užduotį pakeitė naujesnis Roko prašymas.');
  const saved=await saveRewriteDraft(db,pkg,job,changes,actor,resultHash,review);
  return {id,state:'drafted',etag:saved.etag,replayed:false};
}
