import { z } from "zod";

const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), text: z.string().min(1).max(12000) }),
  z.object({ type: z.literal("heading"), level: z.number().int().min(2).max(3), text: z.string().min(1).max(180) }),
  z.object({ type: z.literal("list"), ordered: z.boolean().default(false), items: z.array(z.string().min(1).max(1000)).min(1).max(30) }),
  z.object({ type: z.literal("product_cta"), productId: z.string().min(1).max(120), label: z.string().min(1).max(120) }),
  z.object({ type: z.literal("image"), src: z.string().regex(/^\/(?!\/).+/).max(500), alt: z.string().min(5).max(240), width: z.number().int().positive().max(10000), height: z.number().int().positive().max(10000), credit: z.string().max(180).optional() }),
]);

export const ingestArticleSchema = z.object({
  externalId: z.string().trim().min(1).max(160),
  title: z.string().trim().min(10).max(180),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),
  excerpt: z.string().trim().min(40).max(320),
  category: z.string().trim().min(2).max(100),
  locale: z.string().regex(/^[a-z]{2}-[A-Z]{2}$/),
  authorIds: z.array(z.string().min(1).max(120)).min(1).max(5),
  sourceIds: z.array(z.string().min(1).max(120)).max(30).default([]),
  blocks: z.array(blockSchema).min(2).max(80),
  publishAt: z.string().datetime({ offset: true }).optional(),
  // Scheduling is a separate, audited action after a reviewer has approved
  // the immutable article version. Ingest cannot grant publication rights.
  requestedState: z.literal("review").default("review"),
});

export const ingestBatchSchema = z.object({
  idempotencyKey: z.string().trim().min(8).max(180),
  siteKey: z.string().trim().min(2).max(80),
  articles: z.array(ingestArticleSchema).min(1).max(50),
});

export type IngestBatch = z.infer<typeof ingestBatchSchema>;

export function ingestToken(): string | undefined {
  return typeof process !== "undefined" ? process.env.CONTENT_INGEST_TOKEN : undefined;
}

export function validateIngestPayload(input: unknown) {
  return ingestBatchSchema.safeParse(input);
}
