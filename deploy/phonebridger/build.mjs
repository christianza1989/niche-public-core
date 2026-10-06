import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {validateContentPackage} from '../../scripts/content-package-core.mjs';
import {projectPublicPages} from '../../lib/niche-links.mjs';
import settings from '../../config/niche-network.json' with {type:'json'};
import {nicheSchemaGraph} from '../../lib/niche-schema-core.mjs';
import {nichePageUrlCore} from '../../lib/niche-seo-core.mjs';
const core=path.resolve(import.meta.dirname,'../..');
const companion=path.resolve(process.argv[2]||path.join(core,'../nisiniai_puslapiai_monetizavimui'));
const appInput=process.argv[3]||process.env.PHONEBRIDGER_APP_ROOT;
if(!appInput)throw Error('Supply the approved application checkout as the third argument or PHONEBRIDGER_APP_ROOT.');
const app=path.resolve(appInput);
const project=path.join(companion,'sites/phonebridger'),prototype=path.join(project,'prototype');
const out=path.join(core,'.sites-runtime/phonebridger-production'),assets=path.join(out,'assets');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const esc=text=>String(text).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const decode=text=>text.replace(/<[^>]*>/g,' ').replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#39;',"'").replace(/\s+/g,' ').trim();
const {transform}=await import(pathToFileURL(path.join(project,'production/transform.mjs')));
const {productionSource,shopAssetFiles,shellAssetFiles}=await import(pathToFileURL(path.join(project,'production/source.mjs')));
const manifest=JSON.parse(await readFile(path.join(prototype,'manifest.json'),'utf8'));
const transformed=new Map();
for(const entry of manifest.files){
 const original=await readFile(path.join(prototype,entry.path));
 if(original.length!==entry.bytes||sha(original)!==entry.sha256)throw Error('Prototype attestation failed: '+entry.path);
 if(entry.path.startsWith('tests/')||/preview\.html$|\.test\.|^robots.txt$|^sitemap.xml$|^llms/.test(entry.path))continue;
 transformed.set(entry.path,/\.(html|js)$/.test(entry.path)?Buffer.from(transform(entry.path,await productionSource(entry.path,original.toString()))):original);
}
for(const file of shopAssetFiles)transformed.set('assets/shop-v2/'+file,await readFile(path.join(project,'shop-v2',file)));
for(const file of shellAssetFiles)transformed.set('assets/shared-shell/'+file,await readFile(path.join(project,'production/shared-shell',file)));
transformed.set('checkout/index.html',Buffer.from(transform('checkout/index.html',await productionSource('checkout/index.html',await readFile(path.join(prototype,'shop/index.html'),'utf8')))));
// Builds consume the committed reviewed edition; deployment never manufactures approval.
const pkg=JSON.parse(await readFile(path.join(project,'production/package/content-package.json'),'utf8'));validateContentPackage(pkg);
const pages=projectPublicPages(pkg,[pkg],settings);if(pages.length!==14)throw Error('Expected 14 due exact approved public pages.');
for(const page of pages.filter(p=>['contact','privacy','shop','terms'].includes(p.slug))){
 const html=transformed.get(page.slug+'/index.html').toString(),main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
 const body=[...main.matchAll(/<(p|h2|li)\b[^>]*>([\s\S]*?)<\/\1>/g)].map(m=>m[1]==='h2'?{type:'heading',level:2,text:decode(m[2])}:{type:'paragraph',text:decode(m[2])}).filter(b=>b.text);
 if(JSON.stringify(body)!==JSON.stringify(page.body))throw Error('Production copy requires a new reviewed edition: '+page.slug);
}
await mkdir(out,{recursive:true});
const routes={},allow=[];await mkdir(assets,{recursive:true});
for(const [file,bytes] of transformed){
 let content=bytes;const html=file.endsWith('/index.html')||file==='index.html';
 if(html){
  const slug=file==='index.html'?'':file.slice(0,-'/index.html'.length),page=pages.find(p=>p.slug===slug);
  if(!page&&!['login','register','recover','account','checkout'].includes(slug))continue;
  let text=bytes.toString();
  if(slug==='checkout')text=text.replace(/<meta name="robots"[^>]*>/g,'<meta name="robots" content="noindex,nofollow">').replace(/<link rel="canonical"[^>]*>/g,'').replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g,'');
  if(slug)text=text.replace('<head>',`<head><base href="/${slug}/">`);
  if(page){
   text=text.replace('</head>','<script src="/interest.js" defer></script></head>');
   text=text.replace(/<meta name="robots"[^>]*>/g,'<meta name="robots" content="index,follow">');
   text=text.replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${esc(page.description)}">`);
   const canonical=nichePageUrlCore(pkg,page);
   const canonicalTag=`<link rel="canonical" href="${canonical}">`;
   if(/<link rel="canonical"[^>]*>/.test(text))text=text.replace(/<link rel="canonical"[^>]*>/,canonicalTag);else text=text.replace('</head>',canonicalTag+'</head>');
   text=text.replace(/<meta property="og:url"[^>]*>/,`<meta property="og:url" content="${canonical}">`).replace(/<meta property="og:description"[^>]*>/,`<meta property="og:description" content="${esc(page.description)}">`).replace(/<meta property="og:title"[^>]*>/,`<meta property="og:title" content="${esc(page.title)}">`);
   text=text.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g,'');
   text=text.replace('</head>',`<meta name="content-revision" content="${page.revisionHash}"><script type="application/ld+json">${JSON.stringify(nicheSchemaGraph(pkg,page,pages,settings.operatorName)).replaceAll('<','\\u003c')}</script></head>`);
  }
  routes[slug]={revisionHash:page?.revisionHash||null,sha256:sha(text)};content=Buffer.from(text);
 }else allow.push('/'+file);
 if(content.length>25*1024*1024)throw Error('Static asset too large: '+file);
 await mkdir(path.dirname(path.join(assets,file)),{recursive:true});await writeFile(path.join(assets,file),content);
}
await copyFile(path.join(import.meta.dirname,'interest.js'),path.join(assets,'interest.js'));allow.push('/interest.js');
const verification=JSON.parse(await readFile(path.join(app,'release/v1.1-auto-usb-1/package-verification.json'),'utf8'));
const downloads={};
for(const [key,filename,hash]of [['windows','PhoneBridger-V1.1-auto-USB-beta.3.zip',verification.zip_sha256],['android','PhoneBridger-Android.apk',verification.apk_sha256]]){
 const bytes=await readFile(path.join(app,'release/v1.1-auto-usb-1',filename));if(sha(bytes)!==hash)throw Error('Approved installer hash mismatch: '+filename);
 const parts=[];for(let offset=0;offset<bytes.length;offset+=20*1024*1024){const data=bytes.subarray(offset,offset+20*1024*1024),file=`/_downloads/${key}/${parts.length}.bin`;await mkdir(path.dirname(path.join(assets,file)),{recursive:true});await writeFile(path.join(assets,file),data);parts.push({path:file,bytes:data.length,sha256:sha(data)});}
 downloads[key]={filename,bytes:bytes.length,sha256:hash,parts};
}
await writeFile(path.join(out,'release.json'),JSON.stringify({package:pkg,routes,assets:allow,downloads,generatedAt:new Date().toISOString()},null,2));
console.log(JSON.stringify({routes:Object.keys(routes).length,publicPages:pages.length,assets:allow.length,downloads:Object.fromEntries(Object.entries(downloads).map(([k,v])=>[k,{bytes:v.bytes,sha256:v.sha256}]))}));
