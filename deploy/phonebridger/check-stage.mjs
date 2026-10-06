// Complements the repository safety scanner with this deployment's exact private values.
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const files=execFileSync('git',['diff','--cached','--name-only','--diff-filter=ACM','-z']).toString().split('\0').filter(Boolean);
if(!files.length)throw Error('Nothing staged; this is not a successful safety check.');
const root=path.resolve(import.meta.dirname,'../..');
const secrets=await Promise.all(['hostinger-token.txt','hostinger-mailbox.txt','rate-secret.txt'].map(file=>readFile(path.join(root,'.sites-runtime/phonebridger-production',file),'utf8').then(value=>value.trim())));
for(const [directory,files]of [['phonebridger-production',['operator-secret.txt','stripe-live-key.txt','stripe-live-webhook-secret.txt']],['phonebridger-playground',['stripe-key.txt','webhook-secret.txt','operator-secret.txt']]]){
 for(const file of files){try{secrets.push((await readFile(path.join(root,'.sites-runtime',directory,file),'utf8')).trim());}catch(error){if(error.code!=='ENOENT')throw error;}}
}
try{const buyer=JSON.parse(await readFile(path.join(root,'.sites-runtime/phonebridger-playground/buyer.json'),'utf8'));secrets.push(buyer.password,buyer.cookie?.split('=')[1]);}catch(error){if(error.code!=='ENOENT')throw error;}
let matches=0;
for(const file of files){const blob=execFileSync('git',['show',':'+file],{maxBuffer:8*1024*1024});for(const value of secrets)if(value&&blob.includes(Buffer.from(value)))matches++;}
console.log(JSON.stringify({files:files.length,knownSecrets:secrets.filter(Boolean).length,privateValueMatches:matches,status:matches?'FAIL':'PASS'}));
process.exitCode=matches?1:0;
