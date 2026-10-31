import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {projectPublicPages} from '../lib/niche-links.mjs';
import {kvapunaikinimasDeliverySrc} from '../lib/kvapunaikinimas-asset-delivery.mjs';

export function fullyPublicDeliveryPages(pkg,settings,now=Date.now()) {
 const pages=projectPublicPages(pkg,[pkg],settings,now);
 if(pages.length!==pkg.pages.length)throw Error('static_delivery_requires_fully_public_release');
 return pages;
}

export async function copyHostingerStaticAssets(root) {
 const receipt=await fs.readFile(path.join(root,'hostinger-artifact.json'),'utf8').then(JSON.parse).catch(e=>{if(e.code==='ENOENT')return null;throw e});
 if(receipt?.siteId!=='kvapunaikinimas')return {state:'not-selected-target'};
 const packageBytes=await fs.readFile(path.join(root,'content-packages/kvapunaikinimas/content-package.json'));
 const hash=b=>createHash('sha256').update(b).digest('hex');
 if(hash(packageBytes)!==receipt.packageSha256)throw Error('static_delivery_package_hash_mismatch');
 const pkg=JSON.parse(packageBytes),settings=JSON.parse(await fs.readFile(path.join(root,'config/niche-network.json'),'utf8'));
 const pages=fullyPublicDeliveryPages(pkg,settings),media=new Map(pages.flatMap(p=>p.media).map(a=>[a.src,a]));
 const copied=[];
 const copy=async(src,delivery)=>{
  if(!delivery.startsWith('/_next/static/niche-assets/kvapunaikinimas/'))throw Error('unsafe_static_delivery_path');
  const bytes=await fs.readFile(src),dest=path.join(root,'.next/static',delivery.slice('/_next/static/'.length));
  await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,bytes);
  copied.push({delivery,sha256:hash(bytes),bytes:bytes.length});
 };
 for(const a of media.values())await copy(path.join(root,'public',a.src),kvapunaikinimasDeliverySrc(a.src,true));
 for(const name of ['open-sans-latin','open-sans-latin-ext','open-sans-italic-latin','open-sans-italic-latin-ext']){
  const src=path.join(root,'public/fonts/kvapunaikinimas',name+'.woff2'),bytes=await fs.readFile(src);
  await copy(src,kvapunaikinimasDeliverySrc(`/fonts/kvapunaikinimas/${name}.woff2?v=${hash(bytes).slice(0,12)}`,true));
 }
 const result={state:'immutable-delivery-ready',packageSha256:receipt.packageSha256,publicPages:pages.length,assets:copied};
 await fs.writeFile(path.join(root,'hostinger-static-delivery.json'),JSON.stringify(result,null,2)+'\n');return result;
}
