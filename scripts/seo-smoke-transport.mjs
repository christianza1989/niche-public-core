import assert from 'node:assert/strict';
export function smokeRequestOptions(target,host){
 // HTTP Host is deliberately varied by isolation probes. TLS still authenticates
 // the real transport origin; never use the untrusted Host as SNI.
 return {headers:{Host:host},...(target.protocol==='https:'?{servername:target.hostname}:{})};
}
export function assertSmokeHostIsolation({response,body},{edge,markers=[],label}){
 const rejectedAtEdge=edge&&[403,421].includes(response.statusCode)&&response.headers.server==='cloudflare';
 assert.ok(response.statusCode===404||rejectedAtEdge,label+' must reject the unknown host');
 assert.ok(!/rel=["']canonical["']/i.test(body),label+' must not leak a canonical');
 for(const marker of markers.filter(Boolean))assert.ok(!body.includes(marker),label+' must not leak niche content');
}
