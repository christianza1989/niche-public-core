// Call only after the Host header has resolved to the requested public site.
// Workers retain their request origin; Node's internal rewrite URL is loopback.
export function nicheRequestOrigin(request,validatedHost,nodeTarget=false) {
 const fallback=new URL(request.url).origin;
 if(!nodeTarget||!validatedHost||/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(validatedHost))return fallback;
 if(!/^[a-z0-9.-]+(?::\d{1,5})?$/i.test(validatedHost))return null;
 try{
  const url=new URL('https://'+validatedHost);
  if(url.username||url.password||url.pathname!=='/'||url.search||url.hash)return null;
  return url.origin;
 }catch{return null;}
}

// One exported native site per Node process; never expose unrelated core hosts.
export function hostingerPublicHost(rawHost,forwardedHost,canonicalHost,stageHost='') {
 const normalize=value=>String(value||'').trim().toLowerCase().replace(/:\d+$/,'');
 const allowed=new Set([canonicalHost,'www.'+canonicalHost,...(stageHost?[stageHost]:[])]);
 let host=normalize(rawHost);
 if(['localhost','127.0.0.1','0.0.0.0'].includes(host)&&forwardedHost)host=normalize(String(forwardedHost).split(',')[0]);
 return allowed.has(host)?host:null;
}
