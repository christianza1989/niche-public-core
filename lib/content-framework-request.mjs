import { contentRenderer } from './content-renderers.mjs';

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
