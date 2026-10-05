import Link from "next/link";
import type { ReactNode } from "react";
import type { SiteConfig } from "@/lib/site-config";

export function PolicyLayout({ site, eyebrow, title, intro, children }: { site: SiteConfig; eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <main className="policy-shell">
      <header className="site-header"><div className="container header-inner"><Link href="/" className="brand-mark"><span className="brand-dot" aria-hidden="true" />{site.name}</Link><nav className="main-nav" aria-label="Navigacija"><Link href="/straipsniai">Gidai</Link><Link href="/autoriai">Autoriai</Link></nav><Link href="/" className="text-link">← Į pradžią</Link></div></header>
      <section className="policy-header"><div className="container"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{intro}</p></div></section>
      <article className="container policy-content">{children}</article>
      <footer className="site-footer"><div className="container footer-grid"><Link href="/" className="brand-mark"><span className="brand-dot" aria-hidden="true" />{site.name}</Link><div className="footer-links"><Link href="/privatumas">Privatumas</Link><Link href="/slapukai">Slapukai</Link><Link href="/kontaktai">Kontaktai</Link></div></div></footer>
    </main>
  );
}
