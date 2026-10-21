import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const site=path.resolve(import.meta.dirname,'..'),repo=path.resolve(site,'../..');
const manifest=JSON.parse(await readFile(path.join(site,'handoff/FILES.json')));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const item of manifest.files){const bytes=await readFile(path.join(repo,item.file));if(hash(bytes)!==item.sha256)throw Error('Source or asset hash mismatch: '+item.file);}
const originals=JSON.parse(await readFile(path.join(site,'media-originals/MANIFEST.json')));
for(const item of originals.objects)if(hash(await readFile(path.join(site,'media-originals',item.file)))!==item.sha256)throw Error('Original image hash mismatch: '+item.file);
const due=JSON.parse(await readFile(path.join(site,'releases/production-20261013/content-package.json'))),next=JSON.parse(await readFile(path.join(site,'content-next6-20261015/release-final/content-package.json')));
if(due.pages.length!==135||next.pages.length!==141)throw Error('Content edition mismatch');
for(const page of due.pages){const same=next.pages.find(x=>x.id===page.id);if(JSON.stringify(same)!==JSON.stringify(page))throw Error('Prior approved page changed: '+page.id);}
console.log(JSON.stringify({state:'PASS',recoveredFiles:manifest.files.length,originalImages:originals.objects.length,productionPackagePages:135,nextPackagePages:141,priorPagesPreserved:135,productionChanged:false}));
