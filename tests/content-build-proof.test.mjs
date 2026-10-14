import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,realpath} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import {cleanBuildSource} from '../scripts/content-build-proof.mjs';
const git=(root,args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
async function fixture(t){
  const root=await mkdtemp(path.join(os.tmpdir(),'pinet-build-proof-'));
  t.after(async()=>{assert.equal(path.dirname(root),os.tmpdir());assert.equal(await realpath(root),root);await rm(root,{recursive:true,force:true});});
  await mkdir(path.join(root,'scripts'));await writeFile(path.join(root,'scripts/content-build-proof.mjs'),'// isolated source fixture\n');await writeFile(path.join(root,'proxy.ts'),'// isolated router fixture\n');
  git(root,['init']);git(root,['config','user.name','Synthetic QA']);git(root,['config','user.email','qa@example.invalid']);
  git(root,['remote','add','origin','https://github.com/christianza1989/niche-public-core.git']);git(root,['add','.']);git(root,['commit','-m','synthetic source']);
  const head=git(root,['rev-parse','HEAD']);git(root,['update-ref','refs/remotes/origin/main',head]);return {root,head};
}
test('build source is derived only from its actual clean Git root, never an env assertion or ancestor repo',async t=>{
  const {root,head}=await fixture(t);assert.equal(cleanBuildSource(root),head);
  await mkdir(path.join(root,'output/copy'),{recursive:true});assert.equal(cleanBuildSource(path.join(root,'output/copy')),null);
  git(root,['remote','set-url','origin','https://example.invalid/unrelated.git']);assert.equal(cleanBuildSource(root),null);
});
test('changed or untracked execution code withholds proof; isolated content inputs remain distinct',async t=>{
  const {root,head}=await fixture(t);await mkdir(path.join(root,'content-packages/qa'),{recursive:true});await writeFile(path.join(root,'content-packages/qa/content-package.json'),'{}');assert.equal(cleanBuildSource(root),head);
  await writeFile(path.join(root,'proxy.ts'),'// changed source\n');assert.equal(cleanBuildSource(root),null);
  git(root,['restore','--','proxy.ts']);await writeFile(path.join(root,'scripts/extra.mjs'),'// untracked execution source');assert.equal(cleanBuildSource(root),null);
});
test('no Git source or missing canonical compiler in HEAD cannot manufacture a source pin',async t=>{
  const {root}=await fixture(t);git(root,['rm','scripts/content-build-proof.mjs']);git(root,['commit','-m','remove fixture compiler']);assert.equal(cleanBuildSource(root),null);
});
