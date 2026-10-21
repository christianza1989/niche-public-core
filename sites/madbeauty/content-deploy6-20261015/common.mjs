import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
export {core,hash,json,files,provider} from '../favicon-20261013/common.mjs';
export const repo=path.resolve(import.meta.dirname,'../../..'),out=path.join(repo,'sites/madbeauty/cloudflare/output/content-deploy6-20261015'),releaseRoot=path.dirname(out),previous=path.join(repo,'sites/madbeauty/cloudflare/output/favicon-20261013/main'),producer=path.resolve(repo,'../madbeauty-next6-20261015/sites/madbeauty/content-next6-20261015');
export const packageSha256='ee7a92ee36a48c6ba3382882f05c538bdeef43aa6c82cbeb290fdb1acd33ad84',baselineSha256='86c7595036970f905cec196d9090d712bfa11c113f09e4cd645c25611ed47509',runtimeSource='9dcd67cf1f5bd1500564b47ea6b4a2dbd8ce8f63',baselineVersion='f68008dd-5ceb-446b-8113-d68bd1631919',coreSource='5661d5d6907d6f5d11514ae69c0decc6130d65e2',freshCore=path.resolve(repo,'../madbeauty-favicon-public-core-20261013');
export const save=async(name,v)=>{await mkdir(path.dirname(path.join(out,name)),{recursive:true});await writeFile(path.join(out,name),JSON.stringify(v,null,2)+'\n');};
export function sourceBoundary(){assert.equal(execFileSync('git',['diff','--name-only','4f6fb988c5cc302502a4ca5523df937b5e9ccc14','--','sites/madbeauty/backend','sites/madbeauty/prototype','sites/madbeauty/cloudflare','sites/madbeauty/content','sites/madbeauty/trial-20261010/worker.mjs'],{cwd:repo,encoding:'utf8'}).trim(),'','Published platform source including favicon must remain unchanged');}
