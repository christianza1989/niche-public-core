import {createHash} from 'node:crypto';

// Presentation never supplies public prose: it decorates matching native blocks.
// If an editor changes the native text, stale ranges/links are not applied.
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const blockDigest=block=>hash([block.type,block.type==='list'?block.items:block.text]);
export const pageDigest=(body,media)=>hash(body.map(b=>b.type==='image'?['image',media.find(m=>m.id===b.assetId)?.alt]:blockDigest(b)));
// Elementor IDs can be all digits: JS enumerates those before other keys.
export const orderedWidgets=widgets=>Object.entries(widgets).sort((a,b)=>a[1].start-b[1].start);
export function matchingPresentation(block,presentation){return presentation?.digest===blockDigest(block)?presentation:undefined;}
// Only typography is imported. Bright brand colors keep the accessible site tokens.
export function originalTextStyle(style={}){
 if(!style||typeof style!=='object'||Array.isArray(style))return {};
 const css={};
 if(Number.isFinite(style.size)&&style.size>=8&&style.size<=64)css.fontSize=style.size;
 if(Number.isInteger(style.weight)&&style.weight>=100&&style.weight<=900&&style.weight%100===0)css.fontWeight=style.weight;
 if(Number.isFinite(style.letter)&&style.letter>=-2&&style.letter<=8)css.letterSpacing=style.letter;
 if(['normal','italic'].includes(style.slant))css.fontStyle=style.slant;
 const color=typeof style.color==='string'?style.color.replace(/\s/g,''):'';
 if(['rgb(51,51,51)','rgb(89,89,89)'].includes(color))css.color=color;
 return css;
}
export function originalHref(value){
 try{
  const url=new URL(value,'https://kvapunaikinimas.lt');
  if(!['http:','https:','mailto:','tel:'].includes(url.protocol))return undefined;
  if(['kvapunaikinimas.lt','www.kvapunaikinimas.lt'].includes(url.hostname))return (url.pathname.replace(/\/$/,'')||'/')+url.search+url.hash;
  return url.href;
 }catch{return undefined;}
}
export function inlinePieces(text,marks=[]){
 const valid=marks.filter(m=>['strong','em','link','style'].includes(m.kind)&&Number.isInteger(m.from)&&Number.isInteger(m.to)&&m.from>=0&&m.to<=text.length&&m.from<m.to&& (m.kind!=='link'||originalHref(m.href))&&(m.kind!=='style'||Object.keys(originalTextStyle(m.style)).length));
 const edges=[...new Set([0,text.length,...valid.flatMap(m=>[m.from,m.to])])].sort((a,b)=>a-b);
 return edges.slice(0,-1).map((from,i)=>({text:text.slice(from,edges[i+1]),marks:valid.filter(m=>m.from<=from&&m.to>=edges[i+1])}));
}
