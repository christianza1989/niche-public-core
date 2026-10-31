import test from 'node:test';import assert from'node:assert/strict';import{createHash}from'node:crypto';
import{validateV2Admission,assertPreviewSandbox}from'../scripts/content-v2-admission.mjs';
import{hostedPreviewAdmission,hostedPreviewRequest,hostedInquiryRequest}from'../lib/content-hosted-preview.mjs';
import{hostedContentPreviewConfig}from'../scripts/hosted-content-preview.mjs';
const pkg={siteId:'qa',canonicalHost:'qa.example',locale:'lt-LT',site:{renderer:'gift',contact:{email:'team@qa.example'}}},raw=JSON.stringify(pkg),sha256=createHash('sha256').update(raw).digest('hex');
const inquiry={sender:'forms@sender.example',recipient:'team@qa.example',transport:'hostinger-api'};
const checks=Object.fromEntries(['schema','routing','seo','forms','media','time','revocation','isolation','inquiry-authorization','mail-authentication'].map(key=>[key,{status:'PASS',evidence:[{path:'fixture/'+key,sha256}]}]));
const receipt={schemaVersion:1,scope:'hosted-inquiries',readOnly:false,testOnly:true,siteId:pkg.siteId,canonicalHost:pkg.canonicalHost,renderer:'gift',packageSha256:sha256,reviewer:'fixture',acceptedAt:'2026-10-31T00:00:00Z',previewHost:'qa-review.fixture.workers.dev',inquiry,checks};
const admission=hostedPreviewAdmission({qa:validateV2Admission(pkg,raw,receipt)});
const target={siteId:'qa',accountId:'a'.repeat(32),workerName:'qa-review',previewHost:receipt.previewHost,inquiryDatabaseId:'7a368e84-14b9-4711-9c6d-1350f9810778',mailboxId:'ACfixture',rateLimitNamespaceId:'834631031'};
function env(){return{DB:{},INQUIRY_RATE_LIMIT:{limit:async()=>({success:true})},LEAD_HOSTINGER_ENABLED:'1',LEAD_HOSTINGER_SITE_ID:'qa',LEAD_HOSTINGER_SENDER:inquiry.sender,LEAD_HOSTINGER_MAILBOX_ID:'ACfixture',LEAD_HOSTINGER_API_KEY:'fixture-key-not-real',LEAD_SMTP_ENABLED:'0'};}
const post=(path='/uzklausa',headers={})=>new Request('https://'+receipt.previewHost+path,{method:'POST',headers:{origin:'https://'+receipt.previewHost,...headers},body:'unread'});
test('hosted inquiries need owner/auth evidence, exact package and declared contact recipient; cannot loosen read-only or production admission',()=>{
 assert.equal(admission.readOnly,false);assert.deepEqual(admission.inquiry,inquiry);
 for(const change of[{readOnly:true},{testOnly:false},{checks:{}},{inquiry:{...inquiry,apiKey:'must-not-compile'}},{inquiry:{...inquiry,recipient:'other@qa.example'}},{inquiry:{...inquiry,transport:'smtp'}},{inquiry:{...inquiry,sender:'bad\r\nBcc: x@y.example'}},{previewHost:'qa.example'}])assert.throws(()=>validateV2Admission(pkg,raw,{...receipt,...change}));
 assert.throws(()=>validateV2Admission(pkg,raw+' ',receipt));assert.throws(()=>validateV2Admission(pkg,raw,{...receipt,scope:'production'}),/ownership/);
 assert.throws(()=>validateV2Admission(pkg,raw,{...receipt,scope:'hosted-preview'}),/readOnly/);assert.throws(()=>assertPreviewSandbox('D:/Core/source',receipt));
});
test('only exact hosted-origin POST /uzklausa is admitted; other mutations and aliases remain blocked before body consumption',()=>{
 const request=post();assert.equal(hostedPreviewRequest(request,admission),null);assert.equal(request.bodyUsed,false);
 for(const path of ['/uzklausa/','/ivykius','/api/send','/niche/qa/lead','/_next/static/file.js'])assert.equal(hostedPreviewRequest(post(path),admission).status,503);
 assert.equal(hostedPreviewRequest(new Request('https://foreign.example/uzklausa',{method:'POST'}),admission).status,404);
 for(const method of ['PUT','DELETE','PATCH'])assert.equal(hostedPreviewRequest(new Request('https://'+receipt.previewHost+'/uzklausa',{method}),admission).status,503);
});
test('mail opt-in fails closed on missing/mismatched bindings, sender, site, secrets or origin; never consumes the form itself',async()=>{
 assert.equal(await hostedInquiryRequest(post(),env(),admission),null);
 for(const change of [{DB:undefined},{INQUIRY_RATE_LIMIT:undefined},{LEAD_HOSTINGER_ENABLED:'0'},{LEAD_HOSTINGER_SITE_ID:'other'},{LEAD_HOSTINGER_SENDER:'other@sender.example'},{LEAD_HOSTINGER_API_KEY:''},{LEAD_HOSTINGER_MAILBOX_ID:''},{LEAD_SMTP_ENABLED:'1'},{LEAD_EMAIL:{}}]){const request=post();assert.equal((await hostedInquiryRequest(request,{...env(),...change},admission)).status,503);assert.equal(request.bodyUsed,false);}
 assert.equal((await hostedInquiryRequest(post('/uzklausa',{origin:'https://foreign.example'}),env(),admission)).status,403);
 const noOrigin=post();noOrigin.headers.delete('origin');assert.equal((await hostedInquiryRequest(noOrigin,env(),admission)).status,403);
 const referer=post();referer.headers.delete('origin');referer.headers.set('referer','https://'+receipt.previewHost+'/');assert.equal(await hostedInquiryRequest(referer,env(),admission),null);
});
test('rate limit is applied before native storage/mail; saturation and failure are truthful private responses',async()=>{
 let key;const request=post('/uzklausa',{'cf-connecting-ip':'192.0.2.10'}),bindings=env();bindings.INQUIRY_RATE_LIMIT.limit=async value=>{key=value.key;return{success:false};};
 const response=await hostedInquiryRequest(request,bindings,admission);assert.equal(response.status,429);assert.equal(key,'qa:192.0.2.10');assert.equal(response.headers.get('retry-after'),'60');assert.match(response.headers.get('x-robots-tag'),/noindex/);assert.equal(request.bodyUsed,false);
 bindings.INQUIRY_RATE_LIMIT.limit=async()=>{throw Error('unavailable');};assert.equal((await hostedInquiryRequest(post(),bindings,admission)).status,503);
 assert.equal(await hostedInquiryRequest(post(),bindings,null),null);
});
test('build binds only the isolated inquiry DB and authenticated mailbox; credentials never enter vars and unrelated services stay disabled',()=>{
 const config=hostedContentPreviewConfig(target,{qa:admission});assert.equal(config.d1_databases[0].database_name,'qa-preview-inquiries');assert.equal(config.d1_databases[0].database_id,target.inquiryDatabaseId);assert.equal(config.vars.LEAD_HOSTINGER_SENDER,inquiry.sender);assert.equal(config.vars.LEAD_HOSTINGER_SITE_ID,'qa');assert.equal(config.vars.LEAD_HOSTINGER_ENABLED,'1');assert.equal('LEAD_HOSTINGER_API_KEY'in config.vars,false);assert.equal(config.vars.LEAD_SMTP_ENABLED,'0');assert.deepEqual(config.send_email,[]);assert.deepEqual(config.routes,[]);assert.deepEqual(config.r2_buckets,[]);assert.equal(config.ratelimits[0].simple.limit,10);assert.equal(config.ratelimits[0].simple.period,60);
 for(const change of[{inquiryDatabaseId:''},{inquiryDatabaseId:'00000000-0000-4000-8000-000000000000'},{mailboxId:''},{rateLimitNamespaceId:'invalid'}])assert.throws(()=>hostedContentPreviewConfig({...target,...change},{qa:admission}));
});
