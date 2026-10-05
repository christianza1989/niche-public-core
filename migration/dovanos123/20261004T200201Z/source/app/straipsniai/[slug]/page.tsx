import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { findArticleFromStore, authorsForArticleFromStore, publishedArticlesFromStore, sourcesForArticleFromStore } from "@/lib/content-store";
import type { ArticleRecord } from "@/lib/content";
import { getCopy } from "@/lib/i18n";
import { localeAlternates, resolveSite, siteOrigin } from "@/lib/site-config";

type ArticleParams = { params: Promise<{ slug: string }> };

function renderInlineLinks(text: string, liveArticles: Map<string, ArticleRecord>) {
  const parts: React.ReactNode[] = [];
  const pattern = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > cursor) parts.push(text.slice(cursor, start));
    if (match[2].startsWith("article:")) {
      const target = liveArticles.get(match[2].slice("article:".length));
      parts.push(target ? <Link key={`${start}-${target.id}`} href={`/straipsniai/${target.slug}`}>{match[1]}</Link> : match[1]);
      cursor = start + match[0].length;
      continue;
    }
    let validUrl: URL | undefined;
    try {
      validUrl = new URL(match[2]);
    } catch {
      // Malformed editorial links remain readable text.
    }
    if (validUrl?.protocol === "https:") {
      parts.push(<a key={`${start}-${match[1]}`} href={validUrl.toString()} rel="noopener noreferrer" target="_blank">{match[1]}</a>);
    } else {
      parts.push(match[1]);
    }
    cursor = start + match[0].length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

function renderBodyBlock(block: string, index: number, liveArticles: Map<string, ArticleRecord>) {
  if (block.startsWith("### ")) return <h3 key={`${block}-${index}`}>{block.slice(4)}</h3>;
  if (block.startsWith("## ")) return <h2 key={`${block}-${index}`}>{block.slice(3)}</h2>;
  if (block.startsWith("• ")) return <li key={`${block}-${index}`}>{block.slice(2)}</li>;
  return <p key={`${block}-${index}`}>{renderInlineLinks(block, liveArticles)}</p>;
}

function renderArticleBody(body: string[], liveArticles: Map<string, ArticleRecord>) {
  const blocks: React.ReactNode[] = [];
  for (let index = 0; index < body.length; index += 1) {
    if (!body[index].startsWith("• ")) {
      blocks.push(renderBodyBlock(body[index], index, liveArticles));
      continue;
    }
    const items: string[] = [];
    while (index < body.length && body[index].startsWith("• ")) {
      items.push(body[index].slice(2));
      index += 1;
    }
    blocks.push(<ul key={`list-${index}`}>{items.map((item, offset) => <li key={`${item}-${offset}`}>{item}</li>)}</ul>);
    index -= 1;
  }
  return blocks;
}

export async function generateMetadata({ params }: ArticleParams): Promise<Metadata> {
  const host = (await headers()).get("host");
  const site = resolveSite(host);
  const { slug } = await params;
  const article = await findArticleFromStore(site, slug);
  if (!article) return { title: "Straipsnis nerastas", robots: { index: false, follow: false } };
  const canonical = `${siteOrigin(site, host)}/straipsniai/${article.slug}`;
  const imageUrl = article.featuredImage ? new URL(article.featuredImage.src, siteOrigin(site, host)).toString() : undefined;
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical, languages: localeAlternates(site, siteOrigin(site, host), `/straipsniai/${article.slug}`) },
    openGraph: { title: article.title, description: article.excerpt, url: canonical, type: "article", ...(imageUrl ? { images: [{ url: imageUrl, width: article.featuredImage?.width, height: article.featuredImage?.height, alt: article.featuredImage?.alt }] } : {}) },
  };
}

export default async function ArticlePage({ params }: ArticleParams) {
  const host = (await headers()).get("host");
  const site = resolveSite(host);
  const copy = getCopy(site.defaultLocale);
  const { slug } = await params;
  const article = await findArticleFromStore(site, slug);
  if (!article) notFound();

  const authors = await authorsForArticleFromStore(site, article);
  const sources = sourcesForArticleFromStore(article);
  const liveArticles = new Map((await publishedArticlesFromStore(site)).map((item) => [item.id, item]));
  const relatedLinks = article.relatedIds.flatMap((id) => {
    const target = liveArticles.get(id);
    return target ? [{ href: `/straipsniai/${target.slug}`, label: target.title }] : [];
  });
  const canonical = `${siteOrigin(site, host)}/straipsniai/${article.slug}`;
  const publishedAt = new Date(article.publishAt).toISOString();
  const imageUrl = article.featuredImage ? new URL(article.featuredImage.src, siteOrigin(site, host)).toString() : undefined;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    inLanguage: article.locale,
    articleSection: article.category,
    mainEntityOfPage: canonical,
    datePublished: publishedAt,
    dateModified: publishedAt,
    author: authors.map((author) => ({
      "@type": author.kind === "organization" ? "Organization" : "Person",
      name: author.name,
      url: `${siteOrigin(site, host)}/autoriai/${author.slug}`,
      ...(author.sameAs.length ? { sameAs: author.sameAs } : {}),
    })),
    publisher: { "@type": "Organization", name: site.name, url: siteOrigin(site, host) },
    ...(imageUrl ? { image: [imageUrl] } : {}),
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: copy.home, item: siteOrigin(site, host) },
      { "@type": "ListItem", position: 2, name: copy.navGuides, item: `${siteOrigin(site, host)}/straipsniai` },
      { "@type": "ListItem", position: 3, name: article.title, item: canonical },
    ],
  };

  return (
    <main className="article-shell">
      <header className="article-topbar">
        <Link href="/" className="brand-mark"><span className="brand-dot" aria-hidden="true" />{site.name}</Link>
        <nav className="main-nav" aria-label="Straipsnio navigacija">
          <Link href="/straipsniai">{copy.allGuides}</Link>
          <Link href="/apie">{copy.aboutProject}</Link>
        </nav>
      </header>
      <article className="article-card">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">{copy.home}</Link><span aria-hidden="true">/</span><Link href="/straipsniai">{copy.navGuides}</Link><span aria-hidden="true">/</span><span>{article.category}</span>
        </nav>
        <p className="eyebrow">{article.category} · {article.readingMinutes} min.</p>
        <h1>{article.title}</h1>
        <p className="article-lead">{article.excerpt}</p>
        <div className="article-meta">
          {authors.map((author) => <Link className="author-chip" href={`/autoriai/${author.slug}`} key={author.id}><span className="author-avatar" aria-hidden="true">{author.name.slice(0, 1)}</span>{author.name}</Link>)}
          <span aria-hidden="true">•</span>
          <time dateTime={publishedAt}>{new Intl.DateTimeFormat(site.defaultLocale, { dateStyle: "long" }).format(new Date(article.publishAt))}</time>
        </div>
        {article.featuredImage && <figure className="article-featured-image"><img src={article.featuredImage.src} alt={article.featuredImage.alt} width={article.featuredImage.width} height={article.featuredImage.height} fetchPriority="high" decoding="async" /><figcaption>{article.featuredImage.credit ?? "Redakcijos iliustracija"}</figcaption></figure>}
        <div className="article-copy">
          {renderArticleBody(article.body, liveArticles)}
        </div>
        {article.productRecommendation !== false && <aside className="product-callout">
          <div><span className="callout-kicker">{copy.primaryRecommendation}</span><strong>{site.productName}</strong><span>{copy.productLine}</span></div>
          <a href={`${site.productUrl}?utm_source=${site.id}&utm_medium=content&utm_campaign=article`} className="callout-button">{copy.viewProduct} ↗</a>
        </aside>}
        {sources.length > 0 && <section className="source-list" aria-labelledby="sources-heading"><h2 id="sources-heading">{copy.sources}</h2><ul>{sources.map((source) => <li key={source.id}><a href={source.url} rel="noreferrer">{source.title}</a> — {source.publisher}; tikrinta {source.accessedAt}.</li>)}</ul></section>}
        {relatedLinks.length > 0 && <section className="related-block"><p className="eyebrow">{copy.readNext}</p><div className="related-links">{relatedLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}<span aria-hidden="true">→</span></Link>)}</div></section>}
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([schema, breadcrumbSchema]) }} />
    </main>
  );
}
