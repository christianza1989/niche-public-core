/* eslint-disable @next/next/no-html-link-for-pages, @next/next/no-img-element -- Server-rendered native navigation and pre-sized WebP assets. */
import type { ReactNode } from "react";
import { nichePagePath, type NicheBlock, type NicheMedia, type NichePage, type NichePackage } from "@/lib/niche-sites";
import { nicheJsonLd } from "@/lib/niche-seo";
import { InterestTracking } from "./interest-tracking";
import { LinkedText } from "./linked-text";
import styles from "./roletaiklaipedoje-site.module.css";

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d={diagonal ? "M5 19 19 5M5 5h14v14" : "M4 12h15m-6-6 6 6-6 6"} /></svg>;
}
function WindowMark() {
  return <svg aria-hidden="true" width="33" height="38" viewBox="0 0 33 38" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 2h29v34H2zM2 18h29M16.5 18v18M2 7h29M2 12h29" /></svg>;
}
function Block({ block, page, livePages, media = [] }: { block: NicheBlock; page: NichePage; livePages: NichePage[]; media?: NicheMedia[] }) {
  if (block.type === "paragraph") return <p><LinkedText text={block.text} page={page} livePages={livePages} /></p>;
  if (block.type === "heading") return block.level === 2 ? <h2>{block.text}</h2> : <h3>{block.text}</h3>;
  if (block.type === "list") return <ul>{block.items.map((text, i) => <li key={i}><LinkedText text={text} page={page} livePages={livePages} /></li>)}</ul>;
  const asset = media.find(item => item.id === block.assetId);
  return asset ? <figure><img src={asset.src} alt={asset.alt} width={asset.width} height={asset.height} loading="lazy" />{asset.credit && <figcaption>{asset.credit}</figcaption>}</figure> : null;
}
function section(page: NichePage, heading: string): NicheBlock[] {
  const start = page.body.findIndex(b => b.type === "heading" && b.text === heading);
  if (start < 0) return [];
  const end = page.body.findIndex((b, i) => i > start && b.type === "heading" && b.level === 2);
  return page.body.slice(start + 1, end < 0 ? undefined : end);
}
function textOf(block?: NicheBlock) { return block && "text" in block ? block.text : ""; }
function Button({ page, children, quiet = false }: { page?: NichePage; children: ReactNode; quiet?: boolean }) {
  return page ? <a className={quiet ? styles.textLink : styles.button} href={nichePagePath(page)}>{children}<Arrow /></a> : null;
}
function Header({ pages }: { pages: NichePage[] }) {
  const items = [
    ["gidai/kaip-issirinkti-roletus", "Kaip pasirinkti"], ["gidai", "Gidai"], ["roletu-poreikis", "Apie užklausą"],
  ].map(([slug, label]) => ({ page: pages.find(p => p.slug === slug), label })).filter(item => item.page);
  const contact = pages.find(p => p.slug === "kontaktai");
  return <header className={styles.header}>
    <a className={styles.brand} href="/"><WindowMark /><span>roletai<span> Klaipėdoje</span></span></a>
    <nav className={styles.desktopNav} aria-label="Pagrindinė navigacija">{items.map(({page,label}) => <a key={label} href={nichePagePath(page!)}>{label}</a>)}</nav>
    <div className={styles.headerAction}><Button page={contact}>Aprašyti poreikį</Button></div>
    <details className={styles.mobileMenu}><summary>Meniu <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" stroke="currentColor"><path d="M2 5h16M2 10h16M2 15h16" /></svg></summary><nav aria-label="Mobilioji navigacija">{items.map(({page,label}) => <a key={label} href={nichePagePath(page!)}>{label}</a>)}{contact && <a href={nichePagePath(contact)}>Aprašyti poreikį</a>}</nav></details>
  </header>;
}
function Footer({ pkg, pages }: { pkg: NichePackage; pages: NichePage[] }) {
  return <footer className={styles.footer}>
    <div className={styles.footerTop}><a className={styles.brand} href="/"><WindowMark /><span>roletai<span> Klaipėdoje</span></span></a><a className={styles.footerEmail} href={`mailto:${pkg.site.contact.email}`}>{pkg.site.contact.email}<Arrow diagonal /></a></div>
    <div className={styles.footerBottom}><span>{pkg.site.name}</span><nav aria-label="Poraštės navigacija">{["gidai", "kontaktai", "privatumas"].map(slug => pages.find(p => p.slug === slug)).filter((p):p is NichePage => !!p).map(p => <a key={p.id} href={nichePagePath(p)}>{p.slug === "gidai" ? "Gidai" : p.slug === "privatumas" ? "Privatumas" : "Kontaktai"}</a>)}</nav><span>Mūsų verslas automatizuotas su <a href="https://verslomatika.lt/" rel="noopener noreferrer">verslomatika.lt</a></span></div>
  </footer>;
}
function GuideLinks({ pages, homepage = false }: { pages: NichePage[]; homepage?: boolean }) {
  const guides = pages.filter(p => p.type === "guide");
  const root = guides.find(p => p.slug === "gidai/kaip-issirinkti-roletus");
  return <div className={styles.guideIndex}>
    {root && <a className={styles.featuredGuide} href={nichePagePath(root)}><h3>{root.title}</h3><p>{root.description}</p><span>Skaityti pasirinkimo gidą <Arrow diagonal /></span></a>}
    <div className={styles.guideRows}>{guides.filter(p => p.id !== root?.id).map(p => <a href={nichePagePath(p)} key={p.id}><div><h3>{p.title}</h3>{!homepage && <p>{p.description}</p>}</div><Arrow diagonal /></a>)}</div>
  </div>;
}
function ContactForm({ pkg, privacy }: { pkg: NichePackage; privacy?: NichePage }) {
  return <form className={styles.form} action="/uzklausa" method="post" acceptCharset="utf-8">
    <div className={styles.formRow}><label>Jūsų vardas<input name="name" autoComplete="name" minLength={2} maxLength={100} required /></label><label>El. paštas<input name="email" type="email" autoComplete="email" maxLength={250} required /></label></div>
    <label>Aprašykite savo langus ir poreikį<textarea name="message" rows={6} minLength={20} maxLength={3000} required placeholder="Pvz., miegamasis Klaipėdoje, du atidaromi langai. Norisi mažiau šviesos rytais. Preliminarūs matmenys…" /></label>
    <p className={styles.fieldNote}>Bent 20 ženklų. Jei nežinote matmenų ar modelio, taip ir parašykite.</p>
    <label className={styles.consent}><input name="consent" type="checkbox" value="yes" required /><span>Sutinku, kad mano vardas, el. paštas ir žinutė būtų naudojami atsakyti į šią užklausą.</span></label>
    <p className={styles.formPrivacy}>{privacy && <a href={nichePagePath(privacy)}>Privatumo informacija</a>}. Duomenų klausimams: <a href={`mailto:${pkg.site.contact.email}`}>{pkg.site.contact.email}</a>.</p>
    <div className={styles.honeypot} aria-hidden="true"><label>Palikite tuščią<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <button className={styles.button} type="submit">Siųsti poreikio užklausą<Arrow /></button>
  </form>;
}
function Home({ page, pages }: { page: NichePage; pages: NichePage[] }) {
  const get = (slug: string) => pages.find(p => p.slug === slug);
  const contact = get("kontaktai");
  const hero = page.media[0];
  const mediaSet = [...page.media].sort((a,b)=>a.width-b.width).map(m=>`${m.src} ${m.width}w`).join(", ");
  const needs = section(page, "Kokios šviesos reikia jums?");
  const fabric = section(page, "Audinys ir mechanizmas – du atskiri pasirinkimai.");
  const steps = section(page, "Nuo lango iki aiškios užklausos");
  const invite = section(page, "Papasakokite apie savo langus");
  return <main id="turinys">
    <section className={styles.hero}>
      <div className={styles.heroCopy}><h1>{page.title}</h1><p>{textOf(page.body[0])}</p><div className={styles.heroActions}><Button page={contact}>Aprašyti savo poreikį</Button><Button page={get("gidai/kaip-issirinkti-roletus")} quiet>Kaip pasirinkti roletus</Button></div></div>
      {hero && <figure className={styles.heroMedia}><img src={hero.src} srcSet={mediaSet} sizes="(max-width: 760px) 100vw, 56vw" alt="Interjero iliustracija: mėlynas roletas, pro langą krintanti popietės šviesa" width={hero.width} height={hero.height} fetchPriority="high" decoding="async" /><figcaption>{hero.credit}</figcaption></figure>}
    </section>
    <section className={styles.needSection} aria-labelledby="needs-title"><div className={styles.sectionHead}><h2 id="needs-title">Kokios šviesos reikia jums?</h2><p>{textOf(needs[0])}</p></div><div className={styles.needGrid}>{needs.filter(b=>b.type==="heading").map(b=>{
      const i=needs.indexOf(b); const title=textOf(b); const target=title==="Dienos šviesa"?get("gidai/kaip-issirinkti-roletus"):get("gidai/diena-naktis-ar-blackout");
      return <article key={title}><h3>{title}</h3><p>{textOf(needs[i+1])}</p><Button page={target} quiet>{title==="Dienos šviesa"?"Pradėti pasirinkimą":"Palyginti audinius"}</Button></article>;
    })}</div></section>
    <section className={styles.comparison}><div className={styles.comparisonIntro}><h2>Audinys ir mechanizmas – du atskiri pasirinkimai.</h2><p>{textOf(fabric[0])}</p><Button page={get("gidai/diena-naktis-ar-blackout")} quiet>Suprasti skirtumus</Button></div><div className={styles.fabricRows}>{fabric.filter(b=>b.type==="heading").map(b=>{const i=fabric.indexOf(b);return <div key={textOf(b)}><h3>{textOf(b)}</h3><p>{textOf(fabric[i+1])}</p></div>;})}</div></section>
    <section className={styles.prepare}><div><h2>Nuo lango iki aiškios užklausos</h2><p>{textOf(steps[0])}</p><Button page={get("gidai/lango-matmenys-roletams")} quiet>Ką pasiruošti prieš rašant</Button></div><ol>{steps.filter((b): b is Extract<NicheBlock,{type:"list"}>=>b.type==="list").flatMap(b=>b.items).map((s,i)=><li key={i}>{s}</li>)}</ol></section>
    <section className={styles.guides}><div className={styles.sectionHead}><h2>Praktiniai gidai jūsų sprendimui</h2><p>{textOf(section(page,"Praktiniai gidai jūsų sprendimui")[0])}</p></div><GuideLinks pages={pages} homepage /></section>
    <section className={styles.invite}><div><h2>Papasakokite apie savo langus</h2><p>{textOf(invite[0])}</p></div><Button page={contact}>Pateikti poreikio užklausą</Button></section>
    <section className={styles.homeSources} aria-label="Informacijos šaltiniai">{page.externalLinks?.map(s=><a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">{s.label}<span className={styles.srOnly}> (atsidaro naujame lange)</span></a>)}</section>
  </main>;
}
function Inner({ pkg, page, pages }: { pkg: NichePackage; page: NichePage; pages: NichePage[] }) {
  const isContact = page.slug === "kontaktai" || page.slug === "roletu-poreikis";
  const isIndex = page.slug === "gidai";
  const privacy = pages.find(p=>p.slug==="privatumas");
  const headings = page.body.filter((b): b is Extract<NicheBlock,{type:"heading"}>=>b.type==="heading" && b.level===2);
  const inviteIndex = page.body.findIndex(b=>b.type==="heading"&&b.text==="Papasakokite apie savo langus");
  const body = isContact && inviteIndex >= 0 ? page.body.slice(0,inviteIndex) : page.body;
  let headingIndex=0;
  return <main id="turinys">
    <div className={styles.innerIntro}><nav className={styles.breadcrumbs} aria-label="Puslapio kelias"><a href="/">Pradžia</a>{page.type==="guide" && pages.some(p=>p.slug==="gidai") && <><span aria-hidden="true">/</span><a href="/gidai">Gidai</a></>}<span aria-hidden="true">/</span><span aria-current="page">{isContact?"Užklausa":isIndex?"Gidai":page.slug==="privatumas"?"Privatumas":"Skaityti"}</span></nav><h1>{page.title}</h1><p>{page.description}</p></div>
    {isIndex ? <div className={styles.indexBody}><GuideLinks pages={pages} /><article className={styles.article}>{page.body.map((b,i)=><Block key={i} block={b} page={page} livePages={pages} />)}</article></div> :
    <div className={`${styles.readingGrid} ${isContact?styles.contactGrid:page.type!=="guide"?styles.simpleGrid:""}`}>
      {page.type==="guide" && <aside className={styles.contents}><nav aria-label="Šiame gide"><strong>Šiame gide</strong>{headings.map((h,i)=><a key={i} href={`#dalis-${i+1}`}>{h.text}</a>)}</nav></aside>}
      <article className={styles.article}>{body.map((b,i)=>b.type==="heading"&&b.level===2?<h2 id={`dalis-${++headingIndex}`} key={i}>{b.text}</h2>:<Block key={i} block={b} page={page} livePages={pages} media={page.media} />)}
        {!!page.externalLinks?.length && <section className={styles.sources}><h2>Šaltiniai ir kontekstas</h2><ul>{page.externalLinks.map(s=><li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}<span className={styles.srOnly}> (atsidaro naujame lange)</span></a><p>{s.reason}</p></li>)}</ul></section>}
      </article>
      {isContact && <section className={styles.formPanel} aria-labelledby="form-heading"><h2 id="form-heading">Papasakokite apie savo langus</h2><p>{textOf(section(page,"Papasakokite apie savo langus")[0])}</p><ContactForm pkg={pkg} privacy={privacy} /></section>}
    </div>}
    {!isIndex && <section className={styles.related} aria-label="Kitas naudingas žingsnis"><h2>Kitas naudingas žingsnis</h2><div>{page.links.map(l=>({page:pages.find(p=>p.id===l.targetPageId),label:l.label})).filter(l=>l.page).map(l=><a key={l.page!.id} href={nichePagePath(l.page!)}>{l.label}<Arrow diagonal /></a>)}</div></section>}
  </main>;
}
export function RoletaiklaipedojeSite({ pkg, page, livePages }: { pkg:NichePackage; page:NichePage; livePages:NichePage[] }) {
  return <div className={styles.site}>
    <a className={styles.skip} href="#turinys">Pereiti prie turinio</a>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:nicheJsonLd(pkg,page)}} />
    <Header pages={livePages} />
    {page.type==="home" ? <Home page={page} pages={livePages} /> : <Inner pkg={pkg} page={page} pages={livePages} />}
    <Footer pkg={pkg} pages={livePages} />
    <InterestTracking />
  </div>;
}
