/* eslint-disable @next/next/no-html-link-for-pages -- Native public host paths intentionally use full document navigation through the host proxy. */
/* eslint-disable @next/next/no-img-element -- Published Core WebP families already provide srcSet, sizes and intrinsic dimensions. */
import type {CSSProperties,ReactNode} from 'react';
import type {NicheBlock,NicheMedia,NichePackage,NichePage} from '@/lib/niche-sites';
import {nicheJsonLd} from '@/lib/niche-seo';
import {nicheBreadcrumbs} from '@/lib/niche-schema-core.mjs';
import {imageSrcSet,uniqueImageFamilies} from '@/lib/niche-media.mjs';
import layout from '@/config/kvapunaikinimas-layout.json';
import {KvapunaikinimasForm} from './kvapunaikinimas-form';
import styles from './kvapunaikinimas-site.module.css';

type Props={pkg:NichePackage;page:NichePage;livePages:NichePage[]};
type Group={kind:string;start:number;end:number;imageAlts:string[]};
type LayoutPage={widgets:Record<string,Group>;heading:string};
const services=[
 ['patalpu-kvapu-naikinimas','Patalpų kvapų naikinimas','Patalpu-kvapu-naikinimas.jpg'],
 ['kvapu-naikinimas-automobilyje-ozonavimas','Kvapų naikinimas automobilyje','Kvapu-naikinimas-automobilyje-1.jpg'],
 ['cigareciu-tabako-dumu-rukalu-kvapo-naikinimas','Cigarečių kvapų naikinimas','Cigareciu-kvapu-naikinimas.jpg'],
 ['gyvunu-kvapo-naikinimas','Gyvunu kvapo naikinimas','Gyvunu-kvapo-naikinimas.jpg'],
 ['pelesio-naikinimas','Pelėsio naikinimas','pelesio-naikinimas-1.webp'],
 ['kvapu-naikinimas','Ozonavimas / Kitų kvapų naikinimas','ozonavimas.jpg']
] as const;
const path=(slug:string)=>slug?`/${slug}`:'/';
function PhoneIcon(){return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 3 4 5-2 3c1 2 3 4 5 5l3-2 5 4-2 3C10 22 2 14 3 6Z"/></svg>;}
function PublishedImage({media,altName,className,eager=false,sizes='(max-width: 700px) 45vw, 220px'}:{media:NicheMedia[];altName?:string;className?:string;eager?:boolean;sizes?:string}){
 const asset=uniqueImageFamilies(media).find((m:NicheMedia)=>m.alt===altName);if(!asset)return null;
 return <img className={className} src={asset.src} srcSet={imageSrcSet(media,asset)} sizes={sizes} width={asset.width} height={asset.height} alt={asset.alt} loading={eager?'eager':'lazy'} fetchPriority={eager?'high':undefined} decoding="async"/>;
}
function Blocks({blocks,media}:{blocks:NicheBlock[];media:NicheMedia[]}){
 return <>{blocks.map((b,i)=>{
  if(b.type==='heading'){const Tag=b.level===3?'h3':'h2';return <Tag key={i}>{b.text}</Tag>;}
  if(b.type==='paragraph')return <p key={i}>{b.text}</p>;
  if(b.type==='list')return <ul key={i}>{b.items.map((s,j)=><li key={j}>{s}</li>)}</ul>;
  const asset=media.find(a=>a.id===b.assetId);return asset?<PublishedImage key={i} media={media} altName={asset.alt} className={styles.articleImage} sizes="(max-width:700px) 90vw, 560px"/>:null;
 })}</>;
}
function Header({page,livePages,media}:{page:NichePage;livePages:NichePage[];media:NicheMedia[]}){
 const available=(slug:string)=>livePages.some(p=>p.slug===slug);
 const links=<>
  <a href="/" aria-current={page.slug===''?'page':undefined}>PAGRINDINIS</a>
  {available('ozonavimas-kas-tai')&&<a href="/ozonavimas-kas-tai">OZONAVIMAS</a>}
  <details className={styles.dropdown}><summary>PASLAUGOS</summary><div>{services.filter(([s])=>available(s)).map(([s,label])=><a key={s} href={path(s)}>{label}</a>)}</div></details>
  <details className={styles.dropdown}><summary>KAINOS</summary><div>{['vilniuje','kaune'].map(city=>available(`ozonavimas-${city}-kaina`)&&<a key={city} href={`/ozonavimas-${city}-kaina`}>Ozonavimas {city==='vilniuje'?'Vilniuje':'Kaune'}</a>)}</div></details>
  {available('dazniausiai-uzduodami-klausimai')&&<a href="/dazniausiai-uzduodami-klausimai">D.U.K.</a>}
  <a href="/#kontaktai">KONTAKTAI</a>
 </>;
 return <header className={styles.header}><div className={styles.headerInner}>
  <a className={styles.logo} href="/" aria-label="Kvapų naikinimas – pagrindinis puslapis"><PublishedImage media={media} altName={layout.assets['logo-o3.png']} eager sizes="200px"/></a>
  <nav className={styles.desktopNav} aria-label="Pagrindinė navigacija">{links}</nav>
  <a className={styles.mobileCall} href="tel:+37064819979"><PhoneIcon/>Skambinti</a>
  <details className={styles.mobileMenu}><summary aria-label="Atverti meniu"><svg viewBox="0 0 24 24" width="23" height="23" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg></summary><nav aria-label="Mobilioji navigacija">{links}</nav></details>
 </div></header>;
}
function Contacts({pkg}:{pkg:NichePackage}){
 return <section className={styles.contacts} aria-labelledby="kv-contact-title"><h2 id="kv-contact-title">KONTAKTAI</h2>
  <p>Tel. Vilniuje: <a href="tel:+37064819979"><PhoneIcon/>+37064819979</a><a href="tel:+37069199833"><PhoneIcon/>+37069199833</a></p>
  <p>Tel. Kaune: <a href="tel:+37068460688"><PhoneIcon/>+37068460688</a><a href="tel:+37065354982"><PhoneIcon/>+37065354982</a></p>
  <p>El. paštas: <a href={`mailto:${pkg.site.contact.email}`}>{pkg.site.contact.email}</a></p>
 </section>;
}
function Footer({pkg,livePages,media}:{pkg:NichePackage;livePages:NichePage[];media:NicheMedia[]}){
 return <footer className={styles.footer}><div className={styles.footerGrid}>
  <a href="/" aria-label="Kvapų naikinimas – pagrindinis puslapis"><PublishedImage media={media} altName={layout.assets['logo-o3.png']} sizes="200px"/></a>
  <div><h2>KATEGORIJA</h2>{services.filter(([s])=>livePages.some(p=>p.slug===s)).map(([s,label])=><a key={s} href={path(s)}>{label}</a>)}</div>
  <div><h2>INFORMACIJA</h2>{livePages.some(p=>p.slug==='musu-slapuku-politika')&&<a href="/musu-slapuku-politika">Privatumo informacija ir slapukai</a>}</div>
  <div><h2>KONTAKTAI</h2><a href="tel:+37064819979">+370 648 19979</a><a href={`mailto:${pkg.site.contact.email}`}>{pkg.site.contact.email}</a></div>
 </div><p className={styles.copyright}>© kvapunaikinimas.lt</p></footer>;
}
function Panel({children}:{children:ReactNode}){return <div className={styles.panel}>{children}</div>;}
const panelHeadings=(blocks:NicheBlock[]):NicheBlock[]=>blocks.map(b=>b.type==='heading'?{...b,level:2}:b);
function Questions({blocks,media}:{blocks:NicheBlock[];media:NicheMedia[]}){
 const groups:{question:string;body:NicheBlock[]}[]=[];
 for(const b of blocks){if(b.type==='heading')groups.push({question:b.text,body:[]});else groups.at(-1)?.body.push(b);}
 return <div className={styles.questions}>{groups.map(g=><details key={g.question}><summary><h2>{g.question}</h2></summary><Blocks blocks={g.body} media={media}/></details>)}</div>;
}
function Home({page,media,livePages}:{page:NichePage;media:NicheMedia[];livePages:NichePage[]}){
 const lp=layout.pages[''] as LayoutPage;
 const group=(id:string)=>{const g=lp.widgets[id];return g?page.body.slice(g.start,g.end):[];};
 const first=uniqueImageFamilies(media).filter((m:NicheMedia)=>['Blogi kvapai','Dulkių erkutės','Virusai','Alergenai','Pelėsis'].includes(m.alt));
 const equipment=uniqueImageFamilies(media).filter((m:NicheMedia)=>lp.widgets['e490c58'].imageAlts.includes(m.alt));
 const bg=uniqueImageFamilies(media).find((m:NicheMedia)=>m.alt===layout.assets['gaivus-oras.webp']);
 return <>
  {bg&&<link rel="preload" as="image" href={bg.src} fetchPriority="high" type="image/webp"/>}
  <section className={`${styles.hero} ${styles.cloudSection}`} style={{'--kv-background':bg?`url("${bg.src}")`:'none'} as CSSProperties}>
   <div className={styles.cloudTop} aria-hidden="true"/><div className={styles.container}>
    <h1>{lp.heading}</h1><div className={styles.heroGrid}>
     <Panel><Blocks blocks={panelHeadings(group('69b9db1'))} media={media}/></Panel>
     <div className={styles.carousel} aria-label="Ozonavimo iliustracijos">{first.map((a:NicheMedia,i:number)=><PublishedImage key={a.id} media={media} altName={a.alt} eager={i===0} sizes="300px"/>)}</div>
    </div>
   </div><div className={styles.cloudBottom} aria-hidden="true"/>
  </section>
  <section className={`${styles.services} ${styles.container}`}>
   <h2>MŪSŲ PASLAUGOS:</h2><div className={styles.serviceGrid}>{services.filter(([slug])=>livePages.some(p=>p.slug===slug)).map(([slug,label,file])=><a className={styles.serviceCard} key={slug} href={path(slug)}>
    <PublishedImage media={media} altName={layout.assets[file]} sizes="(max-width:700px) 43vw, 175px"/><span>{label}</span>
   </a>)}</div>
  </section>
  <section className={`${styles.proof} ${styles.cloudSection}`}><div className={styles.cloudTop} aria-hidden="true"/><div className={styles.container}>
   <h2>{group('5080467').find(b=>b.type==='heading')?.text}</h2><div className={styles.proofGrid}>
    <Panel><Blocks blocks={panelHeadings(group('83439ef'))} media={media}/></Panel>
    <div className={styles.carousel} aria-label="Ozonavimo įranga">{equipment.map((a:NicheMedia)=><PublishedImage key={a.id} media={media} altName={a.alt} sizes="300px"/>)}</div>
   </div>
  </div><div className={styles.cloudBottom} aria-hidden="true"/></section>
  <section id="kontaktai" className={`${styles.contactArea} ${styles.container}`}><div>
   <h2>SUSISIEKITE SU MŪSŲ KOMANDA!</h2><KvapunaikinimasForm styles={{form:styles.form,trap:styles.trap,notice:styles.notice,button:styles.button}}/>
  </div><PublishedImage className={styles.van} media={media} altName={layout.assets['Kvapu-naikinimas-kontaktai-1024x694.jpg']||layout.assets['Kvapu-naikinimas-kontaktai.jpg']} sizes="(max-width:700px) 90vw, 520px"/></section>
 </>;
}
export function KvapunaikinimasSite({pkg,page,livePages}:Props){
 const home=livePages.find(p=>p.type==='home');
 const media=page.type==='home'?page.media:[...page.media,...(home?.media||[])];
 const lp=(layout.pages as Record<string,LayoutPage>)[page.slug];
 const first=page.body.findIndex(b=>b.type==='heading');
 const body=page.body.filter((_,i)=>i!==first);
 return <div className={styles.shell}>
  <a className={styles.skip} href="#kv-main">Praleisti navigaciją</a>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:nicheJsonLd(pkg,page,livePages)}}/>
  <Header page={page} livePages={livePages} media={media}/>
  <main id="kv-main">{page.type==='home'?<Home page={page} media={media} livePages={livePages}/>:<>
   <section className={`${styles.articleSection} ${styles.cloudSection}`}><div className={styles.cloudTop} aria-hidden="true"/><div className={styles.container}>
    <nav className={styles.breadcrumbs} aria-label="Puslapio kelias">{nicheBreadcrumbs(pkg,page,livePages).map((b:{path:string;name:string},i:number,all:unknown[])=><span key={b.path}>{i>0&&' / '}{i===all.length-1?<span aria-current="page">{b.name}</span>:<a href={b.path}>{b.name}</a>}</span>)}</nav>
    <h1>{lp?.heading||page.title}</h1><article className={styles.article}>{page.slug==='dazniausiai-uzduodami-klausimai'?<Questions blocks={body} media={page.media}/>:<Blocks blocks={body} media={page.media}/>}</article>
   </div><div className={styles.cloudBottom} aria-hidden="true"/></section>
   <p className={styles.pageAction}><a className={styles.button} href="/#kontaktai">SUSISIEKITE SU MŪSŲ KOMANDA!</a></p>
  </>}
  <Contacts pkg={pkg}/></main>
  <Footer pkg={pkg} livePages={livePages} media={media}/>
 </div>;
}
