import { contentRenderer, contentPagePath } from './content-renderers.mjs';

export const contentOriginalPathHeader = 'x-content-original-path';

// Vinext normalizes slashes before proxy.ts. Preserve the registered site's
// public path at the Worker boundary, then give the framework its neutral
// internal path. This leaves the slash policy of every other site unchanged.
export function contentFrameworkRequest(request, pkg, scope) {
  const url=new URL(request.url), host=(request.headers.get('host')||url.host).toLowerCase().replace(/:\d+$/,'');
  const special=contentRenderer(pkg)==='signaturepads';
  if(special&&scope==='local-preview'&&(!['localhost','127.0.0.1'].includes(host)||!['localhost','127.0.0.1'].includes(url.hostname)))return new Response('Private preview',{status:404,headers:{'X-Robots-Tag':'noindex, nofollow','Cache-Control':'private, no-store'}});
  if(!special&&!request.headers.has(contentOriginalPathHeader))return request;
  const originalPath=url.pathname;
  if(special&&url.pathname!=='/')url.pathname=url.pathname.replace(/\/+$/,'');
  const adapted=new Request(url,request);
  adapted.headers.delete(contentOriginalPathHeader);
  if(special)adapted.headers.set(contentOriginalPathHeader,originalPath);
  return adapted;
}

// Vinext also normalizes middleware Location headers. Restore a redirect only
// when it names an eligible page of this site, using the same canonical path
// function as the projection/SEO. Never rewrite another tenant's redirects.
export function contentFrameworkResponse(request,pkg,pages,response) {
  if(contentRenderer(pkg)!=='signaturepads'||![301,302,303,307,308].includes(response.status)||!response.headers.has('location'))return response;
  const location=response.headers.get('location');
  let target;
  try{target=new URL(location,request.url);}catch{return response;}
  if(![new URL(request.url).origin,`https://${pkg.canonicalHost}`].includes(target.origin))return response;
  const trim=path=>path.replace(/\/+$/,'')||'/';
  const page=pages.find(p=>trim(contentPagePath(pkg,p))===trim(target.pathname));
  if(!page)return response;
  target.pathname=contentPagePath(pkg,page);
  const headers=new Headers(response.headers);
  headers.set('location',location.startsWith('/')&&!location.startsWith('//')?target.pathname+target.search+target.hash:target.href);
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
