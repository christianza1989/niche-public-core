import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { authorsForSiteFromStore, publishedArticlesFromStore } from "@/lib/content-store";
import { resolveSite, siteOrigin } from "@/lib/site-config";
import { nicheOrigin, nichePagePath, nicheSiteByHost, normalizedHost, publicNichePage, publicNichePages } from "@/lib/niche-sites";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get("host");
  const niche = nicheSiteByHost(host);
  if (niche) {
    if (["localhost", "127.0.0.1"].includes(normalizedHost(host)) || !publicNichePage(niche, "")) return [];
    const origin = nicheOrigin(niche);
    return publicNichePages(niche).map((page) => ({
      url: `${origin}${nichePagePath(page)}`,
      lastModified: new Date(page.approval.approvedAt),
      changeFrequency: "monthly" as const,
      priority: page.type === "home" ? 1 : page.type === "service" ? 0.8 : 0.6,
    }));
  }
  const site = resolveSite(host);
  const origin = siteOrigin(site, host);
  const articles = await publishedArticlesFromStore(site);
  const authors = await authorsForSiteFromStore(site);
  const staticPaths = [
    "/",
    "/straipsniai",
    "/autoriai",
    "/apie",
    "/kontaktai",
    "/redakcine-politika",
    "/partneriu-nuorodu-atskleidimas",
    "/privatumas",
    "/slapukai",
    "/taisykles",
  ];
  return [
    ...staticPaths.map((path, index) => ({
      url: `${origin}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: index === 0 ? 1 : 0.4,
    })),
    ...authors.map((author) => ({
      url: `${origin}/autoriai/${author.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
    ...articles.map((article) => ({
      url: `${origin}/straipsniai/${article.slug}`,
      lastModified: new Date(article.publishAt),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];
}
