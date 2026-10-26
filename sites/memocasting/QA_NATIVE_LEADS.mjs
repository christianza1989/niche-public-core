// Synthetic local-only contacts; configured notifications must be OFF.
import {request} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const config=JSON.parse(await readFile(new URL('../../output/memocasting-runtime/wrangler.local.json',import.meta.url),'utf8'));
assert.equal(config.vars.LEAD_SMTP_ENABLED,'0');
assert.equal(config.send_email.length,0);
const observations=[];
async function post(fields,origin='http://127.0.0.1:8817'){
 const body=new URLSearchParams(fields).toString();
 return new Promise((resolve,reject)=>{
  const req=request('http://127.0.0.1:8817/uzklausa',{method:'POST',headers:{origin,'content-type':'application/x-www-form-urlencoded','content-length':Buffer.byteLength(body)}},response=>{
   let html='';response.on('data',d=>html+=d);response.on('end',()=>resolve({status:response.statusCode,html,headers:response.headers}));
  });req.on('error',reject);req.end(body);
 });
}
for(const [language,prefix] of [['lt',''],['pl','pl/'],['lv','lv/'],['et','et/']]){
 const fields={source_path:'/'+prefix+'kontaktai',name:'Local Form Test',email:'local-native-form@example.test',message:'Local synthetic contact validation, with real delivery disabled.',consent:'yes'};
 const bad=await post({...fields,email:'bad',message:'Short'});assert.equal(bad.status,400);assert.ok(bad.html.includes('lang="'+language+'"'));assert.ok(bad.headers['cache-control'].includes('no-store'));
 const good=await post(fields);assert.equal(good.status,200);assert.ok(good.html.includes('lang="'+language+'"'));assert.ok(good.html.includes('href="/'+prefix.replace(/\/$/,'')+'"'));
 observations.push({language,invalidStatus:bad.status,validStatus:good.status,sourcePath:fields.source_path});
}
assert.equal((await post({source_path:'/pl/cart'})).status,503);
assert.equal((await post({source_path:'/et/kontaktai'},'https://other.example')).status,403);
const report={state:'LOCAL_NATIVE_CONTACTS_PASS_NO_OUTBOUND',checkedAt:new Date().toISOString(),observations,syntheticMessagesSaved:4,notificationsEnabled:false,limits:['Mailbox delivery and operator reply are not asserted','No customer data, SMTP authentication or real email used']};
await writeFile(new URL('../../output/audits/memocasting-native-contacts.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
