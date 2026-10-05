import type { articles, articleVersions } from "@/db/schema";

type ArticleRow = typeof articles.$inferSelect;
type VersionRow = typeof articleVersions.$inferSelect;

export type DbReviewMetadata = {
  status: "approved";
  versionId: string;
  contentHash: string;
  approvedAt: string;
  actorId: string;
};

/** Hash all public fields, not only the body, so changing a title, URL, media
 * block, author list, or schedule invalidates the review. */
export async function dbVersionHash(article: ArticleRow, version: VersionRow): Promise<string> {
  const snapshot = JSON.stringify({
    articleId: article.id,
    siteId: article.siteId,
    locale: article.locale,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    category: article.category,
    publishAt: article.publishAt?.toISOString() ?? null,
    authorIdsJson: article.authorIdsJson,
    sourceIdsJson: article.sourceIdsJson,
    contentSnapshotJson: version.contentSnapshotJson,
    seoSnapshotJson: version.seoSnapshotJson,
    schemaSnapshotJson: version.schemaSnapshotJson,
  });
  const bytes = new TextEncoder().encode(snapshot);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function isApprovedDbVersion(article: ArticleRow, version: VersionRow | undefined): Promise<boolean> {
  if (!version || version.articleId !== article.id || article.publishedVersionId !== version.id || !article.publishAt) return false;
  if (!["scheduled", "published"].includes(article.publicationState)) return false;
  let review: Partial<DbReviewMetadata>;
  try {
    review = JSON.parse(version.reviewMetadataJson) as Partial<DbReviewMetadata>;
  } catch {
    return false;
  }
  if (review.status !== "approved" || review.versionId !== version.id || !review.actorId || !review.approvedAt || !review.contentHash) return false;
  return review.contentHash === await dbVersionHash(article, version);
}
