/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages -- Sized WebP and native links keep the niche server rendered. */
import type { NicheBlock, NichePackage, NichePage, NicheMedia } from "@/lib/niche-sites";
import { nichePagePath } from "@/lib/niche-sites";
import { nicheJsonLd } from "@/lib/niche-seo";
import { nicheNetworkContact } from "@/lib/niche-network";
import { LinkedText } from "./linked-text";
import { InterestTracking } from "./interest-tracking";
import { ArticleMeta } from "./article-meta";
import { nicheBreadcrumbs } from "@/lib/niche-schema-core.mjs";
import { imageSrcSet } from "@/lib/niche-media.mjs";
import s from "./tractor-site.module.css";

type Group = { title: string; blocks: NicheBlock[] };
function groups(body: NicheBlock[], level = 2): Group[] {
  const result: Group[] = [];
  for (const block of body) {
    if (block.type === "heading" && block.level === level) result.push({ title: block.text, blocks: [] });
    else if (result.length) result.at(-1)!.blocks.push(block);
  }
  return result;
}
function blocks(body: NicheBlock[], page: NichePage, livePages: NichePage[]) {
  return body.map((b, i) => b.type === "paragraph" ? <Paragraph key={i} text={b.text} page={page} livePages={livePages} />
    : b.type === "list" ? page.slug === "gidas/traktoriaus-padangu-zymejimas" && b.items.length === 4 && b.items[0].startsWith("650 ") ? <MarkingFigure key={i} items={b.items} /> : <ul key={i}>{b.items.map(item => <li key={item}><LinkedText text={item} page={page} livePages={livePages} /></li>)}</ul>
    : b.type === "heading" ? b.level === 2 ? <h2 key={i} id={"skyrius-" + i}>{b.text}</h2> : <h3 key={i}>{b.text}</h3> : <ContentImage key={i} assetId={b.assetId} page={page} />);
}
function ContentImage({ assetId, page }: { assetId: string; page: NichePage }) {
  const asset = page.media.find(item => item.id === assetId);
  return asset ? <figure className={s.contentImage}><EditorialImage asset={asset} page={page} /></figure> : null;
}
// Responsive variants must depict the same image; a page's other illustrations
// cannot enter the hero srcset merely because they have another width.
function EditorialImage({ asset, page, sizes = "(max-width: 760px) calc(100vw - 44px), 560px", eager = false, decorative = false }: { asset: NicheMedia; page: NichePage; sizes?: string; eager?: boolean; decorative?: boolean }) {
  return <img src={asset.src} srcSet={imageSrcSet(page.media,asset)} sizes={sizes} alt={decorative ? "" : asset.alt} width={asset.width} height={asset.height} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : undefined} decoding="async" />;
}
function hasInquiry(page: NichePage) { return !["privatumas", "redakcija", "apie-projekta", "naudojimo-salygos"].includes(page.slug); }
function Paragraph({ text, page, livePages }: { text: string; page: NichePage; livePages: NichePage[] }) {
  const start = text.indexOf("„Ašis:"); const end = text.indexOf("“", start);
  if (page.slug !== "gidas/traktoriaus-padangu-zymejimas" || start < 0 || end < start) return <p><LinkedText text={text} page={page} livePages={livePages} /></p>;
  const fields = text.slice(start + 1, end).split("; ");
  return <><p>{text.slice(0, start).trim()}</p><dl className={s.worksheet}>{fields.map(field => { const separator = field.indexOf(":"); return <div key={field}><dt>{field.slice(0, separator)}</dt><dd>{field.slice(separator + 1).trim()}</dd></div>; })}</dl><p>{text.slice(end + 1).replace(/^\.\s*/, "")}</p><a className={s.textLink} href="#uzklausa">Aprašyti poreikį formoje <Arrow /></a></>;
}
function MarkingFigure({ items }: { items: string[] }) {
  const values = items.map(item => item.split(/\s/)[0]);
  return <figure className={s.markingFigure}><figcaption>Žymėjimo skaitymo pavyzdys: {values[0]}/{values[1]} {values[2]}{values[3]}</figcaption><dl>{items.map((item, i) => <div key={values[i]}><dt>{values[i]}{i === 0 && <span aria-hidden="true">/</span>}</dt><dd>{item.slice(values[i].length).replace(/^[\s—]+/, "")}</dd></div>)}</dl></figure>;
}
function Arrow({ down = false }: { down?: boolean }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true" className={down ? s.downArrow : undefined}><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function Brand() { return <a className={s.brand} href="/" aria-label="traktorių padangos. – pradžia">traktorių{" "}<span>padangos.</span></a>; }
function Header({ pages, page }: { pages: NichePage[]; page: NichePage }) {
  const has = (slug: string) => pages.some(page => page.slug === slug);
  const inquiryHref = hasInquiry(page) ? "#uzklausa" : "/#uzklausa";
  return <><a className={s.skip} href="#turinys">Pereiti prie turinio</a><header className={s.header}><div className={s.headerInner}><Brand />
    <nav className={s.nav} aria-label="Pagrindinė navigacija">{has("gidai") && <a href="/gidai">Pasirinkimo gidai</a>}<a href="/#zymejimas">Padangų žymėjimas</a>{has("duk") && <a href="/duk">Klausimai</a>}</nav>
    <a className={s.headerCta} href={inquiryHref}>Pateikti poreikį <Arrow /></a>
    <details className={s.mobileNav}><summary>Meniu <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.5" /></svg></summary><nav aria-label="Mobilioji navigacija"><a href="/">Pradžia</a>{has("gidai") && <a href="/gidai">Pasirinkimo gidai</a>}<a href="/#zymejimas">Žymėjimas</a>{has("duk") && <a href="/duk">Klausimai</a>}<a href={inquiryHref}>Pateikti poreikį</a></nav></details>
  </div></header></>;
}
function emailLink(pkg: NichePackage) { return "mailto:" + pkg.site.contact.email + "?subject=" + encodeURIComponent("[" + pkg.canonicalHost + "] Padangų poreikis"); }
function Footer({ pkg, pages }: { pkg: NichePackage; pages: NichePage[] }) {
  return <footer className={s.footer}><div className={s.footerGrid}><div><Brand /><p>{pkg.site.offer}</p></div><div><h2>Pasirinkimui</h2>{pages.filter(p => ["gidai", "duk"].includes(p.slug)).map(p => <a key={p.id} href={nichePagePath(p)}>{p.slug === "gidai" ? "Visi padangų gidai" : "Dažniausi klausimai"}</a>)}<a href="/#zymejimas">Žymėjimo pavyzdys</a></div><div><h2>{nicheNetworkContact(pkg.siteId).operatorName}</h2><a data-interest="email_click" href={emailLink(pkg)}>{pkg.site.contact.email}</a>{pages.filter(p => ["kontaktai", "apie-projekta", "redakcija", "naudojimo-salygos", "privatumas"].includes(p.slug)).map(p => <a href={nichePagePath(p)} key={p.id}>{p.slug === "kontaktai" ? "Kontaktai ir užklausa" : p.slug === "privatumas" ? "Privatumo informacija" : p.title}</a>)}</div></div><div className={s.footerBottom}><span>{pkg.canonicalHost}</span><span>Mūsų verslas automatizuotas su <a href="https://verslomatika.lt/">verslomatika.lt</a></span></div></footer>;
}
function Inquiry({ pkg, pages }: { pkg: NichePackage; pages: NichePage[] }) {
  return <section className={s.inquiry} id="uzklausa" aria-labelledby="inquiry-title"><div className={s.inquiryInner}><div className={s.inquiryCopy}><h2 id="inquiry-title">Kokių padangų<br />ieškote?</h2><p>Pradėkite nuo žymėjimo ant padangos ir traktoriaus modelio. Jei dalies duomenų nežinote, taip ir parašykite.</p><a data-interest="email_click" href={emailLink(pkg)}>{pkg.site.contact.email} <Arrow /></a><p className={s.inquiryNote}>Tai poreikio užklausa. Ji nepatvirtina pirkimo ar padangos tinkamumo. Kainos, tiekimas ir montavimas šia forma nežadami.</p></div>
    <form className={s.form} action="/uzklausa" method="post" acceptCharset="utf-8"><div><p className={s.recipient}>Užklausos operatorius: <strong>{nicheNetworkContact(pkg.siteId).operatorName}</strong></p><p className={s.formHint}>Visi matomi formos laukai privalomi.</p></div><div className={s.formRow}><label>Jūsų vardas<input name="name" minLength={2} maxLength={100} autoComplete="name" required /></label><label>El. paštas<input name="email" type="email" maxLength={250} autoComplete="email" required /></label></div><label>Traktorius, matmenys ir jūsų klausimas<textarea name="message" rows={5} minLength={20} maxLength={3000} required aria-describedby="message-help" /></label><p id="message-help" className={s.messageHelp}>Nurodykite traktoriaus modelį, padangos žymėjimą, ašį, darbus ir kiekį. Nežinomus duomenis pažymėkite. Parašykite bent 20 simbolių.</p><label className={s.consent}><input name="consent" type="checkbox" value="yes" required /><span>Sutinku, kad pateikti duomenys būtų naudojami mano užklausai apdoroti. {pages.some(p => p.slug === "privatumas") && <a href="/privatumas">Privatumo informacija</a>}.</span></label><div className={s.honeypot} aria-hidden="true"><label>Palikite tuščią<input name="website" tabIndex={-1} autoComplete="off" /></label></div><button type="submit">Siųsti poreikio užklausą <Arrow /></button><p className={s.formHint}>Ši forma neprenumeruoja reklaminių laiškų.</p></form>
  </div></section>;
}
function GuideList({ pages }: { pages: NichePage[] }) {
  return <div className={s.guideList}>{pages.map(p => <a key={p.id} href={nichePagePath(p)}>{p.media[0] && <EditorialImage asset={p.media[0]} page={p} sizes="(max-width: 760px) 110px, 150px" decorative />}<div><h3>{p.title}</h3><p>{p.description}</p><span className={s.guideRead}>Skaityti gidą <Arrow /></span></div></a>)}</div>;
}
export function TractorSite({ pkg, page, livePages }: { pkg: NichePackage; page: NichePage; livePages: NichePage[] }) {
  const home = page.type === "home"; const sections = groups(page.body); const hero = page.media[0];
  const guidePages = livePages.filter(p => p.type === "guide" && p.slug.startsWith("gidas/"));
  const find = (slug: string) => livePages.find(p => p.slug === slug);
  const questions = find("duk"); const markings = find("gidas/traktoriaus-padangu-zymejimas");
  const [first, sizes, use, faq] = sections;
  const intro = page.body.find(b => b.type === "paragraph");
  const workImage = page.body.find(b => b.type === "image");
  const targets = ["gidas/kaip-issirinkti-traktoriaus-padangas", "gidas/traktoriaus-padangu-zymejimas", "gidas/radialines-ar-diagonalines-traktoriaus-padangos"];
  const byId = new Map(livePages.map(p => [p.id, p]));
  const toc = page.body.flatMap((b, i) => b.type === "heading" && b.level === 2 ? [{ text: b.text, id: "skyrius-" + i }] : []);
  return <div className={s.site}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: nicheJsonLd(pkg, page) }} /><Header pages={livePages} page={page} /><main id="turinys">
    {home ? <><section className={s.hero}><div className={s.heroCopy}><h1>Traktorių<br />padangos<span>Pasirinkimas pagal jūsų techniką.</span></h1><p>{page.description}</p><div className={s.actions}><a className={s.primary} href="#uzklausa">Aprašyti padangų poreikį <Arrow /></a><a className={s.secondary} href="#pasirinkimas">Nuo ko pradėti <Arrow down /></a></div></div><figure className={s.heroVisual}>{hero && <EditorialImage asset={hero} page={page} sizes="(max-width: 760px) 60vw, 36vw" eager />}<span className={s.visualWord} aria-hidden="true">Darbui.</span></figure></section>
      <div className={s.introStrip}><strong>Vien dydžio neužtenka.</strong><p>{intro?.type === "paragraph" ? intro.text.replace(/^Vien dydžio neužtenka\.\s*/, "") : pkg.site.offer}</p></div>
      {first && <section className={s.section + " " + s.selection} id="pasirinkimas"><div><h2>{first.title}</h2>{blocks(first.blocks.filter(b => b.type === "paragraph").slice(0, 1), page, livePages)}</div><div className={s.selectionRows}>{groups(first.blocks, 3).map((group, i) => { const target = find(targets[i]); return <article key={group.title}>{target?.media[0] && <a className={s.selectionThumb} href={nichePagePath(target)} aria-label={target.title}><EditorialImage asset={target.media[0]} page={target} sizes="(max-width: 760px) calc(100vw - 44px), 180px" decorative /></a>}<div className={s.selectionCopy}><h3>{group.title}</h3>{blocks(group.blocks, page, livePages)}{target && <a href={nichePagePath(target)}>Plačiau gide <Arrow /></a>}</div></article>; })}</div></section>}
      {sizes && <section className={s.markings} id="zymejimas"><div className={s.markingsInner}><div><h2>{sizes.title}</h2>{blocks(sizes.blocks.filter(b => b.type === "paragraph"), page, livePages)}{markings && <a className={s.lightLink} href={nichePagePath(markings)}>Kaip skaityti padangos žymėjimą <Arrow /></a>}</div><div className={s.spec}>{sizes.blocks.filter(b => b.type === "list").map((b, i) => b.type === "list" && <MarkingFigure key={i} items={b.items} />)}<p className={s.specFoot}>Pavyzdys žymėjimui perskaityti. Jis nėra tinkamumo rekomendacija.</p></div></div></section>}
      {use && <section className={s.section + " " + s.work}><div className={s.workHead}><h2>{use.title}</h2><a className={s.textLink} href="#uzklausa">Aprašyti darbo sąlygas <Arrow /></a></div>{workImage?.type === "image" && <div className={s.workVisual}><ContentImage assetId={workImage.assetId} page={page} /></div>}<div className={s.workConditions}>{groups(use.blocks, 3).map(group => <article key={group.title}><h3>{group.title}</h3>{blocks(group.blocks, page, livePages)}</article>)}</div></section>}
      {faq && <section className={s.section + " " + s.faq}><div><h2>{faq.title}</h2>{questions && <a className={s.textLink} href={nichePagePath(questions)}>Dažniausi klausimai <Arrow /></a>}</div><div className={s.faqList}>{groups(faq.blocks, 3).map(group => <details key={group.title}><summary>{group.title}<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 9h14M9 2v14" stroke="currentColor" strokeWidth="1.5" /></svg></summary>{blocks(group.blocks, page, livePages)}</details>)}</div></section>}
    </> : <><section className={s.pageHero}><nav className={s.breadcrumbs} aria-label="Puslapio kelias">{nicheBreadcrumbs(pkg, page, livePages).map((item: { name: string; path: string }, i: number, trail: { name: string; path: string }[]) => <span key={item.path}>{i > 0 && <span aria-hidden="true"> / </span>}{i === trail.length - 1 ? <span aria-current="page">{item.name}</span> : <a href={item.path}>{item.name}</a>}</span>)}</nav><div className={page.type === "guide" && hero ? s.featureHeader : s.plainHeader}><div className={s.featureCopy}><h1>{page.title}</h1><p>{page.description}</p>{page.type === "guide" && <ArticleMeta pkg={pkg} page={page} pages={livePages} className={s.articleMeta} />}</div>{page.type === "guide" && hero && <figure className={s.featureVisual}><EditorialImage asset={hero} page={page} sizes="(max-width: 760px) calc(100vw - 44px), (max-width: 1100px) 45vw, 570px" eager /></figure>}</div></section>
      <div className={s.articleLayout}>{toc.length > 0 && <details className={s.mobileContents}><summary>Šiame {page.type === "guide" ? "gide" : "puslapyje"}</summary><nav aria-label="Mobilus puslapio turinys">{toc.map(item => <a href={"#" + item.id} key={item.id}>{item.text}</a>)}</nav></details>}<article className={s.article}>{blocks(page.body, page, livePages)}{page.slug === "gidai" && <GuideList pages={guidePages} />}{Boolean(page.externalLinks?.length) && <section className={s.sources}><h2>Šaltiniai ir tolesnis skaitymas</h2>{page.externalLinks?.map(link => <div key={link.url}><a href={link.url}>{link.label} <Arrow /></a><p>{link.reason}</p></div>)}</section>}</article><aside className={s.aside}>{toc.length > 0 && <nav aria-label="Šio puslapio turinys"><h2>Šiame puslapyje</h2>{toc.map(item => <a href={"#" + item.id} key={item.id}>{item.text}</a>)}</nav>}{hasInquiry(page) && <div className={s.asideNext}><h2>Turite konkretų poreikį?</h2><p>Aprašykite techniką, padangos žymėjimą ir savo klausimą.</p><a href="#uzklausa">Pateikti poreikį <Arrow /></a></div>}</aside></div>
      {page.slug !== "gidai" && page.links.length > 0 && <section className={s.section + " " + s.related}><h2>Susiję atsakymai</h2><div>{page.links.map(link => { const target = byId.get(link.targetPageId); return target && target.id !== page.id ? <a key={target.id} href={nichePagePath(target)}>{link.label}<Arrow /></a> : null; })}</div></section>}
    </>}
    {hasInquiry(page) && <Inquiry pkg={pkg} pages={livePages} />}
  </main><Footer pkg={pkg} pages={livePages} /><InterestTracking /></div>;
}
