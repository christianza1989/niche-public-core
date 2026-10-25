import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
export async function verifyCommerceSdk(root=new URL('../vendor/commerce-core/',import.meta.url)){
const manifest=JSON.parse(await readFile(new URL('source-manifest.json',root),'utf8'));
if(manifest.schemaVersion!==1||!/^\b[a-f0-9]{40}\b$/.test(manifest.sourceRevision)||manifest.sourcePath!=='commerce-core/public'||manifest.sourceRepository!=='https://github.com/christianza1989/nisiniai-puslapiai-monetizavimui')throw Error('Invalid canonical commerce SDK provenance');
if(JSON.stringify(manifest.files.map(f=>f.filename).sort())!==JSON.stringify(['checkout-ui.mjs','commerce-client.mjs']))throw Error('Unexpected public SDK file inventory');
for(const file of manifest.files){const bytes=await readFile(new URL(file.filename,root));if(bytes.length!==file.bytes||createHash('sha256').update(bytes).digest('hex')!==file.sha256)throw Error('Modified canonical SDK: '+file.filename);}
return {state:'EXACT_PUBLIC_SDK_VERIFIED',sourceRevision:manifest.sourceRevision,files:manifest.files.length};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(await verifyCommerceSdk()));
