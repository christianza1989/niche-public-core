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
function Inquiry({ pkg }: { pkg: NichePackage }) {
  return <section id="kontaktai" className={styles.inquiry} aria-labelledby="inquiry-title">
    <div className={styles.inquiryIntro}><DocumentIcon /><h2 id="inquiry-title">Aptarkime tinkamą komplektą.</h2><p>Dokumento tipas, darbo vietų skaičius ir naudojama sistema padės pradėti atranką. Užklausa nėra užsakymas ar galutinė kaina.</p><a className={styles.email} href={`mailto:${pkg.site.contact.email}`}>{pkg.site.contact.email} <Arrow /></a>{pkg.site.contact.phone && <p><a href={`tel:${pkg.site.contact.phone.replace(/[^+0-9]/g, "")}`}>{pkg.site.contact.phone}</a></p>}<div className={styles.inquiryChecklist}><span>Dokumento tipas</span><span>Darbo vietų skaičius</span><span>Naudojama sistema</span></div></div>
    <form action="/uzklausa" method="post" acceptCharset="utf-8" className={styles.form}>
      <div className={styles.formRow}><label>Jūsų vardas<input name="name" autoComplete="name" minLength={2} maxLength={100} required /></label>
      <label>El. paštas<input name="email" type="email" autoComplete="email" maxLength={250} required /></label></div>
      <label>Ko reikia jūsų darbo vietai?<textarea name="message" rows={5} minLength={20} maxLength={3000} required aria-describedby="message-help" placeholder="Dokumento tipas, darbo vietų skaičius, naudojama programa…" /></label>
      <p id="message-help">Visi matomi laukai privalomi. Žinutė — bent 20 simbolių. Asmens dokumentų ir pasirašytų sutarčių nesiųskite.</p>
      <label className={styles.consent}><input name="consent" type="checkbox" value="yes" required /> Sutinku, kad šie duomenys būtų naudojami atsakyti į mano užklausą.</label>
      <p>Vardą, el. paštą ir žinutę naudojame užklausai apdoroti. <a href="/privatumas">Privatumo informacija</a>. Šia forma rinkodaros prenumerata nekuriama.</p>
      <div className={styles.honeypot} aria-hidden="true"><label>Palikite tuščią<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <button type="submit">Siųsti užklausą <Arrow /></button>
    </form>
  </section>;
}
function Guides({ pages }: { pages: NichePage[] }) {
  const guides = pages.filter(p => p.type === "guide");
  const cardSizes = "(max-width: 700px) calc(100vw - 48px), (max-width: 1100px) calc((100vw - 72px) / 2), 282px";
  return <div className={styles.guides}>{guides.map(guide => <article key={guide.id}><a className={styles.guideImage} href={nichePagePath(guide)} tabIndex={-1} aria-hidden="true"><Picture page={guide} sizes={cardSizes} /></a><div><h3><a href={nichePagePath(guide)}>{guide.title}</a></h3><p>{guide.description}</p><a className={styles.textLink} href={nichePagePath(guide)}>Skaityti gidą <Arrow /></a></div></article>)}</div>;
}
function Catalog({ pages }: { pages: NichePage[] }) {
  return <div className={styles.catalog}>{modelPages(pages).map(model => <article key={model.id}><div className={styles.catalogImage}><Picture page={model} /></div><div><h2><a href={nichePagePath(model)}>{modelName(model)}</a></h2><p>{model.description}</p><dl>{modelSpecs(model).map((item, n) => { const colon = item.indexOf(":"); return <div key={n}><dt>{colon >= 0 ? item.slice(0, colon) : "Savybė"}</dt><dd>{colon >= 0 ? item.slice(colon + 1).trim() : item}</dd></div>; })}</dl><a className={styles.textLink} href={nichePagePath(model)}>Modelis ir komplektacija <Arrow /></a></div></article>)}</div>;
}
function ModelRail({ page, pages }: { page: NichePage; pages: NichePage[] }) {
  return <section className={styles.modelSection}><div className={styles.sectionTitle}><div><h2>Ekranas jūsų darbo vietai.</h2><p>Palyginkite modelį ir jam reikalingą programinį kelią.</p></div><a className={styles.textLink} href="/paraso-plansetes">Visi modeliai <Arrow /></a></div><div className={styles.deviceRail}>{page.media.map(asset => { const model = modelPages(pages).find(p => p.media.some(m => m.id === asset.id)); return model ? <article key={asset.id}><Picture page={model} asset={asset} /><h3><a href={nichePagePath(model)}>{modelName(model)}</a></h3><p>{modelSpecs(model)[0]?.replace(/^Ekranas:\s*/, "")}</p><a className={styles.textLink} href={nichePagePath(model)}>Peržiūrėti modelį <Arrow /></a></article> : null; })}</div></section>;
}
function Workbench({ pages }: { pages: NichePage[] }) {
  const model = modelPages(pages).find(p => p.slug.endsWith("durasign-pad-5-0"));
  return <div className={styles.workbench}><div className={styles.workbenchTop}><DocumentIcon /><span>Jūsų dokumentų procesas</span></div><ol className={styles.workflow}><li>Dokumentas</li><li>Peržiūra</li><li>Parašas</li><li>Archyvas</li></ol>{model && <><div className={styles.featuredDevice}><Picture page={model} eager /></div><div className={styles.workbenchBottom}><span>{modelName(model)}</span><a href={nichePagePath(model)} aria-label={`Peržiūrėti ${modelName(model)}`}><Arrow /></a></div></>}</div>;
}
function Sources({ page, livePages }: { page: NichePage; livePages: NichePage[] }) {
  const related = page.links.map(l => ({ ...l, page: livePages.find(p => p.id === l.targetPageId) })).filter(l => l.page);
  return <div className={styles.readingEnd}>{page.externalLinks?.length ? <section aria-labelledby="sources-title"><h2 id="sources-title">Šaltiniai ir patikros apimtis</h2><ul>{page.externalLinks.map(source => <li key={source.url}><a href={source.url} rel="noopener noreferrer">{source.label}</a><p>{source.reason}</p></li>)}</ul></section> : null}{related.length ? <section aria-labelledby="related-title"><h2 id="related-title">Kitas žingsnis</h2><ul>{related.map(l => <li key={l.targetPageId}><a href={nichePagePath(l.page!)}>{l.label} ↗</a></li>)}</ul></section> : null}</div>;
}
function Brand() { return <a className={styles.brand} href="/" title="Pradžia"><svg aria-hidden="true" viewBox="0 0 64 64"><path d="M10 39c7-3 15-23 12-25-5-3-12 32-5 32 6 0 17-27 13-27-3 0-6 23 0 21l11-9-4 9 17-5M10 51h44" /></svg><span>parašo planšetės<span>StepOver sprendimai</span></span></a>; }
export function ParasoplansetesSite({ pkg, page, livePages }: Props) {
  const isHome = page.type === "home", isGuide = page.type === "guide", isHub = page.slug === "gidai", isCatalog = page.slug === "paraso-plansetes";
  const intro = page.body[0]?.type === "paragraph" ? page.body[0].text : page.description;
  const nav = [["paraso-plansetes", "Modeliai"], ["programine-iranga", "Programinė įranga"], ["integracija", "Integracija"], ["gidai", "Gidai"]];
  const navigation = nav.map(([slug, label]) => livePages.some(p => p.slug === slug) ? <a key={slug} href={`/${slug}`} aria-current={page.slug === slug || slug === "paraso-plansetes" && page.slug.startsWith("produktas/") || slug === "gidai" && isGuide ? "page" : undefined}>{label}</a> : null);
  return <div className={styles.shell}>
    <InterestTracking />
    <a className={styles.skip} href="#turinys">Pereiti prie turinio</a>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: nicheJsonLd(pkg, page) }} />
    <div className={styles.utility}><span>StepOver pasirašymo sprendimai verslui</span><a href={`mailto:${pkg.site.contact.email}`}>{pkg.site.contact.email}</a></div>
    <header className={styles.header}><Brand /><nav className={styles.desktopNav} aria-label="Pagrindinė navigacija">{navigation}</nav><a className={styles.headerAction} href={isHome || page.slug === "kontaktai" ? "#kontaktai" : "/kontaktai"}>Aptarti sprendimą <Arrow /></a><details className={styles.mobileMenu}><summary>Meniu <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.7" /></svg></summary><nav aria-label="Mobilioji navigacija">{navigation}<a href="/kontaktai">Aptarti sprendimą <Arrow /></a></nav></details></header>
    <main id="turinys" tabIndex={-1}>
      {!isHome && <nav className={styles.crumbs} aria-label="Puslapio kelias" data-niche-breadcrumbs>{nicheBreadcrumbs(pkg, page, livePages).map((item: { name: string; path: string }, i: number, all: {name:string;path:string}[]) => <span key={item.path}>{i > 0 && <span aria-hidden="true"> / </span>}{i === all.length - 1 ? <span aria-current="page">{item.name}</span> : <a href={item.path}>{item.name}</a>}</span>)}</nav>}
      <section className={`${styles.hero} ${isHome ? styles.homeHero : ""} ${!isGuide && !isHome && page.media.length ? styles.productHero : ""}`}>
        <div><h1>{page.title}</h1>{isGuide && <ArticleMeta pkg={pkg} page={page} pages={livePages} className={styles.meta} />}<p className={styles.lead}><LinkedText text={intro} page={page} livePages={livePages} /></p>{isHome && <div className={styles.actions}><a className={styles.primary} href="/paraso-plansetes">Palyginti modelius <Arrow /></a><a className={styles.textLink} href="#kontaktai">Aptarti mano procesą <Arrow /></a></div>}{page.slug.startsWith("produktas/") && <div className={styles.actions}><a className={styles.primary} href="/kontaktai">Aptarti šį modelį <Arrow /></a><a className={styles.textLink} href="/paraso-plansetes">Palyginti modelius <Arrow /></a></div>}</div>
        {isHome ? <Workbench pages={livePages} /> : !isGuide && page.media.length > 0 && <div className={styles.productStage}><Picture page={page} eager /></div>}
      </section>
      {isHome ? <>
        <div className={styles.solutionNav}><a href="/paraso-plansetes"><span>Įrenginiai</span>Pasirinkite ekraną <Arrow /></a><a href="/programine-iranga"><span>Programinė įranga</span>Suderinkite dokumento kelią <Arrow /></a><a href="/integracija"><span>Integracija</span>Įvertinkite jūsų sistemą <Arrow /></a></div>
        <ModelRail page={page} pages={livePages} />
        <section className={styles.homeContent}><Body page={page} livePages={livePages} skipIntro /><a className={styles.textLink} href="/integracija">Kaip įvertinti integraciją <Arrow /></a></section>
        <section className={styles.guideSection}><div className={styles.sectionTitle}><div><h2>Aiškesnis pasirinkimas<br />prasideda nuo klausimų.</h2></div><a className={styles.textLink} href="/gidai">Visi gidai <Arrow /></a></div><Guides pages={livePages} /></section>
        <Inquiry pkg={pkg} />
      </> : <>
        {isGuide && <div className={styles.articlePicture}><Picture page={page} eager /></div>}
        {isCatalog && <section className={styles.catalogSection} aria-label="Modelių palyginimas"><Catalog pages={livePages} /></section>}
        {page.slug === "kontaktai" && <Inquiry pkg={pkg} />}
        <div className={isGuide ? styles.articleLayout : styles.contentLayout}>
          {isGuide && <aside className={styles.contents}><details open><summary>Šiame gide</summary><ol>{page.body.map((block, i) => block.type === "heading" && block.level === 2 ? <li key={i}><a href={`#section-${i}`}>{block.text}</a></li> : null)}</ol></details></aside>}
          <div><Body page={page} livePages={livePages} skipIntro /><Sources page={page} livePages={livePages} /></div>
        </div>
        {isHub && <section className={styles.guideSection}><Guides pages={livePages} /></section>}
        {isCatalog ? <Inquiry pkg={pkg} /> : page.slug !== "kontaktai" && <div className={styles.nextAction}><p>Reikia komplekto jūsų dokumentams?</p><a className={styles.primary} href="/kontaktai">Aptarti sprendimą <Arrow /></a></div>}
      </>}
    </main>
    {(voiceWidgetEnabled(pkg) || chatWidgetEnabled(pkg)) && <VoiceWidget title="StepOver AI konsultantas" appearance="stepover" chatAvailable={chatWidgetEnabled(pkg)} voiceAvailable={voiceWidgetEnabled(pkg)} />}
    <footer className={styles.footer}><div><Brand /><p>{nicheNetworkContact(pkg.siteId).operatorName}</p><a href={`mailto:${pkg.site.contact.email}`}>{pkg.site.contact.email}</a></div><nav aria-label="Papildoma navigacija">{livePages.filter(p => ["gidai", "kontaktai", "apie-projekta", "redakcija", "privatumas", "naudojimo-salygos"].includes(p.slug)).map(p => <a key={p.id} href={nichePagePath(p)}>{p.title}</a>)}</nav><p className={styles.attribution}>Mūsų verslas automatizuotas su <a href="https://verslomatika.lt/" rel="noopener noreferrer">verslomatika.lt</a></p></footer>
  </div>;
}
