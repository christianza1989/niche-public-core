import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sendNicheMailRelay} from '../lib/niche-mail-relay.mjs';
import {createLeadMailRelay} from '../services/lead-mail-relay/relay.mjs';
import {smtpMessage} from '../lib/smtp-protocol.mjs';
const token='x'.repeat(43),sender='forms@example.test';
const env={LEAD_MAIL_RELAY_URL:'https://relay.example.test/v1/fixture',LEAD_MAIL_RELAY_TOKEN:token,LEAD_MAIL_RELAY_SENDER:sender};
const mail={id:'test-123',to:'sales@example.test',replyTo:'client@example.test',subject:'Form test',text:'Test, no real message.'};
function fixture(fail=false){
 const rows=new Map();let sends=0,checks=0,raw='';
 const key=(e,s,id)=>`${e}/${s}/${id}`;
 const ledger={async get(e,s,id){return rows.get(key(e,s,id))||null;},async claim(m,hash){const k=key(m.environment,m.storeId,m.id),claimed=!rows.has(k);if(claimed)rows.set(k,{id:m.id,environment:m.environment,store_id:m.storeId,fingerprint:hash,sender:m.from,recipient:m.to,status:'unknown',reference:null});return{claimed,row:rows.get(k)};},async accept(m,hash,reference){const row=await this.get(m.environment,m.storeId,m.id);assert.equal(row.fingerprint,hash);row.status='accepted';row.reference=reference;return row;}};
 const relay=createLeadMailRelay({clients:[{id:'fixture',tokenHash:createHash('sha256').update(token).digest('hex'),to:mail.to,fromName:'Fixture operator'}],from:sender,ledger,send:async m=>{sends++;raw=smtpMessage(m);if(fail)throw Error('ambiguous timeout');return{reference:`smtp-accepted:${m.messageId}`};},checkTransport:async()=>{checks++;return{ready:true,stage:'authenticated'};}});
 return{relay,fetcher:(url,options)=>relay(new Request(url,options)),stats:()=>({sends,checks,raw,rows:rows.size})};
}
test('HTTPS relay preserves authenticated sender and client Reply-To; exact accepted replay sends once',async()=>{
 const f=fixture();assert.equal(await sendNicheMailRelay(env,mail,f.fetcher),true);assert.equal(await sendNicheMailRelay(env,mail,f.fetcher),true);
 assert.equal(f.stats().sends,1);assert.match(f.stats().raw,/From: .*<forms@example.test>/);assert.match(f.stats().raw,/Reply-To: <client@example.test>/);
 await assert.rejects(sendNicheMailRelay(env,{...mail,subject:'Changed'},f.fetcher),/unavailable/);assert.equal(f.stats().sends,1);
});
test('wrong token, another recipient, tenant and unsafe headers cannot claim or send',async()=>{
 const f=fixture();
 for(const [config,message] of [[{...env,LEAD_MAIL_RELAY_TOKEN:'y'.repeat(43)},mail],[env,{...mail,to:'outsider@example.test'}],[{...env,LEAD_MAIL_RELAY_URL:'https://relay.example.test/v1/other'},mail],[env,{...mail,replyTo:'client@example.test\r\nBcc: outsider@example.test'}],[env,{...mail,subject:'Bad\r\nHeader'}]])await assert.rejects(sendNicheMailRelay(config,message,f.fetcher));
 assert.equal(f.stats().sends,0);assert.equal(f.stats().rows,0);
});
test('unknown SMTP acceptance is permanent and is never resent on replay',async()=>{
 const f=fixture(true);await assert.rejects(sendNicheMailRelay(env,mail,f.fetcher),/unknown/);await assert.rejects(sendNicheMailRelay(env,mail,f.fetcher),/unknown/);assert.equal(f.stats().sends,1);
});
test('transport check authenticates without a claim or SMTP DATA; ingress is bounded',async()=>{
 const f=fixture();const headers={authorization:`Bearer ${token}`};
 const check=await f.relay(new Request(env.LEAD_MAIL_RELAY_URL+'/transport-check',{headers}));assert.deepEqual(await check.json(),{ready:true,stage:'authenticated',reason:null});
 const large=await f.relay(new Request(env.LEAD_MAIL_RELAY_URL+'/messages/test-123',{method:'POST',headers,body:'x'.repeat(65537)}));assert.equal(large.status,413);
 assert.equal((await f.relay(new Request('https://relay.example.test/'))).status,404);assert.equal(f.stats().sends,0);assert.equal(f.stats().rows,0);assert.equal(f.stats().checks,1);
});
test('relay rejects redirects and mismatched acknowledgements without retry or fallback',async()=>{
 for(const result of [new Response(null,{status:302,headers:{location:'https://elsewhere.test'}}),Response.json({status:'accepted',id:'other'})]){let calls=0;await assert.rejects(sendNicheMailRelay(env,mail,async(_url,options)=>{calls++;assert.equal(options.redirect,'manual');return result;}));assert.equal(calls,1);}
 for(const url of ['http://relay.example.test/v1/fixture','https://user:pass@relay.example.test/v1/fixture','https://relay.example.test/v1/fixture?q=1'])await assert.rejects(sendNicheMailRelay({...env,LEAD_MAIL_RELAY_URL:url},mail,()=>{throw Error('must not fetch');}),/configuration/);
});
