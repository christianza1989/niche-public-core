// Actual workerd + D1 + private service binding. No network SMTP/auth/provider.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {build} from 'esbuild';
import * as installedRuntime from 'miniflare';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const args=process.argv.slice(2),argument=name=>args.includes(name)?args[args.indexOf(name)+1]:null;
const runtimeArgument=argument('--runtime'),runtimeModule=runtimeArgument?await import(pathToFileURL(resolve(runtimeArgument)).href):installedRuntime;
const configuredCompatibilityDate=JSON.parse(await readFile(new URL('./wrangler.jsonc',import.meta.url),'utf8')).compatibility_date;
const runtimeCompatibilityDate=argument('--compatibility-date')||configuredCompatibilityDate;
if(!/^\d{4}-\d{2}-\d{2}$/.test(runtimeCompatibilityDate))throw Error('Invalid explicit runtime date');
const bundle=async file=>(await build({entryPoints:[new URL(file,import.meta.url).pathname.replace(/^\/(\w:)/,'$1')],bundle:true,write:false,format:'esm',platform:'browser',external:['cloudflare:sockets']})).outputFiles[0].text;
let sends=0;
const options={workers:[
 {name:'caller',modules:true,compatibilityDate:runtimeCompatibilityDate,script:`export default {fetch(request,env){return env.COMMERCE_MAIL.fetch(new Request('https://core-mail.internal'+new URL(request.url).pathname,request));}}`,serviceBindings:{COMMERCE_MAIL:'mail'}},
 {name:'mail',modules:true,compatibilityDate:runtimeCompatibilityDate,script:await bundle('./test/fixture-worker.mjs'),d1Databases:{COMMERCE_MAIL_DB:'mail-fixture-only'},serviceBindings:{SMTP_FIXTURE:async()=>{sends++;return new Response('DATA250 fixture');}}},
 {name:'disabled',modules:true,compatibilityDate:runtimeCompatibilityDate,script:await bundle('./index.mjs'),bindings:{COMMERCE_MAIL_ENABLED:'0',COMMERCE_ENVIRONMENT:'sandbox',COMMERCE_STORE_ID:'memo-fixture'},d1Databases:{COMMERCE_MAIL_DB:'mail-disabled-only'}}
]};
const runtime=new runtimeModule.Miniflare(runtimeModule.convertV4MiniflareOptions?runtimeModule.convertV4MiniflareOptions(options):options);
try{
 const db=await runtime.getD1Database('COMMERCE_MAIL_DB','mail');await db.prepare(await readFile(new URL('./migrations/0001_mail_messages.sql',import.meta.url),'utf8')).run();
 const payload={schemaVersion:1,environment:'sandbox',storeId:'memo-fixture',id:'commerce-native-123',messageId:'<commerce-native-123@example.test>',from:'sender@example.test',to:'buyer@example.test',replyTo:'info@memorycasting.lt',subject:'Vietinis bandymas',text:'Tik sintetiniai duomenys; jokio laiško.'};
 const post=(body=payload)=>runtime.dispatchFetch('http://caller/commerce/messages/'+body.id,{method:'POST',body:JSON.stringify(body)});
 const responses=await Promise.all([post(),post()]);for(const response of responses)assert.equal(response.status,200);assert.equal(sends,1);
 const receipt=await (await runtime.dispatchFetch('http://caller/commerce/messages/'+payload.id)).json();assert.equal(receipt.status,'accepted');assert.equal(receipt.reference,'smtp-accepted:'+payload.messageId);
 assert.equal((await post()).status,200);assert.equal(sends,1);
 assert.equal((await post({...payload,text:'Different immutable message'})).status,409);
 assert.equal((await post({...payload,id:'commerce-wrong-context',storeId:'other'})).status,403);
 const disabled=await runtime.getWorker('disabled');assert.equal((await disabled.fetch('https://core-mail.internal/commerce/messages/'+payload.id,{method:'POST',body:JSON.stringify(payload)})).status,503);assert.equal(sends,1);
 const stored=await db.prepare('SELECT COUNT(*) AS count FROM commerce_mail_messages').first();assert.equal(stored.count,1);
 const report={state:runtimeCompatibilityDate===configuredCompatibilityDate?'LOCAL_CONFIGURED_NATIVE_MAIL_BINDING_PASS':'OLDER_RUNTIME_MAIL_FIXTURE_PASS_NOT_CONFIG_ACCEPTANCE',checkedAt:new Date().toISOString(),runtimeCompatibilityDate,configuredCompatibilityDate,runtimeSource:runtimeArgument?'explicit canonical companion dependency':'installed public dependency',nativeWorker:true,d1:true,privateServiceBinding:true,smtpAttempts:1,realSmtpAttempts:0,providerAuth:false,limits:[...(runtimeCompatibilityDate===configuredCompatibilityDate?[]:['Runtime date differs from configuration; not exact-config acceptance']),'SMTP transport is a fixture; actual DATA250 socket protocol verified separately','No mailbox receipt, production deployment or live-send admission']};
 await mkdir(new URL('../../output/audits/',import.meta.url),{recursive:true});await writeFile(new URL('../../output/audits/commerce-mail-native.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await runtime.dispose();}
