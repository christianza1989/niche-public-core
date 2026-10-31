import test from 'node:test';import assert from 'node:assert/strict';
import{nicheRequestOrigin,hostingerPublicHost}from'../lib/niche-request-origin.mjs';
test('Worker origins remain exact and ignore forwarded spoofing',()=>{
 const request=new Request('https://kvapunaikinimas.lt/uzklausa',{headers:{'X-Forwarded-Host':'attacker.example'}});
 assert.equal(nicheRequestOrigin(request,'kvapunaikinimas.lt'), 'https://kvapunaikinimas.lt');
});
test('Node public HTTPS origin survives internal loopback rewrite',()=>{
 const request=new Request('http://localhost:3000/niche/kvapunaikinimas/lead');
 assert.equal(nicheRequestOrigin(request,'kvapunaikinimas.lt',true),'https://kvapunaikinimas.lt');
 assert.notEqual(nicheRequestOrigin(request,'kvapunaikinimas.lt',true),'https://attacker.example');
 assert.equal(nicheRequestOrigin(request,'localhost:3000',true),'http://localhost:3000');
 assert.equal(nicheRequestOrigin(request,'127.0.0.1:3000',true),'http://localhost:3000');
});
test('malformed host cannot turn into an accepted form origin',()=>{
 const request=new Request('http://localhost:3000/niche/kvapunaikinimas/lead');
 for(const host of ['user:pass@example.lt','example.lt/path','example.lt?other=1','example.lt,attacker.example'])assert.equal(nicheRequestOrigin(request,host,true),null);
});
test('dedicated Node app admits only its native host and explicit stage alias',()=>{
 const canonical='kvapunaikinimas.lt',stage='one-123.hostingersite.com';
 assert.equal(hostingerPublicHost('KVAPUNAIKINIMAS.LT:443',null,canonical,stage),canonical);
 assert.equal(hostingerPublicHost(stage,null,canonical,stage),stage);
 assert.equal(hostingerPublicHost('localhost:3000',stage,canonical,stage),stage);
 assert.equal(hostingerPublicHost('other.example',canonical,canonical,stage),null);
 assert.equal(hostingerPublicHost('unrelated-core.lt',null,canonical,stage),null);
 assert.equal(hostingerPublicHost(canonical+',attacker.example',null,canonical,stage),null);
});
