import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import manifest from '../lib/memocasting-instruction-documents.json' with {type:'json'};
import {memoInstructionDocument,memoInstructionDocumentAlias,memoInstructionRawDocumentPath,serveMemoInstructionDocument} from '../lib/memocasting-instruction-documents.mjs';
import {projectPublicPages} from '../lib/niche-links.mjs';

const now=Date.parse('2026-10-25T00:00:00Z');
const page=slug=>({id:slug,siteId:'memocasting',type:'faq',slug,publishAt:'2026-10-01T00:00:00.000Z',revisionHash:'current',approval:{status:'approved',revisionHash:'current'},links:[],media:[]});
const pkg={siteId:'memocasting',canonicalHost:'memocasting.lt',pages:manifest.documents.map(document=>page(document.pageSlug))};
const project=(candidate=pkg)=>projectPublicPages(candidate,[candidate],{},now);
const request=(pathname,options={})=>{const {host='memocasting.lt',method='GET',headers={}}=options;return new Request('https://'+host+pathname,{method,headers:{host,...headers}});};

test('both owner originals retain their exact PDF bytes, checksums and narrow worker-first paths',async()=>{
 assert.equal(manifest.documents.length,2);
 for(const document of manifest.documents){
  const bytes=await readFile(new URL('../public'+document.path,import.meta.url));
  assert.equal(bytes.length,document.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),document.sha256);
  assert.equal(bytes.subarray(0,5).toString(),'%PDF-');
  assert.ok(memoInstructionRawDocumentPath(document.path));assert.ok(memoInstructionDocumentAlias(document.alias));
  assert.equal(memoInstructionDocument(pkg,project(),document.path),null,'raw paths are not aliases');
 }
 const config=await readFile(new URL('../vite.config.ts',import.meta.url),'utf8');
 assert.ok(config.includes('"/memocasting-homepage/*"'),'raw namespace must run the Worker before static ASSETS');
});

test('alias lookup admits only the matching current native instruction page on the owning site',()=>{
 const [couple,family]=manifest.documents;
 assert.equal(memoInstructionDocument(pkg,project(),couple.alias)?.sha256,couple.sha256);
 assert.equal(memoInstructionDocument(pkg,[pkg.pages[0]],family.alias),null);
 for(const candidate of [{...pkg,siteId:'other'},{...pkg,canonicalHost:'other.lt'},null])assert.equal(memoInstructionDocument(candidate,project(),couple.alias),null);
 for(const pathname of ['/dokumentai/private.pdf',couple.alias+'/',family.path])assert.equal(memoInstructionDocument(pkg,project(),pathname),null);
 for(const change of [{publishAt:'2030-01-01T00:00:00Z'},{revisionHash:'edited'},{approval:{status:'revoked',revisionHash:'current'}}]){
  const candidate={...pkg,pages:[{...pkg.pages[0],...change}]};
  assert.equal(memoInstructionDocument(candidate,project(candidate),couple.alias),null);
 }
});

test('regression: approved owner PDF links survive projection while arbitrary owned assets remain hidden',()=>{
 const document=manifest.documents[0],url='https://memocasting.lt'+document.alias;
 const links=[{url,label:'Poros rinkinio instrukcija PDF',reason:'Savininko originalas'},
  {url:'https://memocasting.lt/dokumentai/private.pdf',label:'Unknown'},
  {url:'https://memocasting.lt'+document.path,label:'Raw'},
  {url:url+'?download=1',label:'Query'},
  {url:url+'#page=1',label:'Fragment'},
  {url:'https://manufacturer.example/spec',label:'External'}];
 const candidate={...pkg,pages:[{...pkg.pages[0],externalLinks:links}]};
 const before=JSON.stringify(candidate);
 assert.deepEqual(project(candidate)[0].externalLinks,[links[0],links.at(-1)]);
 assert.equal(JSON.stringify(candidate),before,'reviewed native source is not rewritten');
 const reader={siteId:'reader',canonicalHost:'reader.lt',pages:[{...page('reader'),externalLinks:[links[0]]}]};
 assert.deepEqual(projectPublicPages(reader,[reader,candidate],{},now)[0].externalLinks,[]);
 assert.deepEqual(projectPublicPages(reader,[reader,candidate],{networkLiveDomains:['memocasting.lt']},now)[0].externalLinks,[links[0]]);
 const future={...candidate,pages:[{...candidate.pages[0],publishAt:'2030-01-01T00:00:00Z'}]};
 assert.deepEqual(projectPublicPages(reader,[reader,future],{networkLiveDomains:['memocasting.lt']},now)[0].externalLinks,[]);
});

test('GET, HEAD and ranges stream exact PDF bytes with attachment, noindex and private cache headers',async()=>{
 for(const document of manifest.documents){
  const bytes=await readFile(new URL('../public'+document.path,import.meta.url));
  const seen=[];
  const assets={fetch:async incoming=>{seen.push(incoming);assert.equal(new URL(incoming.url).pathname,document.path);assert.equal(new URL(incoming.url).search,'');assert.equal(incoming.headers.get('Range'),null);assert.equal(incoming.headers.get('Accept-Encoding'),'identity');return new Response(incoming.method==='HEAD'?null:bytes,{headers:{'Content-Type':'application/octet-stream','Content-Length':String(bytes.length),ETag:'"original"'}});}};
  const options={pkg,eligiblePages:project(),pathname:document.alias,assets};
  const get=await serveMemoInstructionDocument(request(document.alias+'?ignored=1'),options);
  assert.equal(get.status,200);assert.equal(get.headers.get('Content-Type'),'application/pdf');assert.equal(get.headers.get('Content-Length'),String(bytes.length));
  assert.equal(get.headers.get('X-Robots-Tag'),'noindex');assert.equal(get.headers.get('X-Content-Type-Options'),'nosniff');assert.match(get.headers.get('Cache-Control'),/private, no-store/);
  assert.match(get.headers.get('Content-Disposition'),/^attachment; filename="[^"\r\n]+"; filename\*=UTF-8''/);
  assert.ok(get.headers.get('Content-Disposition').includes(encodeURIComponent(document.filename).replace(/[()]/g,value=>'%'+value.charCodeAt(0).toString(16))));
  assert.deepEqual(new Uint8Array(await get.arrayBuffer()),new Uint8Array(bytes));
  const head=await serveMemoInstructionDocument(request(document.alias,{method:'HEAD'}),options);
  assert.equal(head.status,200);assert.equal(await head.text(),'');assert.equal(head.headers.get('Content-Length'),String(bytes.length));
  const ranged=await serveMemoInstructionDocument(request(document.alias,{headers:{Range:'bytes=5-18'}}),options);
  assert.equal(ranged.status,206);assert.equal(ranged.headers.get('Content-Range'),`bytes 5-18/${bytes.length}`);assert.deepEqual(new Uint8Array(await ranged.arrayBuffer()),new Uint8Array(bytes.subarray(5,19)));
  assert.equal(seen.length,3);
 }
});

test('serving denies foreign hosts, conflicting Host headers, future pages and all raw paths before fetching',async()=>{
 const document=manifest.documents[0];let fetches=0;
 const options={pkg,eligiblePages:project(),pathname:document.alias,assets:{fetch:async()=>{fetches++;throw new Error('Must not fetch denied document');}}};
 for(const incoming of [request(document.alias,{host:'other.lt'}),request(document.alias,{headers:{host:'other.lt'}}),request(document.alias,{host:'memocasting.lt:444'})])assert.equal((await serveMemoInstructionDocument(incoming,options)).status,404);
 for(const change of [{pkg:{...pkg,siteId:'other'}},{eligiblePages:[]},{pathname:document.path},{pathname:'/dokumentai/private.pdf'}])assert.equal((await serveMemoInstructionDocument(request(document.alias),{...options,...change})).status,404);
 assert.equal(fetches,0);
 const write=await serveMemoInstructionDocument(request(document.alias,{method:'POST'}),options);assert.equal(write.status,405);assert.equal(write.headers.get('Allow'),'GET, HEAD');assert.equal(fetches,0);
 const missing=await serveMemoInstructionDocument(request(document.alias),{...options,assets:undefined});assert.equal(missing.status,503);assert.equal(missing.headers.get('X-Robots-Tag'),'noindex');
});

async function loadProxy(candidate=pkg){
 const source=await readFile(new URL('../proxy.ts',import.meta.url),'utf8');
 const javascript=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const modules={
  'next/server':{NextResponse:{next:()=>new Response('fallback'),rewrite:url=>new Response(null,{headers:{'x-test-rewrite':url.href}}),redirect:(url,status)=>new Response(null,{status,headers:{Location:url.href}})}},
  '@/lib/niche-sites':{normalizedHost:host=>(host??'').split(',')[0].trim().toLowerCase().replace(/:\d+$/,''),nicheSiteByHost:host=>host==='memocasting.lt'?candidate:host==='other.lt'?{siteId:'other',canonicalHost:'other.lt',pages:[]}:null,publicNichePages:site=>projectPublicPages(site,[site],{},now)},
  '@/lib/site-config':{SITE_CONFIGS:{legacy:{domains:['legacy.test']}}},
  '@/lib/content-model-v2':{hasLocalPreviewContent:()=>false,contentPackageByHost:()=>{throw new Error('Document request reached gift fallback');}},
  '@/config/content-media-aliases.json':[],
  '@/lib/content-media-aliases.mjs':{visibleMediaAlias:()=>null},
  '@/lib/memocasting-routes.mjs':{memoRedirectUrl:()=>null},
  '@/lib/memocasting-homepage-assets.mjs':{memoHomepageAsset:()=>null},
  '@/lib/memocasting-homepage-markup.mjs':{memoHomepageAdmitted:()=>false},
  '@/lib/memocasting-instruction-documents.mjs':{memoInstructionDocument,memoInstructionDocumentAlias,memoInstructionRawDocumentPath},
  '@/lib/memocasting-instagram-bridge.mjs':{instagramAction:()=>false},
  '@/lib/o3tech-brand.mjs':await import('../lib/o3tech-brand.mjs'),
  '@/config/niche-path-aliases.json':[],
  '@/lib/niche-path-aliases.mjs':{indexNichePathAliases:()=>new Map(),nichePathAliasDestination:()=>null},
 };
 const exported={};
 runInNewContext(javascript,{exports:exported,require:name=>{assert.ok(name in modules,'Unexpected proxy dependency '+name);return modules[name];},Response,Headers,URL,Map,Set});
 return exported.proxy;
}

function proxyRequest(pathname,options={}){
 const incoming=request(pathname,options),nextUrl=new URL(incoming.url);nextUrl.clone=()=>new URL(nextUrl);incoming.nextUrl=nextUrl;return incoming;
}

test('actual proxy routes GET/HEAD aliases and rejects raw/cross-site/future requests before any fallback',async()=>{
 const proxy=await loadProxy(),document=manifest.documents[0];
 for(const method of ['GET','HEAD']){
  const visible=proxy(proxyRequest(document.alias,{method}));assert.equal(visible.status,200);assert.equal(visible.headers.get('X-Robots-Tag'),'noindex');
  assert.equal(visible.headers.get('x-test-rewrite'),'https://memocasting.lt/niche/memocasting/instruction-documents/poros-rinkinio-instrukcija.pdf');
 }
 for(const method of ['GET','HEAD']){
  for(const host of ['memocasting.lt','www.memocasting.lt','other.lt','gift.test','legacy.test','unknown.test','localhost']){
   assert.equal(proxy(proxyRequest(document.path,{host,method})).status,404,'raw denied on '+host);
   assert.equal(proxy(proxyRequest(manifest.rawPrefix+'private.pdf',{host,method})).status,404,'unknown raw denied on '+host);
  }
  for(const host of ['other.lt','gift.test','legacy.test','unknown.test','localhost'])assert.equal(proxy(proxyRequest(document.alias,{host,method})).status,404,'alias denied on '+host);
 }
 const future=await loadProxy({...pkg,pages:[{...pkg.pages[0],publishAt:'2030-01-01T00:00:00Z'}]});
 assert.equal(future(proxyRequest(document.alias)).status,404);
 assert.equal(proxy(proxyRequest(document.alias,{method:'POST'})).status,405);
});
