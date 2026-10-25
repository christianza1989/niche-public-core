// Export only two public browser files from an explicitly reviewed Git revision.
// Canonical business/client logic remains in the shared commerce-core repository.
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const args=process.argv.slice(2),argument=name=>args[args.indexOf(name)+1];
const source=args.includes('--source')?argument('--source'):null,revision=args.includes('--revision')?argument('--revision'):null;
if(!source||!/^\b[a-f0-9]{40}\b$/.test(revision||''))throw Error('Usage: node scripts/sync-commerce-sdk.mjs --source <canonical-core-checkout> --revision <reviewed40hexSHA>');
execFileSync('git',['-C',source,'merge-base','--is-ancestor',revision,'HEAD'],{stdio:['ignore','ignore','pipe']});
const root=new URL('../vendor/commerce-core/',import.meta.url);await mkdir(root,{recursive:true});
const manifest={schemaVersion:1,sourceRepository:'https://github.com/christianza1989/nisiniai-puslapiai-monetizavimui',sourceRevision:revision,sourcePath:'commerce-core/public',files:[]};
for(const filename of ['commerce-client.mjs','checkout-ui.mjs']){
 const bytes=execFileSync('git',['-C',source,'show',revision+':commerce-core/public/'+filename],{maxBuffer:1048576});
 await writeFile(new URL(filename,root),bytes);
 manifest.files.push({filename,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
}
await writeFile(new URL('source-manifest.json',root),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({state:'EXACT_PUBLIC_SDK_EXPORTED',sourceRevision:revision,files:manifest.files,target:fileURLToPath(root)}));
