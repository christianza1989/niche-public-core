// Read an owner-prepared action JSON and secret file; never put secrets in argv.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
const [originInput,secretFile,actionFile,resultFile]=process.argv.slice(2);
const origin=new URL(originInput);
if(origin.protocol!=='https:'||!['phonebridger.com','phonebridger-playground.phonebridger-app.workers.dev'].includes(origin.hostname)||origin.username||origin.password)throw Error('Use an exact authorized PhoneBridger HTTPS host.');
const secret=(await readFile(secretFile,'utf8')).trim();
const payload=JSON.parse(await readFile(actionFile,'utf8'));
let privateOutput;
if(payload.action==='orders'){
 if(!resultFile)throw Error('Order exports require an ignored private result file.');
 const privateRoot=path.resolve(import.meta.dirname,'../../.sites-runtime',origin.hostname==='phonebridger.com'?'phonebridger-production':'phonebridger-playground');
 privateOutput=path.resolve(resultFile);const relative=path.relative(privateRoot,privateOutput);
 if(!relative||relative.startsWith('..')||path.isAbsolute(relative)||path.extname(privateOutput)!=='.json')throw Error('Keep the order export in the matching private runtime directory.');
}
const response=await fetch(new URL('/api/shop/operator',origin),{method:'POST',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},body:JSON.stringify(payload)});
const result=await response.json();
if(privateOutput&&response.ok){await mkdir(path.dirname(privateOutput),{recursive:true});await writeFile(privateOutput,JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify({status:response.status,orders:result.orders?.length||0,privateExport:true}));}
else console.log(JSON.stringify({status:response.status,...result}));
if(!response.ok)process.exitCode=1;
