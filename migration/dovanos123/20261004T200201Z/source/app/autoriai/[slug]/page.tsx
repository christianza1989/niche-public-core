import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { articlesForAuthorFromStore, authorBySlugFromStore } from "@/lib/content-store";
import { localeAlternates, resolveSite, siteOrigin } from "@/lib/site-config";

type AuthorParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: AuthorParams): Promise<Metadata> {
  const host = (await headers()).get("host");
  const site = resolveSite(host);
  const author = await authorBySlugFromStore(site, (await params).slug);
  if (!author) return { title: "Autorius nerastas", robots: { index: false, follow: false } };
  const origin = siteOrigin(site, host);
  return { title: author.name, description: author.bio, alternates: { canonical: `${origin}/autoriai/${author.slug}`, languages: localeAlternates(site, origin, `/autoriai/${author.slug}`) } };
}

export default async function AuthorPage({ params }: AuthorParams) {
  const host = (await headers()).get("host");
  const site = resolveSite(host);
  const author = await authorBySlugFromStore(site, (await params).slug);
  if (!author) notFound();
  const articles = await articlesForAuthorFromStore(site, author.id);
  const origin = siteOrigin(site, host);
  const schema = { "@context": "https://schema.org", "@type": "ProfilePage", mainEntity: { "@type": author.kind === "organization" ? "Organization" : "Person", name: author.name, description: author.bio, url: `${origin}/autoriai/${author.slug}`, ...(author.sameAs.length ? { sameAs: author.sameAs } : {}) } };
  return (
    <main className="listing-shell">
      <header className="site-header"><div className="container header-inner"><Link href="/" className="brand-mark"><span className="brand-dot" aria-hidden="true" />{site.name}</Link><Link href="/autoriai" className="text-link">← Visi autoriai</Link></div></header>
      <section className="listing-header"><div className="container"><span className="author-avatar" aria-hidden="true">{author.name.slice(0, 1)}</span><p className="author-role" style={{ marginTop: 20 }}>{author.role}</p><h1>{author.name}</h1><p>{author.bio}</p><p className="author-experience"><strong>Patirtis:</strong> {author.experience}</p></div></section>
      <section className="container listing-grid" aria-labelledby="author-articles"><div style={{ gridColumn: "1 / -1" }}><p className="eyebrow">Publikuoti gidai</p><h2 id="author-articles" style={{ fontSize: 35, letterSpacing: "-.04em" }}>Straipsniai</h2></div>{articles.map((article) => <article className="listing-card" key={article.id}>{article.featuredImage && <img className="listing-card-image" src={article.featuredImage.src} alt={article.featuredImage.alt} width={article.featuredImage.width} height={article.featuredImage.height} loading="lazy" decoding="async" />}<p className="eyebrow">{article.category} · {article.readingMinutes} min.</p><h2><Link href={`/straipsniai/${article.slug}`}>{article.title}</Link></h2><p>{article.excerpt}</p><Link href={`/straipsniai/${article.slug}`} className="text-link">Skaityti gidą <span aria-hidden="true">→</span></Link></article>)}</section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </main>
  );
}
