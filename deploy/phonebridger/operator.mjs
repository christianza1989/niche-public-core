// Read an owner-prepared action JSON and secret file; never put secrets in argv.
import {readFile} from 'node:fs/promises';
const [originInput,secretFile,actionFile]=process.argv.slice(2);
const origin=new URL(originInput);
if(origin.protocol!=='https:'||!['phonebridger.com','phonebridger-playground.phonebridger-app.workers.dev'].includes(origin.hostname)||origin.username||origin.password)throw Error('Use an exact authorized PhoneBridger HTTPS host.');
const secret=(await readFile(secretFile,'utf8')).trim();
const payload=JSON.parse(await readFile(actionFile,'utf8'));
const response=await fetch(new URL('/api/shop/operator',origin),{method:'POST',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},body:JSON.stringify(payload)});
const result=await response.json();console.log(JSON.stringify({status:response.status,...result}));if(!response.ok)process.exitCode=1;
