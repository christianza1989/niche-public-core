// Isolated local durable-counter verification; restores only this test's increments.
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {readdirSync} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
const base='http://127.0.0.1:8794',site='roletaiklaipedoje',page='/gidai/matmenys-uzklausai';
const home=await new Promise((resolve,reject)=>{request(base,res=>{let text='';res.setEncoding('utf8');res.on('data',c=>text+=c);res.on('end',()=>resolve({status:res.statusCode,text}));}).on('error',reject).end();});
assert.equal(home.status,200);assert.ok(home.text.includes('href="https://roletaiklaipedoje.lt/"'));
const dir='.wrangler/state/v3/d1/miniflare-D1DatabaseObject',files=readdirSync(dir).filter(f=>f.endsWith('.sqlite')&&f!=='metadata.sqlite');
assert.equal(files.length,1,'Require an unambiguous isolated D1 database');
const db=new DatabaseSync(`${dir}/${files[0]}`),day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Vilnius',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const params=[site,day,page,'email_click'];
const select=db.prepare('SELECT count FROM niche_interest_daily WHERE site_id=? AND day=? AND page_path=? AND event=?');
const original=select.get(...params);let increments=0;
function post(body,headers={}){return new Promise((resolve,reject)=>{const req=request(base+'/ivykius',{method:'POST',headers:{origin:base,'content-type':'application/json','content-length':Buffer.byteLength(body),'user-agent':'NicheLocalIntegration/1',...headers}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});req.on('error',reject);req.end(body);});}
const event=JSON.stringify({event:'email_click',path:page}),checks={};
try{
  for(let i=0;i<2;i++){assert.equal(await post(event),204);increments++;}
  assert.equal(select.get(...params).count,(original?.count||0)+2);
  for(const [name,body,headers,expected]of [
    ['origin',event,{origin:'https://outside.invalid'},403],['invalid','{}',{},400],
    ['private',JSON.stringify({event:'email_click',path:'/gidai/pelesis'}),{},404],['size','x'.repeat(513),{},413],
    ['dnt',event,{dnt:'1'},204],['gpc',event,{'sec-gpc':'1'},204],['bot',event,{'user-agent':'HeadlessChrome Lighthouse'},204],
    ['unknownHost','',{host:'unknown-domain.example'},404]
  ]){checks[name]=await post(body,headers);assert.equal(checks[name],expected,name);}
  assert.equal(select.get(...params).count,(original?.count||0)+2,'Rejected and privacy-excluded events do not increment');
}finally{
  // A concurrent update must be preserved and reported, never overwritten.
  const current=select.get(...params)?.count||0;
  assert.equal(current,(original?.count||0)+increments,'Concurrent counter changes: preserve database and investigate');
  if(original)db.prepare('UPDATE niche_interest_daily SET count=? WHERE site_id=? AND day=? AND page_path=? AND event=? AND count=?').run(original.count,...params,current);
  else db.prepare('DELETE FROM niche_interest_daily WHERE site_id=? AND day=? AND page_path=? AND event=? AND count=?').run(...params,current);
  assert.equal(select.get(...params)?.count||0,original?.count||0);db.close();
}
const report={at:new Date().toISOString(),siteId:site,synthetic:true,durableAcceptedEvents:increments,checks,syntheticIncrementsRestored:true,noLeadsOrEmail:true};
await mkdir('output/audits/roletai',{recursive:true});await writeFile('output/audits/roletai/interest-local.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
