import rawPackages from "@/lib/generated/content-packages.json";
import { env } from "cloudflare:workers";
import { dueRevision, projectPublicPages } from "./niche-links.mjs";
import networkSettings from "@/config/niche-network.json";
import { cache } from "react";

export type NicheBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "list"; items: string[] }
  | { type: "image"; assetId: string };

export type NicheMedia = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  credit?: string;
  rights: string;
};

export type NichePage = {
  id: string;
  siteId: string;
  type: "home" | "service" | "product" | "guide" | "faq" | "location";
  slug: string;
  title: string;
  description: string;
  intent: string;
  body: NicheBlock[];
  publishAt: string;
  revisionHash: string;
  approval: { status: "approved"; revisionHash: string; approvedAt: string; actorId: string };
  media: NicheMedia[];
  links: { targetPageId: string; label: string }[];
  externalLinks?: { url: string; label: string; reason: string }[];
};

export type NichePackage = {
  schemaVersion: 1;
  siteId: string;
  canonicalHost: string;
  locale: string;
  generatedAt: string;
  site: {
    id: string;
    name: string;
    canonicalHost: string;
    locale: string;
    timezone: string;
    brand: { accent: string };
    offer: string;
    contact: { email: string; phone?: string };
  };
  pages: NichePage[];
};

const packages = rawPackages.filter(pkg => pkg.schemaVersion === 1) as NichePackage[];

export function normalizedHost(host: string | null | undefined): string {
  return (host ?? "").split(",")[0].trim().toLowerCase().replace(/:\d+$/, "");
}

export function nicheSiteById(siteId: string): NichePackage | undefined {
  return packages.find((item) => item.siteId === siteId);
}

export function nicheSiteByHost(host: string | null | undefined): NichePackage | undefined {
  const hostname = normalizedHost(host);
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    const devId = env.NICHE_DEV_SITE_ID || process.env.NICHE_DEV_SITE_ID;
    if (devId) return nicheSiteById(devId);
  }
  return packages.find((item) => item.canonicalHost === hostname);
}

export function isPublicNichePage(page: NichePage, now = Date.now()): boolean {
  return dueRevision(page, now);
}

// React owns this cache for one server render and clears it between requests.
// Explicit clocks and non-component callers retain the pure time-aware path.
const renderedPublicPages = cache((pkg: NichePackage) =>
  projectPublicPages(pkg, rawPackages, networkSettings, Date.now()) as NichePage[]);

export function publicNichePages(pkg: NichePackage, now?: number): NichePage[] {
  return now === undefined ? renderedPublicPages(pkg)
    : projectPublicPages(pkg, rawPackages, networkSettings, now) as NichePage[];
}

export function publicNichePage(pkg: NichePackage, slug: string, now?: number): NichePage | undefined {
  return publicNichePages(pkg, now).find((page) => page.slug === slug);
}

export function nichePagePath(page: NichePage): string {
  return page.slug ? `/${page.slug}` : "/";
}

export function nicheOrigin(pkg: NichePackage): string {
  return `https://${pkg.canonicalHost}`;
}
