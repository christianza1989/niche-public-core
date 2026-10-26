import {request} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const config=JSON.parse(await readFile(new URL('../../output/memocasting-runtime/wrangler.local.json',import.meta.url),'utf8'));
assert.equal(config.vars.LEAD_SMTP_ENABLED,'0');assert.equal(config.send_email.length,0);
const body=new URLSearchParams({source_path:'/pl/kontaktai',name:'Unicode Form Test',email:'unicode-native@example.test',message:'Ž'.repeat(3000),consent:'yes'}).toString();
const result=await new Promise((resolve,reject)=>{
 const req=request('http://127.0.0.1:8817/uzklausa',{method:'POST',headers:{origin:'http://127.0.0.1:8817','content-type':'application/x-www-form-urlencoded','content-length':Buffer.byteLength(body)}},response=>{
  let html='';response.on('data',data=>html+=data);response.on('end',()=>resolve({status:response.statusCode,native:html.includes('lang="pl"')}));
 });req.on('error',reject);req.end(body);
});
console.log(JSON.stringify({messageCharacters:3000,encodedBodyBytes:Buffer.byteLength(body),...result,realMail:false}));
assert.equal(result.status,200);assert.equal(result.native,true);
await writeFile(new URL('../../output/audits/memocasting-native-unicode-form.json',import.meta.url),JSON.stringify({checkedAt:new Date().toISOString(),state:'LOCAL_MAX_NATIVE_FORM_PASS',messageCharacters:3000,encodedBodyBytes:Buffer.byteLength(body),...result,realMail:false},null,2));
