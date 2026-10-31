import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validateV2Admission,assertPreviewSandbox} from '../scripts/content-v2-admission.mjs';
import {hostedPreviewAdmission,hostedPreviewRequest,hostedPreviewResponse,hostedPreviewAssetResponse} from '../lib/content-hosted-preview.mjs';
import {hostedContentPreviewConfig} from '../scripts/hosted-content-preview.mjs';

const pkg={siteId:'qa',canonicalHost:'qa.example',locale:'lt-LT',site:{renderer:'gift'}};
const raw=JSON.stringify(pkg),sha256=createHash('sha256').update(raw).digest('hex');
const receipt={schemaVersion:1,scope:'hosted-preview',siteId:pkg.siteId,canonicalHost:pkg.canonicalHost,renderer:'gift',packageSha256:sha256,reviewer:'test fixture',acceptedAt:'2026-10-31T00:00:00Z',testOnly:true,readOnly:true,previewHost:'qa-review.fixture.workers.dev',checks:Object.fromEntries(['schema','routing','seo','forms','media','time','revocation','isolation'].map(key=>[key,{status:'PASS',evidence:[{path:'fixture/'+key,sha256}]}]))};
const admission=hostedPreviewAdmission({qa:validateV2Admission(pkg,raw,receipt)});

test('hosted preview binds exact bytes, explicit read-only target and actual local check evidence; production still requires launch checks',()=>{
  assert.equal(admission.previewHost,receipt.previewHost);
  assert.equal(admission.testOnly,true);
  for(const change of [{testOnly:false},{readOnly:false},{previewHost:'*.workers.dev'},{previewHost:'foreign.example'},{previewHost:'QA.fixture.workers.dev'},{checks:{}}])assert.throws(()=>validateV2Admission(pkg,raw,{...receipt,...change}));
  assert.throws(()=>validateV2Admission(pkg,raw+' ',receipt),/exact package/);
  assert.throws(()=>validateV2Admission(pkg,raw,{...receipt,scope:'production'}),/ownership/);
  const production={...receipt,scope:'production',checks:{...receipt.checks}};
  for(const key of ['ownership','dns','contacts','inbox','privacy'])production.checks[key]={status:'PASS',evidence:[{path:'fixture/'+key,sha256}]};
  assert.equal(validateV2Admission(pkg,raw,production).scope,'production');
  production.checks.inbox={status:'UNVERIFIED'};
  assert.throws(()=>validateV2Admission(pkg,raw,production),/inbox/);
  assert.throws(()=>assertPreviewSandbox('D:/Core/source/',receipt),/never main/);
  assertPreviewSandbox('D:/Core/output/review/',receipt);
  assert.throws(()=>hostedPreviewAdmission({qa:admission,other:admission}),/exactly one/);
});

test('only exact HTTPS preview authority or consistent loopback is admitted; forwarded headers cannot bypass it',()=>{
  assert.equal(hostedPreviewRequest(new Request('https://'+receipt.previewHost+'/prekes/'),admission),null);
  assert.equal(hostedPreviewRequest(new Request('http://127.0.0.1:8959/',{headers:{host:'127.0.0.1:8959'}}),admission),null);
  for(const url of ['http://'+receipt.previewHost+'/', 'https://qa.example/','https://other.fixture.workers.dev/','https://'+receipt.previewHost+'.attacker.example/'])assert.equal(hostedPreviewRequest(new Request(url,{headers:{'x-forwarded-host':receipt.previewHost}}),admission).status,404);
  assert.equal(hostedPreviewRequest(new Request('https://'+receipt.previewHost+'/',{headers:{host:'qa.example'}}),admission).status,404);
  assert.equal(hostedPreviewRequest(new Request('https://qa.example/',{headers:{host:receipt.previewHost}}),admission).status,404);
  assert.equal(hostedPreviewRequest(new Request('http://127.0.0.1:8959/',{headers:{host:receipt.previewHost}}),admission).status,404);
  assert.equal(hostedPreviewRequest(new Request('https://qa.example/'),null),null);
});

test('preview rejects form, event and API mutations before body consumption and cannot produce a successful inquiry receipt',async()=>{
  for(const path of ['/uzklausa','/ivykius','/api/anything']){
    const request=new Request('https://'+receipt.previewHost+path,{method:'POST',body:'private=must-not-be-read',headers:{Accept:'application/json'}});
    const response=hostedPreviewRequest(request,admission);
    assert.equal(request.bodyUsed,false);
    assert.equal(response.status,503);
    const value=await response.json();assert.equal(value.ok,false);assert.match(value.message,/nepavyko/);assert.equal('receipt' in value,false);
  }
  for(const method of ['PUT','PATCH','DELETE','OPTIONS'])assert.equal(hostedPreviewRequest(new Request('https://'+receipt.previewHost+'/',{method}),admission).status,503);
  assert.equal(hostedPreviewRequest(new Request('https://'+receipt.previewHost+'/',{method:'HEAD'}),admission),null);
});

test('HTML, static files, redirects and errors all receive noindex/no-store without losing headers or status',async()=>{
  for(const status of [200,204,301,404,500]){
    const original=new Response(status===204?null:'body',{status,headers:{Location:'/prekes/','Cache-Control':'public,max-age=3600'}});
    const response=hostedPreviewResponse(original,admission);
    assert.equal(response.status,status);assert.equal(response.headers.get('location'),'/prekes/');
    assert.equal(response.headers.get('cache-control'),'private, no-store');assert.match(response.headers.get('x-robots-tag'),/noindex.*nofollow.*noarchive/);
    assert.equal(await response.text(),status===204?'':'body');
  }
  const response=new Response('unchanged');assert.equal(hostedPreviewResponse(response,null),response);
});

test('build target cannot inherit customer D1/R2/mail or route the incumbent domain; mismatched targets fail closed',()=>{
  const target={siteId:'qa',accountId:'a'.repeat(32),workerName:'qa-review',previewHost:receipt.previewHost};
  const result=hostedContentPreviewConfig(target,{qa:admission});
  assert.equal(result.assets.run_worker_first,true);assert.equal(result.workers_dev,true);assert.equal(result.preview_urls,false);
  assert.deepEqual(result.routes,[]);assert.deepEqual(result.d1_databases,[]);assert.deepEqual(result.r2_buckets,[]);assert.deepEqual(result.send_email,[]);
  assert.equal(result.vars.LEAD_SMTP_ENABLED,'0');assert.equal(result.vars.LEAD_HOSTINGER_ENABLED,'0');assert.equal(result.vars.LEAD_EMAIL_ENABLED,'0');assert.equal(result.vars.VOICE_WIDGET_ENABLED,'0');
  assert.equal(result.observability.traces.enabled,true);
  for(const change of [{siteId:'other'},{accountId:'invalid'},{workerName:'other-worker'},{previewHost:'qa.example'}])assert.throws(()=>hostedContentPreviewConfig({...target,...change},{qa:admission}));
  assert.throws(()=>hostedContentPreviewConfig(target,{}));
});

test('Worker-first CSS/JS reach ASSETS with the exact authority/read-only/noindex gate; native content and private paths never bypass Core',async()=>{
  const calls=[],assets={fetch:async request=>{calls.push(request.url);return new Response('.sp-header{height:82px}',{headers:{'Content-Type':'text/css'}});}};
  const url='https://'+receipt.previewHost+'/_next/static/css/site.css';
  const response=await hostedPreviewAssetResponse(new Request(url),assets,admission);
  assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'text/css');assert.match(response.headers.get('x-robots-tag'),/noindex/);assert.match(await response.text(),/sp-header/);assert.equal(calls.length,1);
  assert.equal((await hostedPreviewAssetResponse(new Request(url.replace(receipt.previewHost,'foreign.example')),assets,admission)).status,404);
  const post=new Request(url,{method:'POST',body:'not consumed'});assert.equal((await hostedPreviewAssetResponse(post,assets,admission)).status,503);assert.equal(post.bodyUsed,false);assert.equal(calls.length,1);
  for(const pathname of ['/content-assets/qa/future.webp','/_next/server/private.js','/_next/staticx/file.js','/gift/qa','/'])assert.equal(await hostedPreviewAssetResponse(new Request('https://'+receipt.previewHost+pathname),assets,admission),null);
  assert.equal(await hostedPreviewAssetResponse(new Request(url),assets,null),null);assert.equal(calls.length,1);
});
