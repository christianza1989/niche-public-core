import http from 'node:http';
import path from 'node:path';
import { readFile, appendFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { renderSignaturepads } from '../components/niche/signaturepads/render.mjs';

// Explicitly private draft transport. It cannot bind a public interface and
// does not register packages, manufacture approvals, or send notifications.
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=path.resolve(process.argv[2]||'../../output/signaturepads-migration-20261029');
const port=Number(process.argv[3]||8956);
const source=JSON.parse(await readFile(path.join(repo,'sites/signaturepads/migration/site-source.json'),'utf8'));
const retiredPaths=new Set((source.retiredRoutes||[]).map(r=>r.path));
const activeUrls=new Set(source.routes.map(r=>source.origin+r.path));
const inventory=JSON.parse(await readFile(path.join(root,'capture/inventory.json'),'utf8'));
const css=await readFile(path.join(repo,'components/niche/signaturepads/signaturepads.css'),'utf8');
const js=await readFile(path.join(repo,'components/niche/signaturepads/client.js'),'utf8');
const types={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.webp':'image/webp','.svg':'image/svg+xml','.pdf':'application/pdf','.woff2':'font/woff2','.css':'text/css; charset=utf-8'};
const escape=value=>String(value??'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));
const pages=JSON.parse(await readFile(path.join(root,'capture/responses/pages.json'),'utf8'));
const sourceHtml=new Map();
for(const record of inventory.records.filter(r=>r.contentType?.includes('text/html')))sourceHtml.set(new URL(record.url).pathname,await readFile(path.join(root,'capture',record.file),'utf8'));
function schema(route){
 return [...(sourceHtml.get(route.path)||'').matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m=>{
  try{const graph=JSON.parse(m[1]);const visit=value=>{if(Array.isArray(value))return value.filter(item=>!['Offer','AggregateOffer','BuyAction','OrderAction','PayAction'].includes(item?.['@type'])).map(visit);if(!value||typeof value!=='object')return value;const out={};for(const[k,v]of Object.entries(value)){if(['offers','aggregateRating','review'].includes(k))continue;out[k]=visit(v);}if(out.url===route.canonical&&(/WebPage|CollectionPage|ItemPage/.test(String(out['@type'])))){out.name=route.metaTitle;out.description=route.description;}return out;};return `<script type="application/ld+json">${JSON.stringify(visit(graph)).replaceAll('<','\\u003c')}</script>`;}catch{return '';}
 }).join('');
}
function document(route,query){return `<!doctype html><html lang="lt-LT"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(route.metaTitle||route.title)}</title><meta name="robots" content="noindex,nofollow"><meta name="description" content="${escape(route.description)}">${route.canonical?`<link rel="canonical" href="${escape(route.canonical)}">`:''}<meta property="og:title" content="${escape(route.metaTitle||route.title)}"><meta property="og:description" content="${escape(route.description)}"><meta property="og:url" content="${escape(route.canonical)}"><meta property="og:locale" content="lt_LT"><link rel="stylesheet" href="/signaturepads/fonts.css"><link rel="stylesheet" href="/signaturepads/site.css">${route.path==='/'?`<link rel="preload" as="image" href="${escape(source.home.images[0].src)}">`:''}${schema(route)}</head><body style="margin:0"><div class="signaturepads-site">${renderSignaturepads(source,route,query)}</div><script src="/signaturepads/site.js" defer></script></body></html>`;}
async function lead(request,response,url){
  const expected=`http://${request.headers.host}`;
  if(request.headers.origin!==expected){response.writeHead(403,{'Content-Type':'application/json'});response.end(JSON.stringify({message:'Neleidžiama užklausos kilmė.'}));return;}
  let length=0,body='';for await(const chunk of request){length+=chunk.length;if(length>10000){response.writeHead(413,{'Content-Type':'application/json'});response.end(JSON.stringify({message:'Patikrinkite formą ir bandykite dar kartą.'}));return;}body+=chunk;}
  const form=new URLSearchParams(body),name=(form.get('name')||'').trim(),email=(form.get('email')||'').trim(),message=(form.get('message')||'').trim();
  const reply=(code,message)=>{response.writeHead(code,{'Content-Type':'application/json; charset=utf-8'});response.end(JSON.stringify({message}));};
  if(form.get('website')){reply(200,'Užklausa gauta.');return;}
  if(name.length<2||name.length>100||email.length>250||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||message.length<20||message.length>3000||(form.get('phone')||'').length>50){reply(400,'Įrašykite vardą, veikiantį el. paštą ir bent 20 ženklų žinutę.');return;}
  try{await mkdir(path.join(root,'preview-state'),{recursive:true});await appendFile(path.join(root,'preview-state/leads.jsonl'),JSON.stringify({id:randomUUID(),preview:true,siteId:'signaturepads',createdAt:new Date().toISOString(),name,email,message,phone:form.get('phone'),preference:form.get('preference')})+'\n');reply(200,'Tai vietinės peržiūros bandymas: žinutė išsaugota tik šiame kompiuteryje, o tikras el. laiškas neišsiųstas.');}catch{reply(503,'Užklausos išsaugoti nepavyko. Parašykite svetainėje nurodytu el. paštu.');}
}
const server=http.createServer(async(request,response)=>{
  response.setHeader('X-Robots-Tag','noindex, nofollow');response.setHeader('Cache-Control','no-store');response.setHeader('X-Content-Type-Options','nosniff');response.setHeader('Referrer-Policy','same-origin');
  if(!/^(127\.0\.0\.1|localhost):\d+$/.test(request.headers.host||'')){response.writeHead(403);response.end('Forbidden');return;}
  try{
    const url=new URL(request.url,`http://${request.headers.host}`);
    if(url.pathname==='/favicon.ico'){response.setHeader('Content-Type','image/jpeg');response.end(await readFile(path.join(root,'public',source.favicon)));return;}
    const normalizedPath=url.pathname.endsWith('/')?url.pathname:url.pathname+'/';
    const retired=retiredPaths.has(normalizedPath);
    const legacyCommerce=/^\/(?:cart|checkout|krepselis|krep[sš]elis|atsiskaitymas|apmokejimas|paysera)(?:\/|$)/i.test(url.pathname)||['add-to-cart','wc-ajax','wc-api'].some(key=>url.searchParams.has(key));
    if(retired||legacyCommerce){response.writeHead(410,{'Content-Type':'text/html; charset=utf-8'});response.end(request.method==='HEAD'?undefined:document({kind:'page',path:url.pathname,title:'Puslapis nerastas',html:'<p>410</p>',description:'',canonical:''},url.searchParams));return;}
    if(request.method==='POST'&&url.pathname==='/uzklausa'){await lead(request,response,url);return;}
    if(!['GET','HEAD'].includes(request.method)){response.writeHead(405);response.end();return;}
    if(url.pathname==='/signaturepads/site.css'||url.pathname==='/signaturepads/site.js'){response.setHeader('Content-Type',url.pathname.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8');response.end(request.method==='HEAD'?undefined:url.pathname.endsWith('.css')?css:js);return;}
    if(url.pathname==='/robots.txt'){response.setHeader('Content-Type','text/plain');response.end('User-agent: *\nDisallow: /\n');return;}
    const sitemapNames=new Map([['/sitemap_index.xml','sitemap_index.xml'],['/page-sitemap.xml','sitemap-0.xml'],['/product-sitemap.xml','sitemap-1.xml'],['/product_cat-sitemap.xml','sitemap-2.xml']]);
    if(sitemapNames.has(url.pathname)){let xml=await readFile(path.join(root,'capture/responses',sitemapNames.get(url.pathname)),'utf8');xml=xml.replace(/<\?xml-stylesheet[\s\S]*?\?>/g,'').replace(/<url>[\s\S]*?<\/url>/g,block=>activeUrls.has(block.match(/<loc>(.*?)<\/loc>/)?.[1])?block:'');response.setHeader('Content-Type','application/xml');response.end(xml);return;}
    if(url.pathname==='/sitemap.xml'){response.setHeader('Content-Type','application/xml');response.end(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${source.routes.map(r=>`<url><loc>${escape(source.origin+r.path)}</loc></url>`).join('')}</urlset>`);return;}
    if(url.pathname.startsWith('/wp-content/uploads/')||url.pathname.startsWith('/signaturepads/fonts')){
      const base=path.join(root,'public'),file=path.resolve(base,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(base+path.sep))throw new Error('path');const bytes=await readFile(file);response.setHeader('Content-Type',types[path.extname(file).toLowerCase()]||'application/octet-stream');response.end(request.method==='HEAD'?undefined:bytes);return;
    }
    if(url.pathname==='/'){
      const legacyId=Number(url.searchParams.get('p')||url.searchParams.get('page_id'));
      const oldPage=pages.find(p=>p.id===legacyId),oldProduct=source.products.find(p=>p.id===legacyId);
      if(oldPage&&retiredPaths.has(new URL(oldPage.link).pathname)){response.writeHead(410,{'Content-Type':'text/html; charset=utf-8'});response.end(request.method==='HEAD'?undefined:document({kind:'page',path:'/',title:'Puslapis nerastas',html:'<p>410</p>',description:'',canonical:''},url.searchParams));return;}
      if(oldPage||oldProduct){response.writeHead(301,{Location:oldProduct?.path||new URL(oldPage.link).pathname});response.end();return;}
      if(url.searchParams.get('s')){response.writeHead(302,{Location:'/prekes/?s='+encodeURIComponent(url.searchParams.get('s'))});response.end();return;}
    }
    let route=source.routes.find(r=>r.path===url.pathname);
    if(!route&&!url.pathname.endsWith('/')){const match=source.routes.find(r=>r.path===url.pathname+'/');if(match){response.writeHead(308,{Location:match.path+url.search});response.end();return;}}
    const pagination=url.pathname.match(/^\/prekes\/page\/(\d+)\/$/);if(!route&&pagination&&Number(pagination[1])===2){route={...source.routes.find(r=>r.path==='/prekes/'),canonical:source.origin+url.pathname};url.searchParams.set('paged',pagination[1]);}
    if(!route){response.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});response.end(document({kind:'page',path:url.pathname,title:'Puslapis nerastas',html:'<p>404</p>',description:'',canonical:''},url.searchParams));return;}
    response.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});response.end(request.method==='HEAD'?undefined:document(route,url.searchParams));
  }catch(error){response.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});response.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(JSON.stringify({url:`http://127.0.0.1:${server.address().port}`,mode:'private-unapproved-migration-preview',routes:source.routes.length,source:repo,assets:path.join(root,'public')})));
