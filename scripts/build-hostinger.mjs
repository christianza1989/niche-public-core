import {spawnSync} from 'node:child_process';
import {lstat} from 'node:fs/promises';
process.env.HOSTINGER_NODE_RUNTIME='1';
delete process.env.CLOUDFLARE_WORKER_BUILD;
for(const [file,args] of [['scripts/verify-commerce-sdk.mjs',[]],['scripts/compile-content-packages.mjs',[]],['node_modules/next/dist/bin/next',['build','--webpack']]]){
 const r=spawnSync(process.execPath,[file,...args],{stdio:'inherit',env:process.env,windowsHide:true});if(r.status!==0)process.exit(r.status || 1);
}
if(process.env.HOSTINGER_PRUNE_DEV==='1'){
 if((await lstat('node_modules')).isSymbolicLink()||!process.env.npm_execpath)throw Error('refuse_pruning_shared_dependencies');
 const r=spawnSync(process.execPath,[process.env.npm_execpath,'prune','--omit=dev','--ignore-scripts'],{stdio:'inherit',env:process.env,windowsHide:true});if(r.status!==0)process.exit(r.status||1);
}
