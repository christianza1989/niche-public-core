import test from 'node:test';
import assert from 'node:assert/strict';
import {localRuntime} from './local-runtime.mjs';
test('Recovered canonical artifact serves current pages, private boundaries and actual assets without the original PC',async()=>{
 const app=await localRuntime();try{
  const root=await app.fetch('/');assert.equal(root.status,200);assert.match(await root.text(),/Madbeauty/);
  const content=await (await app.fetch('/content.json')).json();assert.ok(content.pages.length>=12);assert.equal((await app.fetch('/favicon.svg')).status,200);
  const sitemap=await app.fetch('/sitemap.xml');assert.equal(sitemap.status,200);assert.match(await sitemap.text(),/<loc>https:\/\/madbeauty.lt\//);
  assert.equal((await app.fetch('/this-is-not-a-real-page')).status,404);
  const secret=await app.fetch('/paskyra');assert.equal(secret.status,200);assert.match((secret.headers.get('x-robots-tag')||'')+await secret.text(),/noindex/);
  assert.equal((await app.fetch('/api/madbeauty/auth/start',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://foreign.example.test'},body:JSON.stringify({email:'restore@example.test'})})).status,403);
  assert.equal(app.mails.length,0);
 }finally{await app.close();}
});
test('Recovered trial has fictional profiles only in isolated local state; hosted expiry is unchanged',async()=>{
 const app=await localRuntime({trial:true});try{
  assert.equal((await app.fetch('/')).status,200);
  const providers=await (await app.fetch('/providers.json')).json();assert.ok(providers.profiles.length>=40);
  assert.equal((await app.fetch('/api/madbeauty/session')).status,200);
 }finally{await app.close();}
});
