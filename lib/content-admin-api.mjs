import { authenticateRewriteBridge, queueRewrite, listRewrites, getRewrite, importRewrite,editorialMatches,queueEditorialMatches } from './content-admin-rewrites.mjs';
import {editorialRules,saveEditorialRule,deactivateEditorialRule,editorialIssues} from './content-admin-editorial.mjs';
import { authenticate, signIn, enroll, cookieValue, authTransport, sessionCookie, requireOrigin, requireCsrf, authError, digest } from './content-admin-auth.mjs';
import { pageRecord, siteSettings, saveDraft, publishDraft, getHistory, restoreDraft, listTexts, setPublicationPause, readPublishedEdits } from './content-admin-store.mjs';
import { contentAdminEnabled, publicationSettings } from './content-admin-context.mjs';
import { validateContentPackage } from '../scripts/content-package-core.mjs';
import { authenticateDraftWriter, draftChanges } from './content-admin-draft-auth.mjs';
import { contentKind } from './content-admin-store.mjs';
const PRIVATE={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow, noarchive','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'};
const response=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...PRIVATE,'Content-Type':'application/json; charset=utf-8',...extra}});
function exact(input,keys){if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!keys.includes(k)))throw authError(400,'Netinkami užklausos laukai.');return input;}
async function body(request){const reader=request.body?.getReader();if(!reader)throw authError(400,'Trūksta užklausos duomenų.');const chunks=[];let total=0;for(;;){const {value,done}=await reader.read();if(done)break;total+=value.byteLength;if(total>524288){await reader.cancel();throw authError(413,'Tekstas viršija užklausos dydžio ribą.');}chunks.push(value)}const buffer=new Uint8Array(total);let i=0;for(const c of chunks){buffer.set(c,i);i+=c.length}try{return JSON.parse(new TextDecoder().decode(buffer))}catch{throw authError(400,'Netinkamas JSON formatas.')}}
const shell=`<!doctype html><html lang="lt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>Promedical · Turinio administravimas</title><link rel="stylesheet" href="/brand/promedical/admin/admin.css"><script type="module" src="/brand/promedical/admin/admin.js"></script></head><body><a class="skip" href="#workspace">Pereiti prie turinio</a><div id="app"><main id="workspace" class="loading" aria-busy="true">Atidaromas administravimas…</main></div><div id="announcements" class="sr-only" role="status" aria-live="polite"></div></body></html>`;
export async function handleContentAdmin(request,pkg,bindings,projection,network){
 const url=new URL(request.url),path=url.pathname;
 if(!contentAdminEnabled(bindings,pkg?.siteId))return new Response('Not found',{status:404,headers:PRIVATE});
 const transport=authTransport(request,bindings,pkg.canonicalHost),db=bindings.DB;
 try{
  if(!db)throw authError(503,'Administravimo saugykla nepasiekiama.');
  // Read the bounded payload before early auth/origin rejection. Unread POST
  // bodies can poison the next keep-alive request in the Workers local proxy.
  const payload=request.method==='POST'?await body(request):null;
  if(request.method==='GET'&&!path.startsWith('/admin/api/')){
   if(!/^\/admin(?:\/login|\/calendar|\/pending|\/publication|\/text\/[a-z0-9-]{1,80})?\/?$/.test(path))throw authError(404,'Puslapis nerastas.');
   return new Response(shell,{headers:{...PRIVATE,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",'Permissions-Policy':'camera=(), microphone=(), geolocation=()'}});
  }
  const parts=path.split('/').filter(Boolean),action=parts[2];
  if(parts[0]!=='admin'||parts[1]!=='api')throw authError(404,'Puslapis nerastas.');
  // A machine capability never enters the owner session/publish/policy router.
  if(action==='drafts'){
   if(parts.length!==4||!/^[a-z0-9-]{1,80}$/.test(parts[3]))throw authError(404,'Veiksmas nerastas.');
   if(!['GET','POST'].includes(request.method))throw authError(405,'Neleidžiamas veiksmas.');
   const actor=authenticateDraftWriter(request,bindings,pkg.canonicalHost),id=parts[3];
   const target=pkg.pages.find(p=>p.id===id);
   if(!target||!['guide','category'].includes(contentKind(target)))throw authError(404,'Tekstas nerastas.');
   let r;
   if(request.method==='POST'){
    if((request.headers.get('content-type')||'').split(';')[0].trim()!=='application/json')throw authError(415,'Reikia JSON užklausos.');
    const input=exact(payload,['etag','changes']);
    if(typeof input.etag!=='string'||input.etag.length>200)throw authError(400,'Reikia juodraščio versijos.');
    r=await saveDraft(db,pkg,id,draftChanges(input.changes),input.etag,actor);
   }else r=await pageRecord(db,pkg,id);
   return response({id,etag:r.etag,conflict:r.conflict,updatedAt:r.row?.updated_at||null,draft:{title:r.draft.title,description:r.draft.description,body:r.draft.body,publishAt:r.draft.publishAt}},200,{ETag:`"${r.etag}"`});
  }
  if(action==='rewrite-bridge') {
   const actor=authenticateRewriteBridge(request,bindings,pkg.canonicalHost);
   if(request.method!=='POST')throw authError(405,'Reikia POST užklausos.');
   if((request.headers.get('content-type')||'').split(';')[0].trim()!=='application/json')throw authError(415,'Reikia JSON užklausos.');
   if(parts.length===4&&parts[3]==='list')return response(await listRewrites(db,pkg,payload));
   if(parts.length===5&&parts[4]==='status'){exact(payload,[]);return response(await getRewrite(db,pkg,parts[3]));}
   if(parts.length===5&&parts[4]==='draft')return response(await importRewrite(db,pkg,parts[3],payload,actor));
   throw authError(404,'Veiksmas nerastas.');
  }
  if(request.headers.has('authorization'))throw authError(403,'Importo raktas nesuteikia savininko teisių.');
  if(request.method==='POST')requireOrigin(request,transport);else if(request.method!=='GET')throw authError(405,'Neleidžiamas veiksmas.');
  const ip=request.headers.get('cf-connecting-ip')||'unknown';
  if(action==='login'&&parts.length===3&&request.method==='POST'){
   const input=exact(payload,['email','password']),login=await signIn(db,pkg.siteId,input,ip);
   return response({email:login.email,csrf:login.csrf},200,{'Set-Cookie':sessionCookie(transport,login.value)});
  }
  if(action==='enrollment'&&parts.length===3&&request.method==='POST'){
   const input=exact(payload,['token']);if(typeof input.token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(input.token))throw authError(400,'Nustatymo nuoroda negalioja.');
   const row=await db.prepare('SELECT email FROM content_admin_enrollments WHERE token_hash=? AND site_id=? AND expires_at>? AND consumed_at IS NULL').bind(digest(input.token),pkg.siteId,Date.now()).first();if(!row)throw authError(400,'Nustatymo nuoroda negalioja arba jau panaudota.');return response({email:row.email});
  }
  if(action==='enroll'&&parts.length===3&&request.method==='POST'){const input=exact(payload,['token','password']);return response(await enroll(db,pkg.siteId,input,ip));}
  const session=await authenticate(db,pkg.siteId,cookieValue(request,transport.cookie));
  if(request.method==='POST')requireCsrf(request,session);
  if(action==='session'&&parts.length===3&&request.method==='GET')return response({email:session.email,csrf:session.csrf_token,localPreview:!transport.secure,site:{id:pkg.siteId,name:pkg.site.name,host:pkg.canonicalHost,timezone:pkg.site.timezone}});
  if(action==='editorial-rules'){
   if(parts.length===3&&request.method==='GET')return response({rules:await editorialRules(db,pkg.siteId)});
   if(parts.length===3&&request.method==='POST')return response(await saveEditorialRule(db,pkg.siteId,payload,session.email));
   if(parts.length===5&&parts[4]==='matches'&&request.method==='GET')return response(await editorialMatches(db,pkg,parts[3]));
   if(parts.length===5&&parts[4]==='queue'&&request.method==='POST')return response(await queueEditorialMatches(db,pkg,parts[3],payload,session.email));
   if(parts.length===5&&parts[4]==='remove'&&request.method==='POST'){exact(payload,[]);return response(await deactivateEditorialRule(db,pkg.siteId,parts[3]));}
   throw authError(404,'Veiksmas nerastas.');
  }
  if(action==='logout'&&parts.length===3&&request.method==='POST'){await db.prepare('DELETE FROM content_admin_sessions WHERE token_hash=? AND site_id=?').bind(session.token_hash,pkg.siteId).run();return response({ok:true},200,{'Set-Cookie':sessionCookie(transport,'',true)});}
  if(action==='media'&&parts.length===4&&request.method==='GET'){
   const src=`/content-assets/${pkg.siteId}/${decodeURIComponent(parts[3])}`;
   if(!pkg.pages.some(p=>p.media.some(a=>a.src===src)))throw authError(404,'Vaizdas nerastas.');if(!bindings.ASSETS)throw authError(503,'Vaizdų saugykla nepasiekiama.');
   const asset=await bindings.ASSETS.fetch(new Request(`https://${pkg.canonicalHost}${src}`));if(asset.status!==200)throw authError(404,'Vaizdas nerastas.');return new Response(asset.body,{headers:{...PRIVATE,'Content-Type':asset.headers.get('content-type')||'application/octet-stream'}});
  }
  if(action==='texts'&&parts.length===3&&request.method==='GET'){
   const current=await readPublishedEdits(db,pkg);const settings=publicationSettings(network,pkg.siteId,current.pausedAt);return response(await listTexts(db,pkg,url.searchParams,projection(current.pkg,settings,current.at)));
  }
  if(action==='policy'&&parts.length===3){
   if(request.method==='GET'){const settings=await siteSettings(db,pkg.siteId),current=await readPublishedEdits(db,pkg),resumed=await readPublishedEdits(db,pkg,current.at,null);const currentPages=projection(current.pkg,publicationSettings(network,pkg.siteId,current.pausedAt),current.at),nextPages=projection(resumed.pkg,publicationSettings(network,pkg.siteId,null),resumed.at),byId=new Map(currentPages.map(p=>[p.id,p.revisionHash]));return response({pausedAt:settings.paused_at,version:settings.version,releasingNowCount:nextPages.filter(p=>byId.get(p.id)!==p.revisionHash).length});}
   const input=exact(payload,['action','version','confirmation']);return response(await setPublicationPause(db,pkg,input,session.email));
  }
  if(action==='texts'&&parts[3]&&/^[a-z0-9-]{1,80}$/.test(parts[3])){
   const id=parts[3];
   if(parts.length===4&&request.method==='GET'){const r=await pageRecord(db,pkg,id),current=await readPublishedEdits(db,pkg);const live=projection(current.pkg,publicationSettings(network,pkg.siteId,current.pausedAt),current.at).find(p=>p.id===id)||null;const rules=await editorialRules(db,pkg.siteId);return response({base:r.base,draft:r.draft,approved:r.approved,live,etag:r.etag,conflict:r.conflict,editorialRules:rules,editorialIssues:editorialIssues(r.draft,rules),updatedAt:r.row?.updated_at||null},200,{ETag:`"${r.etag}"`});}
   if(parts.length===5&&parts[4]==='history'&&request.method==='GET')return response({items:await getHistory(db,pkg,id)});
   if(parts.length===5&&request.method==='POST'){
    const input=payload;let result;
    if(parts[4]==='rewrite')return response(await queueRewrite(db,pkg,id,input,session.email));
    if(parts[4]==='save'){exact(input,['changes','etag']);result=await saveDraft(db,pkg,id,input.changes,input.etag,session.email);}
    else if(parts[4]==='publish'){
     exact(input,['evidence','etag']);
     const verify=async asset=>{if(!bindings.ASSETS||!asset.src.startsWith(`/content-assets/${pkg.siteId}/`))throw authError(400,'Nepasiekiama puslapio medija.');const r=await bindings.ASSETS.fetch(new Request(`https://${pkg.canonicalHost}${asset.src}`,{method:'HEAD'}));if(r.status!==200||!(r.headers.get('content-type')||'').startsWith('image/'))throw authError(400,'Puslapio vaizdas nerastas saugykloje.');};
     result=await publishDraft(db,pkg,id,input.evidence,input.etag,session.email,verify,validateContentPackage);
    }else if(parts[4]==='restore'){exact(input,['version','etag']);if(!Number.isInteger(input.version))throw authError(400,'Netinkama versija.');result=await restoreDraft(db,pkg,id,input.version,input.etag,session.email);}
    else throw authError(404,'Veiksmas nerastas.');
    return response({base:result.base,draft:result.draft,approved:result.approved,etag:result.etag,conflict:result.conflict,updatedAt:result.row?.updated_at||null});
   }
  }
  throw authError(404,'Veiksmas nerastas.');
 }catch(error){return response({error:error.status?error.message:'Nepavyko atlikti veiksmo. Bandykite dar kartą.'},error.status||500);}
}
