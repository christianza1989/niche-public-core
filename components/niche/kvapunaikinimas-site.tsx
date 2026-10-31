/* eslint-disable @next/next/no-html-link-for-pages -- Native host proxy uses public paths. */
/* eslint-disable @next/next/no-img-element -- Native responsive WebP media families. */
import type {CSSProperties,ReactNode} from 'react';
import {preload} from 'react-dom';
import {kvapunaikinimasImageSrcSet} from '@/lib/kvapunaikinimas-image-delivery.mjs';
import {kvapunaikinimasDeliverySrc} from '@/lib/kvapunaikinimas-asset-delivery.mjs';
import type {NicheMedia,NichePackage,NichePage} from '@/lib/niche-sites';
import {nicheJsonLd} from '@/lib/niche-seo';
import {nicheBreadcrumbs} from '@/lib/niche-schema-core.mjs';
import {imageSrcSet,uniqueImageFamilies,responsiveImageVariants} from '@/lib/niche-media.mjs';
import {inlinePieces,matchingPresentation,originalHref,pageDigest,orderedWidgets,originalTextStyle} from '@/lib/kvapunaikinimas-presentation.mjs';
import rawLayout from '@/config/kvapunaikinimas-layout.json';
import {KvapunaikinimasForm} from './kvapunaikinimas-form';
import {KvBackToTop,KvCarousel,KvMobileMenu} from './kvapunaikinimas-controls';
import styles from './kvapunaikinimas-site.module.css';

type Mark={kind:'strong'|'em'|'link'|'style';from:number;to:number;href?:string;style?:{size?:number;weight?:number;letter?:number;color?:string;slant?:string}};
type Format={digest?:string;style?:{size:number;weight:number;line?:number|'normal';align:string;letter:number;color?:string;marginTop?:number;marginBottom?:number};marks?:Mark[];marker?:{type:string;indent:number};ordered?:boolean;start?:number;itemMarks?:Mark[][];image?:{alt:string;width:number;height:number;radius:number}};
type Group={start:number;end:number;open:boolean;hasTitle:boolean};
type Widget={kind:string;start:number;end:number;imageAlts:string[];sectionId?:string;box?:{w:number;h:number};mobileBox?:{h:number};gap?:number;mobileGap?:number;paddingBefore?:number;paddingAfter?:number;mobilePaddingBefore?:number;mobilePaddingAfter?:number;groups?:Group[]};
type LayoutPage={widgets:Record<string,Widget>;heading:string;formats:Record<string,Format>;digest:string;top:number;mobileTop:number;bottom:number;mobileBottom:number};
const layout=rawLayout as unknown as {assets:Record<string,string>;pages:Record<string,LayoutPage>};
type Context={page:NichePage;media:NicheMedia[];lp?:LayoutPage};
type Props={pkg:NichePackage;page:NichePage;livePages:NichePage[]};
const services=[
 ['patalpu-kvapu-naikinimas','Patalpų kvapų naikinimas','Patalpu-kvapu-naikinimas.jpg','dffd8f7'],
 ['kvapu-naikinimas-automobilyje-ozonavimas','Kvapų naikinimas automobilyje','Kvapu-naikinimas-automobilyje-1.jpg','2468773'],
 ['cigareciu-tabako-dumu-rukalu-kvapo-naikinimas','Cigarečių kvapo naikinimas','Cigareciu-kvapu-naikinimas.jpg','424953c'],
 ['gyvunu-kvapo-naikinimas','Gyvūnų kvapo naikinimas','Gyvunu-kvapo-naikinimas.jpg','bd1ef8d'],
 ['pelesio-naikinimas','Pelėsio naikinimas','pelesio-naikinimas-1.webp','e5f7cd7'],
 ['kvapu-naikinimas','Ozonavimas / Kitų kvapų naikinimas','ozonavimas.jpg','f80da2b']
] as const;
function PhoneIcon(){return <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="m6 3 4 5-2 3c1 2 3 4 5 5l3-2 5 4-2 3C10 22 2 14 3 6Z"/></svg>;}
function MailIcon(){return <svg viewBox="0 0 24 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M2 3h20v14H2ZM2 3l10 8L22 3"/></svg>;}
function PublishedImage({media,altName,assetId,className,eager=false,sizes='(max-width: 700px) 45vw, 220px'}:{media:NicheMedia[];altName?:string;assetId?:string;className?:string;eager?:boolean;sizes?:string}){
 const asset=assetId?media.find(m=>m.id===assetId):uniqueImageFamilies(media).find((m:NicheMedia)=>m.alt===altName);if(!asset)return null;
 const srcSet=sizes==='300px'?kvapunaikinimasImageSrcSet(asset,process.env.HOSTINGER_NODE_RUNTIME==='1'):undefined;
 const fallbackSet=process.env.HOSTINGER_NODE_RUNTIME==='1'?responsiveImageVariants(media,asset).map((a:NicheMedia)=>`${kvapunaikinimasDeliverySrc(a.src,true)} ${a.width}w`).join(', '):imageSrcSet(media,asset);
 const image=<img className={className} src={asset.src} srcSet={fallbackSet} sizes={sizes} width={asset.width} height={asset.height} alt={asset.alt} loading={eager?'eager':'lazy'} fetchPriority={eager?'high':undefined} decoding="async"/>;
 return srcSet?<picture style={{display:'contents'}}><source type="image/avif" srcSet={srcSet} sizes={sizes}/>{image}</picture>:image;
}
function Inline({text,marks}:{text:string;marks?:Mark[]}){
 return <>{inlinePieces(text,marks).map((piece:{text:string;marks:Mark[]},i:number)=>{
  let content:ReactNode=piece.text;
  for(const mark of piece.marks){if(mark.kind==='strong')content=<strong>{content}</strong>;else if(mark.kind==='em')content=<em>{content}</em>;else if(mark.kind==='style')content=<span style={originalTextStyle(mark.style)}>{content}</span>;else content=<a href={originalHref(mark.href)}>{content}</a>;}
  return <span key={i}>{content}</span>;
 })}</>;
}
function typeStyle(format?:Format):CSSProperties|undefined{
 const s=format?.style;if(!s)return;
 return {fontSize:s.size,fontWeight:s.weight,lineHeight:s.line==='normal'?'normal':s.line&&s.line>0?s.line:undefined,textAlign:s.align as CSSProperties['textAlign'],letterSpacing:s.letter||undefined,color:s.color,marginTop:s.marginTop||0,marginBottom:s.marginBottom??20};
}
function Block({ctx,index}:{ctx:Context;index:number}){
 const b=ctx.page.body[index];if(!b)return null;
 const raw=ctx.lp?.formats[index];
 if(b.type==='image'){
  const asset=ctx.media.find(a=>a.id===b.assetId);if(!asset)return null;
  const frame=raw?.image?.alt===asset.alt?raw.image:undefined;
  return <div className={styles.articleImageFrame} style={{maxWidth:frame?.width||800,aspectRatio:frame?`${frame.width}/${frame.height}`:undefined,borderRadius:frame?.radius||0}}><PublishedImage media={ctx.media} assetId={asset.id} className={styles.articleImage} sizes={`(max-width:800px) 90vw, ${frame?.width||800}px`}/></div>;
 }
 const format=matchingPresentation(b,raw) as Format|undefined;
 if(b.type==='heading'){const Tag=b.level===3?'h3':'h2';const heading=<Tag style={format?.marker?{...typeStyle(format),margin:0}:typeStyle(format)}><Inline text={b.text} marks={format?.marks}/></Tag>;return format?.marker?<ul className={styles.titleList} style={{...typeStyle(format),paddingLeft:format.marker.indent,listStyleType:format.marker.type==='decimal'?'decimal':'disc'}}><li>{heading}</li></ul>:heading;}
 if(b.type==='paragraph')return <p style={typeStyle(format)}><Inline text={b.text} marks={format?.marks}/></p>;
 const Tag=format?.ordered?'ol':'ul';
 return <Tag style={typeStyle(format)} {...(format?.ordered?{start:format.start}:{})}>{b.items.map((s,j)=><li key={j}><Inline text={s} marks={format?.itemMarks?.[j]}/></li>)}</Tag>;
}
function Blocks({ctx,start=0,end=ctx.page.body.length}:{ctx:Context;start?:number;end?:number}){return <>{Array.from({length:Math.max(0,end-start)},(_,i)=><Block ctx={ctx} index={start+i} key={start+i}/>)}</>;}
function WidgetContent({ctx,id}:{ctx:Context;id:string}){const w=ctx.lp?.widgets[id];return w?<Blocks ctx={ctx} start={w.start} end={w.end}/>:null;}
function Header({page,livePages,media}:{page:NichePage;livePages:NichePage[];media:NicheMedia[]}){
 const available=(slug:string)=>livePages.some(p=>p.slug===slug);
 const current=(slug:string)=>page.slug===slug?'page' as const:undefined;
 const links=<>
  <a href="/" aria-current={current('')}>PAGRINDINIS</a>
  {available('ozonavimas-kas-tai')&&<a href="/ozonavimas-kas-tai" aria-current={current('ozonavimas-kas-tai')}>OZONAVIMAS</a>}
  <details className={styles.dropdown} data-current={services.some(([s])=>s===page.slug)||undefined}><summary>PASLAUGOS</summary><div>{services.filter(([s])=>available(s)).map(([s,label])=><a key={s} href={`/${s}`} aria-current={current(s)}>{label}</a>)}</div></details>
  <details className={styles.dropdown} data-current={page.slug.endsWith('-kaina')||undefined}><summary>KAINOS</summary><div>{['vilniuje','kaune'].map(city=>available(`ozonavimas-${city}-kaina`)&&<a key={city} href={`/ozonavimas-${city}-kaina`} aria-current={current(`ozonavimas-${city}-kaina`)}>Ozonavimas {city==='vilniuje'?'Vilniuje':'Kaune'}</a>)}</div></details>
  {available('dazniausiai-uzduodami-klausimai')&&<a href="/dazniausiai-uzduodami-klausimai" aria-current={current('dazniausiai-uzduodami-klausimai')}>D.U.K.</a>}
  <a href="/#kontaktai">KONTAKTAI</a>
 </>;
 return <header className={styles.header}><div className={styles.headerInner}>
  <a className={styles.logo} href="/" aria-label="Kvapų naikinimas – pagrindinis puslapis"><PublishedImage media={media} altName={layout.assets['logo-o3.png']} eager sizes="208px"/></a>
  <nav className={styles.desktopNav} aria-label="Pagrindinė navigacija">{links}</nav>
  <a className={styles.mobileCall} href="tel:+37064819979"><PhoneIcon/>Skambinti</a>
  <KvMobileMenu className={styles.mobileMenu}>{links}</KvMobileMenu>
 </div></header>;
}
function Contacts({pkg,home}:{pkg:NichePackage;home:boolean}){
 return <section className={`${styles.contacts} ${home?styles.homeContacts:''}`} aria-labelledby="kv-contact-title"><h2 id="kv-contact-title">KONTAKTAI</h2>
  <p>Tel. Vilniuje: <a href="tel:+37064819979"><PhoneIcon/>+37064819979</a><a href="tel:+37069199833"><PhoneIcon/>+37069199833</a></p>
  <p>Tel. Kaune: <a href="tel:+37068460688"><PhoneIcon/>+37068460688</a><a href="tel:+37065354982"><PhoneIcon/>+37065354982</a></p>
  <p>El. paštas: <a href={`mailto:${pkg.site.contact.email}`}><MailIcon/>{pkg.site.contact.email}</a></p>
 </section>;
}
function Footer({pkg,livePages,media}:{pkg:NichePackage;livePages:NichePage[];media:NicheMedia[]}){
 return <footer className={styles.footer}><div className={styles.footerGrid}>
  <a href="/" aria-label="Kvapų naikinimas – pagrindinis puslapis"><PublishedImage media={media} altName={layout.assets['logo-o3.png']} sizes="225px"/></a>
  <div><h2>KATEGORIJA</h2>{services.filter(([s])=>livePages.some(p=>p.slug===s)).map(([s,label])=><a key={s} href={`/${s}`}>{label}</a>)}</div>
  <div><h2>INFORMACIJA</h2>{livePages.some(p=>p.slug==='musu-slapuku-politika')&&<a href="/musu-slapuku-politika">Privatumo informacija ir slapukai</a>}</div>
  <div><h2>KONTAKTAI</h2><a href="tel:+37064819979">+370 648 19979</a><a href={`mailto:${pkg.site.contact.email}`}>{pkg.site.contact.email}</a></div>
 </div><p className={styles.copyright}>© kvapunaikinimas.lt</p></footer>;
}
function Clouds(){return <><div className={styles.cloudTop} aria-hidden="true"/><div className={styles.cloudBottom} aria-hidden="true"/></>;}
function Panel({ctx,id}:{ctx:Context;id:string}){
 const group=ctx.lp?.widgets[id]?.groups?.[0];if(!group)return null;
 return <details className={styles.panel} open><summary><Block ctx={ctx} index={group.start}/></summary><div className={styles.panelBody}><Blocks ctx={ctx} start={group.start+1} end={group.end}/></div></details>;
}
const carouselClasses={carousel:styles.carousel,carouselTrack:styles.carouselTrack,slide:styles.slide};
function Home({ctx,livePages}:{ctx:Context;livePages:NichePage[]}){
 const {media,lp}=ctx;if(!lp){const first=ctx.page.body.findIndex(b=>b.type==='heading');const heading=ctx.page.body[first];return <><section className={`${styles.articleSection} ${styles.container}`}><h1>{heading?.type==='heading'?heading.text:ctx.page.title}</h1><Blocks ctx={ctx} start={first+1}/></section><section id="kontaktai" className={`${styles.contactArea} ${styles.container}`}><h2>SUSISIEKITE SU MŪSŲ KOMANDA!</h2><KvapunaikinimasForm styles={{form:styles.form,fieldLabel:styles.fieldLabel,trap:styles.trap,notice:styles.notice,button:styles.button}}/></section></>;}
 const family=uniqueImageFamilies(media);
 const bg=family.find((m:NicheMedia)=>m.alt===layout.assets['gaivus-oras.webp']);
 const sky=family.find((m:NicheMedia)=>m.alt===layout.assets['Titulinis-e1712211692495.jpg']);
 const initial=['blogi-kvapai.png','dulkiu-erkutes2.png','virusai.png','alergenai-1.png','pelesis.png'];
 const equipment=['imageedit_1_4410406638-1.png','imageedit_5_2550315103.png','imageedit_9_6143204277.png','imageedit_11_8985628063.png'];
 return <>
  {bg&&<link rel="preload" as="image" href={kvapunaikinimasDeliverySrc(bg.src,process.env.HOSTINGER_NODE_RUNTIME==='1')} fetchPriority="high" type="image/webp"/>}
  <section className={`${styles.hero} ${styles.cloudSection}`} style={{'--kv-background':bg?`url("${kvapunaikinimasDeliverySrc(bg.src,process.env.HOSTINGER_NODE_RUNTIME==='1')}")`:'none'} as CSSProperties}><Clouds/><div className={`${styles.container} ${styles.homeContainer}`}>
   <h1>{lp.heading}</h1><div className={styles.heroGrid}><Panel ctx={ctx} id="69b9db1"/><KvCarousel classes={carouselClasses} label="Ozonavimo iliustracijos">{initial.map((file,i)=><PublishedImage key={file} media={media} altName={layout.assets[file]} eager={i===0} sizes="300px"/>)}</KvCarousel></div>
  </div></section>
  <section className={`${styles.services} ${styles.container}`}><h2>MŪSŲ PASLAUGOS:</h2><div className={styles.serviceGrid}>{services.filter(([s])=>livePages.some(p=>p.slug===s)).map(([s,label,file,buttonId])=>{const caption=ctx.page.body[lp.widgets[buttonId]?.start];return <a className={styles.serviceCard} key={s} href={`/${s}`}><PublishedImage media={media} altName={layout.assets[file]} sizes="(max-width:800px) 43vw, 162px"/><span>{caption&&'text' in caption?caption.text:label}</span></a>;})}</div></section>
  <section className={`${styles.proof} ${styles.cloudSection}`} style={{'--kv-background':sky?`url("${kvapunaikinimasDeliverySrc(sky.src,process.env.HOSTINGER_NODE_RUNTIME==='1')}")`:'none'} as CSSProperties}><Clouds/><div className={`${styles.container} ${styles.homeContainer}`}>
   <div className={styles.sectionHeading}><WidgetContent ctx={ctx} id="5080467"/></div><div className={styles.proofGrid}><Panel ctx={ctx} id="83439ef"/><KvCarousel classes={carouselClasses} label="Ozonavimo įranga">{equipment.map(file=><PublishedImage key={file} media={media} altName={layout.assets[file]} sizes="300px"/>)}</KvCarousel></div>
  </div></section>
  <section id="kontaktai" className={`${styles.contactArea} ${styles.container}`}><h2>SUSISIEKITE SU MŪSŲ KOMANDA!</h2><KvapunaikinimasForm styles={{form:styles.form,fieldLabel:styles.fieldLabel,trap:styles.trap,notice:styles.notice,button:styles.button}}/><div className={styles.vanFrame}><WidgetContent ctx={ctx} id="caf5d1d"/></div></section>
 </>;
}
function Questions({ctx,widget}:{ctx:Context;widget:Widget}){
 return <div className={styles.questions}>{widget.groups?.map(g=><details key={g.start}><summary><span className={styles.questionIcon}><svg viewBox="0 0 8 10" width="7" height="9" fill="currentColor" aria-hidden="true"><path d="m1 1 6 4-6 4Z"/></svg></span><Block ctx={ctx} index={g.start}/></summary><div className={styles.answer}><Blocks ctx={ctx} start={g.start+1} end={g.end}/></div></details>)}</div>;
}
function Process({ctx}:{ctx:Context}){
 if(!ctx.lp?.widgets['27f2c03'])return null;
 return <section className={styles.process}><div className={styles.container}><WidgetContent ctx={ctx} id="27f2c03"/><div className={styles.processGrid}>{['a3255c9','8432579','e84801a','a515030'].map(id=><div key={id}><WidgetContent ctx={ctx} id={id}/></div>)}</div></div></section>;
}
function InnerPage({ctx,pkg,livePages}:{ctx:Context;pkg:NichePackage;livePages:NichePage[]}){
 const {page,lp}=ctx,legal=page.slug==='musu-slapuku-politika';
 const first=page.body.findIndex(b=>b.type==='heading');
 const widgetEntries=orderedWidgets(lp?.widgets||{}).filter(([,w]:[string,Widget])=>w.sectionId!=='2cac69a'&&!(w.start===first&&w.end===first+1)) as [string,Widget][];
 const sectionStyle={'--kv-heading-top':`${lp?.top||90}px`,'--kv-mobile-top':`${lp?.mobileTop||108}px`,'--kv-bottom':`${lp?.bottom||150}px`,'--kv-mobile-bottom':`${lp?.mobileBottom||100}px`} as CSSProperties;
 return <>
  <section className={`${styles.articleSection} ${legal?styles.legalSection:styles.cloudSection}`} style={sectionStyle}>{!legal&&<Clouds/>}<div className={styles.container}>
   <div className={styles.titleStack}><nav className={styles.breadcrumbs} aria-label="Puslapio kelias">{nicheBreadcrumbs(pkg,page,livePages).map((b:{path:string;name:string},i:number,all:unknown[])=><span key={b.path}>{i>0&&' / '}{i===all.length-1?<span aria-current="page">{lp?.heading||page.title}</span>:<a href={b.path}>{b.name}</a>}</span>)}</nav><h1>{lp?.heading||page.title}</h1></div>
   <article className={`${styles.article} ${legal?styles.legalArticle:''}`}>
    {legal?<Blocks ctx={ctx} start={first+1}/>:lp?widgetEntries.map(([id,w])=><div key={id} data-source-widget={id} className={`${styles.widget} ${w.kind==='heading.default'?styles.headingWidget:''} ${w.groups&&w.kind==='accordion.default'?styles.priceCard:''}`} style={{'--kv-gap':`${w.gap||0}px`,'--kv-mobile-gap':`${w.mobileGap||0}px`,'--kv-head':`${w.paddingBefore||0}px`,'--kv-tail':`${w.paddingAfter||0}px`,'--kv-mobile-head':`${w.mobilePaddingBefore||0}px`,'--kv-mobile-tail':`${w.mobilePaddingAfter||0}px`} as CSSProperties}>{w.kind==='toggle.default'?<Questions ctx={ctx} widget={w}/>:<WidgetContent ctx={ctx} id={id}/>}</div>):<Blocks ctx={ctx} start={first+1}/>}
   </article>
  </div></section>
  {!legal&&<Process ctx={ctx}/>}
 </>;
}
export function KvapunaikinimasSite({pkg,page,livePages}:Props){
 preload(kvapunaikinimasDeliverySrc('/fonts/kvapunaikinimas/open-sans-latin.woff2?v=d8e4fe0452aa',process.env.HOSTINGER_NODE_RUNTIME==='1'),{as:'font',type:'font/woff2',crossOrigin:'anonymous'});
 preload(kvapunaikinimasDeliverySrc('/fonts/kvapunaikinimas/open-sans-latin-ext.woff2?v=d5bab8e28732',process.env.HOSTINGER_NODE_RUNTIME==='1'),{as:'font',type:'font/woff2',crossOrigin:'anonymous'});
 const home=livePages.find(p=>p.type==='home'),media=page.type==='home'?page.media:[...page.media,...(home?.media||[])];
 const candidate=layout.pages[page.slug];
 const lp=candidate?.digest===pageDigest(page.body,media)?candidate:undefined;
 if(lp&&Object.values(lp.formats).some(f=>[...(f.marks||[]),...(f.itemMarks||[]).flat()].some(m=>m.kind==='em'||m.style?.slant==='italic'))){
  preload(kvapunaikinimasDeliverySrc('/fonts/kvapunaikinimas/open-sans-italic-latin.woff2?v=8df90accd45b',process.env.HOSTINGER_NODE_RUNTIME==='1'),{as:'font',type:'font/woff2',crossOrigin:'anonymous'});
  preload(kvapunaikinimasDeliverySrc('/fonts/kvapunaikinimas/open-sans-italic-latin-ext.woff2?v=2e9001fa91a2',process.env.HOSTINGER_NODE_RUNTIME==='1'),{as:'font',type:'font/woff2',crossOrigin:'anonymous'});
 }
 const ctx={page,media,lp};
 return <div className={styles.shell} id="kv-top"><a className={styles.skip} href="#kv-main">Praleisti navigaciją</a><script type="application/ld+json" dangerouslySetInnerHTML={{__html:nicheJsonLd(pkg,page,livePages)}}/><Header page={page} livePages={livePages} media={media}/><main id="kv-main">{page.type==='home'?<Home ctx={ctx} livePages={livePages}/>:<InnerPage ctx={ctx} pkg={pkg} livePages={livePages}/>} {page.slug!=='musu-slapuku-politika'&&<Contacts pkg={pkg} home={page.type==='home'}/>}</main><Footer pkg={pkg} livePages={livePages} media={media}/><KvBackToTop className={styles.backToTop}/></div>;
}
