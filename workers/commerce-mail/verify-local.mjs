// Actual workerd + D1 + private service binding. No network SMTP/auth/provider.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';
const bundle=async file=>(await build({entryPoints:[new URL(file,import.meta.url).pathname.replace(/^\/(\w:)/,'$1')],bundle:true,write:false,format:'esm',platform:'browser',external:['cloudflare:sockets']})).outputFiles[0].text;
let sends=0;
const runtime=new Miniflare({workers:[
 {name:'caller',modules:true,compatibilityDate:'2026-05-22',script:`export default {fetch(request,env){return env.COMMERCE_MAIL.fetch(new Request('https://core-mail.internal'+new URL(request.url).pathname,request));}}`,serviceBindings:{COMMERCE_MAIL:'mail'}},
 {name:'mail',modules:true,compatibilityDate:'2026-05-22',script:await bundle('./test/fixture-worker.mjs'),d1Databases:{COMMERCE_MAIL_DB:'mail-fixture-only'},serviceBindings:{SMTP_FIXTURE:async()=>{sends++;return new Response('DATA250 fixture');}}},
 {name:'disabled',modules:true,compatibilityDate:'2026-05-22',script:await bundle('./index.mjs'),bindings:{COMMERCE_MAIL_ENABLED:'0',COMMERCE_ENVIRONMENT:'sandbox',COMMERCE_STORE_ID:'memo-fixture'},d1Databases:{COMMERCE_MAIL_DB:'mail-disabled-only'}}
]});
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
 const report={state:'LOCAL_NATIVE_MAIL_BINDING_PASS',checkedAt:new Date().toISOString(),runtimeCompatibilityDate:'2026-05-22',configuredCompatibilityDate:'2026-10-12',nativeWorker:true,d1:true,privateServiceBinding:true,smtpAttempts:1,realSmtpAttempts:0,providerAuth:false,limits:['Installed public workerd supports2026-05-22; new2026-10-12 configuration requires matching newer runtime before production acceptance','SMTP transport is a fixture; actual DATA250 socket protocol verified separately','No mailbox receipt, production deployment or live-send admission']};
 await mkdir(new URL('../../output/audits/',import.meta.url),{recursive:true});await writeFile(new URL('../../output/audits/commerce-mail-native.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await runtime.dispose();}
