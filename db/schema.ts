import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
};

export const sites = sqliteTable(
  "sites",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull(),
    displayName: text("display_name").notNull(),
    defaultLocale: text("default_locale").notNull(),
    timezone: text("timezone").notNull(),
    currency: text("currency").notNull(),
    status: text("status").notNull().default("active"),
    ...timestamps,
  },
  (table) => ({ keyUnique: uniqueIndex("sites_key_unique").on(table.key) }),
);

export const nicheLeads = sqliteTable("niche_leads", {
  id: text("id").primaryKey(),
  siteId: text("site_id").notNull(),
  createdAt: integer("created_at").notNull(),
  sourcePath: text("source_path").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  consentAt: integer("consent_at").notNull(),
  status: text("status").notNull().default("new"),
}, (table) => ({ siteCreatedIdx: index("niche_leads_site_created_idx").on(table.siteId, table.createdAt) }));

export const nicheInterestDaily = sqliteTable("niche_interest_daily", {
  siteId: text("site_id").notNull(),
  day: text("day").notNull(),
  pagePath: text("page_path").notNull(),
  event: text("event", { enum: ["pageview", "email_click", "phone_click"] }).notNull(),
  count: integer("count").notNull().default(0),
}, (table) => ({ pk: primaryKey({ columns: [table.siteId, table.day, table.pagePath, table.event] }) }));

export const domains = sqliteTable(
  "domains",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").notNull().references(() => sites.id),
    hostname: text("hostname").notNull(),
    isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
    redirectTarget: text("redirect_target"),
    ...timestamps,
  },
  (table) => ({ hostnameUnique: uniqueIndex("domains_hostname_unique").on(table.hostname) }),
);

export const locales = sqliteTable(
  "locales",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").notNull().references(() => sites.id),
    locale: text("locale").notNull(),
    hreflang: text("hreflang").notNull(),
    pathPrefix: text("path_prefix").notNull().default(""),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
    ...timestamps,
  },
  (table) => ({ localeUnique: uniqueIndex("locales_site_locale_unique").on(table.siteId, table.locale) }),
);

export const authors = sqliteTable("authors", {
  id: text("id").primaryKey(),
  siteId: text("site_id").notNull().references(() => sites.id),
  locale: text("locale").notNull(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  bio: text("bio").notNull(),
  experience: text("experience").notNull(),
  sameAsJson: text("same_as_json").notNull().default("[]"),
  ...timestamps,
});

export const articles = sqliteTable(
  "articles",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id").notNull().references(() => sites.id),
    locale: text("locale").notNull(),
    translationGroupId: text("translation_group_id"),
    externalId: text("external_id").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull(),
    category: text("category").notNull(),
    blocksJson: text("blocks_json").notNull().default("[]"),
    publicationState: text("publication_state").notNull().default("draft"),
    publishAt: integer("publish_at", { mode: "timestamp_ms" }),
    publishedVersionId: text("published_version_id"),
    authorIdsJson: text("author_ids_json").notNull().default("[]"),
    sourceIdsJson: text("source_ids_json").notNull().default("[]"),
    ...timestamps,
  },
  (table) => ({
    slugUnique: uniqueIndex("articles_site_locale_slug_unique").on(table.siteId, table.locale, table.slug),
    externalUnique: uniqueIndex("articles_site_locale_external_unique").on(table.siteId, table.locale, table.externalId),
  }),
);

export const articleVersions = sqliteTable("article_versions", {
  id: text("id").primaryKey(),
  articleId: text("article_id").notNull().references(() => articles.id),
  versionNumber: integer("version_number").notNull(),
  contentSnapshotJson: text("content_snapshot_json").notNull(),
  seoSnapshotJson: text("seo_snapshot_json").notNull(),
  schemaSnapshotJson: text("schema_snapshot_json").notNull(),
  aiMetadataJson: text("ai_metadata_json").notNull().default("{}"),
  reviewMetadataJson: text("review_metadata_json").notNull().default("{}"),
  ...timestamps,
});

export const publishJobs = sqliteTable("publish_jobs", {
  id: text("id").primaryKey(),
  articleId: text("article_id").notNull().references(() => articles.id),
  versionId: text("version_id").notNull().references(() => articleVersions.id),
  dueAt: integer("due_at", { mode: "timestamp_ms" }).notNull(),
  status: text("status").notNull().default("pending"),
  leaseUntil: integer("lease_until", { mode: "timestamp_ms" }),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  ...timestamps,
});

export const outboxEvents = sqliteTable("outbox_events", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  aggregateId: text("aggregate_id").notNull(),
  idempotencyKey: text("idempotency_key").notNull(),
  payloadJson: text("payload_json").notNull(),
  deliveredAt: integer("delivered_at", { mode: "timestamp_ms" }),
  ...timestamps,
});

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  siteId: text("site_id").notNull().references(() => sites.id),
  actorType: text("actor_type").notNull(),
  actorId: text("actor_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  metadataJson: text("metadata_json").notNull().default("{}"),
  ...timestamps,
});
