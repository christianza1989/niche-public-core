import test from'node:test';
import assert from'node:assert/strict';
import{readNicheFormBody}from'../lib/niche-form-body.mjs';
const request=(body,type='application/x-www-form-urlencoded',headers={})=>new Request('https://example.test/uzklausa',{method:'POST',headers:{...(type?{'content-type':type}:{}),...headers},body});

test('valid UTF-8 form parameters survive the bounded reader',async()=>{
 const r=request(new URLSearchParams({name:'Ąžuolas',message:'Kvapas Vilniuje'}).toString());
 const p=await readNicheFormBody(r);assert.equal(p.get('name'),'Ąžuolas');assert.equal(p.get('message'),'Kvapas Vilniuje');
});
test('rejected JSON is consumed, so no unread modest body remains',async()=>{
 const r=request('{}','application/json');assert.equal(await readNicheFormBody(r),null);assert.equal(r.bodyUsed,true);
});
test('missing content type is rejected after consuming the body',async()=>{
 const r=request(new Uint8Array([120,61,49]),null);assert.equal(await readNicheFormBody(r),null);assert.equal(r.bodyUsed,true);
});
test('modest oversize form is drained but never returned',async()=>{
 const r=request('x='+'a'.repeat(10001));assert.equal(await readNicheFormBody(r),null);assert.equal(r.bodyUsed,true);
});
test('declared excessive size does not leave a short body unread',async()=>{
 const r=request('x=1',undefined,{'content-length':'65537'});assert.equal(await readNicheFormBody(r),null);assert.equal(r.bodyUsed,true);
});
test('unbounded accepted-type stream is cancelled after the drain bound',async()=>{
 let cancelled=false,pulls=0;const body=new ReadableStream({pull(c){pulls++;c.enqueue(new Uint8Array(16384))},cancel(){cancelled=true}});
 const r=new Request('https://example.test/',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body,duplex:'half'});
 assert.equal(await readNicheFormBody(r),null);assert.equal(cancelled,true);assert.ok(pulls<=6);
});
test('unbounded rejected-type stream is also cancelled',async()=>{
 let cancelled=false;const body=new ReadableStream({pull(c){c.enqueue(new Uint8Array(16384))},cancel(){cancelled=true}});
 const r=new Request('https://example.test/',{method:'POST',headers:{'content-type':'application/json'},body,duplex:'half'});
 assert.equal(await readNicheFormBody(r),null);assert.equal(cancelled,true);
});
test('MIME parameters and casing work, a lookalike MIME remains rejected',async()=>{
 assert.equal((await readNicheFormBody(request('x=1','Application/X-WWW-Form-Urlencoded; charset=UTF-8'))).get('x'),'1');
 const r=request('x=1','application/x-www-form-urlencodedevil');assert.equal(await readNicheFormBody(r),null);assert.equal(r.bodyUsed,true);
});
test('absent request body remains invalid',async()=>{
 assert.equal(await readNicheFormBody(request(undefined)),null);
});
test('exact10KB boundary is accepted; limit counts UTF-8 bytes',async()=>{
 assert.equal((await readNicheFormBody(request('x='+'a'.repeat(9998)))).get('x').length,9998);
 assert.equal(await readNicheFormBody(request('x='+'a'.repeat(9999))),null);
 assert.equal(await readNicheFormBody(request('x='+'ą'.repeat(5000))),null);
});
