import release from '../../.sites-runtime/phonebridger-production/release.json';
import settings from '../../config/niche-network.json';
import {projectPublicPages} from '../../lib/niche-links.mjs';
import {nicheRobotsTextCore,nicheSitemapXmlCore,nicheLlmsIndexCore,nicheLlmsFullCore} from '../../lib/niche-seo-core.mjs';
import {boundedJson,requestRate,customerAccount} from '../../lib/customer-accounts.mjs';
import {smtpSession} from '../../lib/smtp-protocol.mjs';
import {connect} from 'cloudflare:sockets';
import {sendHostingerMail} from '../../lib/hostinger-mail-api.mjs';

const pkg=release.package, privatePages=new Set(['login','register','recover','account']);
const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
const txt=(body,type='text/plain; charset=utf-8')=>new Response(body,{headers:{'Content-Type':type,'Cache-Control':'no-cache'}});
async function download(request,env,key){
 const item=release.downloads[key];if(!item)return new Response('Not found',{status:404});
 let start=0,end=item.bytes-1,status=200;const range=request.headers.get('range');
 if(range){const match=/^bytes=(\d*)-(\d*)$/.exec(range);if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416,headers:{'Content-Range':`bytes */${item.bytes}`}});
  if(!match[1])start=Math.max(0,item.bytes-Number(match[2]));else {start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
  if(start>end||start>=item.bytes)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${item.bytes}`}});status=206;
 }
 const headers={'Content-Type':key==='windows'?'application/zip':'application/vnd.android.package-archive','Content-Disposition':`attachment; filename="${item.filename}"`,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes','ETag':`"${item.sha256}"`,'Cache-Control':'public, max-age=3600',...(status===206?{'Content-Range':`bytes ${start}-${end}/${item.bytes}`}:{})};
 if(request.method==='HEAD')return new Response(null,{status,headers});
 let index=0,offset=0,reader;
 const stream=new ReadableStream({async pull(controller){try{while(true){
  if(!reader){if(index>=item.parts.length||offset>end){controller.close();return;}const part=item.parts[index++];if(offset+part.bytes<=start){offset+=part.bytes;continue;}const url=new URL(part.path,request.url),asset=await env.ASSETS.fetch(new Request(url));if(!asset.ok)throw Error('Installer part unavailable');reader=asset.body.getReader();}
  const {done,value}=await reader.read();if(done){reader.releaseLock();reader=null;continue;}
  const from=Math.max(0,start-offset),to=Math.min(value.length,end-offset+1);offset+=value.length;
  if(to>from){controller.enqueue(value.subarray(from,to));return;}
 } }catch(error){controller.error(error);}},async cancel(){await reader?.cancel();}});
 return new Response(stream,{status,headers});
}
async function sendMail(env,mail){
  if(env.HOSTINGER_MAIL_API_KEY)return sendHostingerMail(env,mail);
  if(env.LEAD_SMTP_ENABLED!=='1'||!env.LEAD_SMTP_USER||!env.LEAD_SMTP_PASSWORD)return false;
  const socket=connect({hostname:'smtp.hostinger.com',port:465},{secureTransport:'on',allowHalfOpen:false});socket.closed.catch(()=>{});
  await smtpSession(socket,{user:env.LEAD_SMTP_USER,password:env.LEAD_SMTP_PASSWORD,timeoutMs:12000},mail);return true;
}
async function lead(request,env,live){
  if(!live.some(p=>p.slug==='contact')||!live.some(p=>p.slug==='privacy'))return response({error:'Contact is unavailable.'},503);
  if(request.method!=='POST')return response({error:'Method not allowed.'},405);
  if(request.headers.get('origin')!==new URL(request.url).origin)return response({error:'Open this form on the website.'},403);
  const payload=await boundedJson(request,10000);
  if(payload?.website)return response({ok:true});
  if(!await requestRate(env.DB,request,env.AUTH_RATE_SECRET,'contact',5,3600))return response({error:'Too many messages. Please try again later.'},429);
  const name=String(payload.name||'').trim(),email=String(payload.email||'').trim(),message=String(payload.message||'').trim(),topic=String(payload.topic||'other');
  if(name.length<2||name.length>100||email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||message.length<20||message.length>3000||payload.consent!==true||!['setup','pairing','permissions','account','other'].includes(topic))return response({error:'Enter your name, email, at least 20 characters and accept the privacy notice.'},400);
  const id=crypto.randomUUID(),now=Date.now();let source='/contact';
  try{const ref=new URL(request.headers.get('referer'));if(ref.origin===new URL(request.url).origin)source=ref.pathname.slice(0,300);}catch{}
  await env.DB.prepare("INSERT INTO niche_leads (id,site_id,created_at,source_path,name,email,message,consent_at,status) VALUES (?,?,?,?,?,?,?,?, 'new')").bind(id,pkg.siteId,now,source,name,email,`Topic: ${topic}\n${message}`,now).run();
  let notified=false;
  try{notified=await sendMail(env,{id,to:env.LEAD_RECIPIENT||pkg.site.contact.email,replyTo:email,subject:`[${pkg.canonicalHost}] ${topic} ${id.slice(0,8)}`,text:`PhoneBridger website enquiry\nID: ${id}\nName: ${name}\nEmail: ${email}\nPage: ${source}\nTopic: ${topic}\n\n${message}`});if(notified)await env.DB.prepare("UPDATE niche_leads SET status='notified' WHERE id=? AND site_id=?").bind(id,pkg.siteId).run();}catch{console.error(JSON.stringify({event:'lead_notification_failed',siteId:pkg.siteId,id}));}
  return response({ok:true,id,notified,message:notified?'Your message was saved and passed to our mail server.':'Your message was saved. Email notification is currently unavailable; please contact support if urgent.'},201);
}
async function interest(request,env,live){
  if(request.method!=='POST'||request.headers.get('origin')!==new URL(request.url).origin)return response({error:'Invalid origin or method.'},403);
  if(/bot|crawler|spider|headless|lighthouse/i.test(request.headers.get('user-agent')||'')||request.headers.get('sec-gpc')==='1'||request.headers.get('dnt')==='1')return new Response(null,{status:204});
  const data=await boundedJson(request,512);
  if(!['pageview','email_click','phone_click'].includes(data?.event)||!live.some(p=>(p.slug?'/'+p.slug:'/')===data.path))return response({error:'Unknown event or page.'},400);
  if(!await requestRate(env.DB,request,env.AUTH_RATE_SECRET,'interest',120))return new Response(null,{status:204});
  const day=new Date().toISOString().slice(0,10);
  await env.DB.prepare('INSERT INTO niche_interest_daily (site_id,day,page_path,event,count) VALUES (?,?,?,?,1) ON CONFLICT(site_id,day,page_path,event) DO UPDATE SET count=count+1').bind(pkg.siteId,day,data.path,data.event).run();return new Response(null,{status:204});
}
export default {
  async fetch(request,env){
    const url=new URL(request.url),host=url.hostname;
    if(host==='www.'+pkg.canonicalHost){url.hostname=pkg.canonicalHost;return Response.redirect(url.toString(),308);}
    if(host!==pkg.canonicalHost&&host!==env.PREVIEW_HOST&&!['127.0.0.1','localhost'].includes(host))return new Response('Unknown domain',{status:404});
    const local=host!==pkg.canonicalHost,live=projectPublicPages(pkg,[pkg],settings),home=live.some(p=>p.slug==='');
    if(!home)return new Response('Not found',{status:404});
    let result;
    try{
      if(url.pathname.startsWith('/api/account/'))result=await customerAccount(request,env,url.pathname.slice('/api/account/'.length));
      else if(url.pathname==='/api/contact')result=await lead(request,env,live);
      else if(url.pathname==='/ivykius')result=await interest(request,env,live);
      else if(!['GET','HEAD'].includes(request.method))result=new Response('Method not allowed',{status:405});
      else if(['/downloads/windows','/downloads/android'].includes(url.pathname)&&live.some(p=>p.slug==='downloads'))result=await download(request,env,url.pathname.split('/').pop());
      else if(url.pathname==='/robots.txt')result=txt(nicheRobotsTextCore(pkg,local,home));
      else if(url.pathname==='/sitemap.xml')result=txt(nicheSitemapXmlCore(pkg,live),'application/xml; charset=utf-8');
      else if(url.pathname==='/llms.txt')result=txt(nicheLlmsIndexCore(pkg,live));
      else if(url.pathname==='/llms-full.txt')result=txt(nicheLlmsFullCore(pkg,live,settings.operatorName));
      else {
        const slug=url.pathname.replace(/^\/+|\/+$/g,'');
        const page=live.find(p=>p.slug===slug),isPrivate=privatePages.has(slug);
        if(page||isPrivate){
          if(slug&&url.pathname!=='/'+slug){url.pathname='/'+slug;return Response.redirect(url.toString(),308);}
          const expected=release.routes[slug];
          if(!expected||(page&&expected.revisionHash!==page.revisionHash))return new Response('Not found',{status:404});
          const assetUrl=new URL(request.url);if(slug)assetUrl.pathname='/'+slug+'/';result=await env.ASSETS.fetch(new Request(assetUrl,request));
        }else if(release.assets.includes(url.pathname)&&(!url.pathname.startsWith('/content-assets/')||live.some(p=>p.media.some(m=>m.src===url.pathname))))result=await env.ASSETS.fetch(request);
        else result=new Response('Not found',{status:404});
      }
    }catch(error){console.error(JSON.stringify({event:'request_failed',code:error.status||503,path:url.pathname}));result=response({error:error.status?error.message:'Service is temporarily unavailable.'},error.status||503);}
    const headers=new Headers(result.headers);headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','strict-origin-when-cross-origin');headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');headers.set('Content-Security-Policy',"frame-ancestors 'none'; base-uri 'self'; object-src 'none'");
    if(!local)headers.set('Strict-Transport-Security','max-age=31536000');
    if(local||privatePages.has(url.pathname.replace(/^\/+|\/+$/g,''))||url.pathname.startsWith('/api/')||result.status>=400){headers.set('X-Robots-Tag','noindex, nofollow');headers.set('Cache-Control','private, no-store');}
    else if(headers.get('Content-Type')?.includes('text/html'))headers.set('Cache-Control','no-cache');
    return new Response(request.method==='HEAD'?null:result.body,{status:result.status,headers});
  },
  async scheduled(event,env,ctx){ctx.waitUntil(env.DB.batch([
    env.DB.prepare('DELETE FROM customer_sessions WHERE expires_at<?').bind(Date.now()),
    env.DB.prepare('DELETE FROM request_rates WHERE expires_at<?').bind(Date.now()),
    env.DB.prepare('DELETE FROM niche_leads WHERE created_at<?').bind(Date.now()-180*86400000),
    env.DB.prepare('DELETE FROM niche_interest_daily WHERE day<?').bind(new Date(Date.now()-395*86400000).toISOString().slice(0,10))
  ]));}
};
