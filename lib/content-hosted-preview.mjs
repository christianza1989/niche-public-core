import {inquiryRequestGuard} from './inquiry-request-guard.mjs';
// A hosted preview is an explicit read-only admission, never a production
// admission or a way to publish an existing loopback-only receipt.
export const validHostedPreviewHost = host => typeof host === 'string' && /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.workers\.dev$/.test(host);
export const hostedContentScope=scope=>['hosted-preview','hosted-inquiries'].includes(scope);
export function validHostedInquiry(inquiry){return inquiry?.transport==='hostinger-api'&&Object.keys(inquiry).length===3&&['sender','recipient'].every(key=>typeof inquiry[key]==='string'&&/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(inquiry[key]));}

export function hostedPreviewAdmission(admissions) {
  const entries=Object.entries(admissions).filter(([,value])=>hostedContentScope(value.scope));
  if(!entries.length)return null;
  if(entries.length!==1)throw new Error('Hosted preview requires exactly one admitted site');
  const [siteId,receipt]=entries[0];
  if(!validHostedPreviewHost(receipt.previewHost)||receipt.testOnly!==true||
    (receipt.scope==='hosted-preview'?receipt.readOnly!==true:receipt.readOnly!==false||!validHostedInquiry(receipt.inquiry)))throw new Error('Invalid hosted preview admission');
  return {...receipt,siteId};
}

export function hostedPreviewRequest(request,admission) {
  if(!admission)return null;
  const url=new URL(request.url), host=(request.headers.get('host')||url.host).toLowerCase();
  const loopback=['localhost','127.0.0.1'];
  const local=loopback.includes(url.hostname)&&host===url.host;
  const hosted=url.protocol==='https:'&&url.host===admission.previewHost&&host===admission.previewHost;
  if(!local&&!hosted)return hostedPreviewResponse(new Response('Not found',{status:404}),admission);
  if(!['GET','HEAD'].includes(request.method)&&!(admission.scope==='hosted-inquiries'&&request.method==='POST'&&url.pathname==='/uzklausa')){
    // Reuse the reviewed failure message. Never parse/store a preview inquiry,
    // emit an event or reach a mail binding, even if one is misconfigured.
    const message='Užklausos išsaugoti nepavyko. Parašykite svetainėje nurodytu el. paštu.';
    const json=request.headers.get('accept')?.includes('application/json');
    return hostedPreviewResponse(new Response(json?JSON.stringify({ok:false,message}):message,{status:503,headers:{'Content-Type':json?'application/json; charset=utf-8':'text/plain; charset=utf-8'}}),admission);
  }
  return null;
}

// Explicitly authorized hosted inquiries are the only preview write capability.
// The native lead route still validates, stores, claims once and notifies.
export async function hostedInquiryRequest(request,env,admission){
  if(admission?.scope!=='hosted-inquiries'||request.method!=='POST')return null;
  const denied=hostedPreviewRequest(request,admission);if(denied)return denied;
  const blocked=await inquiryRequestGuard(request,env,{siteId:admission.siteId,sender:admission.inquiry.sender});
  return blocked?hostedPreviewResponse(blocked,admission):null;
}

export function hostedPreviewResponse(response,admission) {
  if(!admission)return response;
  const headers=new Headers(response.headers);
  headers.set('X-Robots-Tag','noindex, nofollow, noarchive');
  headers.set('Cache-Control','private, no-store');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

// With run_worker_first, Vinext reserves /_next but does not forward its static
// files to ASSETS. Serve only that immutable framework namespace explicitly,
// after the same authority/method gate as HTML. Content/media stays in Core.
export async function hostedPreviewAssetResponse(request,assets,admission){
  if(!admission||!new URL(request.url).pathname.startsWith('/_next/static/'))return null;
  const denied=hostedPreviewRequest(request,admission);
  if(denied)return denied;
  return hostedPreviewResponse(await assets.fetch(request),admission);
}
