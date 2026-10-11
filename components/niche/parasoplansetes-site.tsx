/* eslint-disable @next/next/no-html-link-for-pages, @next/next/no-img-element -- Native navigation and responsive approved WebP media. */
import { nichePagePath, type NicheBlock, type NicheMedia, type NichePage, type NichePackage } from "@/lib/niche-sites";
import { nicheJsonLd } from "@/lib/niche-seo";
import { nicheNetworkContact } from "@/lib/niche-network";
import { nicheBreadcrumbs } from "@/lib/niche-schema-core.mjs";
import { imageSrcSet, visibleImageCredit } from "@/lib/niche-media.mjs";
import { LinkedText } from "./linked-text";
import { ArticleMeta } from "./article-meta";
import { InterestTracking } from "./interest-tracking";
import { VoiceWidget } from "./voice-widget";
import { voiceWidgetEnabled, chatWidgetEnabled } from "@/lib/niche-voice";
import styles from "./parasoplansetes-site.module.css";
import homepageMedia from "@/config/parasoplansetes-homepage-media.json";
import { StepOverIcon, type StepOverIconName } from "./parasoplansetes-icons";

type Props = { pkg: NichePackage; page: NichePage; livePages: NichePage[] };
const modelPages = (pages: NichePage[]) => pages.filter(p => p.slug.startsWith("produktas/paraso-plansete-stepover-"));
function Arrow() { return <svg aria-hidden="true" className={styles.arrow} viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function DocumentIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5Zm0 0v5h5M9 12h6m-6 4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
const modelName = (page: NichePage) => page.title.replace(/^StepOver /, "");
const modelSpecs = (page: NichePage) => page.body.find(b => b.type === "list")?.items ?? [];
function Picture({ page, asset = page.media[0], eager = false, sizes }: { page: NichePage; asset?: NicheMedia; eager?: boolean; sizes?: string }) {
  if (!asset) return null;
  const documentary = asset.width <= 300;
  return <figure className={`${styles.picture} ${documentary ? styles.device : styles.illustration}`}>
    <img src={asset.src} srcSet={imageSrcSet(page.media, asset)} sizes={sizes ?? (documentary ? "(max-width: 360px) calc(100vw - 48px), 300px" : "(max-width: 760px) calc(100vw - 48px), 720px")} alt={asset.alt} width={asset.width} height={asset.height} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : "auto"} decoding="async" />
    {visibleImageCredit(asset) && <figcaption>{visibleImageCredit(asset)}</figcaption>}
  </figure>;
}
function Block({ block, index, page, livePages }: { block: NicheBlock; index: number; page: NichePage; livePages: NichePage[] }) {
  if (block.type === "heading") return block.level === 2 ? <h2 id={`section-${index}`}>{block.text}</h2> : <h3 id={`section-${index}`}>{block.text}</h3>;
  if (block.type === "paragraph") return <p><LinkedText text={block.text} page={page} livePages={livePages} /></p>;
  if (block.type === "list") return <ul>{block.items.map((item, i) => <li key={i}><LinkedText text={item} page={page} livePages={livePages} /></li>)}</ul>;
  const asset = page.media.find(a => a.id === block.assetId);
  return asset ? <Picture page={page} asset={asset} /> : null;
}
function Body({ page, livePages, skipIntro = false }: { page: NichePage; livePages: NichePage[]; skipIntro?: boolean }) {
  const sections: Array<Array<{ block: NicheBlock; index: number }>> = [];
  page.body.forEach((block, index) => {
    if (skipIntro && index === 0 && block.type === "paragraph") return;
    if (!sections.length || block.type === "heading" && block.level === 2) sections.push([]);
    sections[sections.length - 1].push({ block, index });
  });
  return <div className={styles.prose}>{sections.map((section, i) => <section key={i} className={styles.proseSection}>{section.map(({ block, index }) => <Block key={index} block={block} index={index} page={page} livePages={livePages} />)}</section>)}</div>;
}
function Inquiry({ pkg, homePage }: { pkg: NichePackage; homePage?: NichePage }) {
  return <section id="kontaktai" className={styles.inquiry} aria-labelledby="inquiry-title">
    <div className={styles.inquiryIntro}>{!homePage && <DocumentIcon />}<h2 id="inquiry-title">{homePage?.body[6]?.type === "heading" ? homePage.body[6].text : "Padedame išsirinkti parašo planšetę"}</h2><p>{homePage?.body[7]?.type === "paragraph" ? homePage.body[7].text : "Aprašykite savo situaciją: kokius dokumentus pasirašote, kiek darbo vietų reikia įrengti ir kokią programą naudojate. Gavę šią informaciją, patarsime dėl tinkamiausios įrangos ir programų. Kaina bei užsakymo sąlygos derinamos atskirai."}</p><a className={styles.email} href={`mailto:${pkg.site.contact.email}`}><StepOverIcon name="mail" />{pkg.site.contact.email} <Arrow /></a>{pkg.site.contact.phone && <p><a href={`tel:${pkg.site.contact.phone.replace(/[^+0-9]/g, "")}`}>{pkg.site.contact.phone}</a></p>}<div className={styles.inquiryChecklist}>{["Dokumentų rūšys", "Darbo vietų skaičius", "Naudojama sistema"].map(label => <span key={label}><StepOverIcon name="check" />{label}</span>)}</div></div>
    <form action="/uzklausa" method="post" acceptCharset="utf-8" className={styles.form}>
      <div className={styles.formRow}><label>Jūsų vardas<input name="name" autoComplete="name" minLength={2} maxLength={100} required /></label>
      <label>El. paštas<input name="email" type="email" autoComplete="email" maxLength={250} required /></label></div>
      <label>{"Kuo galime padėti?"}<textarea name="message" rows={5} minLength={20} maxLength={3000} required aria-describedby="message-help" placeholder="Pavyzdžiui: nuomos sutartis rengiame įmonės sistemoje, pasirašyti reikės dviejose aptarnavimo vietose." /></label>
      <p id="message-help">{"Visi laukai privalomi. Žinutėje turi būti bent 20 simbolių. Asmens dokumentų ar pasirašytų sutarčių siųsti nereikia."}</p>
      <label className={styles.consent}><input name="consent" type="checkbox" value="yes" required /> {"Sutinku, kad šie duomenys būtų naudojami atsakant į mano užklausą."}</label>
      <p>{"Vardą, el. pašto adresą ir žinutę naudosime tik tam, kad suprastume jūsų poreikį ir parengtume atsakymą."}{" "}<a href="/privatumas">Privatumo informacija</a>{". Užklausos pateikimas nėra reklaminių naujienlaiškių prenumerata."}</p>
      <div className={styles.honeypot} aria-hidden="true"><label>Palikite tuščią<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <button type="submit">Siųsti užklausą <Arrow /></button>
    </form>
  </section>;
}
function Guides({ pages, homePage }: { pages: NichePage[]; homePage?: NichePage }) {
  const guides = pages.filter(p => p.type === "guide").slice(0, homePage ? 4 : undefined);
  const cardSizes = "(max-width: 700px) calc(100vw - 48px), (max-width: 1100px) calc((100vw - 72px) / 2), 282px";
  const roles: Record<string, keyof typeof homepageMedia> = { "gidai/kaip-pasirinkti-paraso-plansete": "guide-device", "gidai/pdf-pasirasymas-plansete": "guide-pdf", "gidai/paraso-plansetes-integracija": "guide-integration", "gidai/terminalinis-serveris-paraso-plansete": "guide-terminal" };
  return <div className={styles.guides}>{guides.map(guide => <article key={guide.id}><a className={styles.guideImage} href={nichePagePath(guide)} tabIndex={-1} aria-hidden="true">{homePage && roles[guide.slug] ? <HomePhoto page={homePage} role={roles[guide.slug]} sizes={cardSizes} decorative /> : <Picture page={guide} sizes={cardSizes} />}</a><div><h3><a href={nichePagePath(guide)}>{guide.title}</a></h3><p>{guide.description}</p><a className={styles.textLink} href={nichePagePath(guide)}>Skaityti gidą <Arrow /></a></div></article>)}</div>;
}
function Catalog({ pages }: { pages: NichePage[] }) {
  return <div className={styles.catalog}>{modelPages(pages).map(model => <article key={model.id}><div className={styles.catalogImage}><Picture page={model} /></div><div><h2><a href={nichePagePath(model)}>{modelName(model)}</a></h2><p>{model.description}</p><dl>{modelSpecs(model).map((item, n) => { const colon = item.indexOf(":"); return <div key={n}><dt>{colon >= 0 ? item.slice(0, colon) : "Savybė"}</dt><dd>{colon >= 0 ? item.slice(colon + 1).trim() : item}</dd></div>; })}</dl><a className={styles.textLink} href={nichePagePath(model)}>Plačiau apie modelį <Arrow /></a></div></article>)}</div>;
}
function ModelRail({ page, pages }: { page: NichePage; pages: NichePage[] }) {
  return <section className={styles.modelSection}><div className={styles.sectionTitle}><div><h2>Palyginkite StepOver modelius</h2><p>{"Pasirinkite atsižvelgdami į dokumento tipą, ekrano dydį ir prijungimą prie savo sistemos."}</p></div><a className={styles.textLink} href="/paraso-plansetes">Visi modeliai <Arrow /></a></div><div className={styles.deviceRail}>{page.media.map(asset => { const model = modelPages(pages).find(p => p.media.some(m => m.id === asset.id)); return model ? <article key={asset.id}><Picture page={model} asset={asset} /><h3><a href={nichePagePath(model)}>{modelName(model)}</a></h3><p>{modelSpecs(model)[0]?.replace(/^Ekranas:\s*/, "")}</p><a className={styles.textLink} href={nichePagePath(model)}>Peržiūrėti modelį <Arrow /></a></article> : null; })}</div></section>;
}
function HomePhoto({ page, role, eager = false, sizes, decorative = false }: { page: NichePage; role: keyof typeof homepageMedia; eager?: boolean; sizes: string; decorative?: boolean }) {
  const asset = page.media.find(a => a.id === homepageMedia[role]);
  if (!asset) return null;
  return <img className={styles.homePhoto} src={asset.src} srcSet={imageSrcSet(page.media, asset)} sizes={sizes} width={asset.width} height={asset.height} alt={decorative ? "" : asset.alt} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : "auto"} decoding="async" />;
}
function DocumentFlow() {
  const steps: Array<[string, StepOverIconName]> = [["Dokumentas", "document"], ["Peržiūra", "eye"], ["Parašas", "pen"], ["Archyvas", "archive"]];
  return <ol className={styles.documentFlow} aria-label="Dokumento pasirašymo eiga">{steps.map(([label, icon], i) => <li key={label}><StepOverIcon name={icon} /><span>{label}</span>{i < 3 && <StepOverIcon name="arrow" className={styles.flowArrow} />}</li>)}</ol>;
}
function HomeHero({ page, livePages }: { page: NichePage; livePages: NichePage[] }) {
  const intro = page.body[0]?.type === "paragraph" ? page.body[0].text : page.description;
  return <section className={styles.photoHero} aria-labelledby="homepage-title"><HomePhoto page={page} role="hero" eager sizes="100vw" /><div className={styles.photoHeroInner}><div className={styles.photoHeroCopy}><h1 id="homepage-title">{page.title}</h1><p className={styles.lead}><LinkedText text={intro} page={page} livePages={livePages} /></p><div className={styles.actions}><a className={styles.primary} href="/paraso-plansetes">Palyginti modelius <Arrow /></a><a className={styles.textLink} href="#kontaktai">Parašykite mums <Arrow /></a></div><DocumentFlow /></div></div></section>;
}
function HomeContexts({ page, livePages }: { page: NichePage; livePages: NichePage[] }) {
  const scenes: Array<[keyof typeof homepageMedia, string]> = [["customer-desk", "Klientų aptarnavimas"], ["reception-desk", "Registratūros"], ["business-desk", "Įmonių padaliniai"]];
  return <section id="section-4" className={styles.contextSection} aria-labelledby="contexts-title"><div className={styles.sectionTitle}><h2 id="contexts-title">{page.body[4]?.type === "heading" && page.body[4].text}</h2><p>{page.body[5]?.type === "paragraph" && <LinkedText text={page.body[5].text} page={page} livePages={livePages} />}</p></div><div className={styles.contextPhotos}>{scenes.map(([role, title]) => <figure key={role}><HomePhoto page={page} role={role} sizes="(max-width: 700px) calc(100vw - 48px), (max-width: 1248px) calc((100vw - 96px) / 3), 384px" /><figcaption>{title}</figcaption></figure>)}</div><p className={styles.illustrativeNote}>{"Darbo situacijos iliustruotos dirbtinio intelekto sukurtais vaizdais."}</p></section>;
}
function HomeProcess({ page, livePages }: { page: NichePage; livePages: NichePage[] }) {
  const steps = page.body[3]?.type === "list" ? page.body[3].items : [];
  const titles = ["Dokumento peržiūra", "Pasirašymas", "Išsaugojimas ir kopija"];
  return <section className={styles.processSection} aria-labelledby="section-1"><div className={styles.processInner}><div className={styles.processCopy}><h2 id="section-1">{page.body[1]?.type === "heading" && page.body[1].text}</h2><p>{page.body[2]?.type === "paragraph" && <LinkedText text={page.body[2].text} page={page} livePages={livePages} />}</p><ol className={styles.processSteps}>{steps.map((text, i) => <li key={text}><span aria-hidden="true">{i + 1}</span><div><h3>{titles[i]}</h3><p><LinkedText text={text} page={page} livePages={livePages} /></p></div></li>)}</ol><a className={styles.primary} href="/integracija">Prijungimas prie jūsų sistemos <Arrow /></a></div><div className={styles.processPhoto}><HomePhoto page={page} role="process" sizes="(max-width: 700px) 100vw, 50vw" /></div></div></section>;
}
function Sources({ page, livePages }: { page: NichePage; livePages: NichePage[] }) {
  const related = page.links.map(l => ({ ...l, page: livePages.find(p => p.id === l.targetPageId) })).filter(l => l.page);
  return <div className={styles.readingEnd}>{page.externalLinks?.length ? <section aria-labelledby="sources-title"><h2 id="sources-title">Šaltiniai ir papildoma informacija</h2><ul>{page.externalLinks.map(source => <li key={source.url}><a href={source.url} rel="noopener noreferrer">{source.label}</a><p>{source.reason}</p></li>)}</ul></section> : null}{related.length ? <section aria-labelledby="related-title"><h2 id="related-title">Susijusi informacija</h2><ul>{related.map(l => <li key={l.targetPageId}><a href={nichePagePath(l.page!)}>{l.label} ↗</a></li>)}</ul></section> : null}</div>;
}
function Brand() {
  return <a className={styles.brand} href="/" aria-label="Parašo planšetės.lt – pradžia">
    <svg className={styles.brandLogo} width="1570" height="360" viewBox="120 295 1570 360" aria-hidden="true" focusable="false">
      <image href="/branding/parasoplansetes-logo-20261010.png" width="1774" height="887" />
    </svg>
  </a>;
}
type FooterLink = readonly [slug: string, label: string];
function FooterLinks({ pages, items }: { pages: NichePage[]; items: readonly FooterLink[] }) {
  return <ul>{items.map(([slug, label]) => {
    const target = pages.find(p => p.slug === slug);
    return target ? <li key={slug}><a href={nichePagePath(target)}>{label}</a></li> : null;
  })}</ul>;
}
function Footer({ pkg, livePages }: { pkg: NichePackage; livePages: NichePage[] }) {
  const operator = nicheNetworkContact(pkg.siteId).operatorName;
  const year = new Intl.DateTimeFormat("lt-LT", { year: "numeric", timeZone: pkg.site.timezone }).format(new Date());
  const groups: Array<{ id: string; title: string; links: FooterLink[] }> = [
    { id: "footer-solutions", title: "StepOver sprendimai", links: [
      ["paraso-plansetes", "Parašo planšečių modeliai"], ["programine-iranga", "Pasirašymo programos"],
      ["integracija", "Integracija į jūsų sistemas"], ["kainos", "Kainos ir diegimo biudžetas"],
      ["pasirasymo-procesai", "Dokumentų pasirašymo eiga"],
    ] },
    { id: "footer-guides", title: "Praktiniai gidai", links: [
      ["gidai", "Visi gidai"], ["gidai/kaip-pasirinkti-paraso-plansete", "Kaip išsirinkti parašo planšetę"],
      ["gidai/pdf-pasirasymas-plansete", "PDF dokumentų pasirašymas"],
      ["gidai/paraso-plansetes-integracija", "Pasiruošimas integracijai"],
      ["gidai/terminalinis-serveris-paraso-plansete", "Pasirašymas per RDP ir Citrix"],
      ["gidai/paraso-galiojimas", "Elektroninio parašo galiojimas"],
    ] },
    { id: "footer-about", title: "Informacija ir kontaktai", links: [
      ["apie-projekta", "Apie svetainę"], ["kontaktai", "Kontaktai ir konsultacijos"],
      ["redakcija", "Kaip rengiame turinį"],
    ] },
  ];
  return <footer className={styles.footerBand}><div className={styles.footer}>
    <div className={styles.footerMain}>
      <div className={styles.footerIdentity}><Brand /><p>Svetainę administruoja <strong>{operator}</strong>.</p>
        <a className={styles.footerContact} href={`mailto:${pkg.site.contact.email}`}>{pkg.site.contact.email}</a>
        {pkg.site.contact.phone && <a className={styles.footerContact} href={`tel:${pkg.site.contact.phone.replace(/[^+0-9]/g, "")}`}>{pkg.site.contact.phone}</a>}
      </div>
      {groups.filter(group => group.links.some(([slug]) => livePages.some(p => p.slug === slug))).map(group =>
        <nav key={group.id} aria-labelledby={group.id}><h2 id={group.id}>{group.title}</h2><FooterLinks pages={livePages} items={group.links} /></nav>)}
    </div>
    <div className={styles.footerBottom}><p>© {year} {operator}</p>
      <nav aria-label="Teisinė informacija"><FooterLinks pages={livePages} items={[["privatumas", "Privatumo politika"], ["naudojimo-salygos", "Naudojimo sąlygos"]]} /></nav>
      <p className={styles.attribution}>Mūsų verslas automatizuotas su <a href="https://verslomatika.lt/" rel="noopener noreferrer">verslomatika.lt</a></p>
    </div>
  </div></footer>;
}
export function ParasoplansetesSite({ pkg, page, livePages }: Props) {
  const isHome = page.type === "home", isGuide = page.type === "guide", isHub = page.slug === "gidai", isCatalog = page.slug === "paraso-plansetes";
  const intro = page.body[0]?.type === "paragraph" ? page.body[0].text : page.description;
  const nav = [["paraso-plansetes", "Modeliai"], ["programine-iranga", "Programinė įranga"], ["integracija", "Integracija"], ["gidai", "Gidai"]];
  const navigation = nav.map(([slug, label]) => livePages.some(p => p.slug === slug) ? <a key={slug} href={`/${slug}`} aria-current={page.slug === slug || slug === "paraso-plansetes" && page.slug.startsWith("produktas/") || slug === "gidai" && isGuide ? "page" : undefined}>{label}</a> : null);
  return <div className={`${styles.shell} ${isHome ? styles.photographicHome : ""}`}>
    <InterestTracking />
    <a className={styles.skip} href="#turinys">Pereiti prie turinio</a>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: nicheJsonLd(pkg, page) }} />
    {!isHome && <div className={styles.utility}><span>StepOver pasirašymo sprendimai verslui</span><a href={`mailto:${pkg.site.contact.email}`}>{pkg.site.contact.email}</a></div>}
    <header className={styles.header}><Brand /><nav className={styles.desktopNav} aria-label="Pagrindinė navigacija">{navigation}</nav><a className={styles.headerAction} href={isHome || page.slug === "kontaktai" ? "#kontaktai" : "/kontaktai"}>Susisiekite <Arrow /></a><details className={styles.mobileMenu}><summary>Meniu <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.7" /></svg></summary><nav aria-label="Mobilioji navigacija">{navigation}<a href="/kontaktai">Susisiekite <Arrow /></a></nav></details></header>
    <main id="turinys" tabIndex={-1}>
      {!isHome && <nav className={styles.crumbs} aria-label="Puslapio kelias" data-niche-breadcrumbs>{nicheBreadcrumbs(pkg, page, livePages).map((item: { name: string; path: string }, i: number, all: {name:string;path:string}[]) => <span key={item.path}>{i > 0 && <span aria-hidden="true"> / </span>}{i === all.length - 1 ? <span aria-current="page">{item.name}</span> : <a href={item.path}>{item.name}</a>}</span>)}</nav>}
      {isHome ? <HomeHero page={page} livePages={livePages} /> : <section className={`${styles.hero} ${!isGuide && page.media.length ? styles.productHero : ""}`}>
        <div><h1>{page.title}</h1>{isGuide && <ArticleMeta pkg={pkg} page={page} pages={livePages} className={styles.meta} />}<p className={styles.lead}><LinkedText text={intro} page={page} livePages={livePages} /></p>{isHome && <div className={styles.actions}><a className={styles.primary} href="/paraso-plansetes">Palyginti modelius <Arrow /></a><a className={styles.textLink} href="#kontaktai">Parašykite mums <Arrow /></a></div>}{page.slug.startsWith("produktas/") && <div className={styles.actions}><a className={styles.primary} href="/kontaktai">Teirautis dėl šio modelio <Arrow /></a><a className={styles.textLink} href="/paraso-plansetes">Palyginti modelius <Arrow /></a></div>}</div>
        {!isGuide && page.media.length > 0 && <div className={styles.productStage}><Picture page={page} eager /></div>}
      </section>}
      {isHome ? <>
        <HomeContexts page={page} livePages={livePages} />
        <div className={styles.modelBand}><ModelRail page={page} pages={livePages} /></div>
        <HomeProcess page={page} livePages={livePages} />
        <section className={styles.guideSection}><div className={styles.sectionTitle}><div><h2>Praktiniai gidai<br />jūsų darbo vietai</h2></div><a className={styles.textLink} href="/gidai">Visi gidai <Arrow /></a></div><Guides pages={livePages} homePage={page} /></section>
        <div className={styles.homeRelated}><div className={styles.prose}>{page.body.slice(8).map((block, index) => <Block key={index} block={block} index={index + 8} page={page} livePages={livePages} />)}</div><Sources page={page} livePages={livePages} /></div>
        <div className={styles.inquiryBand}><Inquiry pkg={pkg} homePage={page} /></div>
      </> : <>
        {isGuide && <div className={styles.articlePicture}><Picture page={page} eager /></div>}
        {isCatalog && <section className={styles.catalogSection} aria-label="Modelių palyginimas"><Catalog pages={livePages} /></section>}
        {page.slug === "kontaktai" && <Inquiry pkg={pkg} />}
        <div className={isGuide ? styles.articleLayout : styles.contentLayout}>
          {isGuide && <aside className={styles.contents}><details open><summary>Šiame gide</summary><ol>{page.body.map((block, i) => block.type === "heading" && block.level === 2 ? <li key={i}><a href={`#section-${i}`}>{block.text}</a></li> : null)}</ol></details></aside>}
          <div><Body page={page} livePages={livePages} skipIntro /><Sources page={page} livePages={livePages} /></div>
        </div>
        {isHub && <section className={styles.guideSection}><Guides pages={livePages} /></section>}
        {isCatalog ? <Inquiry pkg={pkg} /> : page.slug !== "kontaktai" && <div className={styles.nextAction}><p>Norite aptarti savo įmonės poreikį?</p><a className={styles.primary} href="/kontaktai">Susisiekite <Arrow /></a></div>}
      </>}
    </main>
    {(voiceWidgetEnabled(pkg) || chatWidgetEnabled(pkg)) && <VoiceWidget title="StepOver DI konsultantas" appearance="stepover" chatAvailable={chatWidgetEnabled(pkg)} voiceAvailable={voiceWidgetEnabled(pkg)} />}
    <Footer pkg={pkg} livePages={livePages} />
  </div>;
}
