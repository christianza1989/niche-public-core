// No credentials or caller-selected upstream URLs cross this public bridge.
export function instagramAction(path) { return path === 'feed' || /^media\/\d{5,40}\/(poster|video)$/.test(path); }
export function memoInstagramPlacement(html) {
 const match=/<section class="instagram-section[^"<>]*" id="instagram"[\s\S]*?<\/section>/.exec(html);
 return match ? {before:html.slice(0,match.index),fallback:match[0],after:html.slice(match.index+match[0].length)} : {before:html,fallback:'',after:''};
}
export async function relayMemoInstagram(request,path,{siteId,host,service,homepageEligible=false}={}) {
 const headers={'x-robots-tag':'noindex, nofollow','cache-control':'no-store','referrer-policy':'no-referrer'};
 if(siteId!=='memocasting'||!homepageEligible||!['memocasting.lt','localhost','127.0.0.1'].includes(host)||!instagramAction(path))return new Response('Not found',{status:404,headers});
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{...headers,Allow:'GET, HEAD'}});
 if(!service)return Response.json({unavailable:true,items:[]},{status:503,headers});
 const forwarded=new Headers();const range=request.headers.get('range');if(range)forwarded.set('Range',range);
 try{return await service.fetch(new Request('https://memocasting-instagram.internal/'+path,{method:request.method,headers:forwarded}));}
 catch{return Response.json({unavailable:true,items:[]},{status:503,headers});}
}
