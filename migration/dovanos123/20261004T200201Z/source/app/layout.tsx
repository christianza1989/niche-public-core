import type { Metadata } from "next";
import { headers } from "next/headers";
import { localeAlternates, localeToHtmlLang, resolveSite, siteOrigin } from "@/lib/site-config";
import { nicheOrigin, nichePagePath, nicheSiteByHost, publicNichePage } from "@/lib/niche-sites";

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host");
  const niche = nicheSiteByHost(host);
  if (niche) {
    return { metadataBase: new URL(nicheOrigin(niche)) };
  }
  const site = resolveSite(host);
  const origin = siteOrigin(site, host);
  return {
    metadataBase: new URL(origin),
    title: { default: site.name, template: `%s | ${site.name}` },
    description: site.description,
    applicationName: site.name,
    alternates: { languages: localeAlternates(site, origin) },
    other: { "codex-preview": "development" },
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const host = (await headers()).get("host");
  const niche = nicheSiteByHost(host);
  if (niche) {
    const { NicheStyles } = await import("@/components/niche/niche-styles");
    const pathname = (await headers()).get("x-niche-original-path") || "/";
    const slug = pathname.replace(/^\/+|\/+$/g, "");
    const page = publicNichePage(niche, slug);
    const canonical = page ? `${nicheOrigin(niche)}${nichePagePath(page)}` : undefined;
    const hero = page?.media[0];
    return (
      <html lang={niche.locale.slice(0, 2).toLowerCase()}>
        <head>
          <NicheStyles />
          {niche.siteId === "traktoriupadangos" && <>
            <link rel="preload" href="/fonts/traktoriupadangos/barlow-condensed-latin-3787a5a41917.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
            <link rel="preload" href="/fonts/traktoriupadangos/barlow-condensed-latin-ext-9d351bd9222b.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
            <link rel="preload" href="/fonts/traktoriupadangos/manrope-latin-a30ddcd34970.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
            <link rel="preload" href="/fonts/traktoriupadangos/manrope-latin-ext-3911b66d9f2e.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
          </>}
          <title>{page?.title || niche.site.name}</title>
          <meta name="description" content={page?.description || niche.site.offer} />
          {canonical ? <link rel="canonical" href={canonical} /> : <meta name="robots" content="noindex, nofollow" />}
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          {page && <>
            <meta property="og:site_name" content={niche.site.name} />
            <meta property="og:type" content={page.type === "guide" ? "article" : "website"} />
            <meta property="og:title" content={page.title} />
            <meta property="og:description" content={page.description} />
            <meta property="og:url" content={canonical} />
            {hero && <meta property="og:image" content={`${nicheOrigin(niche)}${hero.src}`} />}
            <meta name="twitter:card" content={hero ? "summary_large_image" : "summary"} />
          </>}
        </head>
        <body className="antialiased">{children}</body>
      </html>
    );
  }
  const site = resolveSite(host);
  const { LegacyStyles } = await import("./legacy-styles");
  return (
    <html lang={localeToHtmlLang(site.defaultLocale)}>
      <body className="antialiased"><LegacyStyles />{children}</body>
    </html>
  );
}
