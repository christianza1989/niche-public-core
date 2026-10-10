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
  return <div className={styles.prose}>{page.body.map((block, i) => skipIntro && i === 0 && block.type === "paragraph" ? null : <Block key={i} block={block} index={i} page={page} livePages={livePages} />)}</div>;
}
function Inquiry({ pkg }: { pkg: NichePackage }) {
  return <section id="kontaktai" className={styles.inquiry} aria-labelledby="inquiry-title">
    <div><p className={styles.kicker}>Jūsų pasirašymo procesas</p><h2 id="inquiry-title">Aptarkime tinkamą komplektą.</h2><p>Dokumento tipas, darbo vietų skaičius ir naudojama sistema padės pradėti atranką. Užklausa nėra užsakymas ar galutinė kaina.</p><a className={styles.email} href={`mailto:${pkg.site.contact.email}`}>{pkg.site.contact.email} ↗</a>{pkg.site.contact.phone && <p><a href={`tel:${pkg.site.contact.phone.replace(/[^+0-9]/g, "")}`}>{pkg.site.contact.phone}</a></p>}</div>
    <form action="/uzklausa" method="post" acceptCharset="utf-8" className={styles.form}>
      <label>Jūsų vardas<input name="name" autoComplete="name" minLength={2} maxLength={100} required /></label>
      <label>El. paštas<input name="email" type="email" autoComplete="email" maxLength={250} required /></label>
      <label>Ko reikia jūsų darbo vietai?<textarea name="message" rows={5} minLength={20} maxLength={3000} required aria-describedby="message-help" placeholder="Dokumento tipas, darbo vietų skaičius, naudojama programa…" /></label>
      <p id="message-help">Visi matomi laukai privalomi. Žinutė — bent 20 simbolių. Asmens dokumentų ir pasirašytų sutarčių nesiųskite.</p>
      <label className={styles.consent}><input name="consent" type="checkbox" value="yes" required /> Sutinku, kad šie duomenys būtų naudojami atsakyti į mano užklausą.</label>
      <p>Vardą, el. paštą ir žinutę naudojame užklausai apdoroti. <a href="/privatumas">Privatumo informacija</a>. Šia forma rinkodaros prenumerata nekuriama.</p>
      <div className={styles.honeypot} aria-hidden="true"><label>Palikite tuščią<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <button type="submit">Siųsti užklausą <span aria-hidden="true">↗</span></button>
    </form>
  </section>;
}
function Guides({ pages, limit }: { pages: NichePage[]; limit?: number }) {
  const guides = pages.filter(p => p.type === "guide").slice(0, limit);
  const cardSizes = guides.length === 4 ? "(max-width: 360px) 85px, (max-width: 760px) 110px, (max-width: 1050px) calc((100vw - 72px) / 2), (max-width: 1328px) calc((100vw - 88px) / 2), 620px" : "(max-width: 360px) 85px, (max-width: 760px) 110px, (max-width: 1050px) calc((100vw - 96px) / 3), (max-width: 1328px) calc((100vw - 128px) / 3), 400px";
  return <div className={`${styles.guides} ${guides.length === 4 ? styles.guidesFour : ""}`}>{guides.map((guide, i) => <article key={guide.id}><a className={styles.guideImage} href={nichePagePath(guide)} tabIndex={-1} aria-hidden="true"><Picture page={guide} sizes={cardSizes} /></a><div><p className={styles.kicker}>Gidas / {String(i + 1).padStart(2, "0")}</p><h3><a href={nichePagePath(guide)}>{guide.title}</a></h3><p>{guide.description}</p><a className={styles.textLink} href={nichePagePath(guide)}>Skaityti gidą <span aria-hidden="true">↗</span></a></div></article>)}</div>;
}
function Catalog({ pages }: { pages: NichePage[] }) {
  return <div className={styles.catalog}>{modelPages(pages).map((model, i) => <article key={model.id}><span className={styles.number}>{String(i + 1).padStart(2, "0")}</span><Picture page={model} /><div><h2><a href={nichePagePath(model)}>{model.title}</a></h2><p>{model.description}</p><dl>{model.body.find(b => b.type === "list")?.items.map((item, n) => { const colon = item.indexOf(":"); return <div key={n}><dt>{colon >= 0 ? item.slice(0, colon) : "Savybė"}</dt><dd>{colon >= 0 ? item.slice(colon + 1).trim() : item}</dd></div>; })}</dl><a className={styles.textLink} href={nichePagePath(model)}>Modelis ir komplektacija ↗</a></div></article>)}</div>;
}
function Sources({ page, livePages }: { page: NichePage; livePages: NichePage[] }) {
  const related = page.links.map(l => ({ ...l, page: livePages.find(p => p.id === l.targetPageId) })).filter(l => l.page);
  return <div className={styles.readingEnd}>{page.externalLinks?.length ? <section aria-labelledby="sources-title"><h2 id="sources-title">Šaltiniai ir patikros apimtis</h2><ul>{page.externalLinks.map(source => <li key={source.url}><a href={source.url} rel="noopener noreferrer">{source.label}</a><p>{source.reason}</p></li>)}</ul></section> : null}{related.length ? <section aria-labelledby="related-title"><h2 id="related-title">Kitas žingsnis</h2><ul>{related.map(l => <li key={l.targetPageId}><a href={nichePagePath(l.page!)}>{l.label} ↗</a></li>)}</ul></section> : null}</div>;
}
function Brand() { return <a className={styles.brand} href="/" title="Pradžia"><svg aria-hidden="true" viewBox="0 0 64 64"><path d="M10 39c7-3 15-23 12-25-5-3-12 32-5 32 6 0 17-27 13-27-3 0-6 23 0 21l11-9-4 9 17-5M10 51h44" /></svg><span>parašo{" "}<span>planšetės.</span></span></a>; }
export function ParasoplansetesSite({ pkg, page, livePages }: Props) {
  const isHome = page.type === "home", isGuide = page.type === "guide", isHub = page.slug === "gidai", isCatalog = page.slug === "paraso-plansetes";
  const intro = page.body[0]?.type === "paragraph" ? page.body[0].text : page.description;
  const nav = [["paraso-plansetes", "Modeliai"], ["programine-iranga", "Programinė įranga"], ["integracija", "Integracija"], ["gidai", "Gidai"]];
  return <div className={styles.shell}>
    <InterestTracking />
    <a className={styles.skip} href="#turinys">Pereiti prie turinio</a>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: nicheJsonLd(pkg, page) }} />
    <header className={styles.header}><Brand /><nav aria-label="Pagrindinė navigacija">{nav.map(([slug, label]) => livePages.some(p => p.slug === slug) ? <a key={slug} href={`/${slug}`} aria-current={page.slug === slug ? "page" : undefined}>{label}</a> : null)}</nav><a className={styles.headerAction} href={isHome || page.slug === "kontaktai" ? "#kontaktai" : "/kontaktai"}>Aptarti sprendimą ↗</a></header>
    <main id="turinys" tabIndex={-1}>
      {!isHome && <nav className={styles.crumbs} aria-label="Puslapio kelias" data-niche-breadcrumbs>{nicheBreadcrumbs(pkg, page, livePages).map((item: { name: string; path: string }, i: number, all: {name:string;path:string}[]) => <span key={item.path}>{i > 0 && <span aria-hidden="true"> / </span>}{i === all.length - 1 ? <span aria-current="page">{item.name}</span> : <a href={item.path}>{item.name}</a>}</span>)}</nav>}
      <section className={`${styles.hero} ${isHome ? styles.homeHero : ""} ${!isGuide && !isHome && page.media.length ? styles.productHero : ""}`}>
        <div><p className={styles.kicker}>{isHome ? "StepOver / sprendimai verslui" : isGuide ? "Pasirašymo gidas" : isHub ? "Praktiniai gidai" : "StepOver / Lietuvoje"}</p><h1>{page.title}</h1>{isGuide && <ArticleMeta pkg={pkg} page={page} pages={livePages} className={styles.meta} />}<p className={styles.lead}><LinkedText text={intro} page={page} livePages={livePages} /></p>{isHome && <div className={styles.actions}><a className={styles.primary} href="/paraso-plansetes">Palyginti modelius ↗</a><a className={styles.textLink} href="#kontaktai">Aptarti mano procesą ↗</a></div>}</div>
        {!isHome && !isGuide && page.media.length > 0 && <Picture page={page} eager />}
      </section>
      {isHome ? <>
        <section className={styles.deviceRail} aria-label="StepOver modelių pavyzdžiai">{page.media.map(asset => { const model = modelPages(livePages).find(p => p.media.some(m => m.id === asset.id)); return <div key={asset.id}><Picture page={page} asset={asset} eager />{model && <a href={nichePagePath(model)}>{model.title} ↗</a>}</div>; })}<p>Įrenginys + programinė įranga + jūsų dokumentų procesas</p></section>
        <section className={styles.homeContent}><Body page={page} livePages={livePages} skipIntro /><a className={styles.textLink} href="/integracija">Kaip įvertinti integraciją ↗</a></section>
        <section className={styles.guideSection}><div className={styles.sectionTitle}><p className={styles.kicker}>Prieš pasirenkant</p><h2>Klausimai, kurie padeda<br />pasirinkti sprendimą.</h2><a className={styles.textLink} href="/gidai">Visi gidai ↗</a></div><Guides pages={livePages} limit={4} /></section>
        <Inquiry pkg={pkg} />
      </> : <>
        {isGuide && <div className={styles.articlePicture}><Picture page={page} eager /></div>}
        <div className={isGuide ? styles.articleLayout : styles.contentLayout}>
          {isGuide && <aside className={styles.contents}><details open><summary>Šiame gide</summary><ol>{page.body.map((block, i) => block.type === "heading" && block.level === 2 ? <li key={i}><a href={`#section-${i}`}>{block.text}</a></li> : null)}</ol></details></aside>}
          <div><Body page={page} livePages={livePages} skipIntro /><Sources page={page} livePages={livePages} /></div>
        </div>
        {isHub && <section className={styles.guideSection}><Guides pages={livePages} /></section>}
        {isCatalog && <section className={styles.catalogSection} aria-label="Modelių palyginimas"><Catalog pages={livePages} /></section>}
        {page.slug === "kontaktai" || isCatalog ? <Inquiry pkg={pkg} /> : <div className={styles.nextAction}><p>Reikia komplekto jūsų dokumentams?</p><a className={styles.primary} href="/kontaktai">Aptarti sprendimą ↗</a></div>}
      </>}
    </main>
    {(voiceWidgetEnabled(pkg) || chatWidgetEnabled(pkg)) && <VoiceWidget title="StepOver AI konsultantas" chatAvailable={chatWidgetEnabled(pkg)} voiceAvailable={voiceWidgetEnabled(pkg)} />}
    <footer className={styles.footer}><div><Brand /><p>{nicheNetworkContact(pkg.siteId).operatorName}</p><a href={`mailto:${pkg.site.contact.email}`}>{pkg.site.contact.email}</a></div><nav aria-label="Papildoma navigacija">{livePages.filter(p => ["gidai", "kontaktai", "apie-projekta", "redakcija", "privatumas", "naudojimo-salygos"].includes(p.slug)).map(p => <a key={p.id} href={nichePagePath(p)}>{p.title}</a>)}</nav><p className={styles.attribution}>Mūsų verslas automatizuotas su <a href="https://verslomatika.lt/" rel="noopener noreferrer">verslomatika.lt</a></p></footer>
  </div>;
}
