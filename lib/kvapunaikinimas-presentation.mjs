import {createHash} from 'node:crypto';

// Presentation never supplies public prose: it decorates matching native blocks.
// If an editor changes the native text, stale ranges/links are not applied.
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const blockDigest=block=>hash([block.type,block.type==='list'?block.items:block.text]);
export const pageDigest=(body,media)=>hash(body.map(b=>b.type==='image'?['image',media.find(m=>m.id===b.assetId)?.alt]:blockDigest(b)));
// Elementor IDs can be all digits: JS enumerates those before other keys.
export const orderedWidgets=widgets=>Object.entries(widgets).sort((a,b)=>a[1].start-b[1].start);
export function matchingPresentation(block,presentation){return presentation?.digest===blockDigest(block)?presentation:undefined;}
export function originalHref(value){
 try{
  const url=new URL(value,'https://kvapunaikinimas.lt');
  if(!['http:','https:','mailto:','tel:'].includes(url.protocol))return undefined;
  if(['kvapunaikinimas.lt','www.kvapunaikinimas.lt'].includes(url.hostname))return (url.pathname.replace(/\/$/,'')||'/')+url.search+url.hash;
  return url.href;
 }catch{return undefined;}
}
export function inlinePieces(text,marks=[]){
 const valid=marks.filter(m=>['strong','em','link'].includes(m.kind)&&Number.isInteger(m.from)&&Number.isInteger(m.to)&&m.from>=0&&m.to<=text.length&&m.from<m.to&& (m.kind!=='link'||originalHref(m.href)));
 const edges=[...new Set([0,text.length,...valid.flatMap(m=>[m.from,m.to])])].sort((a,b)=>a-b);
 return edges.slice(0,-1).map((from,i)=>({text:text.slice(from,edges[i+1]),marks:valid.filter(m=>m.from<=from&&m.to>=edges[i+1])}));
}
