// Compose the canonical Worker-first asset boundary with an existing immutable
// Vinext build. Useful for an entry-only correction: no HTML, package, receipt,
// bundle or original Wrangler config is rewritten.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {hostedPreviewAdmission} from '../lib/content-hosted-preview.mjs';
import {hostedContentPreviewConfig} from './hosted-content-preview.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
if(!/(?:^|\/)(?:output|outputs)\//.test(root.replaceAll('\\','/')))throw Error('Owned output worktree required');
const server=path.join(root,'dist/server'),configFile=path.join(server,'wrangler.json');
const configBytes=await fs.readFile(configFile),config=JSON.parse(configBytes);
const registry=await fs.readFile(path.join(root,'lib/generated/content-admissions.json'));
const admissions=JSON.parse(registry),admission=hostedPreviewAdmission(admissions);
if(admission?.scope==='hosted-inquiries')throw Error('Inquiry activation requires a full native build, not a read-only entry adapter');
if(!admission||config.main!=='index.js'||config.no_bundle!==true)throw Error('Expected admitted Vinext no-bundle build');
const required=hostedContentPreviewConfig({siteId:admission.siteId,accountId:config.account_id,workerName:config.name,previewHost:admission.previewHost},admissions);
for(const key of ['vars','d1_databases','r2_buckets','send_email','routes'])if(JSON.stringify(config[key]||[])!==JSON.stringify(required[key]))throw Error('Unexpected preview '+key);
if(config.assets?.run_worker_first!==true||config.workers_dev!==true||config.preview_urls!==false)throw Error('Preview routing mismatch');
const core=await fs.readFile(path.join(server,'index.js')),guard=await fs.readFile(path.join(root,'lib/content-hosted-preview.mjs'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const version=hash(Buffer.concat([core,guard,registry])).slice(0,12);
const guardName=`hosted-preview-guard.${version}.mjs`,entryName=`hosted-preview-entry.${version}.mjs`,configName=`wrangler.hosted-preview.${version}.json`;
const entry=`import core from './index.js';\nimport {hostedPreviewAssetResponse} from './${guardName}';\nconst admission=${JSON.stringify(admission)};\nexport default {...core,async fetch(request,env,ctx){const asset=await hostedPreviewAssetResponse(request,env.ASSETS,admission);return asset||core.fetch(request,env,ctx);}};\n`;
const derived=JSON.stringify({...config,main:entryName},null,2)+'\n';
for(const [name,bytes] of [[guardName,guard],[entryName,entry],[configName,derived]]){
  const file=path.join(server,name);try{await fs.writeFile(file,bytes,{flag:'wx'});}catch(e){if(e.code!=='EEXIST'||hash(await fs.readFile(file))!==hash(bytes))throw e;}
}
console.log(JSON.stringify({status:'PASS',config:path.join(server,configName),worker:config.name,coreMainSha256:hash(core),sourceGuardSha256:hash(guard),admissionRegistrySha256:hash(registry),originalConfigSha256:hash(configBytes),entrySha256:hash(entry),derivedConfigSha256:hash(derived)}));
