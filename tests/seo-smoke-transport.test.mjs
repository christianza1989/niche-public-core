import test from 'node:test';
import assert from 'node:assert/strict';
import {smokeRequestOptions,assertSmokeHostIsolation} from '../scripts/seo-smoke-transport.mjs';
test('foreign HTTP host does not replace real TLS SNI or disable certificate verification',()=>{
 const options=smokeRequestOptions(new URL('https://site.example/favicon.svg'),'unknown.example');
 assert.equal(options.servername,'site.example');assert.equal(options.headers.Host,'unknown.example');
 assert.equal(options.rejectUnauthorized,undefined);assert.equal(options.checkServerIdentity,undefined);
 assert.equal(smokeRequestOptions(new URL('http://127.0.0.1:8787/'),'unknown.example').servername,undefined);
});
test('local app isolation stays404, while HTTPS Cloudflare denial must not leak niche content',()=>{
 const opts={edge:false,markers:['PRIVATE SITE'],label:'fixture'};
 const result=statusCode=>({response:{statusCode,headers:{server:'cloudflare'}},body:'Denied'});
 assert.doesNotThrow(()=>assertSmokeHostIsolation(result(404),opts));
 assert.throws(()=>assertSmokeHostIsolation(result(403),opts));
 for(const code of [403,421])assert.doesNotThrow(()=>assertSmokeHostIsolation(result(code),{...opts,edge:true}));
 assert.throws(()=>assertSmokeHostIsolation(result(200),{...opts,edge:true}));
 assert.throws(()=>assertSmokeHostIsolation({...result(403),body:'PRIVATE SITE'},{...opts,edge:true}));
 assert.throws(()=>assertSmokeHostIsolation({...result(403),body:'<link rel="canonical" href="/">'},{...opts,edge:true}));
});
