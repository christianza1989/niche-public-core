import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { publishedArticlesFromStore } from "@/lib/content-store";
import { getHomeCategories } from "@/lib/homepage-data";
import { getCopy } from "@/lib/i18n";
import { localeAlternates, resolveSite, siteOrigin } from "@/lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host");
  const site = resolveSite(host);
  const origin = siteOrigin(site, host);
  return { title: "Dovanų gidai", description: "Praktiški dovanų gidai pagal progą, žmogų ir biudžetą.", alternates: { canonical: `${origin}/straipsniai`, languages: localeAlternates(site, origin, "/straipsniai") } };
}

type ArticlesPageProps = { searchParams?: Promise<{ tema?: string }> };

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const host = (await headers()).get("host");
  const site = resolveSite(host);
  const copy = getCopy(site.defaultLocale);
  const params = await searchParams;
  const topic = params?.tema?.trim().toLowerCase();
  const allArticles = await publishedArticlesFromStore(site);
  const selectedCategory = getHomeCategories(site.defaultLocale).find((category) => category.slug === topic);
  const articles = selectedCategory
    ? allArticles.filter((article) => selectedCategory.articleIds.includes(article.id))
    : topic ? allArticles.filter((article) => article.category.toLowerCase().includes(topic.replaceAll("-", " "))) : allArticles;
  const activeTopic = selectedCategory?.label ?? (topic ? params?.tema?.replaceAll("-", " ") : null);
  return (
    <main className="listing-shell">
      <header className="site-header"><div className="container header-inner"><Link href="/" className="brand-mark"><span className="brand-dot" aria-hidden="true" />{site.name}</Link><nav className="main-nav" aria-label="Pagrindinė navigacija"><Link href="/autoriai">{copy.navAuthors}</Link><Link href="/apie">{copy.navAbout}</Link></nav><Link href="/" className="text-link">← {copy.home}</Link></div></header>
      <section className="listing-header"><div className="container"><p className="eyebrow">{copy.featuredKicker}</p><h1>{copy.navGuides}</h1><p>{copy.homeLead}</p></div></section>
      <section className="container listing-grid" aria-label="Straipsnių sąrašas">
        {activeTopic && <div className="active-filter"><span>Filtruojama tema: <strong>{activeTopic}</strong></span><Link href="/straipsniai">Rodyti visus gidus</Link></div>}
        {articles.map((article, index) => <article className="listing-card" key={article.id}>{article.featuredImage && <img className="listing-card-image" src={article.featuredImage.src} alt={article.featuredImage.alt} width={article.featuredImage.width} height={article.featuredImage.height} loading="lazy" decoding="async" />}<div className={`teaser-number teaser-number-${(index % 3) + 1}`} aria-hidden="true">0{index + 1}</div><p className="eyebrow">{article.category} · {article.readingMinutes} min.</p><h2><Link href={`/straipsniai/${article.slug}`}>{article.title}</Link></h2><p>{article.excerpt}</p><Link href={`/straipsniai/${article.slug}`} className="text-link">{copy.readGuide} <span aria-hidden="true">→</span></Link></article>)}
        {articles.length === 0 && <div className="empty-card listing-empty"><h2>Šiai temai gidas dar ruošiamas.</h2><p>Kol kas peržiūrėkite visus publikuotus gidus arba grįžkite į kategorijų pasirinkimą.</p><Link href="/straipsniai" className="button button-dark">Visi gidai <span aria-hidden="true">→</span></Link></div>}
      </section>
    </main>
  );
}
