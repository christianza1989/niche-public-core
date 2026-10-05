import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { authorsForSiteFromStore } from "@/lib/content-store";
import { localeAlternates, resolveSite, siteOrigin } from "@/lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host");
  const site = resolveSite(host);
  const origin = siteOrigin(site, host);
  return { title: "Autoriai ir redakcija", description: "Autoriai ir turinio komanda, rengiantys dovanų gidus.", alternates: { canonical: `${origin}/autoriai`, languages: localeAlternates(site, origin, "/autoriai") } };
}

export default async function AuthorsPage() {
  const host = (await headers()).get("host");
  const site = resolveSite(host);
  const authors = await authorsForSiteFromStore(site);
  return (
    <main className="listing-shell">
      <header className="site-header"><div className="container header-inner"><Link href="/" className="brand-mark"><span className="brand-dot" aria-hidden="true" />{site.name}</Link><Link href="/" className="text-link">← Į pradžią</Link></div></header>
      <section className="listing-header"><div className="container"><p className="eyebrow">Skaidri redakcija</p><h1>Autoriai ir redakcija</h1><p>Sužinokite, kam priskirti mūsų gidai ir kaip rengiame turinį.</p></div></section>
      <section className="container author-grid">{authors.map((author) => <article className="author-card" key={author.id}><span className="author-avatar" aria-hidden="true">{author.name.slice(0, 1)}</span><p className="author-role">{author.role}</p><h2><Link href={`/autoriai/${author.slug}`}>{author.name}</Link></h2><p>{author.bio}</p><Link href={`/autoriai/${author.slug}`} className="text-link">Profilis <span aria-hidden="true">→</span></Link></article>)}</section>
    </main>
  );
}
