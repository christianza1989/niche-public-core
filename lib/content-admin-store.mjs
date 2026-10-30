import { editHostedDraft, approveHostedDraft, revisionHash } from '../vendor/content-studio/authoring.mjs';
import { authError, token } from './content-admin-auth.mjs';
const json=value=>JSON.stringify(value),parse=value=>value?JSON.parse(value):null;
export function contentKind(page){return page.type==='home'?'home':page.type==='product'?'product':page.type==='guide'?'guide':page.slug.startsWith('kategorijos/')?'category':'page';}
export async function siteSettings(db,siteId){const row=await db.prepare('SELECT * FROM content_admin_settings WHERE site_id=?').bind(siteId).first();if(!row)throw authError(503,'Administravimo saugykla dar neparuošta.');return row;}
export async function pageRecord(db,pkg,id){
 const base=pkg.pages.find(p=>p.id===id);if(!base)throw authError(404,'Tekstas nerastas.');
 const row=await db.prepare('SELECT * FROM content_admin_edits WHERE site_id=? AND page_id=?').bind(pkg.siteId,id).first();
 const conflict=Boolean(row&&row.base_revision!==base.revisionHash);
 return {base,row,draft:parse(row?.draft_json)||base,approved:parse(row?.approved_json)||base,etag:`${base.revisionHash}:${row?.version||0}`,conflict};
}
function expect(record,etag){if(record.conflict||etag!==record.etag)throw authError(409,'Tekstas pasikeitė kitame lange arba atnaujintoje svetainėje. Jūsų laukai išsaugoti šiame lange; atnaujinkite versiją prieš saugodami.');}
async function mutate(db,pkg,record,draft,actor,action,published=null,review=null,rewrite=null){
 const id=record.base.id,version=(record.row?.version||0)+1,op=token(),now=Date.now();let statement;
 const guideGuard=rewrite&&record.base.type==='guide'?" AND NOT EXISTS(SELECT 1 FROM content_admin_edits WHERE site_id=? AND page_id<>? AND has_changes=1 AND json_extract(draft_json,'$.type')='guide')":"";
 const guard=rewrite?" AND EXISTS(SELECT 1 FROM content_admin_rewrites WHERE site_id=? AND id=? AND state='queued' AND etag=?)"+guideGuard:"";
 const guardArgs=rewrite?[pkg.siteId,rewrite.id,record.etag,...(guideGuard?[pkg.siteId,id]:[])]:[];
 const approved=published?json(published):record.row?.approved_json||null,reviewJson=review?json(review):record.row?.review_json||null;
 const live=published||parse(record.row?.approved_json)||record.base,changed=revisionHash(draft)!==live.revisionHash?1:0;
 if(!record.row)statement=db.prepare(`INSERT INTO content_admin_edits(site_id,page_id,base_revision,draft_json,approved_json,review_json,title,publish_at,has_changes,version,operation_id,actor_email,updated_at)
 SELECT ?,?,?,?,?,?,?,?,?,?,?,?,? WHERE 1=1${guard} ON CONFLICT(site_id,page_id) DO NOTHING`).bind(pkg.siteId,id,record.base.revisionHash,json(draft),approved,reviewJson,draft.title,draft.publishAt,changed,version,op,actor,now,...guardArgs);
 else statement=db.prepare(`UPDATE content_admin_edits SET draft_json=?,approved_json=?,review_json=?,title=?,publish_at=?,has_changes=?,version=?,operation_id=?,actor_email=?,updated_at=?
 WHERE site_id=? AND page_id=? AND version=? AND base_revision=?${guard}`).bind(json(draft),approved,reviewJson,draft.title,draft.publishAt,changed,version,op,actor,now,pkg.siteId,id,record.row.version,record.base.revisionHash,...guardArgs);
 const result=await db.batch([statement,
 db.prepare(`INSERT INTO content_admin_history(site_id,page_id,version,action,snapshot_json,actor_email,created_at)
 SELECT site_id,page_id,version,?,draft_json,actor_email,updated_at FROM content_admin_edits WHERE site_id=? AND page_id=? AND operation_id=?`).bind(action,pkg.siteId,id,op),
 db.prepare(`INSERT INTO content_admin_audit(id,site_id,actor_email,action,page_id,revision_hash,created_at)
 SELECT ?,site_id,actor_email,?,page_id,?,updated_at FROM content_admin_edits WHERE site_id=? AND page_id=? AND operation_id=?`).bind(op,action,revisionHash(draft),pkg.siteId,id,op),
 ...(rewrite?[db.prepare("UPDATE content_admin_rewrites SET state='drafted',result_hash=?,review_json=?,draft_etag=? WHERE site_id=? AND id=? AND EXISTS(SELECT 1 FROM content_admin_edits WHERE site_id=? AND page_id=? AND operation_id=?)").bind(rewrite.resultHash,json(rewrite.review),record.base.revisionHash+':'+version,pkg.siteId,rewrite.id,pkg.siteId,id,op)]:[]),
 ...(published?[db.prepare('UPDATE content_admin_settings SET version=version+1 WHERE site_id=? AND EXISTS(SELECT 1 FROM content_admin_edits WHERE site_id=? AND page_id=? AND operation_id=?)').bind(pkg.siteId,pkg.siteId,id,op)]:[])]);
 if(result[0].meta.changes!==1)throw authError(409,'Kitas redaktorius jau išsaugojo šią versiją. Atnaujinkite tekstą.');
 return pageRecord(db,pkg,id);
}
export async function saveDraft(db,pkg,id,input,etag,actor){const record=await pageRecord(db,pkg,id);expect(record,etag);const draft=editHostedDraft(record.draft,input,pkg.site.timezone);return mutate(db,pkg,record,draft,actor,'draft');}
export async function saveRewriteDraft(db,pkg,job,changes,actor,resultHash,review){
 const record=await pageRecord(db,pkg,job.pageId);expect(record,job.etag);
 if(record.base.type==='guide'&&await db.prepare("SELECT page_id FROM content_admin_edits WHERE site_id=? AND page_id<>? AND has_changes=1 AND json_extract(draft_json,'$.type')='guide' LIMIT 1").bind(pkg.siteId,job.pageId).first())throw authError(409,'Kitas gido juodraštis dar laukia Roko patvirtinimo.');
 const draft=editHostedDraft(record.draft,changes,pkg.site.timezone);
 return mutate(db,pkg,record,draft,actor,'rewrite',null,null,{id:job.id,resultHash,review});
}
export async function publishDraft(db,pkg,id,evidence,etag,actor,verifyMedia,validatePackage){
 const record=await pageRecord(db,pkg,id);expect(record,etag);const settings=await siteSettings(db,pkg.siteId),privateContext=parse(settings.context_json);
 const inherited=record.base.externalLinks||[];
 const draft={...record.draft,externalLinks:(record.draft.externalLinks||[]).map(l=>({...l,verified:inherited.some(b=>b.url===l.url&&b.label===l.label&&b.reason===l.reason)}))};
 const context={...pkg.site,...privateContext,id:pkg.siteId,contact:pkg.site.contact,canonicalHost:pkg.canonicalHost,locale:pkg.locale,timezone:pkg.site.timezone,assets:[],
 pages:pkg.pages.map(p=>({...p,status:'approved',publishedRevision:p}))};
 let approved;
 try { approved=await approveHostedDraft(context,draft,`owner:${actor}`,evidence,verifyMedia);validatePackage({...pkg,pages:pkg.pages.map(p=>p.id===id?approved.page:p)}); }
 catch(error){if(!error.status)error.status=400;throw error;}
 return mutate(db,pkg,record,approved.page,actor,'publish',approved.page,approved.review);
}
export async function restoreDraft(db,pkg,id,version,etag,actor){
 const record=await pageRecord(db,pkg,id);expect(record,etag);
 const old=await db.prepare('SELECT snapshot_json FROM content_admin_history WHERE site_id=? AND page_id=? AND version=?').bind(pkg.siteId,id,version).first();if(!old)throw authError(404,'Versija nerasta.');
 const draft=parse(old.snapshot_json);delete draft.approval;draft.revisionHash=revisionHash(draft);return mutate(db,pkg,record,draft,actor,'restore');
}
export async function getHistory(db,pkg,id){await pageRecord(db,pkg,id);return (await db.prepare('SELECT version,action,actor_email,created_at FROM content_admin_history WHERE site_id=? AND page_id=? ORDER BY version DESC LIMIT 30').bind(pkg.siteId,id).all()).results;}
export async function listTexts(db,pkg,params,project,now=Date.now()){
 const settings=await siteSettings(db,pkg.siteId),rows=(await db.prepare('SELECT page_id,title,publish_at,has_changes,version,updated_at,base_revision,approved_json FROM content_admin_edits WHERE site_id=?').bind(pkg.siteId).all()).results;
 const byId=new Map(rows.map(r=>[r.page_id,r])),live=new Map(project.map(p=>[p.id,p]));
 const fmt=new Intl.DateTimeFormat('sv-SE',{timeZone:pkg.site.timezone,year:'numeric',month:'2-digit',day:'2-digit'});
 const scope=['other','pending'].includes(params.get('scope'))?params.get('scope'):'guides';
 let items=pkg.pages.filter(p=>scope==='pending'?true:scope==='guides'?p.type==='guide':p.type!=='guide').map(p=>{const row=byId.get(p.id),approved=parse(row?.approved_json),date=row?.publish_at||p.publishAt;
 const conflict=Boolean(row&&row.base_revision!==p.revisionHash),held=p.type==='guide'&&settings.paused_at!==null&&Date.parse((approved||p).publishAt)>Date.parse(settings.paused_at);
 const state=conflict?'conflict':row?.has_changes?'draft':held?'paused':Date.parse((approved||p).publishAt)>now?'scheduled':live.has(p.id)?'published':'draft';
 return {id:p.id,title:row?.title||p.title,slug:p.slug,kind:contentKind(p),state,publishAt:date,livePublishAt:live.get(p.id)?.publishAt||null,updatedAt:row?.updated_at||null,version:row?.version||0,hasChanges:Boolean(row?.has_changes),localDay:fmt.format(new Date(date))};});
 if(scope==='pending')items=items.filter(p=>p.hasChanges||!p.livePublishAt||p.state==='conflict');
 const counts={all:items.length};for(const item of items)counts[item.kind]=(counts[item.kind]||0)+1;
 const q=(params.get('q')||'').trim().slice(0,100).toLocaleLowerCase('lt');const kind=params.get('kind'),state=params.get('state'),month=params.get('month');
 if(q)items=items.filter(p=>(p.title+' '+p.slug).toLocaleLowerCase('lt').includes(q));if(kind&&kind!=='all')items=items.filter(p=>p.kind===kind);if(state&&state!=='all')items=items.filter(p=>p.state===state);if(month&&/^\d{4}-\d{2}$/.test(month))items=items.filter(p=>p.localDay.startsWith(month));
 if(params.get('day')&&/^\d{4}-\d{2}-\d{2}$/.test(params.get('day')))items=items.filter(p=>p.localDay===params.get('day'));
 items.sort((a,b)=>a.publishAt.localeCompare(b.publishAt)||a.title.localeCompare(b.title,'lt'));
 const limit=month?Math.min(5000,Math.max(1,pkg.pages.length)):50,page=Math.max(1,Number.parseInt(params.get('p')||'1',10)||1),total=items.length;
 return {items:items.slice((page-1)*limit,page*limit),total,page,limit,counts,scope,timezone:pkg.site.timezone,pausedAt:settings.paused_at,policyVersion:settings.version};
}
export async function setPublicationPause(db,pkg,input,actor,now=Date.now()){
 const prior=await siteSettings(db,pkg.siteId);if(input.version!==prior.version)throw authError(409,'Leidybos nustatymai pasikeitė. Atnaujinkite langą.');
 if(input.action!=='pause'&&input.action!=='resume')throw authError(400,'Nežinomas leidybos veiksmas.');
 if(input.action==='resume'&&input.confirmation!=='TĘSTI PUBLIKAVIMĄ')throw authError(400,'Patvirtinkite leidybos atnaujinimą.');
 // Repeated pause must not advance the cutoff and release held guides through
 // a request that did not explicitly confirm resume.
 if(input.action==='pause'&&prior.paused_at!==null)return {pausedAt:prior.paused_at,version:prior.version};
 const op=token(),paused=input.action==='pause'?new Date(now).toISOString():null;
 const result=await db.batch([db.prepare('UPDATE content_admin_settings SET paused_at=?,version=version+1,operation_id=?,updated_at=? WHERE site_id=? AND version=?').bind(paused,op,now,pkg.siteId,prior.version),
 db.prepare(`INSERT INTO content_admin_audit(id,site_id,actor_email,action,created_at) SELECT ?,site_id,?,?,? FROM content_admin_settings WHERE site_id=? AND operation_id=?`).bind(op,actor,input.action,now,pkg.siteId,op)]);
 if(result[0].meta.changes!==1)throw authError(409,'Leidybos nustatymai pasikeitė.');return {pausedAt:paused,version:prior.version+1};
}
export async function readPublishedEdits(db,pkg,now=Date.now(),overridePause){
 const settings=await siteSettings(db,pkg.siteId),rows=(await db.prepare('SELECT page_id,base_revision,approved_json FROM content_admin_edits WHERE site_id=? AND approved_json IS NOT NULL').bind(pkg.siteId).all()).results;
 const pausedAt=overridePause===undefined?settings.paused_at:overridePause;
 const edits=new Map(rows.map(r=>[r.page_id,r]));
 // A newly scheduled revision must not replace an earlier hosted live revision
 // with the original compiled package while it waits. History is immutable and
 // scoped to the current base lineage through the matching edit row below.
 const guideClock=pausedAt===null?now:Math.min(now,Date.parse(pausedAt));
 const pending=rows.some(r=>{const p=parse(r.approved_json);return Date.parse(p.publishAt)>(p.type==='guide'?guideClock:now)});
 const previous=pending?(await db.prepare(`SELECT h.page_id,h.snapshot_json FROM content_admin_history h
 WHERE h.site_id=? AND h.action='publish' AND h.version=(SELECT MAX(v.version) FROM content_admin_history v
 WHERE v.site_id=h.site_id AND v.page_id=h.page_id AND v.action='publish'
 AND julianday(json_extract(v.snapshot_json,'$.publishAt'))<=julianday(CASE WHEN json_extract(v.snapshot_json,'$.type')='guide' THEN ? ELSE ? END))`)
 .bind(pkg.siteId,new Date(guideClock).toISOString(),new Date(now).toISOString()).all()).results:[];
 const prior=new Map(previous.map(r=>[r.page_id,parse(r.snapshot_json)]));
 const pages=pkg.pages.map(base=>{const row=edits.get(base.id);if(!row||row.base_revision!==base.revisionHash)return base;const p=parse(row.approved_json);
 const valid=p=>p.id===base.id&&p.siteId===base.siteId&&p.slug===base.slug&&p.type===base.type&&p.approval?.status==='approved'&&p.approval.revisionHash===p.revisionHash&&revisionHash(p)===p.revisionHash;
 if(!valid(p))throw authError(503,'Publikavimo revizija neatitinka turinio sutarties.');
 const clock=base.type==='guide'&&pausedAt!==null?Math.min(now,Date.parse(pausedAt)):now;
 if(Date.parse(p.publishAt)<=clock)return p;
 const older=prior.get(base.id);if(!older)return base;
 if(!valid(older))throw authError(503,'Publikavimo istorija neatitinka turinio sutarties.');return older;});
 return {pkg:{...pkg,pages},pausedAt,at:now};
}
