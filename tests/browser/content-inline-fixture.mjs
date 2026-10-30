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
import {readPublishedEdits} from '../../lib/content-admin-store.mjs';
import {publicationSettings} from '../../lib/content-admin-context.mjs';
import {projectPublicPages} from '../../lib/niche-links.mjs';
const root=process.cwd(),runtime=path.join(root,'.sites-runtime');await fs.mkdir(runtime,{recursive:true});
const resume=process.env.PROMEDICAL_FIXTURE_RESUME_DIR;
const out=resume?path.resolve(resume):await fs.mkdtemp(path.join(runtime,'inline-fixture-'));
if(resume){const resolved=await fs.realpath(out),relative=path.relative(await fs.realpath(runtime),resolved);if(relative.startsWith('..')||path.isAbsolute(relative)||!path.basename(resolved).startsWith('inline-fixture-'))throw Error('Resume only an existing local inline fixture');await fs.access(path.join(out,'fixture.sqlite'));}
const port=Number(process.env.PROMEDICAL_FIXTURE_PORT||0);if(!Number.isInteger(port)||port<0||port>65535)throw Error('Invalid local fixture port');
// Owner demos must use the preserved deployed site, rather than imply that main's
// older design/content is live. Read-only source root; all output stays here.
const siteRoot=path.resolve(process.env.PROMEDICAL_FIXTURE_SITE_ROOT||root);
// Opt-in file-pipeline acceptance only. Never use a production credential here.
const bridgeKey=process.env.PROMEDICAL_FIXTURE_BRIDGE_TOKEN;
if(bridgeKey&&!/^[A-Za-z0-9_-]{43}$/.test(bridgeKey))throw Error('Invalid local fixture capability');
const network=JSON.parse(await fs.readFile(path.join(siteRoot,'config/niche-network.json'),'utf8'));
const renderer=path.join(siteRoot,'components/niche/promedical-site.tsx');
const previewPlugins=[{name:'local-bindings',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'binding',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:'export const env={};'}));}}];
if(siteRoot!==root)previewPlugins.push({name:'deployed-site-editor-markers',setup(b){b.onLoad({filter:/[\\/]promedical-site\.tsx$/},async()=>{
 let source=await fs.readFile(renderer,'utf8');
 const current=await fs.readFile(path.join(root,'components/niche/promedical-site.tsx'),'utf8');
 const blocks=current.match(/^function Blocks\([^\r\n]+/m)?.[0];
 if(!blocks||source.includes('PromedicalEditor')||(source.match(/^function Blocks\(/gm)||[]).length!==1||(source.match(/<div className=\{s.content\}>/g)||[]).length!==1)throw Error('Unsupported deployed renderer; inspect before adding editor markers');
 const marker='<PromedicalEditor id={page.id} revision={page.revisionHash} kind={isCategory(page)?"category":page.type}/>';
 source='import { PromedicalEditor } from '+JSON.stringify(path.join(root,'components/niche/promedical-editor').replaceAll('\\','/'))+';\n'+source.replace(/^function Blocks\([^\r\n]+/m,()=>blocks).replaceAll('<h1>','<h1 data-edit-path="title">').replace(/(<p(?:\s[^>]*)?)>(\{page.description\})/g,'$1 data-edit-path="description">$2').replace('<div className={s.content}>','<div className={s.content}>'+marker).replace('if (homepage) return <>','if (homepage) return <>'+marker);
 return {contents:source,loader:'tsx',resolveDir:path.dirname(renderer)};
});}});
await build({absWorkingDir:siteRoot,entryPoints:[renderer],outfile:path.join(out,'renderer.mjs'),bundle:true,format:'esm',platform:'node',external:['react','react-dom','/brand/*','/fonts/*','/content-assets/*'],jsx:'automatic',tsconfig:path.join(siteRoot,'tsconfig.json'),plugins:previewPlugins});
await build({stdin:{resolveDir:root,contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {PromedicalEditor} from './components/niche/promedical-editor';const node=document.querySelector('[data-promedical-editor]'),props={id:node.dataset.pageId,revision:node.dataset.revision,kind:node.dataset.kind},container=document.createElement('div');node.replaceWith(container);createRoot(container).render(React.createElement(React.StrictMode,null,React.createElement(PromedicalEditor,props)));`},outfile:path.join(out,'client.js'),bundle:true,format:'esm',platform:'browser',jsx:'automatic',tsconfig:'tsconfig.json'});
const {PromedicalSite}=await import(pathToFileURL(path.join(out,'renderer.mjs'))),css=await fs.readFile(path.join(siteRoot,'app/niche-base.css'),'utf8')+'\n'+await fs.readFile(path.join(out,'renderer.css'),'utf8');
const pkg=JSON.parse(await fs.readFile(path.join(siteRoot,'content-packages/promedical/content-package.json'),'utf8')),database=path.join(out,'fixture.sqlite'),db=testD1(database),project=(p,n=network,at=Date.now())=>projectPublicPages(p,[p],n,at);
await db.prepare('INSERT OR IGNORE INTO content_admin_accounts(site_id,email,password_hash,created_at) VALUES(?,?,?,?)').bind(pkg.siteId,'fixture@example.test',await passwordHash('fixture-only local password'),Date.now()).run();
await db.prepare('INSERT OR IGNORE INTO content_admin_settings(site_id,context_json,paused_at,updated_at) VALUES(?,?,?,?)').bind(pkg.siteId,'{}',network.guidePublicationPausedAtBySite?.[pkg.siteId]??null,Date.now()).run();
let origin='';const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,origin);let result;
 if(url.pathname.startsWith('/admin')){
  if(bridgeKey&&req.method==='POST'&&(/\/publish$/.test(url.pathname)||url.pathname==='/admin/api/policy')){res.writeHead(403);res.end('Publication disabled in file-pipeline test');return;}
  const parts=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>524288){res.writeHead(413);res.end();return;}parts.push(chunk);}
  // Virtual HTTPS request to the actual capability router, in this process only.
  // No outbound request to the canonical host and no production auth relaxation.
  const internalUrl=bridgeKey&&url.pathname.startsWith('/admin/api/rewrite-bridge/')?new URL(url.pathname+url.search,'https://'+pkg.canonicalHost):url;
  result=await handleContentAdmin(new Request(internalUrl,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Buffer.concat(parts)}:{})}),pkg,{DB:db,CONTENT_ADMIN_ENABLED:'1',CONTENT_ADMIN_DEV_ORIGIN:origin,CONTENT_REWRITE_BRIDGE_TOKEN:bridgeKey},project,network);
 }else if(url.pathname==='/fixture-client.js'){
  result=new Response(await fs.readFile(path.join(out,'client.js')),{headers:{'content-type':'text/javascript'}});
 }else if(url.pathname.startsWith('/brand/')||url.pathname.startsWith('/fonts/')||url.pathname.startsWith('/content-assets/')){
  const assetRoot=url.pathname.startsWith('/brand/promedical/admin/')?root:siteRoot;
  const file=path.resolve(assetRoot,'public','.'+decodeURIComponent(url.pathname));if(!file.startsWith(path.join(assetRoot,'public')+path.sep))throw Error('Invalid asset');
  const type={'.js':'text/javascript','.css':'text/css','.webp':'image/webp','.woff2':'font/woff2','.ttf':'font/ttf','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'}[path.extname(file)]||'application/octet-stream';
  result=new Response(await fs.readFile(file),{headers:{'content-type':type}});
 }else{
  const snapshot=await readPublishedEdits(db,pkg),pages=project(snapshot.pkg,publicationSettings(network,pkg.siteId,snapshot.pausedAt),snapshot.at),page=pages.find(p=>p.slug===url.pathname.slice(1));if(!page){res.writeHead(404);res.end('Not found');return;}
  const html=renderToStaticMarkup(React.createElement(PromedicalSite,{pkg:snapshot.pkg,page,livePages:pages,query:Object.fromEntries(url.searchParams)}));
  result=new Response(`<!doctype html><html lang="lt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bandomoji Promedical TVS</title><link rel="stylesheet" href="/fonts/promedical/font.css"><style>${css}</style></head><body style="margin:0"><p style="padding:8px;margin:0;background:#fff3df">Bandomoji TVS · ${bridgeKey?'vieno teksto bandymas iki juodraščio · skelbimas išjungtas':'perrašymo užduotys nesiunčiamos · gyva svetainė nekeičiama'}</p>${html}<script type="module" src="/fixture-client.js"></script></body></html>`,{headers:{'content-type':'text/html'}});
 }
 res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));
 }catch(e){res.writeHead(e.code==='ENOENT'?404:500);res.end('Fixture request failed');console.error(e.message);}});
server.listen(port,'127.0.0.1',()=>{origin='http://127.0.0.1:'+server.address().port;console.log(JSON.stringify({origin,siteRoot,database,filePipeline:!!bridgeKey,publishedGuides:project(pkg).filter(p=>p.type==='guide').length,product:'/produktai/'+pkg.pages.find(p=>p.type==='product').slug.split('/').slice(1).join('/')}));});
process.on('SIGINT',()=>server.close(()=>{db.close();process.exit(0)}));
