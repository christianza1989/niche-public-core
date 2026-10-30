import {Miniflare} from 'miniflare';
import {build} from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
import {passwordHash} from '../lib/content-admin-auth.mjs';

// Actual workerd + isolated D1 and real non-AI bridge, never remote bindings.
const core=process.argv[2];if(!core)throw Error('Pass the matching CORE checkout.');
const {runOnce,sha256}=await import(pathToFileURL(path.resolve(core,'scripts/content-rewrite-bridge.mjs')));
const bundle=await build({stdin:{contents:`
import {handleContentAdmin} from './lib/content-admin-api.mjs';
import {revisionHash} from './vendor/content-studio/authoring.mjs';
const p={id:'fixture',siteId:'promedical',type:'product',slug:'produktai/fixture',title:'Spinta',description:'Priemonėms laikyti.',body:[{type:'paragraph',text:'Spinta turi lentynas.'}],media:[],links:[],publishAt:'2026-01-01T10:00:10.793Z'};
p.revisionHash=revisionHash(p);p.approval={status:'approved',revisionHash:p.revisionHash,actorId:'fixture'};
const pkg={siteId:'promedical',canonicalHost:'example.test',site:{timezone:'Europe/Vilnius'},pages:[p]};
export default{fetch(r,e){return handleContentAdmin(r,pkg,e,p=>p.pages,{})}};
`,resolveDir:process.cwd(),loader:'js'},bundle:true,write:false,format:'esm',platform:'neutral',external:['node:*'],logLevel:'silent'});
const key=randomBytes(32).toString('base64url');
const mf=new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-05-22',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'isolated-rewrite-fixture'},bindings:{CONTENT_ADMIN_ENABLED:'1',CONTENT_REWRITE_BRIDGE_TOKEN:key}});
try{
 const db=await mf.getD1Database('DB');for(const file of ['content-admin.sql','content-admin-rewrites.sql'])for(const statement of (await fs.readFile('db/'+file,'utf8')).replace(/^--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(statement).run();
 await db.prepare('INSERT INTO content_admin_accounts(site_id,email,password_hash,created_at) VALUES(?,?,?,?)').bind('promedical','owner@example.test',await passwordHash('fixture-only local password'),1).run();
 await db.prepare('INSERT INTO content_admin_settings(site_id,context_json,paused_at,updated_at) VALUES(?,?,?,?)').bind('promedical','{}',null,1).run();
 const call=(route,input,headers={})=>mf.dispatchFetch('https://example.test/admin/api/'+route,{method:input===undefined?'GET':'POST',headers:{'content-type':'application/json',...headers},...(input===undefined?{}:{body:JSON.stringify(input)})});
 const login=await call('login',{email:'owner@example.test',password:'fixture-only local password'},{origin:'https://example.test'});assert.equal(login.status,200);const csrf=(await login.json()).csrf,cookie=login.headers.get('set-cookie').split(';')[0],owner={cookie,origin:'https://example.test','x-admin-csrf':csrf};
 const original=await(await call('texts/fixture',undefined,owner)).json();const id=crypto.randomUUID();
 assert.equal((await call('texts/fixture/rewrite',{id,etag:original.etag,mode:'whole',note:'Aiškiau.'},owner)).status,200);
 const root=await fs.mkdtemp(path.resolve('output/rewrite-workerd-'));await fs.mkdir(path.join(root,'uzduotys'));await fs.mkdir(path.join(root,'atsakymai'));await fs.writeFile(path.join(root,'RASYTOJAS.md'),'Isolated fixture');
 const request=async(route,input)=>{const r=await call('rewrite-bridge/'+route,input,{authorization:'Bearer '+key});if(!r.ok)throw Error('HTTP '+r.status+': '+await r.text());return r.json();};
 const config={root,state:path.join(root,'state.sqlite'),request};assert.equal((await runOnce(config)).exported,1);
 const answer='Atsakymas į:001\nModelis: fixture\nSpinta su lentynomis.\n--- PABAIGA ---\n'.replace('į:001','į: 001');await fs.writeFile(path.join(root,'atsakymai/001-atsakymas.md'),answer);
 assert.equal((await runOnce(config)).imported,0);
 const codex=JSON.stringify({jobId:id,etag:original.etag,answerSha256:sha256(answer),reviewer:'Codex',verdict:'PASS',checks:{facts:true,core:true,links:true,language:true},evidence:'Fixture-only source says the cabinet has shelves.',candidate:{changes:{title:'Spinta su lentynomis',description:'Spinta priemonėms laikyti.',body:[{type:'paragraph',text:'Spintoje yra lentynos.'}]}}});
 await fs.writeFile(path.join(root,'patikra/001-codex.json'),codex);
 await fs.writeFile(path.join(root,'atsakymai/001-patvirtinta.md'),`Atsakymas į: 001\nUžduotis: ${id}\nAtsakymo SHA256: ${sha256(answer)}\nCodex patikros SHA256: ${sha256(codex)}\nPatvirtino: Claude\nSprendimas: GERAI\n--- PABAIGA ---\n`);
 assert.equal((await runOnce(config)).imported,1);assert.equal((await runOnce(config)).imported,0);
 const after=await(await call('texts/fixture',undefined,owner)).json();assert.equal(after.draft.title,'Spinta su lentynomis');assert.deepEqual(after.live,original.live);assert.deepEqual(after.approved,original.approved);
 assert.equal((await db.prepare('SELECT count(*) AS n FROM content_admin_history').first()).n,1);
 assert.equal((await call('texts/fixture/publish',{}, {authorization:'Bearer '+key})).status,403);
 // Second, explicitly synthetic terminology rule: exercise cross-field selection
 // through the real HTTP, D1 and writer-file contracts, not just pure helpers.
 const ruleId=crypto.randomUUID();
 assert.equal((await call('editorial-rules',{id:ruleId,term:'spint',instruction:'Fixture only: use baldas.'},{...owner,'x-admin-csrf':'bad'})).status,403);
 assert.equal((await call('editorial-rules',{id:ruleId,term:'spint',instruction:'Fixture only: use baldas.'},owner)).status,200);
 const matches=await(await call(`editorial-rules/${ruleId}/matches`,undefined,owner)).json();assert.equal(matches.items[0].selection.ranges.length,3);
 const queued=await(await call(`editorial-rules/${ruleId}/queue`,{id:crypto.randomUUID(),pages:[{pageId:'fixture',etag:after.etag}]},owner)).json();const partial=queued.results[0].job;
 assert.equal((await runOnce(config)).exported,1);assert.match(await fs.readFile(path.join(root,'uzduotys/002-rewrite.md'),'utf8'),/Nenaudoti „spint“/);
 const replacements=['Baldas su lentynomis','Baldas priemonėms laikyti.','Balde yra lentynos.'];
 const answer2=`Atsakymas į: 002\nModelis: fixture\n${JSON.stringify(replacements)}\n--- PABAIGA ---\n`;
 await fs.writeFile(path.join(root,'atsakymai/002-atsakymas.md'),answer2);assert.equal((await runOnce(config)).imported,0);
 const codex2=JSON.stringify({jobId:partial.id,etag:partial.etag,answerSha256:sha256(answer2),reviewer:'Codex',verdict:'PASS',checks:{facts:true,core:true,links:true,language:true},evidence:'Synthetic terminology acceptance fixture only.',candidate:{replacement:replacements}});
 await fs.writeFile(path.join(root,'patikra/002-codex.json'),codex2);
 await fs.writeFile(path.join(root,'atsakymai/002-patvirtinta.md'),`Atsakymas į: 002\nUžduotis: ${partial.id}\nAtsakymo SHA256: ${sha256(answer2)}\nCodex patikros SHA256: ${sha256(codex2)}\nPatvirtino: Claude\nSprendimas: GERAI\n--- PABAIGA ---\n`);
 assert.equal((await runOnce(config)).imported,1);
 const final=await(await call('texts/fixture',undefined,owner)).json();assert.equal(final.draft.title,replacements[0]);assert.equal(final.draft.body[0].text,replacements[2]);assert.deepEqual(final.live,original.live);assert.deepEqual(final.editorialIssues,[]);
 assert.equal((await db.prepare('SELECT count(*) AS n FROM content_admin_history').first()).n,2);
 console.log(JSON.stringify({passed:true,runtime:'workerd',storage:'isolated D1',bridge:'actual CORE module',exports:2,draftWrites:2,publications:0,multipleReviewedFields:3,root}));
}finally{await mf.dispose();}
