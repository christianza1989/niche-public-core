import test from 'node:test';import assert from 'node:assert/strict';import{checkHostingerCommerceMail,sendHostingerCommerceMail}from'../lib/hostinger-commerce-mail.mjs';
const config={apiKey:'FIXTURE_ONLY_NOT_A_CREDENTIAL',mailboxResourceId:'fixture123',sender:'sender@example.test',displayName:'Memocasting'};
const message={id:'owner-check-123',from:config.sender,to:'buyer@example.test',replyTo:'help@example.test',subject:'Užsakymas',text:'Fixture only.'};
test('Hostinger API admission verifies the exact mailbox and sender without sending',async()=>{
 let calls=0;const fetcher=async(url,options)=>{calls++;assert.equal(url,'https://api.mail.hostinger.com/api/v1/me');assert.equal(options.redirect,'manual');assert.equal(options.method,undefined);return Response.json({data:{mailboxes:[{resourceId:'fixture123',address:config.sender}]}});};
 assert.deepEqual(await checkHostingerCommerceMail(config,fetcher),{ready:true,stage:'authenticated'});assert.equal(calls,1);
 await assert.rejects(checkHostingerCommerceMail({...config,sender:'other@example.test'},fetcher),/sender_mismatch/);
});
test('Hostinger exact204 is acceptance only, with one request and no fabricated SMTP headers',async()=>{
 let calls=0;const receipt=await sendHostingerCommerceMail(config,message,async(url,options)=>{calls++;assert.equal(url,'https://api.mail.hostinger.com/api/v1/mailboxes/fixture123/send');assert.equal(options.redirect,'manual');const body=JSON.parse(options.body);assert.deepEqual(Object.keys(body).sort(),['displayName','subject','text','to']);assert(body.text.includes(message.replyTo));assert(body.text.includes(message.id));return new Response(null,{status:204});});assert.equal(calls,1);assert.deepEqual(receipt,{reference:'hostinger-api-accepted:owner-check-123'});
});
test('Hostinger timeout, redirect or non204 never retries or falls back to SMTP',async()=>{
 for(const status of [200,302,401,403,422,500,502,504]){let calls=0;await assert.rejects(sendHostingerCommerceMail(config,message,async()=>{calls++;return new Response(null,{status});}),/not_accepted/);assert.equal(calls,1);}
 let calls=0;await assert.rejects(sendHostingerCommerceMail(config,message,async()=>{calls++;throw Error('timeout');}),/timeout/);assert.equal(calls,1);
 calls=0;await assert.rejects(sendHostingerCommerceMail(config,{...message,from:'other@example.test'},async()=>{calls++;}),/message_invalid/);assert.equal(calls,0);
});
test('HTML button and plain-text alternative use the documented Hostinger payload together, without tracking or retries',async()=>{
 let calls=0;
 await sendHostingerCommerceMail(config,{...message,html:'<p>Užsakymas</p><a href="https://memocasting.lt/cart">Tęsti apmokėjimą</a>'},async(_url,options)=>{calls++;const body=JSON.parse(options.body);assert(body.text.includes(message.text));assert(body.html.includes('Tęsti apmokėjimą'));return new Response(null,{status:204});});
 assert.equal(calls,1);
 await assert.rejects(sendHostingerCommerceMail(config,{...message,html:'x'.repeat(40001)},async()=>{throw Error('must not send');}),/message_invalid/);
});
