export const referralAllowed=request=>request.headers.get('dnt')!=='1'&&request.headers.get('sec-gpc')!=='1'&&/(?:^|;\s*)pb_ref_choice=allow(?:;|$)/.test(request.headers.get('cookie')||'');
export async function submittedReferralChoice(request){
 if(request.method!=='POST'||request.headers.get('origin')!==new URL(request.url).origin)throw Object.assign(Error('Open this form on this website.'),{status:403});
 if(!/^application\/x-www-form-urlencoded(?:;|$)/i.test(request.headers.get('content-type')||''))throw Object.assign(Error('Use the referral preference form.'),{status:415});
 const reader=request.body?.getReader();let size=0,text='';const decoder=new TextDecoder();
 if(reader)while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>256){await reader.cancel();throw Object.assign(Error('Request is too large.'),{status:413});}text+=decoder.decode(value,{stream:true});}
 const data=new URLSearchParams(text+decoder.decode()),choice=data.get('choice');
 if(data.getAll('choice').length!==1||[...data.keys()].some(k=>k!=='choice')||!['allow','deny'].includes(choice))throw Object.assign(Error('Choose a referral preference.'),{status:400});
 return request.headers.get('dnt')==='1'||request.headers.get('sec-gpc')==='1'?'deny':choice;
}
export function preferenceHeaders(choice,location='/shop'){
 const headers=new Headers({'Location':location,'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'});
 headers.append('Set-Cookie',`pb_ref_choice=${choice}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=2592000`);
 if(choice==='deny')for(const name of ['pb_ref','pb_visitor'])headers.append('Set-Cookie',`${name}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0`);
 return headers;
}
export function referralChoicePage(request,action='/referral-preferences'){
 const signal=request.headers.get('dnt')==='1'||request.headers.get('sec-gpc')==='1';
 const body=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Referral preferences — PhoneBridger</title><link rel="stylesheet" href="/assets/account-workspace/workspace.css"><style>body{display:grid;place-items:center;min-height:100vh;padding:24px}.card{width:min(100%,620px)}h1{margin:16px 0}p{line-height:1.6}form{display:flex;gap:12px;flex-wrap:wrap;margin:24px 0}form button{white-space:normal;min-height:48px}</style></head><body><main class="card"><div class="eyebrow">PHONEBRIDGER</div><h1>Your referral preference</h1><p>If you allow referral tracking, we use first-party cookies for up to 30 days to remember the creator who referred you and recognize repeat visits. An eligible purchase may earn that creator a commission.</p><p>You can shop without tracking. You can still enter an eligible creator code at checkout for its discount. Your choice does not change the price.</p>${signal?'<p>Your browser asks us not to track. We respect that signal and will clear referral cookies.</p>':''}<form method="post" action="${action}"><button class="button primary" name="choice" value="allow"${signal?' disabled':''}>Allow referral tracking</button><button class="button outline" name="choice" value="deny">Continue without tracking</button></form><p class="hint">We remember your choice for 30 days. Change it at any time in <a href="/referral-preferences">Referral preferences</a>. <a href="/privacy">Read our privacy notice</a>.</p></main></body></html>`;
 return new Response(body,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'}});
}
export async function referralPreferences(request){
 try{if(request.method==='GET')return referralChoicePage(request);if(request.method!=='POST')return new Response('Method not allowed',{status:405,headers:{Allow:'GET, POST'}});const choice=await submittedReferralChoice(request);return new Response(null,{status:303,headers:preferenceHeaders(choice,'/privacy')});}
 catch(e){return new Response(e.status?e.message:'Preference service unavailable',{status:e.status||503,headers:{'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'}});}
}
