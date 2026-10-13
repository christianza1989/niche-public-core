// Send once, then reconcile only that enquiry. Never retry an ambiguous send.
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.argv[2],mode=process.argv[3]||'send';
if(base!=='https://phonebridger.com'||!['send','check'].includes(mode))throw Error('Use the authorized canonical origin and send/check mode.');
const privateDir='.sites-runtime/phonebridger-production/';
const ledger=privateDir+'live-form-self-test.json';
let record;
if(mode==='send'){
 try{await readFile(ledger);throw Error('A live test ledger exists. Reconcile it with check mode instead of sending again.');}catch(error){if(error.code!=='ENOENT')throw error;}
 const marker='PhoneBridger live launch self-test '+new Date().toISOString();
 record={base,marker,attemptedAt:new Date().toISOString()};await writeFile(ledger,JSON.stringify(record,null,2));
 const response=await fetch(base+'/api/contact',{method:'POST',headers:{Origin:base,Referer:base+'/contact','Content-Type':'application/json'},body:JSON.stringify({name:'Production self-test',email:'hello@phonebridger.com',topic:'other',message:marker+' — owner-authorized delivery verification; no customer enquiry.',consent:true})});
 const result=await response.json();record={...record,status:response.status,...result};await writeFile(ledger,JSON.stringify(record,null,2));
 assert.equal(response.status,201);assert.equal(result.notified,true);
}else record=JSON.parse(await readFile(ledger,'utf8'));
if(!record.id)throw Error('No confirmed enquiry ID. Inspect the exact attempted marker; do not replay it.');
const key=(await readFile(privateDir+'hostinger-token.txt','utf8')).trim(),mailbox=(await readFile(privateDir+'hostinger-mailbox.txt','utf8')).trim();
assert.match(mailbox,/^[A-Za-z0-9]+$/);
const search=await fetch(`https://api.mail.hostinger.com/api/v1/mailboxes/${mailbox}/folders/INBOX/messages/search?perPage=1`,{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({subject:record.id.slice(0,8),body:record.marker,to:'hello@phonebridger.com'})});
if(!search.ok)throw Error('Exact self-test inbox query failed.');
record.inboxConfirmed=(await search.json()).data?.length===1;record.checkedAt=new Date().toISOString();await writeFile(ledger,JSON.stringify(record,null,2));
console.log(JSON.stringify({origin:base,durableSave:record.status===201,providerAccepted:record.notified,inboxConfirmed:record.inboxConfirmed}));
assert.equal(record.inboxConfirmed,true,'Use check mode after delivery delay; do not send a second message.');
