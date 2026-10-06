import {readFile,writeFile,access} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
const dir='.sites-runtime/phonebridger-production/';
try{await access(dir+'rate-secret.txt');}catch{await writeFile(dir+'rate-secret.txt',randomBytes(48).toString('hex'));}
const entries=[['AUTH_RATE_SECRET','rate-secret.txt'],['HOSTINGER_MAIL_API_KEY','hostinger-token.txt'],['HOSTINGER_MAILBOX_ID','hostinger-mailbox.txt']];
for(const [name,file]of entries){
 const value=await readFile(dir+file,'utf8');
 await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','secret','put',name,'--config','deploy/phonebridger/wrangler.jsonc'],{stdio:['pipe','pipe','pipe']});child.stdin.end(value);child.stdout.pipe(process.stdout);child.stderr.pipe(process.stderr);child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error('Secret upload failed: '+name)));});
}
