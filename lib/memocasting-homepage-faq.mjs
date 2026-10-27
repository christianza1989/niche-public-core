import {memoHomepageAdmitted} from './memocasting-homepage-markup.mjs';

// Reuse the admitted, reviewed native answers rather than keeping a second FAQ.
export function memoHomepageFaq(page,eligiblePages){
 if(!memoHomepageAdmitted(page))return null;
 const start=page.body.findIndex(b=>b.type==='heading'&&b.level===2&&b.text==='Prieš pirmąjį prisilietimą.');
 if(start<0)return null;
 const items=[];
 for(const b of page.body.slice(start+1)){
  if(b.type==='heading'&&b.level===2)break;
  if(b.type==='heading'&&b.level===3)items.push({question:b.text,answers:[]});
  if(b.type==='paragraph'&&items.length)items.at(-1).answers.push(b.text);
 }
 const targets=[['pages/instrukcija','Liejimo instrukcijos','book'],['pagalba','Pagalba liejant','help'],['pristatymas','Pristatymas','delivery'],['grazinimas','Grąžinimas','return'],['kontaktai','Susisiekti su mumis','contact']];
 return{items:items.filter(i=>i.answers.length),links:targets.flatMap(([slug,label,icon])=>eligiblePages.some(p=>p.slug===slug)?[{href:'/'+slug,label,icon}]:[])};
}

export function memoHomepageFaqPlacement(story,faq){
 const match=faq&&story.match(/<section\b[^>]*\bid="klausimai"[^>]*>[\s\S]*?<\/section>/);
 return match?{before:story.slice(0,match.index),after:story.slice(match.index+match[0].length),replace:true}:{before:story,after:'',replace:false};
}
