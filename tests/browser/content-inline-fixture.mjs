// Local-only UI fixture using the actual renderer, API and SQLite storage.
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {testD1} from '../helpers/content-admin-d1.mjs';
import {passwordHash} from '../../lib/content-admin-auth.mjs';
import {handleContentAdmin} from '../../lib/content-admin-api.mjs';
import {projectPublicPages} from '../../lib/niche-links.mjs';
const root=process.cwd(),out=path.join(root,'.sites-runtime/inline-fixture');await fs.mkdir(out,{recursive:true});
await build({entryPoints:['components/niche/promedical-site.tsx'],outfile:path.join(out,'renderer.mjs'),bundle:true,format:'esm',platform:'node',external:['react','react-dom'],jsx:'automatic',tsconfig:'tsconfig.json',plugins:[{name:'local-bindings',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'binding',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:'export const env={};'}));}}]});
await build({stdin:{resolveDir:root,contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {PromedicalEditor} from './components/niche/promedical-editor';const node=document.querySelector('[data-promedical-editor]'),props={id:node.dataset.pageId,revision:node.dataset.revision,kind:node.dataset.kind},container=document.createElement('div');node.replaceWith(container);createRoot(container).render(React.createElement(React.StrictMode,null,React.createElement(PromedicalEditor,props)));`},outfile:path.join(out,'client.js'),bundle:true,format:'esm',platform:'browser',jsx:'automatic',tsconfig:'tsconfig.json'});
const {PromedicalSite}=await import(pathToFileURL(path.join(out,'renderer.mjs'))),css=await fs.readFile(path.join(out,'renderer.css'),'utf8');
const pkg=JSON.parse(await fs.readFile('content-packages/promedical/content-package.json','utf8')),db=testD1(),project=(p,n={},at=Date.now())=>projectPublicPages(p,[p],n,at);
await db.prepare('INSERT INTO content_admin_accounts(site_id,email,password_hash,created_at) VALUES(?,?,?,?)').bind(pkg.siteId,'fixture@example.test',await passwordHash('fixture-only local password'),Date.now()).run();
await db.prepare('INSERT INTO content_admin_settings(site_id,context_json,paused_at,updated_at) VALUES(?,?,?,?)').bind(pkg.siteId,'{}',null,Date.now()).run();
let origin='';const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,origin);let result;
 if(url.pathname.startsWith('/admin')){
  const parts=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>524288){res.writeHead(413);res.end();return;}parts.push(chunk);}
  result=await handleContentAdmin(new Request(url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Buffer.concat(parts)}:{})}),pkg,{DB:db,CONTENT_ADMIN_ENABLED:'1',CONTENT_ADMIN_DEV_ORIGIN:origin},project,{});
 }else if(url.pathname==='/fixture-client.js'){
  result=new Response(await fs.readFile(path.join(out,'client.js')),{headers:{'content-type':'text/javascript'}});
 }else if(url.pathname.startsWith('/brand/')||url.pathname.startsWith('/fonts/')||url.pathname.startsWith('/content-assets/')){
  const file=path.resolve(root,'public','.'+decodeURIComponent(url.pathname));if(!file.startsWith(path.join(root,'public')+path.sep))throw Error('Invalid asset');
  const type={'.js':'text/javascript','.css':'text/css','.webp':'image/webp','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'}[path.extname(file)]||'application/octet-stream';
  result=new Response(await fs.readFile(file),{headers:{'content-type':type}});
 }else{
  const pages=project(pkg),page=pages.find(p=>p.slug===url.pathname.slice(1));if(!page){res.writeHead(404);res.end('Not found');return;}
  const html=renderToStaticMarkup(React.createElement(PromedicalSite,{pkg,page,livePages:pages}));
  result=new Response(`<!doctype html><html lang="lt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Izoliuota Promedical peržiūra</title><link rel="stylesheet" href="/fonts/promedical/font.css"><style>${css}</style></head><body style="margin:0"><p style="padding:8px;margin:0;background:#fff3df">Vietinis bandymas · netikra paskyra · gyva svetainė nekeičiama</p>${html}<script type="module" src="/fixture-client.js"></script></body></html>`,{headers:{'content-type':'text/html'}});
 }
 res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));
 }catch(e){res.writeHead(e.code==='ENOENT'?404:500);res.end('Fixture request failed');console.error(e.message);}});
server.listen(0,'127.0.0.1',()=>{origin='http://127.0.0.1:'+server.address().port;console.log(JSON.stringify({origin,product:'/produktai/'+pkg.pages.find(p=>p.type==='product').slug.split('/').slice(1).join('/')}));});
process.on('SIGINT',()=>server.close(()=>{db.close();process.exit(0)}));
