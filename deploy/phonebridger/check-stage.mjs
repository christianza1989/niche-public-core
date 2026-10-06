// Complements the repository safety scanner with this deployment's exact private values.
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const files=execFileSync('git',['diff','--cached','--name-only','--diff-filter=ACM','-z']).toString().split('\0').filter(Boolean);
if(!files.length)throw Error('Nothing staged; this is not a successful safety check.');
const secrets=await Promise.all(['hostinger-token.txt','hostinger-mailbox.txt','rate-secret.txt'].map(file=>readFile('.sites-runtime/phonebridger-production/'+file,'utf8').then(value=>value.trim())));
let matches=0;
for(const file of files){const blob=execFileSync('git',['show',':'+file],{maxBuffer:8*1024*1024});for(const value of secrets)if(value&&blob.includes(Buffer.from(value)))matches++;}
console.log(JSON.stringify({files:files.length,privateValueMatches:matches,status:matches?'FAIL':'PASS'}));
process.exitCode=matches?1:0;
