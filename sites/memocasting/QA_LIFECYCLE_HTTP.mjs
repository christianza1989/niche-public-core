import {request} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const phase=process.argv[2],target='gidai/liejinio-dazymas-ir-prieziura';
const source=JSON.parse(await readFile(new URL('../../content-packages/memocasting/content-package.json',import.meta.url)));
const media=source.pages.find(p=>p.slug===target).media[0].src;
const out=[];
for(const path of ['/'+target,'/gidai','/sitemap.xml','/llms.txt','/llms-full.txt',media,...(phase==='revoked'?['/','/gidai/dziovinimas-ir-isemimas']:[])]){
 const r=await new Promise((resolve,reject)=>request(new URL(path,'http://localhost:8819'),{headers:{host:'memocasting.lt'}},res=>{let b='';res.on('data',s=>b+=s);res.on('end',()=>resolve({status:res.statusCode,cache:res.headers['cache-control'],body:b}));}).on('error',reject).end());
 const hidden=['before','revoked'].includes(phase);
 assert.equal(r.status,path==='/'+target||path===media?hidden?404:200:200,phase+' '+path);
 assert.ok(r.cache?.includes('no-store')||path===media,phase+' cache '+path);
 const contains=r.body.includes('https://memocasting.lt/'+target)||r.body.includes('href="/'+target+'"');
 if(path!==media)assert.equal(contains,!hidden,phase+' visible URL '+path);
 if(phase==='corrected'&&['/'+target,'/llms.txt','/llms-full.txt'].includes(path))assert.ok(r.body.includes('Vietinės QA kopijos pataisa.'),phase+' correction '+path);
 out.push({path,status:r.status,cache:r.cache,contains});
}
const report={phase,checkedAt:new Date().toISOString(),state:'LIFECYCLE_HTTP_PASS_ISOLATED_DEV',out};
await writeFile(new URL('../../output/audits/memocasting-lifecycle-'+phase+'.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
