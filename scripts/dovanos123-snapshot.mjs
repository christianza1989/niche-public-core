import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import ts from "typescript";

export const SITE_ID = "dovanos123";
const DATA_MODULES = ["lib/content.ts", "lib/new-articles.ts", "lib/scheduled-articles-2026.ts", "lib/site-config.ts", "lib/homepage-data.ts"];
const STATIC_ROUTES = ["", "straipsniai", "autoriai", "apie", "kontaktai", "redakcine-politika", "partneriu-nuorodu-atskleidimas", "privatumas", "slapukai", "taisykles"];
const SOURCE_FILES = [...DATA_MODULES, "lib/content-store.ts", "lib/db-approval.ts", "lib/i18n.ts", "lib/seo.ts", "db/schema.ts", "proxy.ts", "app/layout.tsx", "app/globals.css", "app/legacy-styles.tsx", "app/sitemap.ts", "app/robots.ts", "app/llms.txt/route.ts", "app/llms-full.txt/route.ts", "app/straipsniai/[slug]/page.tsx", "app/autoriai/[slug]/page.tsx", ...STATIC_ROUTES.map((route) => `app/${route ? `${route}/` : ""}page.tsx`)];
export const sha256 = (data) => crypto.createHash("sha256").update(data).digest("hex");
const plain = (data) => JSON.parse(JSON.stringify(data));

function under(root, relative) {
  const target = path.resolve(root, relative);
  if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error(`Path outside root: ${relative}`);
  return target;
}

/** Read only known, pure legacy data modules. Never import application bindings or secret config. */
export function readLegacyData(root, at) {
  const epoch = Date.parse(at);
  if (!Number.isFinite(epoch)) throw new Error("A valid explicit --at timestamp is required.");
  const allowed = new Set(DATA_MODULES.map((name) => path.resolve(root, name)));
  const cache = new Map();
  class SnapshotDate extends Date {
    constructor(...args) { super(...(args.length ? args : [epoch])); }
    static now() { return epoch; }
  }
  function load(filename) {
    if (!allowed.has(filename)) throw new Error(`Unapproved legacy dependency: ${filename}`);
    if (cache.has(filename)) return cache.get(filename).exports;
    const legacyModule = { exports: {} };
    cache.set(filename, legacyModule);
    const source = fs.readFileSync(filename, "utf8");
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(compiled, {
      module: legacyModule, exports: legacyModule.exports, Date: SnapshotDate,
      require(specifier) {
        if (!specifier.startsWith("./")) throw new Error("Only allowlisted relative data dependencies are supported.");
        return load(path.resolve(path.dirname(filename), `${specifier}.ts`));
      },
    }, { filename, timeout: 3000 });
    return legacyModule.exports;
  }
  const content = load(path.resolve(root, "lib/content.ts"));
  const fresh = load(path.resolve(root, "lib/new-articles.ts"));
  const scheduled = load(path.resolve(root, "lib/scheduled-articles-2026.ts"));
  const sites = load(path.resolve(root, "lib/site-config.ts"));
  const home = load(path.resolve(root, "lib/homepage-data.ts"));
  return plain({
    site: sites.SITE_CONFIGS[SITE_ID],
    articles: content.DEMO_ARTICLES.filter((article) => article.siteId === SITE_ID),
    authors: content.DEMO_AUTHORS.filter((author) => author.siteId === SITE_ID),
    sources: content.DEMO_SOURCES,
    categories: home.getHomeCategories("lt-LT"),
    newIds: fresh.NEW_ARTICLES.filter((article) => article.siteId === SITE_ID).map((article) => article.id),
    scheduledIds: scheduled.SCHEDULED_ARTICLES_2026.filter((article) => article.siteId === SITE_ID).map((article) => article.id),
  });
}

export function extractInlineLinks(text) {
  return [...text.matchAll(/\[\[([^\]|]+)\|([^\]]+)\]\]/g)].map((match) => ({
    offset: match.index, length: match[0].length, label: match[1], target: match[2],
  }));
}

export function makeInventory(data, at) {
  const ids = new Set(data.articles.map((article) => article.id));
  const authors = new Set(data.authors.map((author) => author.id));
  const sources = new Set(data.sources.map((source) => source.id));
  const counts = new Map();
  for (const article of data.articles) {
    for (const key of [`id:${article.id}`, `url:/straipsniai/${article.slug}`]) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const records = data.articles.map((article) => {
    const fixed = data.newIds.includes(article.id) || data.scheduledIds.includes(article.id);
    const inlineLinks = article.body.flatMap((text, blockIndex) => extractInlineLinks(text).map((link) => ({ blockIndex, ...link })));
    return {
      id: article.id, locale: article.locale, path: `/straipsniai/${article.slug}`, title: article.title,
      category: article.category, sourceState: article.publicationState,
      source: data.scheduledIds.includes(article.id) ? "lib/scheduled-articles-2026.ts" : data.newIds.includes(article.id) ? "lib/new-articles.ts" : "lib/content.ts",
      schedule: { original: article.publishAt, utc: new Date(article.publishAt).toISOString(), provenance: fixed ? "fixed-source-schedule" : "relative-demo-at-snapshot", historicalPublicationVerified: false },
      legacyEligibleAtSnapshot: ["published", "scheduled"].includes(article.publicationState) && Date.parse(article.publishAt) <= Date.parse(at),
      migrationApproval: "pending", bodyHash: sha256(JSON.stringify(article.body)), blockCount: article.body.length,
      authorIds: article.authorIds, sourceIds: article.sourceIds, relatedIds: article.relatedIds,
      inlineLinks,
      missingArticleTargets: [...new Set([...article.relatedIds, ...inlineLinks.filter((link) => link.target.startsWith("article:")).map((link) => link.target.slice(8))].filter((id) => !ids.has(id)))],
      missingAuthorIds: article.authorIds.filter((id) => !authors.has(id)),
      missingSourceIds: article.sourceIds.filter((id) => !sources.has(id)),
      authorIdentityReviewRequired: article.authorIds.some((id) => data.authors.find((author) => author.id === id)?.kind !== "organization"),
      featuredImage: article.featuredImage ?? null,
      productRecommendation: article.productRecommendation ?? true,
    };
  });
  return {
    schemaVersion: 1, siteId: SITE_ID, capturedAt: new Date(at).toISOString(),
    environment: "local-source-only", productionD1: "UNVERIFIED-not-exported",
    publicDeployment: "UNVERIFIED", historicalDates: "UNVERIFIED-source-schedules-are-not-deployment-evidence",
    totals: { articles: records.length, scheduled: data.scheduledIds.length, relativeDateArticles: records.filter((record) => record.schedule.provenance === "relative-demo-at-snapshot").length, authors: data.authors.length, sourceRecords: data.sources.length },
    collisions: [...counts].filter(([, count]) => count > 1).map(([key, count]) => ({ key, count })),
    routes: [...STATIC_ROUTES.map((slug) => `/${slug}`), ...data.authors.map((author) => `/autoriai/${author.slug}`), ...records.map((record) => record.path), "/sitemap.xml", "/robots.txt", "/llms.txt", "/llms-full.txt"],
    queryFilters: data.categories.map((category) => ({ url: `/straipsniai?tema=${category.slug}`, canonical: "/straipsniai", articleIds: category.articleIds })),
    records,
  };
}

/** Create a new immutable capture. Reusing an existing destination fails rather than overwrites. */
export function captureSnapshot(root, destination, at) {
  root = path.resolve(root);
  const migrationRoot = under(root, "migration/dovanos123");
  destination = path.resolve(destination);
  if (!destination.startsWith(`${migrationRoot}${path.sep}`)) throw new Error("Snapshot destination must be inside migration/dovanos123/.");
  if (fs.existsSync(destination)) throw new Error("Snapshot already exists; choose a new capture ID.");
  const data = readLegacyData(root, at);
  const inventory = makeInventory(data, at);
  if (inventory.collisions.length) throw new Error(`Legacy identity collisions: ${JSON.stringify(inventory.collisions)}`);
  const sourceFiles = [...new Set(SOURCE_FILES)].filter((relative) => fs.existsSync(under(root, relative)));
  const originals = sourceFiles.map((relative) => ({ path: relative, bytes: fs.readFileSync(under(root, relative)) }));
  const mediaPaths = new Set(data.articles.flatMap((article) => article.featuredImage ? [article.featuredImage.src] : []));
  for (const { bytes } of originals) {
    for (const match of bytes.toString("utf8").matchAll(/['"](\/images\/[a-zA-Z0-9_./-]+\.(?:webp|png|jpg|jpeg|svg))['"]/g)) mediaPaths.add(match[1]);
  }
  const media = [...mediaPaths].sort().map((url) => {
    const file = under(root, `public${url}`);
    const exists = fs.existsSync(file);
    const bytes = exists ? fs.readFileSync(file) : null;
    const webpSignatureValid = bytes && url.endsWith(".webp") ? bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" : null;
    return { url, exists, bytes: bytes?.length ?? 0, hash: bytes ? sha256(bytes) : null, webpSignatureValid, provenance: "legacy-source-review-required" };
  });
  inventory.media = media;
  inventory.sourceFiles = originals.map(({ path: relative, bytes }) => ({ path: relative, hash: sha256(bytes), bytes: bytes.length }));
  // The payload contains curated source data only, never D1 leads, env files or credentials.
  fs.mkdirSync(destination, { recursive: true });
  for (const { path: relative, bytes } of originals) {
    const file = under(destination, `source/${relative}`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, bytes, { flag: "wx" });
  }
  for (const asset of media.filter((item) => item.exists)) {
    const file = under(destination, `media${asset.url}`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.copyFileSync(under(root, `public${asset.url}`), file, fs.constants.COPYFILE_EXCL);
  }
  for (const [name, value] of [["legacy-data.json", data], ["inventory.json", inventory]]) fs.writeFileSync(under(destination, name), `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
  const manifest = {
    siteId: SITE_ID, capturedAt: inventory.capturedAt, activated: false,
    inventoryHash: sha256(fs.readFileSync(under(destination, "inventory.json"))),
    dataHash: sha256(fs.readFileSync(under(destination, "legacy-data.json"))),
    rollbackRules: ["restore-only-dovanos123", "preserve-new-leads-and-revisions", "apply-later-revocation-and-tombstones", "never-reactivate-unapproved-demo-fallback"],
    sourceFiles: inventory.sourceFiles, media,
  };
  fs.writeFileSync(under(destination, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
  return { destination, totals: inventory.totals, inventoryHash: manifest.inventoryHash, mediaMissing: media.filter((asset) => !asset.exists).map((asset) => asset.url) };
}

export function verifySnapshot(destination) {
  const manifest = JSON.parse(fs.readFileSync(under(destination, "manifest.json"), "utf8"));
  const checks = [
    { path: "inventory.json", hash: manifest.inventoryHash },
    { path: "legacy-data.json", hash: manifest.dataHash },
    ...manifest.sourceFiles.map((file) => ({ path: `source/${file.path}`, hash: file.hash })),
    ...manifest.media.filter((asset) => asset.exists).map((asset) => ({ path: `media${asset.url}`, hash: asset.hash })),
  ];
  for (const check of checks) {
    const file = under(destination, check.path);
    if (!fs.existsSync(file) || sha256(fs.readFileSync(file)) !== check.hash) throw new Error(`Snapshot missing or changed: ${check.path}`);
  }
  return { siteId: manifest.siteId, capturedAt: manifest.capturedAt, checkedFiles: checks.length, activated: manifest.activated };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const value = (flag) => args[args.indexOf(flag) + 1];
  if (args.includes("--verify")) {
    console.log(JSON.stringify(verifySnapshot(path.resolve(value("--verify"))), null, 2));
    process.exit(0);
  }
  if (!args.includes("--at") || !args.includes("--output")) throw new Error("Usage: node scripts/dovanos123-snapshot.mjs --at <ISO with timezone> --output migration/dovanos123/<capture-id>");
  const at = value("--at");
  if (!/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(at)) throw new Error("--at needs an explicit timezone.");
  console.log(JSON.stringify(captureSnapshot(process.cwd(), path.resolve(value("--output")), at), null, 2));
}
