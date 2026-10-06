import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { request } from 'node:http';
const dev = process.env.PHONEBRIDGER_DEV_URL || 'http://127.0.0.1:5188';
const production = process.env.PHONEBRIDGER_PRODUCTION_URL || 'http://127.0.0.1:5189';
const prefix = '/__projects/phonebridger/';
const manifest = JSON.parse(await readFile(new URL('../../nisiniai_puslapiai_monetizavimui/sites/phonebridger/prototype/manifest.json',import.meta.url),'utf8'));
function get(base, url, options={}) {
  return new Promise((resolve,reject)=> {
    const req=request(new URL(url,base),options,res=>{const parts=[];res.on('data',d=>parts.push(d));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(parts)}));res.on('error',reject);});
    req.on('error',reject);req.end();
  });
}
for (const file of manifest.files) {
  const response=await get(dev,prefix+file.path,{method:'HEAD'});
  assert.equal(response.status,200,file.path);assert.equal(Number(response.headers['content-length']),file.bytes,file.path);assert.match(response.headers['x-robots-tag'],/noindex/);
}
for (const url of [prefix,prefix+'assets/video/relax1.mp4']) {
  // Vite's allowedHosts guard can reject before our middleware's own 404.
  assert.ok([403,404].includes((await get(dev,url,{headers:{Host:'phonebridger.com'}})).status),'actual public Host must not expose prototype');
  for (const options of [{},{headers:{Host:'phonebridger.com'}}]) {
    let denied=await get(production,url,options);
    if(denied.status===308) {
      assert.equal(denied.headers.location,url.replace(/\/$/,''),'only a local slash-normalization redirect is acceptable');
      denied=await get(production,denied.headers.location,options);
    }
    assert.equal(denied.status,404,'production must not expose prototype');
  }
}
assert.equal((await get(dev,prefix+'manifest.json')).status,404);
for (const video of ['relax1','kato']) {
  const response=await get(dev,prefix+`assets/video/${video}.mp4`,{headers:{Range:'bytes=0-1023'}});
  assert.equal(response.status,206);assert.equal(response.body.length,1024);assert.match(response.headers['content-range'],/^bytes 0-1023\//);
}
const pkg=JSON.parse(await readFile(new URL('../lib/generated/content-packages.json',import.meta.url),'utf8'));
assert.equal(pkg.some(p=>p.siteId==='phonebridger'),false);
const settings=JSON.parse(await readFile(new URL('../config/niche-network.json',import.meta.url),'utf8'));
assert.equal(settings.contactsBySite.phonebridger.email,'hello@phonebridger.com');assert.equal(settings.networkLiveDomains.includes('phonebridger.com'),false);
const clientFiles=await readdir(new URL('../dist/client/',import.meta.url),{recursive:true});
assert.equal(clientFiles.some(f=>/phonebridger|simulator|prototype/.test(f)),false);
console.log(JSON.stringify({status:'PASS',runtimeAssets:manifest.files.length,videoRanges:2,publicHostDenied:true,productionExcluded:true,publicPackageAbsent:true,approvedSites:pkg.length}));
