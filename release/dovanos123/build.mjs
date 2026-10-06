import {mkdir,copyFile,readFile,writeFile,symlink} from 'node:fs/promises';
import {execFileSync,spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';import path from 'node:path';
import {validateContentPackage} from '../../scripts/content-package-core.mjs';
import {validateV2Admission} from '../../scripts/content-v2-admission.mjs';
const root=path.resolve(import.meta.dirname,'../..'),mode=process.argv[2]||'preview';
if(!['preview','production'].includes(mode))throw Error('Expected preview or production');
const raw=await readFile(path.join(import.meta.dirname,'content-package.json'),'utf8'),pkg=validateContentPackage(JSON.parse(raw));
const receipt=mode==='preview'?{schemaVersion:1,scope:'hosted-preview',testOnly:true,previewHost:'dovanos123-preview.phonebridger-app.workers.dev',siteId:pkg.siteId,canonicalHost:pkg.canonicalHost,renderer:pkg.site.renderer,packageSha256:createHash('sha256').update(raw).digest('hex'),reviewer:'Codex / isolated public preview; canonical acceptance pending',acceptedAt:new Date().toISOString()}:JSON.parse(await readFile(path.resolve(process.argv[3]||''),'utf8'));
if(mode==='production'&&receipt.scope!=='production')throw Error('Exact production evidence required');
validateV2Admission(pkg,raw,receipt);
const target=path.join(root,'outputs',`dovanos123-release-${Date.now()}`);await mkdir(path.dirname(target),{recursive:true});await mkdir(target);
// Only Git-indexed framework source enters the isolated checkout. Private state,
// previous niche packages and unrelated media are never traversed or published.
const files=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
for(const file of files){
 if(!/^(?:app\/|components\/|config\/|db\/|hooks\/|vendor\/|lib\/|schemas\/|scripts\/|worker\/|release\/dovanos123\/|public\/fonts\/)/.test(file)&&!['package.json','package-lock.json','next.config.ts','vite.config.ts','tsconfig.json','postcss.config.mjs','components.json','proxy.ts','cloudflare-env.d.ts'].includes(file))continue;
 if(/(?:^|\/)(?:output|outputs|node_modules|data|secrets|credentials)\//.test(file))throw Error('Private file in source index');
 const dest=path.join(target,file);await mkdir(path.dirname(dest),{recursive:true});await copyFile(path.join(root,file),dest);
}
const dest=path.join(target,'content-packages/dovanos123');await mkdir(path.join(dest,'assets'),{recursive:true});
await writeFile(path.join(dest,'content-package.json'),raw);await writeFile(path.join(dest,'activation.json'),JSON.stringify(receipt,null,2));
for(const name of new Set(pkg.pages.flatMap(p=>p.media.map(m=>path.basename(m.src)))))await copyFile(path.join(root,'content-staging/dovanos123/assets',name),path.join(dest,'assets',name));
// Use the pinned installed dependency tree. A clean clone first runs npm ci.
await symlink(path.join(root,'node_modules'),path.join(target,'node_modules'),process.platform==='win32'?'junction':'dir');
const env={...process.env,NICHE_RELEASE_CONFIG:`release/dovanos123/wrangler.${mode}.json`,CLOUDFLARE_WORKER_BUILD:'1'};
for(const args of [['scripts/compile-content-packages.mjs'],['scripts/run-framework.mjs','build']]){const r=spawnSync(process.execPath,args,{cwd:target,env,stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
await mkdir(path.join(import.meta.dirname,'output'),{recursive:true});
await writeFile(path.join(import.meta.dirname,'output',`latest-${mode}.json`),JSON.stringify({target,packageSha256:receipt.packageSha256,builtAt:new Date().toISOString(),mode},null,2));
console.log(JSON.stringify({target,mode,packageSha256:receipt.packageSha256,state:'built-not-deployed'}));
