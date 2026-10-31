// Parsing, storage and sending remain owned by the native lead handler.
const message='Užklausos išsaugoti nepavyko. Parašykite svetainėje nurodytu el. paštu.';
const failure=status=>Response.json({message},{status,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow',...(status===429?{'Retry-After':'60'}:{})}});
export async function inquiryRequestGuard(request,env,policy){
 const origin=request.headers.get('origin'),referer=request.headers.get('referer'),expected=new URL(request.url).origin;
 try{if(origin?origin!==expected:!referer||new URL(referer).origin!==expected)return failure(403);}catch{return failure(403);}
 if(!env.DB||typeof env.INQUIRY_RATE_LIMIT?.limit!=='function'||env.LEAD_HOSTINGER_ENABLED!=='1'||env.LEAD_HOSTINGER_SITE_ID!==policy.siteId||typeof policy.sender!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(policy.sender)||env.LEAD_HOSTINGER_SENDER!==policy.sender||!/^AC[A-Za-z0-9]{1,158}$/.test(env.LEAD_HOSTINGER_MAILBOX_ID||'')||typeof env.LEAD_HOSTINGER_API_KEY!=='string'||!env.LEAD_HOSTINGER_API_KEY.trim()||env.LEAD_SMTP_ENABLED==='1'||env.LEAD_EMAIL)return failure(503);
 try{const result=await env.INQUIRY_RATE_LIMIT.limit({key:policy.siteId+':'+(request.headers.get('cf-connecting-ip')||'unknown')});return result.success?null:failure(429);}catch{return failure(503);}
}
export async function configuredInquiryRequest(request,env,siteId){
 if(env.LEAD_INQUIRY_GUARD_ENABLED!=='1')return null;
 const url=new URL(request.url);
 if(env.LEAD_INQUIRY_GUARD_SITE_ID!==siteId||!env.LEAD_INQUIRY_GUARD_HOST||url.protocol!=='https:'||url.host!==env.LEAD_INQUIRY_GUARD_HOST||(request.headers.get('host')||url.host)!==url.host)return failure(503);
 return inquiryRequestGuard(request,env,{siteId,sender:env.LEAD_HOSTINGER_SENDER});
}
