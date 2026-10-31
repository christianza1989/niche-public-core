import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export function hostingerSourceFile(file) {
 const parts=file.split('/');
 if(parts.some(p=>p.startsWith('.')||['node_modules','dist','content-packages'].includes(p)))return false;
 return !file.startsWith('public/')||file.startsWith('public/fonts/kvapunaikinimas/');
}
export function hostingerScopedInputs(network,aliases,siteIds) {
 const ids=new Set(siteIds);
 return {network:{...network,guidePublicationPausedAtBySite:Object.fromEntries(Object.entries(network.guidePublicationPausedAtBySite||{}).filter(([id])=>ids.has(id)))},aliases:{...aliases,sites:Object.fromEntries(Object.entries(aliases.sites||{}).filter(([id])=>ids.has(id)))}};
}
export async function exportHostinger(root,releaseDirectory,output) {
 const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024,windowsHide:true}).trim();
 if(git(['status','--porcelain','--untracked-files=normal']))throw Error('Commit reviewed source before exporting');
 const sourceCommit=git(['rev-parse','HEAD']);
 const packageBytes=await fs.readFile(path.join(releaseDirectory,'content-package.json'));
 const pkg=JSON.parse(packageBytes),manifest=JSON.parse(await fs.readFile(path.join(releaseDirectory,'release-manifest.json'),'utf8'));
 if(pkg.schemaVersion!==1||pkg.siteId!==manifest.siteId||pkg.canonicalHost!==manifest.canonicalHost||hash(packageBytes)!==manifest.packageSha256||!pkg.pages.length||pkg.pages.some(p=>p.approval?.status!=='approved'||/synthetic/i.test(p.approval.actorId||''))||/\.(example|invalid|test)$/.test(pkg.canonicalHost))throw Error('Verified real-domain native release required');
 if(!/^[a-z0-9-]{1,80}$/.test(pkg.siteId))throw Error('Invalid site id');
 await fs.mkdir(output,{recursive:false});
 const names=git(['ls-files','-z','--','.',':(exclude)public/**',':(exclude)content-packages/**']).split('\0').filter(Boolean);
 names.push(...git(['ls-files','-z','--','public/fonts/kvapunaikinimas']).split('\0').filter(Boolean));
 let copied=0;
 for(const file of new Set(names)){
  if(!hostingerSourceFile(file))continue;
  const stat=await fs.lstat(path.join(root,file));if(!stat.isFile()||stat.isSymbolicLink())throw Error('Non-regular source file');
  await fs.mkdir(path.dirname(path.join(output,file)),{recursive:true});await fs.copyFile(path.join(root,file),path.join(output,file));copied++;
 }
 const native=path.join(output,'content-packages',pkg.siteId);
 await fs.mkdir(path.join(native,'assets'),{recursive:true});
 await fs.mkdir(path.join(output,'public/content-assets',pkg.siteId),{recursive:true});
 await fs.writeFile(path.join(native,'content-package.json'),packageBytes);
 for(const asset of manifest.assets){
  if(path.basename(asset.name)!==asset.name||!asset.name.endsWith('.webp'))throw Error('Unsafe release asset name');
  const bytes=await fs.readFile(path.join(releaseDirectory,'assets',asset.name));if(hash(bytes)!==asset.sha256)throw Error('Native asset hash mismatch');
  await fs.writeFile(path.join(native,'assets',asset.name),bytes);await fs.writeFile(path.join(output,'public/content-assets',pkg.siteId,asset.name),bytes);
 }
 const settings=hostingerScopedInputs(JSON.parse(await fs.readFile(path.join(root,'config/niche-network.json'),'utf8')),JSON.parse(await fs.readFile(path.join(root,'config/niche-path-aliases.json'),'utf8')),[pkg.siteId]);
 await fs.writeFile(path.join(output,'config/niche-network.json'),JSON.stringify(settings.network,null,2)+'\n');
 await fs.writeFile(path.join(output,'config/niche-path-aliases.json'),JSON.stringify(settings.aliases,null,2)+'\n');
 const app=JSON.parse(await fs.readFile(path.join(output,'package.json'),'utf8'));
 app.scripts.build=app.scripts['build:hostinger'];app.scripts.start=app.scripts['start:hostinger'];
 await fs.writeFile(path.join(output,'package.json'),JSON.stringify(app,null,2)+'\n');
 const receipt={sourceCommit,siteId:pkg.siteId,canonicalHost:pkg.canonicalHost,packageSha256:hash(packageBytes),pages:pkg.pages.length,assets:manifest.assets.length,copiedFiles:copied,scope:'one verified native release; shared pause/alias inputs projected, canonical source unchanged',entry:'scripts/start-hostinger.mjs',state:'prepared-not-deployed'};
 await fs.writeFile(path.join(output,'hostinger-artifact.json'),JSON.stringify(receipt,null,2)+'\n');return receipt;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const args=Object.fromEntries(process.argv.slice(2).map((v,i,a)=>v.startsWith('--')?[v.slice(2),a[i+1]]:null).filter(Boolean));
 if(!args.release||!args.output)throw Error('Use --release <native release directory> --output <new absolute artifact directory>');
 console.log(JSON.stringify(await exportHostinger(process.cwd(),path.resolve(args.release),path.resolve(args.output))));
}
