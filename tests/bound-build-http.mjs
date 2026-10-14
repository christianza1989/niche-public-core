// Owned real Worker transport fixture; no semantic reviews, writes or activation.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,symlink,realpath} from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {request} from 'node:http';
import {nativeFixture,approveFixture} from './fixtures/native-niche-v2.mjs';
import {cleanBuildSource} from '../scripts/content-build-proof.mjs';

const root=path.resolve(import.meta.dirname,'..'),[command,relative,base='http://127.0.0.1:8899']=process.argv.slice(2);
const target=path.resolve(root,relative||'');
assert.ok(target.startsWith(path.join(root,'outputs')+path.sep));
const marker=path.join(target,'outputs/header-fixture.json'),sha=b=>createHash('sha256').update(b).digest('hex');
if(command==='prepare'){
  const source=cleanBuildSource(root);assert.ok(source,'Commit the reviewed source before preparing an exact Git build');
  await mkdir(path.dirname(target),{recursive:true});
  execFileSync('git',['worktree','add','--detach',target,source],{cwd:root,stdio:'inherit'});
  assert.equal(await realpath(target),target);
  await symlink(path.join(root,'node_modules'),path.join(target,'node_modules'),process.platform==='win32'?'junction':'dir');
  assert.equal(sha(await readFile(path.join(target,'package-lock.json'))),sha(await readFile(path.join(root,'package-lock.json'))));
  const sharp=(await import('sharp')).default,packages=[];
  for(const id of ['headerpreview','headerfixture']){
    const pkg=nativeFixture({siteId:id});
    if(id==='headerpreview'){
      pkg.canonicalHost='private-header-preview.lt';pkg.site.canonicalHost=pkg.canonicalHost;
      for(const page of pkg.pages)page.siteSnapshot=structuredClone(pkg.site);approveFixture(pkg);
    }
    const folder=path.join(target,'content-packages',id);await mkdir(path.join(folder,'assets'),{recursive:true});
    for(const media of pkg.pages.flatMap(p=>p.media))await writeFile(path.join(folder,'assets',path.basename(media.src)),await sharp({create:{width:media.width,height:media.height,channels:3,background:'#31554a'}}).webp().toBuffer());
    // Deliberately noncanonical whitespace proves the header binds original bytes.
    const raw=JSON.stringify(pkg,null,2)+'\n',packageSha256=sha(raw);
    await writeFile(path.join(folder,'content-package.json'),raw);
    await writeFile(path.join(folder,'activation.json'),JSON.stringify({schemaVersion:1,scope:id==='headerpreview'?'local-preview':'local-fixture',testOnly:true,
      siteId:id,canonicalHost:pkg.canonicalHost,renderer:'niche',packageSha256,reviewer:'synthetic build protocol only',acceptedAt:new Date().toISOString()}));
    packages.push({siteId:id,canonicalHost:pkg.canonicalHost,packageSha256});
  }
  await mkdir(path.dirname(marker),{recursive:true});await writeFile(marker,JSON.stringify({version:1,testOnly:true,source,packages}));
  assert.equal(cleanBuildSource(target),source);
  console.log(JSON.stringify({prepared:target,source,testOnly:true}));
}else if(command==='check'){
  const state=JSON.parse(await readFile(marker));assert.equal(state.testOnly,true);
  const origin=new URL(base);assert.equal(origin.protocol,'http:');assert.ok(['127.0.0.1','localhost'].includes(origin.hostname));assert.ok(origin.port);
  const results=[];
  async function get(route,host='127.0.0.1:'+origin.port){
    const result=await new Promise((resolve,reject)=>{const req=request(new URL(route,origin),{method:'GET',headers:{Host:host,'x-niche-package-sha256':'0'.repeat(64),'x-niche-source-revision':'0'.repeat(40)},timeout:20000},res=>{const chunks=[];res.on('data',v=>chunks.push(v));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,bytes:Buffer.concat(chunks)}));});req.on('error',reject);req.on('timeout',()=>req.destroy(Error('Local fixture timeout')));req.end();});
    results.push({route,host,status:result.status,package:result.headers['x-niche-package-sha256'],source:result.headers['x-niche-source-revision'],bodySha256:sha(result.bytes)});return result;
  }
  try{
    const preview=state.packages.find(p=>p.siteId==='headerpreview'),fixture=state.packages.find(p=>p.siteId==='headerfixture');
    for(const [route,status]of [['/',200],['/robots.txt',200],['/sitemap.xml',200],['/llms.txt',200],['/llms-full.txt',200],['/favicon.svg',200],['/content-assets/headerpreview/current-640.webp',200],['/content-assets/headerpreview/future.webp',404],['/content-package.json',404],['/release-manifest.json',404],['/niche/headerpreview',404],['/api/anything',404]]){
      const row=await get(route);assert.equal(row.status,status,route);assert.equal(row.headers['x-niche-package-sha256'],preview.packageSha256,route);assert.equal(row.headers['x-niche-source-revision'],state.source,route);
    }
    for(const host of [preview.canonicalHost,'foreign.example','preview.vercel.app']){const row=await get('/',host);assert.equal(row.status,404,host);assert.equal(row.headers['x-niche-package-sha256'],undefined);assert.equal(row.headers['x-niche-source-revision'],undefined);}
    const row=await get('/',fixture.canonicalHost);assert.equal(row.status,200);assert.equal(row.headers['x-niche-package-sha256'],fixture.packageSha256);assert.equal(row.headers['x-niche-source-revision'],state.source);assert.match(row.headers['x-robots-tag'],/noindex/);
    await writeFile(path.join(target,'outputs/header-http-'+Date.now()+'.json'),JSON.stringify({result:'PASS',testOnly:true,source:state.source,results},null,2));
    console.log(JSON.stringify({result:'PASS',testOnly:true,requests:results.length,source:state.source}));
  }catch(error){await writeFile(path.join(target,'outputs/header-http-FAIL-'+Date.now()+'.json'),JSON.stringify({result:'FAIL',testOnly:true,source:state.source,results,error:String(error)}));throw error;}
}else throw Error('Use prepare/check with a new owned outputs path');
