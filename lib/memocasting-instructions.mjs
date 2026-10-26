import {memoSectionId} from './memocasting-structure.mjs';

export const memoInstructionRoutes=Object.freeze({
 hub:'pages/instrukcija',
 couple:'instrukcijos/poros-rinkiniui',
 family:'instrukcijos/seimos-rinkiniui',
});

// Route admission still belongs to the caller's already eligible page list.
// Exact LT paths prevent this layout from borrowing unapproved translations.
export function memoInstructionKind(page){
 return Object.entries(memoInstructionRoutes).find(([,slug])=>slug===page?.slug)?.[0]??null;
}

export function memoInstructionChoices(pages){
 return ['couple','family'].flatMap(kind=>{
  const page=pages.find(p=>p.slug===memoInstructionRoutes[kind]);
  return page?[{kind,page,label:kind==='couple'?'Poros rinkiniui':'Šeimos rinkiniui'}]:[];
 });
}

export function memoInstructionSections(page){
 const lead=[],sections=[],ids=new Map();let section=null;
 for(const block of page.body){
  if(block.type==='heading'&&block.level===2){
   const root=memoSectionId(block.text)||'instrukcijos-dalis',count=(ids.get(root)??0)+1;ids.set(root,count);
   const number=/^(\d+)[.)]\s+/.exec(block.text);
   section={id:root+(count>1?'-'+count:''),heading:block.text,title:number?block.text.slice(number[0].length):block.text,step:number?Number(number[1]):null,
    role:block.text==='Trumpa atmintinė'?'summary':block.text==='Ko reikės?'?'requirements':block.text==='Prieš pradedant'?'preparation':number?'step':'section',blocks:[]};
   sections.push(section);
  }else(section?section.blocks:lead).push(block);
 }
 return {lead,sections};
}

export function memoInstructionDownloads(page){
 return (page.externalLinks??[]).filter(link=>{
  try{const url=new URL(link.url);return url.protocol==='https:'&&['memocasting.lt','www.memocasting.lt'].includes(url.hostname)&&/\.pdf$/i.test(url.pathname)&&!url.username&&!url.password;}
  catch{return false;}
 });
}
