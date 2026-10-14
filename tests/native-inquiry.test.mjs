import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {DatabaseSync} from 'node:sqlite';
import {nativeFixture} from './fixtures/native-niche-v2.mjs';
import {projectContentPagesV2} from '../lib/content-projection-v2.mjs';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url))),require=createRequire(import.meta.url);
const {NextRequest,NextResponse}=require('next/server');
function proxyFor(pkg){
  const code=ts.transpileModule(fs.readFileSync(path.join(root,'proxy.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,module={exports:{}};
  const load=name=>{
    if(name==='next/server')return {NextResponse};
    if(name==='@/lib/niche-sites')return {nicheSiteByHost:()=>null,normalizedHost:value=>String(value).split(':')[0].toLowerCase()};
    if(name==='@/lib/site-config')return {SITE_CONFIGS:{}};
    if(name==='@/lib/content-model-v2')return {contentPackageByHost:host=>host===pkg.canonicalHost?pkg:null,publicContentPages:()=>projectContentPagesV2(pkg,[pkg],{}, {targets:[]}),contentAdmissionScope:()=> 'public',localContentAdmission:()=>false,hasLocalPreviewContent:()=>false};
    if(name==='@/config/content-media-aliases.json')return {};
    if(name==='@/lib/content-media-aliases.mjs')return {visibleMediaAlias:()=>null};
    throw new Error('Unexpected routing test import '+name);
  };
  vm.runInNewContext(code,{module,exports:module.exports,require:load,Headers,Response,Map},{filename:'proxy.ts'});return module.exports.proxy;
}
test('native inquiry and aggregate measurement reach the existing scoped handlers',()=>{
  const pkg=nativeFixture(),proxy=proxyFor(pkg);
  for(const [route,kind] of [['/uzklausa','lead'],['/ivykius','interest']]){
    const response=proxy(new NextRequest(`https://${pkg.canonicalHost}${route}`,{method:'POST',headers:{host:pkg.canonicalHost}}));
    assert.equal(response.status,200);
    assert.equal(new URL(response.headers.get('x-middleware-rewrite')).pathname,`/niche/${pkg.siteId}/${kind}`);
  }
});
test('native write routing does not expose internal routes or unrelated mutations',()=>{
  const pkg=nativeFixture(),proxy=proxyFor(pkg);
  for(const [route,method,status] of [['/unknown','POST',405],['/kontaktai','POST',405],['/uzklausa','PUT',405],['/api/customer','POST',404],['/niche/nativeqa/lead','POST',404]]){
    assert.equal(proxy(new NextRequest(`https://${pkg.canonicalHost}${route}`,{method,headers:{host:pkg.canonicalHost}})).status,status);
  }
});

function handlerFor(relative,pkg,storage,{host=pkg.canonicalHost}={}){
  const module={exports:{}},code=ts.transpileModule(fs.readFileSync(path.join(root,relative),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const env={DB:storage,LEAD_SMTP_ENABLED:'0'};
  const load=name=>{
    if(name==='cloudflare:workers')return {env};
    if(name==='next/headers')return {headers:async()=>new Headers({host})};
    if(name==='@/lib/public-site')return {publicSiteByHost:value=>value===pkg.canonicalHost?pkg:null,publicSitePage:(_,slug)=>projectContentPagesV2(pkg,[pkg],{}, {targets:[]}).find(page=>page.slug===slug)};
    if(name==='@/lib/niche-network')return {nicheLeadRecipient:()=>{throw new Error('Notifications must stay disabled');}};
    if(name==='@/lib/niche-mail')return {sendNicheLeadMail:()=>{throw new Error('Notifications must stay disabled');}};
    throw new Error('Unexpected maintained handler import '+name);
  };
  vm.runInNewContext(code,{module,exports:module.exports,require:load,Headers,Response,URL,URLSearchParams,TextDecoder,Intl,Date,Set,crypto,console,Uint8Array},{filename:relative});
  return module.exports.POST;
}
function sqlite(){
  const database=new DatabaseSync(':memory:');
  database.exec(fs.readFileSync(path.join(root,'drizzle/0004_niche_leads.sql'),'utf8'));
  database.exec(fs.readFileSync(path.join(root,'drizzle/0005_niche_interest_daily.sql'),'utf8'));
  return {database,prepare(sql){
    return {bind(...values){
      return {async run(){
        const result=database.prepare(sql).run(...values);
        return {success:true,meta:{changes:result.changes}};
      }};
    }};
  }};
}
function leadRequest(pkg,changes={},headers={}){
  return new Request(`https://${pkg.canonicalHost}/uzklausa`,{method:'POST',headers:{origin:`https://${pkg.canonicalHost}`,'content-type':'application/x-www-form-urlencoded',...headers},body:new URLSearchParams({name:'Bandymo vardas',email:'isolated-inquiry@example.invalid',message:'Tai izoliuota sintetinė poreikio užklausa be jokio išorinio siuntimo.',consent:'yes',...changes})});
}
test('maintained native inquiry writes an actual scoped SQLite row without notifying or claiming inbox delivery',async()=>{
  const pkg=nativeFixture(),db=sqlite(),post=handlerFor('app/niche/[siteId]/lead/route.ts',pkg,db);
  try{
    const response=await post(leadRequest(pkg),{params:Promise.resolve({siteId:pkg.siteId})});
    assert.equal(response.status,200);assert.doesNotMatch(await response.text(),/perduota operatoriaus pašto serveriui/);
    const rows=db.database.prepare('SELECT site_id,email,status FROM niche_leads').all();
    assert.equal(rows.length,1);assert.equal(rows[0].site_id,pkg.siteId);assert.equal(rows[0].email,'isolated-inquiry@example.invalid');assert.equal(rows[0].status,'new');
  }finally{db.database.close();}
});
test('invalid native form, cross-origin, missing storage and foreign host never create a lead',async()=>{
  const pkg=nativeFixture(),db=sqlite(),post=handlerFor('app/niche/[siteId]/lead/route.ts',pkg,db);
  try{
    for(const [request,status] of [[leadRequest(pkg,{consent:'no'}),400],[leadRequest(pkg,{message:'short'}),400],[leadRequest(pkg,{}, {origin:'https://foreign.example'}),403]])assert.equal((await post(request,{params:Promise.resolve({siteId:pkg.siteId})})).status,status);
    assert.equal((await handlerFor('app/niche/[siteId]/lead/route.ts',pkg,undefined)(leadRequest(pkg),{params:Promise.resolve({siteId:pkg.siteId})})).status,503);
    assert.equal((await handlerFor('app/niche/[siteId]/lead/route.ts',pkg,db,{host:'foreign.example'})(leadRequest(pkg),{params:Promise.resolve({siteId:pkg.siteId})})).status,404);
    assert.equal(db.database.prepare('SELECT count(*) AS n FROM niche_leads').get().n,0);
  }finally{db.database.close();}
});
test('native aggregate interest uses the maintained table and respects privacy signals',async()=>{
  const pkg=nativeFixture(),db=sqlite(),post=handlerFor('app/niche/[siteId]/interest/route.ts',pkg,db);
  const request=headers=>new Request(`https://${pkg.canonicalHost}/ivykius`,{method:'POST',headers:{origin:`https://${pkg.canonicalHost}`,'content-type':'application/json','user-agent':'NativeScopeFixture/1',...headers},body:JSON.stringify({event:'pageview',path:'/'})});
  try{
    assert.equal((await post(request({}),{params:Promise.resolve({siteId:pkg.siteId})})).status,204);
    assert.equal((await post(request({'sec-gpc':'1'}),{params:Promise.resolve({siteId:pkg.siteId})})).status,204);
    assert.equal((await post(request({origin:'https://foreign.example'}),{params:Promise.resolve({siteId:pkg.siteId})})).status,403);
    const result=db.database.prepare('SELECT site_id,event,count FROM niche_interest_daily').get();assert.equal(result.site_id,pkg.siteId);assert.equal(result.event,'pageview');assert.equal(result.count,1);
  }finally{db.database.close();}
});
