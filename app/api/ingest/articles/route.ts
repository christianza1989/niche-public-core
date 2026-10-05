import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { articles, articleVersions, auditEvents, outboxEvents, sites } from "@/db/schema";
import { ingestToken, validateIngestPayload, type IngestBatch } from "@/lib/ingest";

export const dynamic = "force-dynamic";

function errorResponse(error: string, status: number, details?: unknown) {
  return Response.json({ error, ...(details ? { details } : {}) }, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const expectedToken = ingestToken();
  if (!expectedToken) return errorResponse("ingest_not_configured", 503);
  if (request.headers.get("authorization") !== `Bearer ${expectedToken}`) return errorResponse("unauthorized", 401);

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return errorResponse("invalid_json", 400);
  }
  const parsed = validateIngestPayload(input);
  if (!parsed.success) return errorResponse("validation_failed", 422, parsed.error.flatten());
  const payload: IngestBatch = parsed.data;

  let db: ReturnType<typeof getDb>;
  try {
    db = getDb();
  } catch {
    return errorResponse("database_not_configured", 503);
  }

  const previous = await db.select({ payloadJson: outboxEvents.payloadJson }).from(outboxEvents).where(eq(outboxEvents.idempotencyKey, `ingest:${payload.idempotencyKey}`)).limit(1);
  if (previous[0]) return Response.json(JSON.parse(previous[0].payloadJson), { headers: { "cache-control": "no-store", "x-idempotent-replay": "true" } });

  const siteRows = await db.select({ id: sites.id }).from(sites).where(and(eq(sites.key, payload.siteKey), eq(sites.status, "active"))).limit(1);
  const site = siteRows[0];
  if (!site) return errorResponse("site_not_found", 422, { siteKey: payload.siteKey });

  const now = new Date();
  const created: Array<{ externalId: string; articleId: string; state: string; publishAt: string | null }> = [];
  try {
    for (const item of payload.articles) {
      if (item.locale !== payload.articles[0].locale) return errorResponse("mixed_locale_batch", 422);
      const articleId = crypto.randomUUID();
      const versionId = crypto.randomUUID();
      const state = "review";
      const publishAt = item.publishAt ? new Date(item.publishAt) : null;

      const articleInsert = db.insert(articles).values({
        id: articleId,
        siteId: site.id,
        locale: item.locale,
        externalId: item.externalId,
        slug: item.slug,
        title: item.title,
        excerpt: item.excerpt,
        category: item.category,
        blocksJson: JSON.stringify(item.blocks),
        publicationState: state,
        publishAt,
        publishedVersionId: null,
        authorIdsJson: JSON.stringify(item.authorIds),
        sourceIdsJson: JSON.stringify(item.sourceIds),
        createdAt: now,
        updatedAt: now,
      });
      const versionInsert = db.insert(articleVersions).values({
        id: versionId,
        articleId,
        versionNumber: 1,
        contentSnapshotJson: JSON.stringify(item.blocks),
        seoSnapshotJson: JSON.stringify({ title: item.title, description: item.excerpt }),
        schemaSnapshotJson: JSON.stringify({}),
        aiMetadataJson: JSON.stringify({ ingestIdempotencyKey: payload.idempotencyKey }),
        reviewMetadataJson: JSON.stringify({ status: "pending" }),
        createdAt: now,
        updatedAt: now,
      });
      await db.batch([articleInsert, versionInsert]);
      created.push({ externalId: item.externalId, articleId, state, publishAt: publishAt?.toISOString() ?? null });
    }

    const response = { accepted: created.length, siteKey: payload.siteKey, locale: payload.articles[0].locale, articles: created };
    await db.batch([
      db.insert(outboxEvents).values({ id: crypto.randomUUID(), eventType: "ArticlesIngested", aggregateId: site.id, idempotencyKey: `ingest:${payload.idempotencyKey}`, payloadJson: JSON.stringify(response), createdAt: now, updatedAt: now }),
      db.insert(auditEvents).values({ id: crypto.randomUUID(), siteId: site.id, actorType: "ingest_api", actorId: null, action: "articles_ingested", entityType: "article_batch", entityId: payload.idempotencyKey, metadataJson: JSON.stringify({ count: created.length, locale: payload.articles[0].locale }), createdAt: now, updatedAt: now }),
    ]);
    return Response.json(response, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ingest error";
    return errorResponse("ingest_failed", 409, { message });
  }
}
