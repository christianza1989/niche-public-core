import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyCommerceSdk} from '../scripts/verify-commerce-sdk.mjs';
test('standalone SDK distribution verifies exact files and rejects drift/path injection',async()=>{
 const source=new URL('../vendor/commerce-core/',import.meta.url),directory=await mkdtemp(join(tmpdir(),'commerce-sdk-')),root=pathToFileURL(directory+'/');
 try{
  const manifest=JSON.parse(await readFile(new URL('source-manifest.json',source),'utf8'));
  for(const file of manifest.files)await writeFile(new URL(file.filename,root),await readFile(new URL(file.filename,source)));
  const saveManifest=()=>writeFile(new URL('source-manifest.json',root),JSON.stringify(manifest));await saveManifest();
  assert.equal((await verifyCommerceSdk(root)).sourceRevision,manifest.sourceRevision);
  const file=manifest.files[0],original=await readFile(new URL(file.filename,root));await writeFile(new URL(file.filename,root),Buffer.concat([original,Buffer.from('\n// modified')]));
  await assert.rejects(verifyCommerceSdk(root),/Modified canonical SDK/);await writeFile(new URL(file.filename,root),original);
  manifest.files[0].filename='../private.mjs';await saveManifest();await assert.rejects(verifyCommerceSdk(root),/Unexpected public SDK file inventory/);
 }finally{assert.equal(dirname(resolve(directory)),resolve(tmpdir()));assert.ok(directory.includes('commerce-sdk-'));await rm(directory,{recursive:true});}
});
