import test from'node:test';import assert from'node:assert/strict';import{build}from'esbuild';import fs from'node:fs/promises';import{randomUUID}from'node:crypto';import{fileURLToPath}from'node:url';import{testD1}from'./helpers/content-admin-d1.mjs';
test('forms and measurement load the same hosted pause projection as public HTML, without changing the V2 fallback',async()=>{
 const file=new URL('../.sites-runtime/admin-public-'+randomUUID()+'.mjs',import.meta.url),key='fixtureAdminEnv'+randomUUID().replaceAll('-',''),db=testD1();
 await fs.mkdir(new URL('../.sites-runtime/',import.meta.url),{recursive:true});
 try{await db.prepare('INSERT INTO content_admin_settings(site_id,context_json,paused_at,updated_at) VALUES(?,?,?,?)').bind('promedical','{"facts":"Synthetic adapter fixture only"}','2026-10-13T19:26:54.000Z',Date.now()).run();globalThis[key]={DB:db,CONTENT_ADMIN_ENABLED:'1'};
 await build({entryPoints:[fileURLToPath(new URL('../lib/public-site.ts',import.meta.url))],outfile:fileURLToPath(file),bundle:true,format:'esm',platform:'node',external:['react'],tsconfig:fileURLToPath(new URL('../tsconfig.json',import.meta.url)),plugins:[{name:'isolated-env',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'env',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:`export const env=globalThis[${JSON.stringify(key)}];`}))}}]});
 const model=await import(file.href),base=model.publicSiteByHost('promedical.lt'),guide=base.pages.find(p=>p.type==='guide'&&p.publishAt>'2026-10-13T19:26:54.000Z'),future=Date.parse('2040-01-01T00:00:00.000Z');
 const paused=await model.loadPublicSiteByHost('promedical.lt');assert.equal(model.publicSitePage(paused,guide.slug,future),undefined);
 await db.prepare('UPDATE content_admin_settings SET paused_at=NULL WHERE site_id=?').bind('promedical').run();
 const resumed=await model.loadPublicSiteByHost('promedical.lt');assert.equal(model.publicSitePage(resumed,guide.slug,future).id,guide.id);assert.equal(model.publicSitePage(base,guide.slug,future),undefined,'raw synchronous source is not a substitute for the request-time adapter');assert.equal(await model.loadPublicSiteByHost('unknown.example'),null);
 for(const path of ['../app/niche/[siteId]/lead/route.ts','../app/niche/[siteId]/interest/route.ts'])assert.match(await fs.readFile(new URL(path,import.meta.url),'utf8'),/await loadPublicSiteByHost\(/);
 }finally{delete globalThis[key];db.close();await fs.rm(file,{force:true})}
});
