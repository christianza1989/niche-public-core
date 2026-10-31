import {createHash} from 'node:crypto';
export const o3Signature=text=>createHash('sha256').update(text).digest('hex');
export const o3Escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Standoff formatting contains no duplicate prose. Any changed/reviewed body
// loses its old formatting instead of applying stale ranges to new words.
export function o3Inline(text,format,pages){
 if(!format||format.signature!==o3Signature(text))return o3Escape(text);
 const ranges=(format.ranges||[]).filter(r=>Number.isInteger(r.start)&&Number.isInteger(r.end)&&r.start>=0&&r.end<=text.length&&r.start<r.end&&['strong','em','link'].includes(r.kind));
 const breaks=(format.breaks||[]).filter(n=>Number.isInteger(n)&&n>0&&n<text.length),nbsp=new Set((format.nbsp||[]).filter(n=>Number.isInteger(n)&&text[n]===' '));
 const stops=[...new Set([0,text.length,...breaks,...ranges.flatMap(r=>[r.start,r.end])])].sort((a,b)=>a-b);
 const segments=stops.slice(0,-1).map((a,i)=>{const b=stops[i+1],active=ranges.filter(r=>r.start<=a&&r.end>=b);let html=Array.from(text.slice(a,b),(c,j)=>nbsp.has(a+j)?'&nbsp;':o3Escape(c)).join('');
  if(active.some(r=>r.kind==='strong'))html='<strong>'+html+'</strong>';
  if(active.some(r=>r.kind==='em'))html='<em>'+html+'</em>';
  const link=active.find(r=>r.kind==='link');let href;if(link){try{const u=new URL(link.href);if(['http:','https:'].includes(u.protocol)){if(u.hostname==='o3tech.lt'){const target=pages.find(p=>('/'+p.slug+'/').replace('//','/').replace(/\/+$/,'')===u.pathname.replace(/\/+$/,''));if(target)href=('/'+target.slug+'/').replace('//','/')+u.hash;}else href=u.href;}}catch{}}
  return {html:(breaks.includes(a)?'<br>':'')+html,href};
 });
 const groups=[];for(const segment of segments){if(groups.length&&groups.at(-1).href===segment.href)groups.at(-1).html+=segment.html;else groups.push({...segment});}
 return groups.map(s=>s.href?'<a href="'+o3Escape(s.href)+'">'+s.html+'</a>':s.html).join('');
}
