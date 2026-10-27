import {memoHomepageAdmitted,memoHomepageBlocks} from './memocasting-homepage-markup.mjs';

export const memoBrandSectionHeading='Rankų liejimo rinkiniai „Memory Casting“';

// The caller provides the currently admitted page and eligible native links.
// Copy stays in the reviewed content package, never a second marketing source.
export function memoHomepageBrand(page,eligiblePages){
 const remainder=page.body.slice(memoHomepageBlocks.length);
 const start=memoHomepageAdmitted(page)?remainder.findIndex(b=>b.type==='heading'&&b.level===2&&b.text===memoBrandSectionHeading):-1;
 if(start<0)return{section:null,remainder};
 let end=remainder.findIndex((b,i)=>i>start&&b.type==='heading'&&b.level===2);if(end<0)end=remainder.length;
 const paragraphs=remainder.slice(start+1,end).filter(b=>b.type==='paragraph').map(b=>b.text);
 if(!paragraphs.length)return{section:null,remainder};
 const targets=[['apie-projekta','Susipažinkite su mumis'],['pages/instrukcija','Liejimo instrukcijos'],['kontaktai','Klauskite mūsų']];
 const links=targets.flatMap(([slug,label])=>eligiblePages.some(p=>p.slug===slug)?[{href:'/'+slug,label}]:[]);
 return{section:{heading:remainder[start].text,paragraphs,links},remainder:[...remainder.slice(0,start),...remainder.slice(end)]};
}
