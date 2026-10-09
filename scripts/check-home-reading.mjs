// Read-only regression: canonical home blocks should be present in actual HTML.
import {readFile,writeFile} from 'node:fs/promises';
import {request} from 'node:http';
import {spawnSync} from 'node:child_process';
const packages=JSON.parse(await readFile('lib/generated/content-packages.json','utf8')),rows=[];
for(const p of packages){const home=p.pages.find(x=>x.type==='home');const html=await new Promise((resolve,reject)=>{request('http://127.0.0.1:8794/',{headers:{host:p.canonicalHost}},r=>{let text='';r.on('data',c=>text+=c);r.on('end',()=>resolve(text));}).on('error',reject).end();});rows.push({siteId:p.siteId,html,texts:home.body.flatMap(b=>b.text?[b.text]:b.items||[])});}
const run=spawnSync('python',['-c',"import sys,json;sys.path.insert(0,'../nisiniai_puslapiai_monetizavimui/SKILLS/niche-site-audit/scripts');from rendered_site import Document,norm;rows=json.load(sys.stdin);print(json.dumps([{'siteId':r['siteId'],'missing':[t for t in r['texts'] if norm(t) not in norm(Document(r['html']).root.text())]} for r in rows]))"],{env:{...process.env,PYTHONUTF8:'1'},input:JSON.stringify(rows),encoding:'utf8'});
if(run.status)throw Error(run.stderr);await writeFile('output/audits/roletai/home-reading-alignment.json',run.stdout);console.log(run.stdout);
