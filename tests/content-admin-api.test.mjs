import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs/promises';
import{testD1}from'./helpers/content-admin-d1.mjs';import{passwordHash}from'../lib/content-admin-auth.mjs';import{handleContentAdmin}from'../lib/content-admin-api.mjs';import{projectPublicPages}from'../lib/niche-links.mjs';
test('authenticated HTTP boundary hides drafts, rejects CSRF/foreign sites and persists a full login/read/edit/reload journey',async()=>{
 const pkg=JSON.parse(await fs.readFile(new URL('../content-packages/promedical/content-package.json',import.meta.url),'utf8')),db=testD1(),email='editor@example.test',password='fixture-only admin password',now=Date.now(),network={guidePublicationPausedAtBySite:{promedical:'2026-10-13T19:26:54.000Z'}};
 const bindings={DB:db,CONTENT_ADMIN_ENABLED:'1',ASSETS:{async fetch(){return new Response('isolated fixture media',{headers:{'content-type':'image/webp'}});}}};
 const project=(p,n,t)=>projectPublicPages(p,[p],n,t),url='https://'+pkg.canonicalHost;let cookie='',csrf='';
 async function request(path,method='GET',input,headers={}){const req=new Request(url+'/admin/'+path,{method,headers:{...(cookie?{cookie}:{}),...(method==='POST'?{origin:url,'content-type':'application/json','x-admin-csrf':csrf}:{}),...headers},...(input!==undefined?{body:JSON.stringify(input)}:{})});const result=await handleContentAdmin(req,pkg,bindings,project,network);if(method==='POST')assert.equal(req.bodyUsed,true,'bounded POST payload must be consumed even on a rejected Origin/CSRF so the next keep-alive request is safe');return result}
 try{
 await db.prepare('INSERT INTO content_admin_accounts(site_id,email,password_hash,created_at) VALUES(?,?,?,?)').bind(pkg.siteId,email,await passwordHash(password),now).run();
 await db.prepare('INSERT INTO content_admin_settings(site_id,context_json,paused_at,updated_at) VALUES(?,?,?,?)').bind(pkg.siteId,JSON.stringify({facts:'Synthetic context for an isolated fixture only'}),network.guidePublicationPausedAtBySite.promedical,now).run();
 let r=await request('api/texts');assert.equal(r.status,401);assert(!JSON.stringify(await r.json()).includes(pkg.pages[0].title));
 r=await request('');const shell=await r.text();assert.equal(r.status,200);assert(!shell.includes(pkg.pages[0].title));assert.match(r.headers.get('x-robots-tag'),/noindex/);assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'none'/);
 r=await request('api/login','POST',{email,password},{origin:'https://attacker.example'});assert.equal(r.status,403);
 r=await request('api/login','POST',{email,password});assert.equal(r.status,200);cookie=r.headers.get('set-cookie').split(';')[0];assert.match(r.headers.get('set-cookie'),/HttpOnly; SameSite=Strict; Secure/);csrf=(await r.json()).csrf;
 r=await request('api/texts');const list=await r.json();assert.equal(r.status,200);assert.equal(list.total,57);assert(list.items.every(p=>p.kind==='guide'));assert(!('body'in list.items[0]));
 const other=await(await request('api/texts?scope=other')).json();assert.equal(other.total,pkg.pages.length-57);assert(other.items.every(p=>p.kind!=='guide'));const product=pkg.pages.find(p=>p.type==='product');assert.equal((await request('api/texts/'+product.id)).status,200);assert.equal((await(await request('api/texts?kind=product')).json()).total,0);
 const target=pkg.pages.find(p=>p.type==='guide'),path='api/texts/'+target.id;const first=await(await request(path)).json();
 r=await request(path+'/save','POST',{etag:first.etag,changes:{title:'Fixture edited private title'}},{'x-admin-csrf':'wrong'});assert.equal(r.status,403);
 r=await request(path+'/save','POST',{etag:first.etag,changes:{title:'Fixture edited private title'}});assert.equal(r.status,200);
 const again=await(await request(path)).json();assert.equal(again.draft.title,'Fixture edited private title');assert.notEqual(again.approved.title,again.draft.title);assert.equal(pkg.pages.find(p=>p.id===target.id).title,target.title);
 r=await request(path+'/publish','POST',{etag:again.etag,evidence:{}});assert.equal(r.status,400);
 r=await handleContentAdmin(new Request(url+'/admin/api/texts'),{...pkg,siteId:'foreign'},bindings,project,network);assert.equal(r.status,404);
 r=await request('api/logout','POST',{});assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/Max-Age=0/);assert.equal((await request(path)).status,401);
 }finally{db.close()}
});
