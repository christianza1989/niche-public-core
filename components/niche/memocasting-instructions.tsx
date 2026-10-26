/* eslint-disable @next/next/no-img-element -- Native responsive instruction media. */
import type {NicheBlock,NichePage} from '@/lib/niche-sites';
import {memoInstructionChoices,memoInstructionDownloads,memoInstructionKind,memoInstructionSections} from '@/lib/memocasting-instructions.mjs';
import {memoSectionId} from '@/lib/memocasting-structure.mjs';
import {imageSrcSet,visibleImageCredit} from '@/lib/niche-media.mjs';
import {LinkedText} from './linked-text';
import {MemoPrintInstructions} from './memocasting-print-instructions';
import s from './memocasting-instructions.module.css';

type Section={id:string;heading:string;title:string;step:number|null;role:string;blocks:NicheBlock[]};

function InstructionBlocks({blocks,page,pages,prefix}:{blocks:NicheBlock[];page:NichePage;pages:NichePage[];prefix:string}){
 return <>{blocks.map((block,i)=>{
  if(block.type==='paragraph')return <p key={i}><LinkedText text={block.text} page={page} livePages={pages}/></p>;
  if(block.type==='list')return <ul key={i}>{block.items.map((text,j)=><li key={j}><LinkedText text={text} page={page} livePages={pages}/></li>)}</ul>;
  if(block.type==='heading')return <h3 id={prefix+'-'+memoSectionId(block.text)} key={i}>{block.text}</h3>;
  const media=page.media.find(m=>m.id===block.assetId);return media?<figure key={i}><img src={media.src} srcSet={imageSrcSet(page.media,media)} sizes="(max-width: 760px) calc(100vw - 40px), 760px" width={media.width} height={media.height} alt={media.alt} loading="lazy"/>{visibleImageCredit(media)&&<figcaption>{visibleImageCredit(media)}</figcaption>}</figure>:null;
 })}</>;
}

function RecipeSection({section,page,pages}:{section:Section;page:NichePage;pages:NichePage[]}){
 return <section id={section.id} className={section.role==='summary'?s.summary:section.role==='step'?s.step:s.section} aria-labelledby={section.id+'-title'}>
  <div className={s.sectionHeading}>{section.step!==null&&<span className={s.stepNumber} aria-hidden="true">{String(section.step).padStart(2,'0')}</span>}<h2 className={s.sectionTitle} id={section.id+'-title'}>{section.step!==null&&<span className={s.srOnly}>{section.step}. </span>}{section.title}</h2></div>
  <div className={s.sectionBody}><InstructionBlocks blocks={section.blocks} page={page} pages={pages} prefix={section.id}/></div>
 </section>;
}

export function MemoInstructions({page,pages}:{page:NichePage;pages:NichePage[]}){
 const kind=memoInstructionKind(page),choices=memoInstructionChoices(pages),parts=memoInstructionSections(page) as {lead:NicheBlock[];sections:Section[]},downloads=memoInstructionDownloads(page);
 return <article className={s.instructions} data-memo-instruction={kind}>
  <header className={s.heading}>
   <p className={s.eyebrow}>Memocasting instrukcijos</p><h1>{page.title}</h1><p className={s.intro}>{page.description}</p>
   {kind!=='hub'&&<div className={s.tools}><MemoPrintInstructions/>{downloads.map((link:{url:string;label:string})=><a key={link.url} href={link.url} download><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></svg>{link.label}</a>)}</div>}
  </header>
  {kind==='hub'?<>
   {parts.lead.length>0&&<div className={s.lead}><InstructionBlocks blocks={parts.lead} page={page} pages={pages} prefix="ivadas"/></div>}
   {choices.length>0&&<nav className={s.cards} aria-label="Pasirinkite savo rinkinio instrukciją">{choices.map(({kind:choice,page:target,label}:{kind:string;page:NichePage;label:string})=>{
    const media=target.media[0];return <a className={s.card} key={choice} href={'/'+target.slug}>
     {media&&<div className={s.cardImage}><img src={media.src} srcSet={imageSrcSet(target.media,media)} sizes="(max-width: 760px) calc(100vw - 40px), 440px" width={media.width} height={media.height} alt="" loading="lazy"/></div>}
     <span className={s.cardLabel}>{label}</span><h2>{target.title}</h2><p>{target.description}</p><span className={s.cardAction}>Atverti instrukciją<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></span>
    </a>;
   })}</nav>}
   <div className={s.hubBody}>{parts.sections.map(section=><RecipeSection key={section.id} section={section} page={page} pages={pages}/>)}</div>
  </>:<>
   {choices.length>1&&<nav className={s.switcher} aria-label="Rinkinio instrukcija">{choices.map(({page:target,label}:{page:NichePage;label:string})=><a key={target.id} href={'/'+target.slug} aria-current={target.id===page.id?'page':undefined}>{label}</a>)}</nav>}
   <div className={s.layout}>
    {parts.sections.length>1&&<aside className={s.toc}><details><summary>Instrukcijos eiga</summary><nav aria-label="Šios instrukcijos skyriai"><ol>{parts.sections.map(section=><li key={section.id}><a href={'#'+section.id}>{section.heading}</a></li>)}</ol></nav></details></aside>}
    <div className={s.reading}>{parts.lead.length>0&&<div className={s.lead}><InstructionBlocks blocks={parts.lead} page={page} pages={pages} prefix="ivadas"/></div>}{parts.sections.map(section=><RecipeSection key={section.id} section={section} page={page} pages={pages}/>)}</div>
   </div>
  </>}
 </article>;
}
