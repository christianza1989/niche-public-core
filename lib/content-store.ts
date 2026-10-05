import { and, eq, inArray } from "drizzle-orm";
import { getDb, hasDbBinding } from "@/db";
import { articles, articleVersions, authors, sites } from "@/db/schema";
import { isApprovedDbVersion } from "@/lib/db-approval";
import {
  DEMO_AUTHORS,
  DEMO_SOURCES,
  type FeaturedImage,
  isLive,
  publishedArticles as demoPublishedArticles,
  type ArticleRecord,
  type AuthorRecord,
  type SourceRecord,
} from "@/lib/content";
import type { SiteConfig, SupportedLocale } from "@/lib/site-config";

type StoredBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: number; text: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "product_cta"; productId: string; label: string }
  | { type: "image"; src: string; alt: string; width: number; height: number; credit?: string };

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  try {
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function bodyFromBlocks(value: string): string[] {
  const blocks = parseJson<StoredBlock[]>(value, []);
  return blocks.flatMap((block) => {
    if (block.type === "list") return [block.items.join(" • ")];
    if ("text" in block) return [block.text];
    if (block.type === "product_cta") return [block.label];
    return [];
  });
}

function featuredImageFromBlocks(value: string): FeaturedImage | undefined {
  const blocks = parseJson<StoredBlock[]>(value, []);
  const image = blocks.find((block): block is Extract<StoredBlock, { type: "image" }> => block.type === "image");
  return image ? { src: image.src, alt: image.alt, width: image.width, height: image.height, ...(image.credit ? { credit: image.credit } : {}) } : undefined;
}

function toArticleRecord(row: typeof articles.$inferSelect, snapshot: string): ArticleRecord {
  const publishAt = row.publishAt?.toISOString() ?? new Date(0).toISOString();
  const featuredImage = featuredImageFromBlocks(snapshot);
  return {
    id: row.id,
    siteId: row.siteId,
    locale: row.locale as SupportedLocale,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    publishAt,
    publicationState: row.publicationState as ArticleRecord["publicationState"],
    readingMinutes: Math.max(1, Math.round(bodyFromBlocks(snapshot).join(" ").split(/\s+/).length / 180)),
    relatedIds: [],
    body: bodyFromBlocks(snapshot),
    authorIds: parseJson<string[]>(row.authorIdsJson, []),
    sourceIds: parseJson<string[]>(row.sourceIdsJson, []),
    ...(featuredImage ? { featuredImage } : {}),
  };
}

function withAutomaticRelatedIds(records: ArticleRecord[]): ArticleRecord[] {
  const liveIds = new Set(records.map((record) => record.id));
  return records.map((article) => {
    const plannedRelatedIds = article.relatedIds.filter((id) => liveIds.has(id) && id !== article.id);
    const automaticIds = records
      .filter((candidate) => candidate.id !== article.id)
      .sort((a, b) => {
        const sameCategory = Number(b.category === article.category) - Number(a.category === article.category);
        if (sameCategory !== 0) return sameCategory;
        return Date.parse(b.publishAt) - Date.parse(a.publishAt);
      })
      .map((candidate) => candidate.id);
    return { ...article, relatedIds: [...new Set([...plannedRelatedIds, ...automaticIds])].slice(0, 4) };
  });
}

async function databaseSiteId(site: SiteConfig): Promise<string | null> {
  const db = getDb();
  const rows = await db.select({ id: sites.id }).from(sites).where(and(eq(sites.key, site.id), eq(sites.status, "active"))).limit(1);
  return rows[0]?.id ?? null;
}

export async function publishedArticlesFromStore(
  site: SiteConfig,
  at = Date.now(),
  locale: SupportedLocale = site.defaultLocale,
): Promise<ArticleRecord[]> {
  if (!hasDbBinding()) return demoPublishedArticles(site, at, locale);
  const db = getDb();
  const siteId = await databaseSiteId(site);
  if (!siteId) return demoPublishedArticles(site, at, locale);
  // Include unpublished rows in the identity inventory so a curated article
  // cannot resurrect an intentionally hidden DB page with the same id/slug.
  const rows = await db.select().from(articles).where(and(eq(articles.siteId, siteId), eq(articles.locale, locale)));
  const occupiedKeys = new Set(rows.flatMap((row) => [row.id, row.slug]));
  const candidates = rows.filter((row) => row.publishAt && row.publishAt.getTime() <= at && row.publishedVersionId);
  const ids = candidates.map((row) => row.publishedVersionId).filter((id): id is string => Boolean(id));
  const versions = ids.length ? await db.select().from(articleVersions).where(inArray(articleVersions.id, ids)) : [];
  const byId = new Map(versions.map((version) => [version.id, version]));
  const records: ArticleRecord[] = [];
  for (const row of candidates) {
    const version = byId.get(row.publishedVersionId!);
    if (await isApprovedDbVersion(row, version)) records.push(toArticleRecord(row, version!.contentSnapshotJson));
  }
  const curatedExtras = demoPublishedArticles(site, at, locale).filter((article) => !occupiedKeys.has(article.id) && !occupiedKeys.has(article.slug));
  return withAutomaticRelatedIds([...records, ...curatedExtras]);
}

export async function findArticleFromStore(site: SiteConfig, slug: string, at = Date.now(), locale: SupportedLocale = site.defaultLocale): Promise<ArticleRecord | undefined> {
  const articlesForSite = await publishedArticlesFromStore(site, at, locale);
  return articlesForSite.find((article) => article.slug === slug);
}

export async function resolveInternalLinkFromStore(site: SiteConfig, articleId: string, at = Date.now(), locale: SupportedLocale = site.defaultLocale) {
  const target = (await publishedArticlesFromStore(site, at, locale)).find((article) => article.id === articleId && isLive(article, at));
  return target ? { href: `/straipsniai/${target.slug}`, label: target.title } : null;
}

export async function authorsForArticleFromStore(site: SiteConfig, article: ArticleRecord): Promise<AuthorRecord[]> {
  try {
    const db = getDb();
    const siteId = await databaseSiteId(site);
    if (!siteId || article.authorIds.length === 0) throw new Error("demo-author-fallback");
    const rows = await db.select().from(authors).where(and(eq(authors.siteId, siteId), eq(authors.locale, article.locale)));
    const byId = new Map(rows.map((row) => [row.id, row]));
    const stored = article.authorIds.flatMap((id) => {
      const row = byId.get(id);
      if (!row) return [];
      return [{ id: row.id, slug: row.slug, name: row.name, role: row.role, bio: row.bio, experience: row.experience, sameAs: parseJson<string[]>(row.sameAsJson, []), siteId: site.id, locale: article.locale }];
    });
    if (stored.length > 0) return stored;
  } catch {
    // Local preview without a D1 binding uses the curated demo authors.
  }
  return DEMO_AUTHORS.filter((author) => author.siteId === site.id && article.authorIds.includes(author.id));
}

export async function authorsForSiteFromStore(site: SiteConfig, locale: SupportedLocale = site.defaultLocale): Promise<AuthorRecord[]> {
  try {
    const db = getDb();
    const siteId = await databaseSiteId(site);
    if (!siteId) throw new Error("demo-author-fallback");
    const rows = await db.select().from(authors).where(and(eq(authors.siteId, siteId), eq(authors.locale, locale)));
    if (rows.length > 0) {
      const stored = rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        role: row.role,
        bio: row.bio,
        experience: row.experience,
        sameAs: parseJson<string[]>(row.sameAsJson, []),
        siteId: site.id,
        locale,
      }));
      const storedKeys = new Set(stored.flatMap((author) => [author.id, author.slug]));
      const curatedExtras = DEMO_AUTHORS.filter((author) => author.siteId === site.id && author.locale === locale && !storedKeys.has(author.id) && !storedKeys.has(author.slug));
      return [...stored, ...curatedExtras];
    }
  } catch {
    // Local preview without a D1 binding uses the curated demo authors.
  }
  return DEMO_AUTHORS.filter((author) => author.siteId === site.id && author.locale === locale);
}

export async function authorBySlugFromStore(site: SiteConfig, slug: string, locale: SupportedLocale = site.defaultLocale): Promise<AuthorRecord | undefined> {
  return (await authorsForSiteFromStore(site, locale)).find((author) => author.slug === slug);
}

export async function articlesForAuthorFromStore(site: SiteConfig, authorId: string, at = Date.now(), locale: SupportedLocale = site.defaultLocale): Promise<ArticleRecord[]> {
  return (await publishedArticlesFromStore(site, at, locale)).filter((article) => article.authorIds.includes(authorId));
}

export function sourcesForArticleFromStore(article: ArticleRecord): SourceRecord[] {
  return DEMO_SOURCES.filter((source) => article.sourceIds.includes(source.id) && source.public !== false);
}
