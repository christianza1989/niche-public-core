import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { randomUUID, createHash } from 'node:crypto';
import { request as httpRequest } from 'node:http';
import { smokeRequestOptions } from '../../../scripts/seo-smoke-transport.mjs';

const [engineArg, originArg='http://127.0.0.1:8958'] = process.argv.slice(2);
if(!engineArg)throw Error('Usage: node verify-signaturepads-core.mjs <isolated-engine> [loopback-origin]');
const engine=path.resolve(engineArg),origin=new URL(originArg).origin;
if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname)||!engine.replaceAll('\\','/').startsWith('D:/Core/output/signaturepads-migration-20261029/'))throw Error('Verification is restricted to this isolated local runtime');
const pkg=JSON.parse(await readFile(path.join(engine,'content-packages/signaturepads/content-package.json')));
const admission=JSON.parse(await readFile(path.join(engine,'content-packages/signaturepads/activation.json')));
const config=JSON.parse(await readFile(path.join(engine,'dist/server/wrangler.json')));
const envText=await readFile(path.join(engine,'.dev.vars'),'utf8');
const flag=name=>envText.split(/\r?\n/).find(l=>l.startsWith(name+'='))?.split('=')[1].replaceAll('"','').trim();
if(pkg.siteId!=='signaturepads'||admission.scope!=='local-preview'||config.vars?.NICHE_DEV_SITE_ID!=='signaturepads'||flag('LEAD_SMTP_ENABLED')!=='0'||flag('LEAD_HOSTINGER_ENABLED')!=='0'||config.send_email?.length)throw Error('Ordinary HTTP/D1 QA requires local-preview and every mail transport disabled');
const root=path.resolve(import.meta.dirname,'../../..'),out=path.resolve(engine,'..');
const aliases=JSON.parse(await readFile(path.join(root,'config/content-media-aliases.json'))).entries.filter(e=>e.siteId==='signaturepads');
const check=(value,message)=>{if(!value)throw Error(message);};
const request=async(p,options={})=>{
  if(options.headers?.host)return new Promise((resolve,reject)=>{
    const target=new URL(origin+p),req=httpRequest(target,smokeRequestOptions(target,options.headers.host),res=>{
      let text='';res.setEncoding('utf8');res.on('data',part=>text+=part);res.on('end',()=>resolve({response:new Response(text,{status:res.statusCode,headers:res.headers}),text}));
    });req.setTimeout(20000,()=>{req.destroy();reject(Error('Host probe timeout'));});req.on('error',reject);req.end();
  });
  const response=await fetch(origin+p,{...options,redirect:'manual',signal:AbortSignal.timeout(20000)});
  return {response,text:await response.text()};
};
const sql=value=>"'"+String(value).replaceAll("'","''")+"'";
const db=command=>{
  const result=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs',path.join(engine,'node_modules/wrangler/bin/wrangler.js'),'d1','execute','DB','--config',path.join(engine,'dist/server/wrangler.json'),'--local','--persist-to',path.join(engine,'.wrangler/state'),'--json','--command',command],{cwd:engine,encoding:'utf8',windowsHide:true,maxBuffer:1024*1024,env:{...process.env,WRANGLER_SEND_METRICS:'false'}});
  if(result.status!==0)throw Error('Local scoped D1 query failed');
  return JSON.parse(result.stdout).flatMap(r=>r.results||[]);
};
const report={status:'RUNNING',scope:'local Core Worker only; SMTP/API/native-email disabled',origin,pages:[],redirects:[],assets:0,legacyAssets:0,forms:[],checkedAt:new Date().toISOString()};
const paths=new Map(pkg.pages.map(p=>['/'+p.slug+(p.slug?'/':''),p]));
for(const [pathname,page]of paths){
  const {response,text}=await request(pathname);
  check(response.status===200,`Page ${pathname}: ${response.status}`);
  check((text.match(/<h1\b/g)||[]).length===1,`One H1: ${pathname}`);
  check((text.match(/<title>/g)||[]).length===1,`One title: ${pathname}`);
  check((text.match(/<meta name="description"/g)||[]).length===1,`One description: ${pathname}`);
  check((text.match(/<link rel="canonical"/g)||[]).length===1,`One canonical: ${pathname}`);
  check(text.includes(`href="https://${pkg.canonicalHost}${pathname}"`),`Canonical ${pathname}`);
  check(response.headers.get('x-robots-tag')?.includes('noindex'),`Private robots ${pathname}`);
  check(!/wp-includes|elementor|paysera\.com|woocommerce\/assets/i.test(text),`Old runtime dependencies ${pathname}`);
  report.pages.push({path:pathname,status:response.status});
  if(pathname!=='/'){
    const {response:r}=await request(pathname.slice(0,-1));
    check(r.status===308&&new URL(r.headers.get('location'),origin).pathname===pathname,`Slash redirect ${pathname}`);
  }
}
for(const [pathname,status,target]of [['/?p=488',301,'/produktas/paraso-plansete-signotec-sigma/'],['/?page_id=2',410],['/sample-page/',410],['/ozonas-geriausia-kvapu-naikinimo-priemone/',410],['/cart/',410],['/checkout/',410],['/paysera/',410],['/?add-to-cart=488',410],['/prekes/page/2/',301,'/prekes/']]){
  const {response}=await request(pathname);check(response.status===status,`Legacy ${pathname}: ${response.status}`);
  if(target)check(new URL(response.headers.get('location'),origin).pathname===target,`Legacy target ${pathname}`);
  report.redirects.push({path:pathname,status});
}
const {text:sitemap}=await request('/sitemap.xml');
check((sitemap.match(/<url>/g)||[]).length===26,'Sitemap inventory');
for(const pathname of paths.keys())check(sitemap.includes(`https://${pkg.canonicalHost}${pathname}</loc>`),`Sitemap path ${pathname}`);
const {text:llms}=await request('/llms-full.txt');check(llms.includes('189,00€ be PVM'),'Core LLM product price');
const {text:robots}=await request('/robots.txt');check(robots.includes('Disallow: /'),'Private robots');
for(const host of ['signaturepads.lt','www.signaturepads.lt','foreign.example']){
  const {response}=await request('/',{headers:{host}});check(response.status===404,`Private host ${host}`);
}
for(const p of ['/gift/signaturepads/prekes','/niche/signaturepads/lead','/wp-admin/','/wp-json/wp/v2/pages'])check((await request(p)).response.status===404,`Internal/WordPress path ${p}`);
const media=[...new Set(pkg.pages.flatMap(p=>p.media.map(m=>m.src)))];
for(let offset=0;offset<media.length;offset+=8)await Promise.all(media.slice(offset,offset+8).map(async src=>{
  const r=await fetch(origin+src,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(15000)});
  check(r.status===200&&r.headers.get('content-type')?.includes('image/webp'),`Media ${src}: ${r.status}`);report.assets++;
}));
for(let offset=0;offset<aliases.length;offset+=8)await Promise.all(aliases.slice(offset,offset+8).map(async alias=>{
  const r=await fetch(origin+alias.from,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(15000)});
  const asset=pkg.pages.find(p=>p.id===alias.pageId)?.media.find(m=>m.id===alias.assetId);
  check(r.status===307&&asset&&new URL(r.headers.get('location'),origin).pathname===asset.src,`Legacy media ${alias.from}`);report.legacyAssets++;
}));
const foreign=await request(media[0],{headers:{host:'promedical.lt'}});check(foreign.response.status===404,'Foreign site media isolation');
const ids=[],marker='CORE-LOCAL-VERIFY-'+randomUUID();
report.testMarker=marker;report.inquiryIds=ids;
const form=async()=>{
  const {text}=await request('/');const id=text.match(/name="inquiry_id" value="([0-9a-f-]+)"/)?.[1];check(id,'Native form inquiry ID');ids.push(id);
  await writeFile(path.join(out,'core-http-verification.json'),JSON.stringify(report,null,2)+'\n');
  return new URLSearchParams({inquiry_id:id,name:marker,email:'core-local@example.invalid',phone:'+370 000 00000',preference:'Telefonu',message:marker,consent:'yes'});
};
const post=async(body,{accept='application/json',originHeader=origin}={})=>request('/uzklausa',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded',accept,origin:originHeader,referer:origin+'/'},body:String(body)});
try{
  const jsonForm=await form();let result=await post(jsonForm);check(result.response.status===200&&result.response.headers.get('content-type')?.includes('json'),'JSON inquiry');
  check(JSON.parse(result.text).message.includes('tikras el. laiškas neišsiųstas'),'Disabled-mail receipt');
  result=await post(jsonForm);check(result.response.status===200,'Identical retry should retain one inquiry');
  const conflict=new URLSearchParams(jsonForm);conflict.set('message',marker+' changed');check((await post(conflict)).response.status===409,'Changed payload cannot reuse the inquiry ID');
  const nativeForm=await form();nativeForm.set('message',marker+' '+ 'ą'.repeat(2750));
  result=await post(nativeForm,{accept:'text/html'});check(result.response.status===200&&result.response.headers.get('content-type')?.includes('text/html'),'Native no-JS HTML inquiry with valid encoded Unicode');
  check(result.text.includes('tikras el. laiškas neišsiųstas'),'Native receipt is truthful');
  const invalidCases=[['no-consent',body=>body.delete('consent'),400],['too-long-message',body=>body.set('message','x'.repeat(3001)),400],['phone-required',body=>body.delete('phone'),400],['honeypot',body=>body.set('website','bot'),200]];
  for(const [label,mutate,status]of invalidCases){const body=await form();mutate(body);check((await post(body)).response.status===status,label);report.forms.push({case:label,status});}
  const badOrigin=await form();check((await post(badOrigin,{originHeader:'https://foreign.example'})).response.status===403,'Foreign origin');
  const rows=db(`SELECT id,site_id,name,email,message,source_path,status,created_at,consent_at FROM niche_leads WHERE site_id='signaturepads' AND id IN (${ids.map(sql).join(',')})`);
  check(rows.length===2,'Exactly two accepted inquiries despite retry/invalid forms');
  check(rows.every(r=>r.status==='new'&&r.consent_at===r.created_at&&r.source_path==='/'&&r.message.includes('Telefono nr.: +370 000 00000')&&r.message.includes('Susisiekti: Telefonu')),'D1 retains phone/preference, consent, source and disabled delivery status');
  report.forms.push({case:'native-html-unicode',status:200},{case:'json',status:200},{case:'idempotent-retry',rows:1},{case:'different-payload-same-id',status:409},{case:'foreign-origin',status:403},{case:'durable-storage',acceptedRows:rows.length,phone:true,preference:true,consent:true,mailSent:false});
  report.status='PASS';report.packageSha256=createHash('sha256').update(await readFile(path.join(engine,'content-packages/signaturepads/content-package.json'))).digest('hex');
}finally{
  if(ids.length){db(`DELETE FROM niche_leads WHERE site_id='signaturepads' AND name=${sql(marker)} AND id IN (${ids.map(sql).join(',')})`);
    check(db(`SELECT id FROM niche_leads WHERE site_id='signaturepads' AND name=${sql(marker)} AND id IN (${ids.map(sql).join(',')})`).length===0,'Exact synthetic cleanup');report.syntheticCleanup=true;}
  await writeFile(path.join(out,'core-http-verification.json'),JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify({status:report.status,pages:report.pages.length,assets:report.assets,legacyAssets:report.legacyAssets,formCases:report.forms.length,mailSent:false,syntheticCleanup:report.syntheticCleanup}));
