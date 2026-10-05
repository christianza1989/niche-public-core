import { and, eq, lte } from "drizzle-orm";
import { getDb } from "@/db";
import { articles, outboxEvents, publishJobs } from "@/db/schema";

export type PublishDueResult = {
  scanned: number;
  published: number;
  skipped: number;
  failed: number;
};

/**
 * Publishes due, approved snapshots. The conditional state update is the
 * lease: two workers can see the same job, but only one can claim it.
 */
export async function publishDueJobs(at = new Date(), limit = 25): Promise<PublishDueResult> {
  const db = getDb();
  const dueJobs = await db
    .select()
    .from(publishJobs)
    .where(and(eq(publishJobs.status, "pending"), lte(publishJobs.dueAt, at)))
    .limit(limit);

  const result: PublishDueResult = { scanned: dueJobs.length, published: 0, skipped: 0, failed: 0 };

  for (const job of dueJobs) {
    const leaseUntil = new Date(at.getTime() + 5 * 60 * 1000);
    try {
      const claim = await db
        .update(publishJobs)
        .set({ status: "processing", leaseUntil, attempts: job.attempts + 1, updatedAt: at })
        .where(and(eq(publishJobs.id, job.id), eq(publishJobs.status, "pending")))
        .run();

      if (claim.meta.changes !== 1) {
        result.skipped += 1;
        continue;
      }

      const updatedArticle = await db
        .update(articles)
        .set({ publicationState: "published", publishedVersionId: job.versionId, updatedAt: at })
        .where(and(eq(articles.id, job.articleId), eq(articles.publishedVersionId, job.versionId)))
        .run();

      // A null publishedVersionId is the normal first-publication case. If a
      // different version is already live, do not overwrite it accidentally.
      if (updatedArticle.meta.changes !== 1) {
        const firstPublication = await db
          .update(articles)
          .set({ publicationState: "published", publishedVersionId: job.versionId, updatedAt: at })
          .where(and(eq(articles.id, job.articleId), eq(articles.publicationState, "scheduled")))
          .run();
        if (firstPublication.meta.changes !== 1) {
          await db.update(publishJobs).set({ status: "skipped", updatedAt: at }).where(eq(publishJobs.id, job.id)).run();
          result.skipped += 1;
          continue;
        }
      }

      await db.insert(outboxEvents).values({
        id: crypto.randomUUID(),
        eventType: "ArticlePublished",
        aggregateId: job.articleId,
        idempotencyKey: `article-published:${job.articleId}:${job.versionId}`,
        payloadJson: JSON.stringify({ articleId: job.articleId, versionId: job.versionId }),
        createdAt: at,
        updatedAt: at,
      }).run();
      await db.update(publishJobs).set({ status: "complete", leaseUntil: null, updatedAt: at }).where(eq(publishJobs.id, job.id)).run();
      result.published += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown publish error";
      await db.update(publishJobs).set({ status: "failed", lastError: message, leaseUntil: null, updatedAt: at }).where(eq(publishJobs.id, job.id)).run();
      result.failed += 1;
    }
  }

  return result;
}

export function schedulerToken(): string | undefined {
  return typeof process !== "undefined" ? process.env.PUBLISH_WORKER_TOKEN : undefined;
}
