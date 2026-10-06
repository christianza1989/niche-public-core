import test from 'node:test';
import assert from 'node:assert/strict';
import {boundedJson, customerAccount} from '../lib/customer-accounts.mjs';
import {sendHostingerMail} from '../lib/hostinger-mail-api.mjs';

test('bounded JSON rejects incorrect media, malformed bodies and chunked overflow', async () => {
  const request = (body, type = 'application/json') => new Request('https://example.com/api', {method:'POST', headers:{'Content-Type':type}, body, ...(body instanceof ReadableStream ? {duplex:'half'} : {})});
  await assert.rejects(boundedJson(request('{}','text/plain')), {status:415});
  await assert.rejects(boundedJson(request('{')), {status:400});
  for(const body of ['null','[]','"text"'])await assert.rejects(boundedJson(request(body)), {status:400});
  const chunks = new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode('{"message":"')); controller.enqueue(new TextEncoder().encode('a'.repeat(100))); controller.close();}});
  await assert.rejects(boundedJson(request(chunks), 64), {status:413});
  assert.deepEqual(await boundedJson(request('{"name":"Žmogus"}')), {name:'Žmogus'});
});

test('account mutations reject other origins before touching records', async () => {
  const env = {DB:{prepare(){throw Error('Database must not be accessed');}}};
  const response = await customerAccount(new Request('https://example.com/api/account/logout', {method:'POST', headers:{Origin:'https://other.example'}}), env, 'logout');
  assert.equal(response.status,403);
  assert.equal(response.headers.get('Cache-Control'),'private, no-store');
});

test('session issuance failure returns a private recoverable error rather than rejecting the request', async () => {
  const db = {prepare(sql){return {bind(){return this;}, async first(){return sql.includes('request_rates') ? {count:1} : null;}, async run(){if(sql.includes('customer_sessions'))throw Error('Private database diagnostics'); return {success:true};}};}};
  const request = new Request('https://example.com/api/account/register', {method:'POST', headers:{Origin:'https://example.com','Content-Type':'application/json'},body:JSON.stringify({email:'disposable@example.com',password:'A sufficiently long test password'})});
  const response = await customerAccount(request,{DB:db,AUTH_RATE_SECRET:'test-only'},'register');
  assert.equal(response.status,503);
  assert.deepEqual(await response.json(),{error:'Account service is temporarily unavailable.'});
});

test('site password minimum accepts six, rejects five and preserves the shared default', async () => {
  const db={prepare(sql){return {bind(){return this;},async first(){return sql.includes('request_rates')?{count:1}:null;},async run(){return {success:true};}};}};
  const register=(password,options)=>customerAccount(new Request('https://example.com/api/account/register',{method:'POST',headers:{Origin:'https://example.com','Content-Type':'application/json'},body:JSON.stringify({email:'disposable@example.com',password})}),{DB:db,AUTH_RATE_SECRET:'test-only'},'register',options);
  const short=await register('abcde',{minimumPasswordLength:6});
  assert.equal(short.status,400);
  assert.deepEqual(await short.json(),{error:'Use at least 6 characters for your password.'});
  assert.equal((await register('abcdef',{minimumPasswordLength:6})).status,201);
  const standard=await register('abcdef');
  assert.equal(standard.status,400);
  assert.deepEqual(await standard.json(),{error:'Use at least 12 characters for your password.'});
});

test('optional Mail API is off without credentials and targets only the configured mailbox', async () => {
  let calls=0;
  assert.equal(await sendHostingerMail({}, {}, async()=>{calls++;}), false);
  assert.equal(calls,0);
  const env={HOSTINGER_MAIL_API_KEY:'test-only',HOSTINGER_MAILBOX_ID:'ACtest'};
  assert.equal(await sendHostingerMail(env,{to:'test@example.com',subject:'Form test',text:'Visitor reply address appears in the body.'},async(url,options)=>{
    calls++;
    assert.equal(url,'https://api.mail.hostinger.com/api/v1/mailboxes/ACtest/send');
    assert.equal(options.headers.Authorization,'Bearer test-only');
    assert.equal(options.method,'POST');
    assert.deepEqual(JSON.parse(options.body),{to:['test@example.com'],displayName:'MB Pinet',subject:'Form test',text:'Visitor reply address appears in the body.'});
    return new Response(null,{status:202});
  }),true);
  assert.equal(calls,1);
  await assert.rejects(sendHostingerMail(env,{to:'test@example.com'},async()=>new Response('Private provider diagnostics',{status:403})),{message:'Mail provider did not accept the message'});
  await assert.rejects(sendHostingerMail({...env,HOSTINGER_MAILBOX_ID:'../another'},{}),{message:'Invalid mailbox configuration'});
});
