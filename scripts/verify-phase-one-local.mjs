// Local marked form test. Never send mail or read unrelated inquiries.
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
const config=JSON.parse(await readFile('dist/server/wrangler.json','utf8'));
assert.ok(!config.send_email?.length,'Test requires a preview without email binding');
// Caller starts the root-owned preview with explicit LEAD_SMTP_ENABLED:0.
const siteId=process.env.PHASE_ONE_SITE_ID||'traktoriupadangos';
assert.match(siteId,/^[a-z0-9][a-z0-9-]{1,62}$/);
const id=randomUUID(), name=`AUDIT-${id}`, source=process.env.PHASE_ONE_SOURCE_PATH||'/gidas/traktoriaus-padangu-zymejimas';
assert.match(source,/^\/[a-z0-9/-]*$/);
const base=process.env.PHASE_ONE_BASE_URL||'http://127.0.0.1:8787';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname),'Synthetic storage test is local only');
const headers={origin:base,referer:base+source,'content-type':'application/x-www-form-urlencoded'};
const pkg=JSON.parse(await readFile(`content-packages/${siteId}/content-package.json`,'utf8'));
const home=await new Promise((resolve,reject)=>{request(new URL('/',base),res=>{let body='';res.setEncoding('utf8');res.on('data',c=>body+=c);res.on('end',()=>resolve({status:res.statusCode,body}));}).on('error',reject).end();});
assert.equal(home.status,200);assert.ok(home.body.includes(`href="https://${pkg.canonicalHost}/"`),'Preview must serve the selected tenant before any synthetic POST');
function post(path,body,extra={},chunked=false){return new Promise((resolve,reject)=>{const req=request(new URL(path,base),{method:'POST',agent:false,headers:{...headers,...(chunked?{'transfer-encoding':'chunked'}:{'content-length':Buffer.byteLength(body)}),...extra}},res=>{let text='';res.setEncoding('utf8');res.on('data',part=>text+=part);res.on('end',()=>resolve({status:res.statusCode,text}));});req.on('error',reject);if(chunked){req.write(body.slice(0,6000));req.end(body.slice(6000));}else req.end(body);});}
const valid=new URLSearchParams({name,email:'info@pinet.lt',message:`AUDIT_SELF_TEST ${id}; tik sintetinis vietinis formos bandymas.`,consent:'yes',website:''}).toString();
const checks={};
checks.shortName=(await post('/uzklausa',new URLSearchParams({name:'A',email:'info@pinet.lt',message:'Pakankamai ilga testinė žinutė',consent:'yes'}).toString())).status;assert.equal(checks.shortName,400);
checks.noConsent=(await post('/uzklausa',valid.replace('consent=yes','consent='))).status;assert.equal(checks.noConsent,400);
checks.invalidEmail=(await post('/uzklausa',new URLSearchParams({name,email:'invalid',message:'Pakankamai ilga testinė žinutė',consent:'yes'}).toString())).status;assert.equal(checks.invalidEmail,400);
checks.origin=(await post('/uzklausa',valid,{origin:'https://outside.invalid'})).status;assert.equal(checks.origin,403);
checks.size=(await post('/uzklausa','x='.padEnd(10010,'a'))).status;assert.equal(checks.size,400);
checks.chunkedSize=(await post('/uzklausa','x='.padEnd(10010,'a'),{},true)).status;assert.equal(checks.chunkedSize,400);
checks.honeypot=(await post('/uzklausa',valid.replace('website=','website=bot'))).status;assert.equal(checks.honeypot,200);
checks.unknownHost=(await post('/uzklausa','',{host:'unknown-domain.example'})).status;assert.equal(checks.unknownHost,404);
const accepted=await post('/uzklausa',valid);assert.equal(accepted.status,200);assert.match(accepted.text,/tik šiame kompiuteryje/);checks.accepted=200;
const execute=promisify(execFile);
async function sql(command){const {stdout}=await execute(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--config','dist/server/wrangler.json','--local','--persist-to','.wrangler/state','--command',command,'--json'],{maxBuffer:512000});return JSON.parse(stdout);}
const results=await sql(`SELECT id,site_id,source_path,status,consent_at FROM niche_leads WHERE name='${name}' AND site_id='${siteId}'`);
const rows=results.flatMap(x=>x.results??[]);assert.equal(rows.length,1);assert.equal(rows[0].source_path,source);assert.equal(rows[0].status,'new');
assert.ok(rows[0].consent_at>0);
// Remove only the one synthetic ID selected under the unique test name/site.
assert.match(rows[0].id,/^[a-f0-9-]{36}$/);
await sql(`DELETE FROM niche_leads WHERE id='${rows[0].id}' AND name='${name}' AND site_id='${siteId}'`);
const after=await sql(`SELECT COUNT(*) AS n FROM niche_leads WHERE name='${name}' AND site_id='${siteId}'`);assert.equal(after[0].results[0].n,0);
await mkdir('output/audits',{recursive:true});const evidence={at:new Date().toISOString(),siteId,synthetic:true,checks,durableStored:true,storedStatus:'new',consentTimestampStored:true,smtpDisabled:true,noVoiceCoreDependency:true,syntheticRecordRemoved:true};await writeFile(`output/audits/${siteId==='traktoriupadangos'?'tractor':siteId}-form-local.json`,JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
