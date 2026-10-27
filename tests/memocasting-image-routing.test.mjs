import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,mkdir} from 'node:fs/promises';import {createRequire}from'node:module';import path from'node:path';import {fileURLToPath}from'node:url';import {build}from'esbuild';
import {relayMemoBuyer}from'../lib/memocasting-commerce-bridge.mjs';
const require=createRequire(import.meta.url),{NextRequest}=require('next/server'),root=fileURLToPath(new URL('../',import.meta.url));
test('actual host proxy rewrite cannot override final public-image admission or private/error exclusions',async()=>{
 const runtime=path.join(root,'.sites-runtime');await mkdir(runtime,{recursive:true});const dir=await mkdtemp(path.join(runtime,'image-routing-'));
 try{
  const result=await build({entryPoints:[path.join(root,'proxy.ts')],bundle:true,write:false,platform:'node',format:'cjs',packages:'external',alias:{'@':root},plugins:[{name:'isolated-worker-env',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'worker-env',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:'export const env={};',loader:'js'}));}}]});
  const file=path.join(dir,'proxy.cjs');await writeFile(file,result.outputFiles[0].contents);const {proxy}=require(file);
  for(const [route,status,type,robots]of [['catalog-media/img_fixture',200,'image/webp','index, follow, max-image-preview:large'],['reviews/photos/00000000-0000-4000-8000-000000000001',200,'image/webp','index, follow, max-image-preview:large'],['catalog-media/img_fixture',404,'application/json','noindex, nofollow'],['catalog',200,'application/json','noindex, nofollow'],['orders/test/documents/test',200,'application/pdf','noindex, nofollow']]){
   const request=new NextRequest('https://memocasting.lt/prekyba/'+route,{headers:{host:'memocasting.lt','cf-connecting-ip':'203.0.113.12'}}),rewrite=proxy(request);
   assert.equal(new URL(rewrite.headers.get('x-middleware-rewrite')).pathname,'/niche/memocasting/commerce/'+route);
   const response=await relayMemoBuyer(request,route,{siteId:'memocasting',host:'memocasting.lt',cfTrusted:true,service:{fetch:async()=>new Response('fixture',{status,headers:{'content-type':type}})}});
   const final=new Headers(response.headers);for(const[k,v]of rewrite.headers)if(!k.startsWith('x-middleware-'))final.set(k,v);
   assert.equal(final.get('x-robots-tag'),robots,route+' '+status);assert.match(final.get('cache-control'),/no-store/);
  }
 }finally{assert.ok(dir.startsWith(runtime+path.sep));await rm(dir,{recursive:true,force:true});}
});
