import manifest from './memocasting-instruction-documents.json' with {type:'json'};
import {serveStreamedAsset} from './streamed-asset-range.mjs';

const privateHeaders={'Cache-Control':'private, no-store, no-transform','X-Robots-Tag':'noindex','X-Content-Type-Options':'nosniff'};
const absent=()=>new Response('Not found',{status:404,headers:privateHeaders});

// Raw assets are never public URLs, even when their native page is eligible.
// They share the existing /memocasting-homepage/* worker-first namespace.
export const memoInstructionRawDocumentPath=pathname=>pathname.startsWith(manifest.rawPrefix);
export const memoInstructionDocumentAlias=pathname=>manifest.documents.some(document=>document.alias===pathname);

// Only the caller's canonical, currently eligible projection may grant access.
// This helper does not import the projector, so native external links use the
// same allowlist without a dependency cycle or a second publication predicate.
export function memoInstructionDocument(pkg,eligiblePages,pathname){
 if(pkg?.siteId!==manifest.siteId||pkg.canonicalHost!==manifest.canonicalHost)return null;
 const document=manifest.documents.find(item=>item.alias===pathname);
 return document&&eligiblePages.some(page=>page.slug===document.pageSlug)?document:null;
}

function allowedHost(request){
 const url=new URL(request.url),host=(request.headers.get('host')??'').toLowerCase();
 const local=['localhost','127.0.0.1'].includes(url.hostname);
 return host===url.host&&(local||url.port===''&&[manifest.canonicalHost,'www.'+manifest.canonicalHost].includes(url.hostname));
}

function attachmentFilename(filename){
 const ascii=filename.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7e]|["\\]/g,'_');
 const encoded=encodeURIComponent(filename).replace(/['()*]/g,character=>'%'+character.charCodeAt(0).toString(16).toUpperCase());
 return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export async function serveMemoInstructionDocument(request,{pkg,eligiblePages,pathname,assets,retainPipeline}){
 const document=memoInstructionDocument(pkg,eligiblePages,pathname);
 if(!allowedHost(request)||!document)return absent();
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{...privateHeaders,Allow:'GET, HEAD'}});
 if(!assets)return new Response('Document service unavailable',{status:503,headers:privateHeaders});
 const url=new URL(request.url);url.pathname=document.path;url.search='';url.hash='';
 const headers=new Headers(request.headers);headers.delete('If-None-Match');headers.delete('If-Modified-Since');
 const source=await serveStreamedAsset(new Request(url,{method:request.method,headers}),assets,document.bytes,retainPipeline);
 if(![200,206,416].includes(source.status)){
  await source.body?.cancel();
  return source.status===404?absent():new Response('Document service unavailable',{status:503,headers:privateHeaders});
 }
 const responseHeaders=new Headers(source.headers);
 for(const [name,value]of Object.entries(privateHeaders))responseHeaders.set(name,value);
 responseHeaders.set('Content-Type','application/pdf');
 responseHeaders.set('Content-Disposition',attachmentFilename(document.filename));
 if(source.status===200)responseHeaders.set('Content-Length',String(document.bytes));
 return new Response(source.body,{status:source.status,headers:responseHeaders});
}
