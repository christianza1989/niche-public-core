import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { resolveSite, siteOrigin } from "@/lib/site-config";
import { nicheOrigin, nicheSiteByHost, normalizedHost, publicNichePage } from "@/lib/niche-sites";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host");
  const niche = nicheSiteByHost(host);
  if (niche) return {
    rules: normalizedHost(host) === "localhost" || normalizedHost(host) === "127.0.0.1" || !publicNichePage(niche, "")
      ? [{ userAgent: "*", disallow: "/" }]
      : [{ userAgent: "*", allow: "/", disallow: ["/niche/", "/uzklausa", "/api/"] }],
    sitemap: `${nicheOrigin(niche)}/sitemap.xml`,
  };
  const site = resolveSite(host);
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/preview/"] }],
    sitemap: `${siteOrigin(site, host)}/sitemap.xml`,
  };
}

