import type { ContentPackageV2, ProjectedContentPageV2 } from "@/lib/content-model-v2";
import { giftArticles, giftAuthors, giftAuthorPage, giftDate, giftFeaturedImage, giftFilteredArticles, giftPath, giftTopics } from "@/lib/gift-content";
import { giftJsonLd, giftSchemas } from "@/lib/gift-seo";
import { GiftImage, GiftRichContent } from "./rich-content";
import { GiftStyles } from "./gift-styles";
import { GiftContactForm } from "./contact-form";
import { InterestTracking } from "@/components/niche/interest-tracking";

type Props = { pkg: ContentPackageV2; page: ProjectedContentPageV2; livePages: ProjectedContentPageV2[]; topic?: string };
const footerLabels: Record<string, string> = { apie: "Apie projektą", autoriai: "Redakcija", "redakcine-politika": "Redakcinė politika", kontaktai: "Kontaktai", privatumas: "Privatumas", slapukai: "Slapukai", "partneriu-nuorodu-atskleidimas": "Komerciniai ryšiai", taisykles: "Naudojimo taisyklės" };

function PageLink({ pages, slug, label }: { pages: ProjectedContentPageV2[]; slug: string; label: string }) {
  const target = pages.find(page => page.slug === slug);
  return target ? <a href={giftPath(target)}>{label}</a> : null;
}
function Header({ pkg, page, livePages }: Props) {
  const home = livePages.find(item => item.type === "home");
  const target = page.editorial.commerceTargets[0];
  return <header className="site-header home-header"><div className="container header-inner">
    {home ? <a href={giftPath(home)} className="brand-mark" aria-label={`${pkg.site.name} — pradžia`}><span className="brand-dot" aria-hidden="true" />{pkg.site.name}</a> : <span className="brand-mark">{pkg.site.name}</span>}
    <nav className="main-nav" aria-label="Pagrindinė navigacija"><PageLink pages={livePages} slug="straipsniai" label="Dovanų gidai" />{page.type === "home" && <a href="#kategorijos">Kategorijos</a>}<PageLink pages={livePages} slug="apie" label="Apie projektą" /><PageLink pages={livePages} slug="kontaktai" label="Kontaktai" /></nav>
    {target && <a className="header-cta" href={target.url}>Apie rinkinį <span aria-hidden="true">↗</span></a>}
  </div></header>;
}
function Footer({ pkg, livePages }: Props) {
  return <footer className="site-footer"><div className="container footer-grid"><div><span className="brand-mark"><span className="brand-dot" aria-hidden="true" />{pkg.site.name}</span><p className="footer-note">Dovanų gidai, kurie padeda pasirinkti apgalvotai.</p><p className="footer-note">{pkg.site.operatorName}</p><p className="footer-note">Mūsų verslas automatizuotas su verslomatika.lt</p></div><nav className="footer-links" aria-label="Svetainės informacija">{Object.entries(footerLabels).map(([slug, label]) => <PageLink key={slug} pages={livePages} slug={slug} label={label} />)}</nav></div></footer>;
}
function Card({ page }: { page: ProjectedContentPageV2 }) {
  const image = giftFeaturedImage(page);
  return <article className="home-latest-card">{image && <div className="home-latest-image"><GiftImage asset={image} media={page.media} sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1200px) 30vw, 380px" /></div>}<div className="home-latest-body"><p className="home-kicker">{page.editorial.category} · {page.editorial.readingMinutes} min.</p><h3><a href={giftPath(page)}>{page.title}</a></h3><p>{page.description}</p><a className="home-inline-link" href={giftPath(page)}>Skaityti gidą <span aria-hidden="true">↗</span></a></div></article>;
}
function Recommendation({ page }: { page: ProjectedContentPageV2 }) {
  if (!page.editorial.productRecommendation) return null;
  return page.editorial.commerceTargets.map(target => <aside className="product-callout" key={target.id}><div><span className="callout-kicker">Komercinė rekomendacija</span><strong>{target.label}</strong><span>{target.relationship}</span></div><a className="callout-button" href={target.url}>Peržiūrėti informaciją ↗</a></aside>);
}
function Home(props: Props) {
  const { pkg, page, livePages } = props;
  const articles = giftArticles(livePages);
  const categories = giftTopics(pkg, livePages);
  const index = livePages.find(item => item.slug === "straipsniai");
  const featured = articles.find(item => item.id === "lt-hand-casting-guide") ?? articles[0];
  const seasonal = articles.filter(item => item.id.startsWith("lt-christmas-")).slice(0, 6);
  const quick = [...new Map([articles.find(item => item.id === "lt-christmas-hub-2026"), articles.find(item => item.id === "lt-christmas-man"), featured].filter(item => item !== undefined).map(item => [item.id, item])).values()];
  const latest = articles.filter(item => item.id !== featured?.id).slice(0, 3);
  const hero = giftFeaturedImage(page);
  const seasonalImage = seasonal.length ? giftFeaturedImage(seasonal[0]) : undefined;
  const editorialImage = page.body.find(block => block.type === "image");
  const editorialAsset = editorialImage?.type === "image" ? page.media.find(item => item.id === editorialImage.assetId) : undefined;
  return <>
    <section className="home-hero" aria-labelledby="home-title"><div className="container home-hero-grid"><div className="home-hero-copy"><p className="home-kicker">Dovanų gidai su prasme</p><h1 id="home-title">{page.title}</h1><p>{page.description}</p><div className="home-hero-actions">{index && seasonal.length > 0 && <a className="button button-primary" href={`${giftPath(index)}?tema=kaledoms`}>Kalėdinės dovanos ↗</a>}<a className={seasonal.length ? "home-inline-link" : "button button-primary"} href="#kategorijos">Rinktis pagal kategoriją ↓</a></div><p className="home-hero-note">Pagal žmogų · progą · biudžetą</p></div>{hero && <figure className="home-hero-media"><GiftImage asset={hero} media={page.media} priority sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1200px) 50vw, 620px" />{hero.credit && <figcaption>{hero.credit}</figcaption>}</figure>}</div></section>
    {quick.length > 0 && <section className="container home-quick" aria-labelledby="quick-heading"><div className="home-section-heading compact"><div><p className="home-kicker">Greita pradžia</p><h2 id="quick-heading">Nuo ko pradėti?</h2></div></div><div className="home-quick-grid">{quick.map((article, i) => <a className="home-quick-card" href={giftPath(article)} key={article.id}><span className="home-quick-index">0{i + 1}</span><span className="home-quick-title">{article.title}</span><span className="home-quick-arrow" aria-hidden="true">↗</span></a>)}</div></section>}
    <section id="kategorijos" className="container home-categories" aria-labelledby="categories-heading"><div className="home-section-heading"><div><p className="home-kicker">Pagal žmogų ir progą</p><h2 id="categories-heading">Ieškokite savo krypties</h2></div><p>Kai žinote, kam dovanojate, tinkamą idėją rasti paprasčiau.</p></div><div className="home-category-grid">{index && categories.filter(item => item.available).map((category, i) => <a className={`home-category-card home-category-${category.tone}`} href={`${giftPath(index)}?tema=${encodeURIComponent(category.slug)}`} key={category.slug}><span className="home-category-index">{String(i + 1).padStart(2, "0")}</span><span className="home-category-title">{category.label}</span><span className="home-category-desc">{category.description}</span><span className="home-category-arrow" aria-hidden="true">↗</span></a>)}</div>{categories.some(item => !item.available) && <div className="home-coming-topics"><span>Dar ruošiame gidus</span><p>{categories.filter(item => !item.available).map(item => item.label).join(" · ")}</p></div>}</section>
    {seasonal.length > 0 && <section id="kaledos" className="home-seasonal" aria-labelledby="seasonal-heading"><div className="container home-seasonal-grid">{seasonalImage && <div className="home-seasonal-media"><GiftImage asset={seasonalImage} media={seasonal[0].media} sizes="(max-width: 760px) calc(100vw - 40px), 580px" /></div>}<div className="home-seasonal-copy"><p className="home-kicker">Šventėms</p><h2 id="seasonal-heading">Kalėdoms rinkitės ramiai.</h2><div className="home-seasonal-links">{seasonal.map(article => <a href={giftPath(article)} key={article.id}>{article.title}<span aria-hidden="true">↗</span></a>)}</div></div></div></section>}
    {featured && <section className="container home-feature" aria-labelledby="featured-heading"><div className="home-section-heading"><div><p className="home-kicker">Nuo ko pradėti</p><h2 id="featured-heading">Gidas, nuo kurio verta pradėti</h2></div>{index && <a className="home-inline-link" href={giftPath(index)}>Visi straipsniai ↗</a>}</div><article className="home-feature-card">{giftFeaturedImage(featured) && <div className="home-feature-media"><GiftImage asset={giftFeaturedImage(featured)!} media={featured.media} sizes="(max-width: 760px) calc(100vw - 40px), 580px" /></div>}<div className="home-feature-copy"><p className="home-kicker">{featured.editorial.category} · {featured.editorial.readingMinutes} min.</p><h3><a href={giftPath(featured)}>{featured.title}</a></h3><p>{featured.description}</p><a className="button button-dark" href={giftPath(featured)}>Skaityti gidą ↗</a></div></article></section>}
    {latest.length > 0 && <section className="container home-latest" aria-labelledby="latest-heading"><div className="home-section-heading"><div><p className="home-kicker">Dovanų idėjos</p><h2 id="latest-heading">Daugiau idėjų, kurias verta apsvarstyti</h2></div></div><div className="home-latest-grid">{latest.map(article => <Card page={article} key={article.id} />)}</div></section>}
    <section className="home-editorial" aria-labelledby="editorial-heading"><div className="container home-editorial-grid"><div className="home-editorial-copy"><p className="home-kicker">Kaip atrenkame</p><h2 id="editorial-heading">Gidai, kuriuos verta perskaityti prieš perkant.</h2><GiftRichContent body={page.body.filter(block => block.type !== "image")} media={page.media} /><PageLink pages={livePages} slug="redakcine-politika" label="Skaityti redakcinę politiką →" /></div>{editorialAsset && <div className="home-editorial-media"><GiftImage asset={editorialAsset} media={page.media} sizes="(max-width: 760px) calc(100vw - 40px), 580px" /></div>}</div></section>
    <section className="container"><Recommendation page={page} /></section>
  </>;
}
function Article({ pkg, page, livePages }: Props) {
  const image = giftFeaturedImage(page);
  const related = page.editorial.relatedPageIds.flatMap(id => livePages.find(item => item.id === id) ?? []).filter(item => item.id !== page.id);
  const date = (label: string, value: string | null) => value ? <span>{label} <time dateTime={value}>{giftDate(value, pkg.locale, pkg.site.timezone)}</time></span> : null;
  return <article className="article-card"><nav className="breadcrumbs" aria-label="Puslapio vieta"><PageLink pages={livePages} slug="" label="Pradžia" /><span aria-hidden="true">/</span><PageLink pages={livePages} slug="straipsniai" label="Dovanų gidai" /><span aria-hidden="true">/</span><span aria-current="page">{page.title}</span></nav><p className="eyebrow">{page.editorial.category} · {page.editorial.readingMinutes} min.</p><h1>{page.title}</h1><p className="article-lead">{page.description}</p><div className="article-meta">{page.editorial.authors.map(author => { const profile = giftAuthorPage(author, livePages); return profile ? <a className="author-chip" key={author.id} href={giftPath(profile)}>{author.name}</a> : <span className="author-chip" key={author.id}>{author.name}</span>; })}{date("Paskelbta", page.editorial.datePublished)}{date("Atnaujinta", page.editorial.dateModified)}</div>{image && <figure className="article-featured-image"><GiftImage asset={image} media={page.media} priority />{image.credit && <figcaption>{image.credit}</figcaption>}</figure>}<div className="article-copy"><GiftRichContent body={page.body} media={page.media} /></div><Recommendation page={page} />{page.editorial.sources.length > 0 && <section className="source-list" aria-labelledby="sources-heading"><h2 id="sources-heading">Šaltiniai</h2><ul>{page.editorial.sources.map(source => <li key={source.id}><a href={source.url} rel="noopener noreferrer">{source.title}</a> — {source.publisher}; peržiūrėta <time dateTime={source.accessedAt}>{giftDate(source.accessedAt, pkg.locale, pkg.site.timezone)}</time>.</li>)}</ul></section>}{related.length > 0 && <section className="related-block"><h2 className="eyebrow">Skaitykite toliau</h2><div className="related-links">{related.map(item => <a key={item.id} href={giftPath(item)}>{item.title}<span aria-hidden="true">→</span></a>)}</div></section>}</article>;
}
function Listing(props: Props) {
  const { pkg, page, livePages, topic } = props;
  const articles = giftFilteredArticles(pkg, livePages, topic);
  const category = giftTopics(pkg, livePages).find(item => item.slug === topic);
  return <><section className="listing-header"><div className="container"><p className="eyebrow">Dovanų gidai</p><h1>{page.title}</h1><p>{page.description}</p><div className="article-copy"><GiftRichContent body={page.body} media={page.media} /></div></div></section><section className="container listing-grid" aria-label="Straipsnių sąrašas">{topic && <div className="active-filter"><span>{category ? `Tema: ${category.label}` : "Tema nerasta"}</span><a href={giftPath(page)}>Rodyti visus gidus</a></div>}{articles.map(article => <Card key={article.id} page={article} />)}{articles.length === 0 && <div className="empty-card listing-empty"><h2>Šiai temai gidas dar ruošiamas.</h2><p>Peržiūrėkite paskelbtus gidus arba grįžkite į kategorijų pasirinkimą.</p><a href={giftPath(page)}>Visi gidai →</a></div>}</section></>;
}
function Information(props: Props) {
  const { pkg, page, livePages } = props;
  const authors = page.slug === "autoriai" ? giftAuthors(livePages) : [];
  const authorIds = new Set(page.editorial.authors.map(author => author.id));
  const articles = page.type === "author" ? giftArticles(livePages).filter(article => article.editorial.authors.some(author => authorIds.has(author.id))) : [];
  const privacy = livePages.find(item => item.slug === "privatumas" && item.type === "policy");
  return <article className="article-card"><h1>{page.title}</h1><p className="article-lead">{page.description}</p><div className="article-copy"><GiftRichContent body={page.body} media={page.media} />{page.type === "contact" && <><p>El. paštas: <a href={`mailto:${page.siteSnapshot.contact.email}`}>{page.siteSnapshot.contact.email}</a>. Portalo operatorius: {pkg.site.operatorName}.</p>{privacy && <GiftContactForm privacy={privacy} />}</>}{authors.map(author => { const profile = giftAuthorPage(author, livePages); return <section key={author.id}><h2>{profile ? <a href={giftPath(profile)}>{author.name}</a> : author.name}</h2><p>{author.role}</p><p>{author.bio}</p></section>; })}{articles.length > 0 && <section><h2>Redakcijos gidai</h2><ul>{articles.map(article => <li key={article.id}><a href={giftPath(article)}>{article.title}</a></li>)}</ul></section>}</div></article>;
}

export function GiftSite(props: Props) {
  const { pkg, page, livePages, topic } = props;
  // Fail closed for accidental mismatched renderer inputs; projection remains the only visibility authority.
  if (pkg.site.renderer !== "gift" || page.siteId !== pkg.siteId || !livePages.some(item => item.id === page.id)) return null;
  const privacyVisible = livePages.some(item => item.type === "policy" && item.slug === "privatumas");
  return <div className={`gift-view ${page.type === "home" ? "site-shell home-page" : page.type === "index" && page.slug === "straipsniai" ? "listing-shell" : "article-shell"}`}><GiftStyles /><a className="gift-skip-link" href="#main-content">Pereiti prie turinio</a><Header {...props} /><main id="main-content" tabIndex={-1}>{page.type === "home" ? <Home {...props} /> : page.type === "article" ? <Article {...props} /> : page.type === "index" && page.slug === "straipsniai" ? <Listing {...props} /> : <Information {...props} />}</main><Footer {...props} />{!topic && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: giftJsonLd(giftSchemas(pkg, page, livePages)) }} />}{privacyVisible && <InterestTracking />}</div>;
}
