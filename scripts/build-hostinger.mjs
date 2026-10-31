import {spawnSync} from 'node:child_process';
import {lstat} from 'node:fs/promises';
import {createRequire} from 'node:module';
process.env.HOSTINGER_NODE_RUNTIME='1';
process.env.NEXT_TELEMETRY_DISABLED='1';
delete process.env.CLOUDFLARE_WORKER_BUILD;
// Hostinger installs production dependencies first when NODE_ENV=production.
// TypeScript path resolution and PostCSS still need build-time dependencies.
try{const require=createRequire(import.meta.url);require.resolve('typescript');require.resolve('@tailwindcss/postcss');}
catch{
 if(!process.env.npm_execpath)throw Error('hostinger_build_dependencies_required_use_npm');
 const modules=await lstat('node_modules').catch(error=>{if(error.code!=='ENOENT')throw error;return null;});
 if(modules?.isSymbolicLink())throw Error('refuse_replacing_shared_dependencies');
 const r=spawnSync(process.execPath,[process.env.npm_execpath,'ci','--include=dev','--ignore-scripts'],{stdio:'inherit',env:process.env,windowsHide:true});if(r.status!==0)process.exit(r.status||1);
}
for(const [file,args] of [['scripts/verify-commerce-sdk.mjs',[]],['scripts/compile-content-packages.mjs',[]],['node_modules/next/dist/bin/next',['build','--webpack']]]){
 const r=spawnSync(process.execPath,[file,...args],{stdio:'inherit',env:process.env,windowsHide:true});if(r.status!==0)process.exit(r.status || 1);
}
if(process.env.HOSTINGER_PRUNE_DEV==='1'){
 if((await lstat('node_modules')).isSymbolicLink()||!process.env.npm_execpath)throw Error('refuse_pruning_shared_dependencies');
 const r=spawnSync(process.execPath,[process.env.npm_execpath,'prune','--omit=dev','--ignore-scripts'],{stdio:'inherit',env:process.env,windowsHide:true});if(r.status!==0)process.exit(r.status||1);
}
