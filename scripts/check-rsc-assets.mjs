import {existsSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {pathToFileURL} from 'node:url';

// RSC can capture a CSS-only intermediate chunk before Vite removes it.
// A successful compiler exit alone does not prove hydration assets exist.
export function missingRscAssets(manifest,clientRoot,exists=existsSync){
 const root=resolve(clientRoot),missing=new Set();
 function visit(value){
  if(typeof value==='string'&&value.startsWith('/_next/')){
   const file=resolve(root,'.'+value);
   if(!file.startsWith(root+sep)||!exists(file))missing.add(value);
  }else if(value&&typeof value==='object')for(const child of Object.values(value))visit(child);
 }
 visit(manifest);return [...missing].sort();
}
export async function checkRscAssets(root=process.cwd()){
 const missing=new Set();
 for(const relative of ['dist/server/__vite_rsc_assets_manifest.js','dist/server/ssr/__vite_rsc_assets_manifest.js']){
  const path=resolve(root,relative);
  if(!existsSync(path))throw Error('RSC manifest is missing: '+relative);
  const {default:manifest}=await import(pathToFileURL(path).href);
  for(const asset of missingRscAssets(manifest,resolve(root,'dist/client')))missing.add(asset);
 }
 if(missing.size)throw Error('RSC hydration references missing physical assets: '+[...missing].join(', '));
 return {status:'PASS',manifests:2,missing:0};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 checkRscAssets().then(result=>console.log(JSON.stringify(result))).catch(error=>{console.error(error.message);process.exitCode=1;});
}
