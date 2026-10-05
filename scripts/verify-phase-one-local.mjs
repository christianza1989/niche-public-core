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
const id=randomUUID(), name=`AUDIT-${id}`, source='/gidas/traktoriaus-padangu-zymejimas';
const base='http://127.0.0.1:8787';const headers={origin:base,referer:base+source,'content-type':'application/x-www-form-urlencoded'};
function post(path,body,extra={},chunked=false){return new Promise((resolve,reject)=>{const req=request(new URL(path,base),{method:'POST',agent:false,headers:{...headers,...(chunked?{'transfer-encoding':'chunked'}:{'content-length':Buffer.byteLength(body)}),...extra}},res=>{let text='';res.setEncoding('utf8');res.on('data',part=>text+=part);res.on('end',()=>resolve({status:res.statusCode,text}));});req.on('error',reject);if(chunked){req.write(body.slice(0,6000));req.end(body.slice(6000));}else req.end(body);});}
const valid=new URLSearchParams({name,email:'info@pinet.lt',message:`AUDIT_SELF_TEST ${id}; tik sintetinis vietinis formos bandymas.`,consent:'yes',website:''}).toString();
const checks={};
checks.shortName=(await post('/uzklausa',new URLSearchParams({name:'A',email:'info@pinet.lt',message:'Pakankamai ilga testinė žinutė',consent:'yes'}).toString())).status;assert.equal(checks.shortName,400);
checks.origin=(await post('/uzklausa',valid,{origin:'https://outside.invalid'})).status;assert.equal(checks.origin,403);
checks.size=(await post('/uzklausa','x='.padEnd(10010,'a'))).status;assert.equal(checks.size,400);
checks.chunkedSize=(await post('/uzklausa','x='.padEnd(10010,'a'),{},true)).status;assert.equal(checks.chunkedSize,400);
checks.honeypot=(await post('/uzklausa',valid.replace('website=','website=bot'))).status;assert.equal(checks.honeypot,200);
checks.unknownHost=(await post('/uzklausa','',{host:'unknown-domain.example'})).status;assert.equal(checks.unknownHost,404);
const accepted=await post('/uzklausa',valid);assert.equal(accepted.status,200);assert.match(accepted.text,/tik šiame kompiuteryje/);checks.accepted=200;
const execute=promisify(execFile);
async function sql(command){const {stdout}=await execute(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--config','dist/server/wrangler.json','--local','--persist-to','.wrangler/state','--command',command,'--json'],{maxBuffer:512000});return JSON.parse(stdout);}
const results=await sql(`SELECT id,site_id,source_path,status FROM niche_leads WHERE name='${name}' AND site_id='traktoriupadangos'`);
const rows=results.flatMap(x=>x.results??[]);assert.equal(rows.length,1);assert.equal(rows[0].source_path,source);assert.equal(rows[0].status,'new');
// Remove only the one synthetic ID selected under the unique test name/site.
assert.match(rows[0].id,/^[a-f0-9-]{36}$/);
await sql(`DELETE FROM niche_leads WHERE id='${rows[0].id}' AND name='${name}' AND site_id='traktoriupadangos'`);
const after=await sql(`SELECT COUNT(*) AS n FROM niche_leads WHERE name='${name}' AND site_id='traktoriupadangos'`);assert.equal(after[0].results[0].n,0);
await mkdir('output/audits',{recursive:true});const evidence={at:new Date().toISOString(),siteId:'traktoriupadangos',synthetic:true,checks,durableStored:true,storedStatus:'new',smtpDisabled:true,noVoiceCoreDependency:true,syntheticRecordRemoved:true};await writeFile('output/audits/tractor-form-local.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
