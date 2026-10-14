// Build provenance only. No request/env assertion, acceptance or publication gate.
import {execFileSync} from 'node:child_process';
import {realpathSync} from 'node:fs';

const git=(root,args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore'],timeout:10000,maxBuffer:8*1048576});
const data=file=>/^(content-packages|content-staging|public\/content-assets)\//.test(file)
  || ['lib/generated/content-packages.json','lib/generated/content-admissions.json'].includes(file);

export function cleanBuildSource(root){
  try{
    // An exported build below another repo must not inherit its parent's HEAD.
    if(realpathSync(git(root,['rev-parse','--show-toplevel']).trim())!==realpathSync(root))return null;
    const origin=git(root,['remote','get-url','origin']).trim();
    if(!/^(https:\/\/github\.com\/christianza1989\/niche-public-core(?:\.git)?|git@github\.com:christianza1989\/niche-public-core(?:\.git)?)$/.test(origin))return null;
    const revision=git(root,['rev-parse','HEAD']).trim();if(!/^[a-f0-9]{40}$/.test(revision))return null;
    git(root,['merge-base','--is-ancestor','refs/remotes/origin/main',revision]);
    const changes=git(root,['status','--porcelain=v1','-z','--untracked-files=all']).split('\0');
    for(let i=0;i<changes.length;i++){
      const entry=changes[i];if(!entry)continue;
      if(!data(entry.slice(3)))return null;
      if(/[RC]/.test(entry.slice(0,2))&&!data(changes[++i]||''))return null;
    }
    // A borrowed/untracked compiler cannot attest another commit.
    git(root,['cat-file','-e',revision+':scripts/content-build-proof.mjs']);
    git(root,['cat-file','-e',revision+':proxy.ts']);
    return revision;
  }catch{return null;}
}
