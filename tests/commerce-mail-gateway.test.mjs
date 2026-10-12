import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createCommerceMailGateway,D1CommerceMailLedger} from '../lib/commerce-mail-gateway.mjs';
import {smtpSession} from '../lib/smtp-protocol.mjs';
const migration=readFileSync(new URL('../workers/commerce-mail/migrations/0001_mail_messages.sql',import.meta.url),'utf8');
function database(path=':memory:'){
 const db=new DatabaseSync(path);db.exec(migration.replace('CREATE TABLE ','CREATE TABLE IF NOT EXISTS '));
 return {close:()=>db.close(),prepare(sql){return {bind(...values){return {first:async()=>db.prepare(sql).get(...values)||null,run:async()=>({meta:{changes:Number(db.prepare(sql).run(...values).changes)}})};}};}};
}
const config={storeId:'memo-fixture',environment:'sandbox',from:'sender@example.test',enabled:true,testRecipients:['buyer@example.test']};
const message={schemaVersion:1,environment:'sandbox',storeId:'memo-fixture',id:'notice-123',messageId:'<notice-123@example.test>',from:'sender@example.test',to:'buyer@example.test',replyTo:'info@memorycasting.lt',subject:'Bandomasis užsakymas',text:'Testinis pranešimas; tikras laiškas nesiunčiamas.'};
const post=(body=message)=>new Request('https://core-mail.internal/commerce/messages/'+body.id,{method:'POST',body:JSON.stringify(body)});
const get=()=>new Request('https://core-mail.internal/commerce/messages/'+message.id);
test('concurrent/restarted requests send once and retain exact SMTP acceptance independently of INBOX',async()=>{
 const directory=mkdtempSync(join(tmpdir(),'commerce-mail-')),path=join(directory,'ledger.sqlite');let db=database(path),calls=0;
 try{
  const gateway=createCommerceMailGateway({config,ledger:new D1CommerceMailLedger(db),send:async()=>{calls++;await new Promise(resolve=>setTimeout(resolve,10));}});
  const responses=await Promise.all([gateway(post()),gateway(post()),gateway(post())]);
  assert.equal(calls,1);for(const response of responses)assert.equal(response.status,200);
  assert.equal((await (await gateway(get())).json()).status,'accepted');
  db.close();db=database(path);
  const reopened=createCommerceMailGateway({config,ledger:new D1CommerceMailLedger(db),send:async()=>calls++});
  const saved=await (await reopened(post())).json();assert.equal(saved.reference,'smtp-accepted:<notice-123@example.test>');assert.equal(calls,1);
  assert.equal((await reopened(post({...message,text:'Changed order details'}))).status,409);assert.equal(calls,1);
 }finally{db.close();rmSync(directory,{recursive:true});}
});
test('lost transport outcome and lost acceptance acknowledgement remain unknown without automatic resend',async()=>{
 for(const failure of ['transport','ack']){
  const db=database(),ledger=new D1CommerceMailLedger(db);let calls=0;
  if(failure==='ack')ledger.accept=async()=>{throw Error('DB response lost');};
  const gateway=createCommerceMailGateway({config,ledger,send:async()=>{calls++;if(failure==='transport')throw Error('Connection lost after DATA');}});
  try{assert.equal((await (await gateway(post())).json()).status,'unknown');assert.equal((await (await gateway(post())).json()).status,'unknown');assert.equal(calls,1);}finally{db.close();}
 }
});
test('store/environment/from/recipient/message identity and headers fail before durable claim or SMTP',async()=>{
 const db=database();let calls=0;const ledger=new D1CommerceMailLedger(db),gateway=createCommerceMailGateway({config,ledger,send:async()=>calls++});
 try{
  for(const patch of [{storeId:'other'},{environment:'production'},{from:'info@memorycasting.lt'},{to:'actual@example.com'},{messageId:'<other@example.test>'},{subject:'bad\r\nBcc: victim@example.test'},{replyTo:'bad\r\nDATA'}])assert.ok((await gateway(post({...message,...patch}))).status>=400);
  assert.equal(calls,0);assert.equal(await ledger.get('sandbox','memo-fixture',message.id),null);
  assert.equal((await gateway(new Request('https://public.example/commerce/messages/notice-123'))).status,404);
  assert.equal((await gateway(new Request('https://core-mail.internal/commerce/messages/notice-123',{method:'DELETE'}))).status,405);
  assert.equal((await gateway(new Request('https://core-mail.internal/commerce/messages/notice-123',{method:'POST',body:'x'.repeat(65537)}))).status,413);
 }finally{db.close();}
});
test('disabled transport does not claim or send and cannot masquerade as accepted',async()=>{
 const db=database();let calls=0;const ledger=new D1CommerceMailLedger(db),gateway=createCommerceMailGateway({config:{...config,enabled:false},ledger,send:async()=>calls++});
 try{assert.equal((await gateway(post())).status,503);assert.equal(await ledger.get('sandbox','memo-fixture',message.id),null);assert.equal(calls,0);}finally{db.close();}
});
test('the existing SMTP protocol supplies stable Message-ID and only a positive DATA response permits acceptance',async()=>{
 const db=database();const wires=[];let controller;
 const gateway=createCommerceMailGateway({config,ledger:new D1CommerceMailLedger(db),send:async message=>{
  const replies=['250 capabilities\r\n','334 username\r\n','334 password\r\n','235 authenticated\r\n','250 sender\r\n','250 recipient\r\n','354 send data\r\n','250 accepted\r\n','221 bye\r\n'];
  const socket={readable:new ReadableStream({start(c){controller=c;c.enqueue(new TextEncoder().encode('220 ready\r\n'));}}),writable:new WritableStream({write(bytes){wires.push(new TextDecoder().decode(bytes));controller.enqueue(new TextEncoder().encode(replies.shift()));}}),close:async()=>controller.close()};
  await smtpSession(socket,{user:config.from,password:'synthetic-fixture-only',timeoutMs:1000},message);
 }});
 try{assert.equal((await (await gateway(post())).json()).status,'accepted');assert.match(wires[7],/Message-ID: <notice-123@example.test>/);assert.match(wires[7],/Reply-To: <info@memorycasting.lt>/);}finally{db.close();}
});
