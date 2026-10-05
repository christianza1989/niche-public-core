/* Tenant-aware native links and prebuilt responsive assets avoid client routing/image services. */
/* eslint-disable @next/next/no-html-link-for-pages, @next/next/no-img-element */
import type {NichePackage,NichePage} from '@/lib/niche-sites';
import {nichePagePath} from '@/lib/niche-sites';
import {imageSrcSet} from '@/lib/niche-media.mjs';
import {nicheBreadcrumbs} from '@/lib/niche-schema-core.mjs';
import {nicheJsonLd} from '@/lib/niche-seo';
import {ArticleMeta} from './article-meta';
import {LinkedText} from './linked-text';
import {InterestTracking} from './interest-tracking';
import s from './auksarankiams-site.module.css';
type Props={pkg:NichePackage;page:NichePage;livePages:NichePage[]};
type Asset=NichePage['media'][number];
const needPages=new Set(['baldu-surinkimas','kabinimo-darbai','smulkus-baldu-pataisymai']);
function Photo({owner,asset=owner.media[0],hero=false,sizes='(max-width: 900px) calc(100vw - 40px), 940px',className=''}:{owner:NichePage;asset?:Asset;hero?:boolean;sizes?:string;className?:string}){return asset?<img className={className} src={asset.src} srcSet={imageSrcSet(owner.media,asset)} sizes={sizes} alt={asset.alt} width={asset.width} height={asset.height} loading={hero?'eager':'lazy'} fetchPriority={hero?'high':'auto'} decoding="async"/>:null;}
function Blocks({page,livePages,blocks=page.body}:{page:NichePage;livePages:NichePage[];blocks?:NichePage['body']}){return blocks.map((b,i)=>b.type==='paragraph'?<p key={i}><LinkedText text={b.text} page={page} livePages={livePages}/></p>:b.type==='heading'?b.level===3?<h3 key={i}>{b.text}</h3>:<h2 key={i} id={'skyrius-'+page.body.indexOf(b)}>{b.text}</h2>:b.type==='list'?<ul key={i}>{b.items.map((v,j)=><li key={j}><LinkedText text={v} page={page} livePages={livePages}/></li>)}</ul>:b.type==='image'?<Photo key={i} owner={page} asset={page.media.find(a=>a.id===b.assetId)}/>:null);}
function Sections(page:NichePage){const result:NichePage['body'][]=[];for(const b of page.body){if(b.type==='heading'&&b.level===2)result.push([]);if(result.length)result[result.length-1].push(b);}return result;}
function GuideList({guides}:{guides:NichePage[]}){return <div className={s.guides}>{guides.map(g=><a className={s.guide} href={nichePagePath(g)} key={g.id}><Photo owner={g} sizes="(max-width: 720px) calc(100vw - 40px), (max-width: 1280px) calc((100vw - 144px) / 3), 379px"/><h3>{g.title}</h3><p>{g.description}</p><span>Skaityti gidą</span></a>)}</div>;}
export function AuksarankiamsSite({pkg,page,livePages}:Props){
 const home=page.type==='home',guide=page.type==='guide',service=needPages.has(page.slug),hub=page.slug==='gidai',contact=page.slug==='kontaktai';
 const has=(slug:string)=>livePages.some(p=>p.slug===slug),guides=livePages.filter(p=>p.type==='guide'),services=livePages.filter(p=>needPages.has(p.slug)),sections=Sections(page);
 const nav=[['#darbai','Darbų poreikiai'],['gidai','Gidai'],['kontaktai','Registruoti poreikį']].filter(([slug])=>slug==='#darbai'?has(''):has(slug));
 const navHref=(slug:string)=>slug==='#darbai'?'/#darbai':'/'+slug;
 const textProps={page,livePages};
 const inquiry=<>{has('kontaktai')&&<a className={s.button} href="/kontaktai#forma">Registruoti poreikį</a>}</>;
 return <div className={s.site}><script type="application/ld+json" dangerouslySetInnerHTML={{__html:nicheJsonLd(pkg,page)}}/><InterestTracking/><a href="#turinys" className={s.skip}>Pereiti prie turinio</a>
 <header className={s.header}><a className={s.brand} href="/" aria-label="Auksarankiams — pradžia">{pkg.site.name.toLowerCase()}.</a><nav className={s.desktopNav} aria-label="Pagrindinis meniu">{nav.map(([slug,label])=><a href={navHref(slug)} key={slug} aria-current={page.slug===slug?'page':undefined}>{label}</a>)}</nav><details className={s.mobileNav}><summary>Meniu</summary><nav aria-label="Mobilusis meniu">{nav.map(([slug,label])=><a key={slug} href={navHref(slug)}>{label}</a>)}</nav></details></header>
 <main id="turinys" className={s.main}>
 {!home&&<nav className={s.breadcrumb} aria-label="Puslapio kelias"><ol>{nicheBreadcrumbs(pkg,page,livePages).map((b:{name:string;path:string},i:number,a:unknown[])=><li key={b.path}>{i<a.length-1?<a href={b.path}>{b.name}</a>:<span aria-current="page">{b.name}</span>}</li>)}</ol></nav>}
 {home?<><div className={s.intro}><h1>{page.title}</h1><div className={s.introText}><Blocks {...textProps} blocks={page.body.slice(0,1)}/>{inquiry}<div className={s.pilot}><Blocks {...textProps} blocks={page.body.slice(1,2)}/></div></div></div>
 <section className={s.sequence}><h2>{sections[0]?.[0]?.type==='heading'?sections[0][0].text:''}</h2><div><Blocks {...textProps} blocks={sections[0]?.slice(1)}/></div></section>
 <Photo owner={page} hero sizes="(max-width: 720px) calc(100vw - 40px), (max-width: 1280px) calc(100vw - 80px), 1200px" className={s.hero}/>
 <section id="darbai" className={s.jobs}><Blocks {...textProps} blocks={sections[1]}/><div>{services.map(job=><a className={s.job} key={job.id} href={nichePagePath(job)}><h3>{job.title}</h3><p>{job.description}</p><span>Kaip aprašyti šį darbą</span></a>)}</div></section>
 <section className={s.boundary}><Blocks {...textProps} blocks={sections[2]}/></section>
 <section className={s.guideSection}><Blocks {...textProps} blocks={sections[3]}/><GuideList guides={guides}/></section>
 <section className={s.close}><Blocks {...textProps} blocks={sections[4]}/>{inquiry}</section></>:hub?<><div className={s.pageIntro}><h1>{page.title}</h1><Blocks {...textProps}/></div><GuideList guides={guides}/></>:
 <><div className={s.pageIntro}><h1>{page.title}</h1>{guide&&<ArticleMeta pkg={pkg} page={page} pages={livePages} className={s.meta}/>}</div>
 {(guide||service)&&<Photo owner={page} hero className={s.articlePhoto}/>}
 <div className={s.reading}>{guide&&<aside className={s.contents}><details open><summary>Šiame gide</summary><nav aria-label="Gido turinys">{page.body.map((b,i)=>b.type==='heading'&&b.level===2?<a key={i} href={'#skyrius-'+i}>{b.text}</a>:null)}</nav></details></aside>}
 <article className={s.article}><Blocks {...textProps}/>
 {page.externalLinks&&page.externalLinks.length>0&&<section className={s.sources}><h2>Šaltiniai ir patikros ribos</h2><ul>{page.externalLinks.map(l=><li key={l.url}><a href={l.url}>{l.label}</a><p>{l.reason}</p></li>)}</ul></section>}
 {contact&&<form className={s.form} id="forma" method="post" action="/uzklausa"><h2>Jūsų darbų poreikis</h2><p>Vietinėje peržiūroje naudokite tik bandymo duomenis. Visi matomi laukai būtini.</p><label htmlFor="name">Vardas<input id="name" name="name" autoComplete="given-name" required minLength={2} maxLength={100}/></label><label htmlFor="email">El. paštas<input id="email" name="email" type="email" autoComplete="email" required maxLength={250}/></label><label htmlFor="message">Darbai, vieta ir pageidaujamas laikotarpis<textarea id="message" name="message" required minLength={20} maxLength={3000} rows={7} aria-describedby="message-help"/></label><p id="message-help" className={s.help}>Išvardykite darbus ir jų kiekį, miestą, gaminių duomenis, neaiškumus bei pageidaujamą laikotarpį. Bent 20 ženklų. Tikslaus adreso nereikia; failų forma nepriima.</p><div className={s.honeypot} aria-hidden="true"><label>Palikite tuščią<input name="website" tabIndex={-1} autoComplete="off"/></label></div><label className={s.consent}><input type="checkbox" name="consent" value="yes" required/><span>Susipažinau su {has('privatumas')?<a href="/privatumas">privatumo informacija</a>:'privatumo informacija'} ir sutinku pateikti duomenis šiam poreikiui apdoroti.</span></label><p className={s.help}>Registracija nėra užsakymas. Meistro, atvykimo ir kainos pasiūlymo dar negarantuojame.</p><button className={s.button} type="submit">Registruoti poreikį</button></form>}
 {(guide||service)&&<section className={s.next}><h2>Kitas žingsnis</h2><ul>{page.links.map(l=>{const t=livePages.find(p=>p.id===l.targetPageId);return t?<li key={t.id}><a href={nichePagePath(t)}>{t.title}</a></li>:null;})}</ul>{inquiry}<p className={s.help}>Poreikio registracija nėra užsakymas ar garantuotas kainos pasiūlymas.</p></section>}</article></div></>}
 </main><footer className={s.footer}><div className={s.footerTop}><a href="/" className={s.brand}>{pkg.site.name.toLowerCase()}.</a><a href={'mailto:'+pkg.site.contact.email}>{pkg.site.contact.email}</a></div><nav aria-label="Poraštės meniu">{[['gidai','Gidai'],['apie-projekta','Apie projektą'],['redakcija','Redakcija'],['kontaktai','Kontaktai'],['privatumas','Privatumas'],['naudojimo-salygos','Naudojimo sąlygos']].filter(([slug])=>has(slug)).map(([slug,label])=><a href={'/'+slug} key={slug}>{label}</a>)}</nav><div className={s.footerBottom}><p>© {new Date(page.publishAt).getUTCFullYear()} MB Pinet</p><p>Mūsų verslas automatizuotas su <a href="https://verslomatika.lt">verslomatika.lt</a>.</p></div></footer></div>;
}
