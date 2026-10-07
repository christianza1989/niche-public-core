import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { projectContentPagesV2 } from "../lib/content-projection-v2.mjs";
import { v2RevisionHash, validateV2Package } from "../scripts/content-package-v2.mjs";
import * as media from "../lib/niche-media.mjs";
import { supportPageDefinitions } from "../scripts/dovanos123-support-pages.mjs";

// Test-only TS/TSX loader; production uses the real framework. No registry or studio mutations.
const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const nativeRequire = createRequire(import.meta.url), cache = new Map();
function load(relative) {
  const file = path.resolve(root, relative);
  if (cache.has(file)) return cache.get(file);
  const exports = {}, moduleObject = { exports };
  cache.set(file, exports);
  const javascript = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  const localRequire = name => {
    if (name.endsWith("niche-media.mjs")) return media;
    if (name.startsWith("@/") || name.startsWith(".")) {
      const base = name.startsWith("@/") ? path.resolve(root, name.slice(2)) : path.resolve(path.dirname(file), name);
      const resolved = [base, base + ".ts", base + ".tsx"].find(candidate => fs.existsSync(candidate));
      if (!resolved || !resolved.startsWith(root + path.sep)) throw new Error(`Unexpected local test dependency: ${name}`);
      return load(path.relative(root, resolved));
    }
    return nativeRequire(name);
  };
  vm.runInNewContext(javascript, { exports, module: moduleObject, require: localRequire, URL, Intl, Date, Set, Map, console }, { filename: file });
  cache.set(file, moduleObject.exports);
  return moduleObject.exports;
}
const { GiftSite } = load("components/gift/gift-site.tsx");
const { giftSchemas, giftMetadata, giftJsonLd } = load("lib/gift-seo.ts");
const { giftFilteredArticles } = load("lib/gift-content.ts");
const before = Date.parse("2026-10-04T20:00:00Z"), boundary = "2026-10-05T04:30:00.000Z";
function fixture() {
  const site = { id: "dovanos123", name: "Gift isolated test", canonicalHost: "gift.example", locale: "lt-LT", timezone: "Europe/Vilnius", brand: { accent: "#f06f4f" }, offer: "Only a test", contact: { email: "test@example.org" }, renderer: "gift", operatorName: "Test organization" };
  const author = { id: "real-org", siteId: site.id, locale: site.locale, slug: "redakcija", name: "Organizacijos redakcija", role: "Turinio projektas", bio: "Organizacijos autorystė", kind: "organization", sameAs: [] };
  const make = (id, type, slug, body = [{ type: "paragraph", text: "Izoliuoto bandymo pastraipa." }]) => ({ id, type, slug, siteId: site.id, contentVersion: 2, title: id, description: "Testo aprašymas", intent: "Only a test", body, media: [], links: [], externalLinks: [], publishAt: "2026-10-01T00:00:00.000Z", siteSnapshot: structuredClone(site), editorial: { category: "Dovanų idėjos", readingMinutes: 4, authors: type === "article" || type === "author" ? [author] : [], sources: [], datePublished: null, dateModified: null, featuredImageId: null, productRecommendation: false, relatedPageIds: [], commerceTargets: [] } });
  const current = make("lt-hand-casting-guide", "article", "straipsniai/dabartinis", [{ type: "richHeading", level: 2, content: [{ type: "link", text: "Pakartota idėja", target: { kind: "page", pageId: "lt-gifts-boyfriend" } }] }, { type: "richParagraph", content: [{ type: "text", text: "Pirma " }, { type: "link", text: "Pakartota idėja", target: { kind: "page", pageId: "lt-gifts-boyfriend" } }, { type: "text", text: " pabaiga." }] }, { type: "richList", ordered: true, items: [[{ type: "link", text: "Pakartota idėja", target: { kind: "page", pageId: "lt-gifts-boyfriend" } }]] }]);
  current.editorial.relatedPageIds = ["lt-gifts-boyfriend"];
  current.editorial.sources = [{ id: "source", title: "Tikras temos šaltinis", publisher: "Testas", url: "https://primary.example/source", accessedAt: "2026-10-01T00:00:00.000Z", public: true }];
  current.media = [640, 1280, 1600].map(width => ({ id: "image-" + width, src: `/content-assets/dovanos123/image-${width}.webp`, width, height: width * 9 / 16, alt: "Teminė iliustracija", rights: "Test only" }));
  current.editorial.featuredImageId = "image-1600";
  const future = make("lt-gifts-boyfriend", "article", "straipsniai/veliau");
  future.title = "SLAPTAS BŪSIMAS PAVADINIMAS"; future.publishAt = boundary;
  const pages = [make("gift-home", "home", ""), make("gift-articles", "index", "straipsniai"), make("gift-profile", "author", "autoriai/redakcija"), make("gift-privacy", "policy", "privatumas"), make("gift-contact", "contact", "kontaktai"), make("gift-terms", "policy", "taisykles"), current, future];
  for (const page of pages) { page.revisionHash = v2RevisionHash(page); page.approval = { status: "approved", revisionHash: page.revisionHash, approvedAt: "2026-10-01T00:00:00.000Z", actorId: "isolated-test-only" }; }
  const pkg = { schemaVersion: 2, siteId: site.id, canonicalHost: site.canonicalHost, locale: site.locale, site, pages, generatedAt: "2026-10-04T00:00:00.000Z" };
  validateV2Package(pkg);
  return pkg;
}
const project = (pkg, now) => projectContentPagesV2(pkg, [pkg], {}, { targets: [] }, now);
const htmlFor = (pkg, id, now = before, topic) => { const livePages = project(pkg, now); return renderToStaticMarkup(createElement(GiftSite, { pkg, page: livePages.find(page => page.id === id), livePages, topic })); };

test("article inline targets reveal in original heading/paragraph/list positions at exact boundary, then revoke", () => {
  const pkg = fixture();
  const privateHtml = htmlFor(pkg, "lt-hand-casting-guide");
  assert.doesNotMatch(privateHtml, /href="[^\"]*veliau|SLAPTAS BŪSIMAS/);
  assert.equal((privateHtml.match(/Pakartota idėja/g) || []).length, 3);
  const publicHtml = htmlFor(pkg, "lt-hand-casting-guide", Date.parse(boundary));
  assert.equal((publicHtml.match(/href="https:\/\/gift.example\/straipsniai\/veliau"/g) || []).length, 3);
  assert.match(publicHtml, /<h2><a[^>]+>Pakartota idėja<\/a><\/h2>/);
  assert.match(publicHtml, /<ol><li><a[^>]+>Pakartota idėja<\/a><\/li><\/ol>/);
  assert.match(publicHtml, /class="related-links"/);
  pkg.pages.find(page => page.id === "lt-gifts-boyfriend").approval.status = "revoked";
  assert.doesNotMatch(htmlFor(pkg, "lt-hand-casting-guide", Date.parse(boundary)), /href="[^\"]*veliau|SLAPTAS BŪSIMAS/);
});
test("home/index/authors do not leak future titles or create dangling navigation; images use actual family", () => {
  const pkg = fixture();
  for (const id of ["gift-home", "gift-articles", "gift-profile"]) assert.doesNotMatch(htmlFor(pkg, id), /SLAPTAS BŪSIMAS|href="\/apie"|href="\/slapukai"/);
  assert.match(htmlFor(pkg, "gift-home", Date.parse(boundary)), /SLAPTAS BŪSIMAS/);
  assert.match(htmlFor(pkg, "lt-hand-casting-guide"), /srcSet="[^\"]*640w[^\"]*1280w[^\"]*1600w"/i);
  assert.match(htmlFor(pkg, "lt-hand-casting-guide"), /width="1600" height="900"/);
  assert.match(htmlFor(pkg, "gift-home"), /href="#main-content"/);
  assert.match(htmlFor(pkg, "gift-home"), /<main id="main-content" tabindex="-1">/);
  assert.equal(giftFilteredArticles(pkg, project(pkg, before), "dovanos-jam").length, 0);
  assert.equal(giftFilteredArticles(pkg, project(pkg, Date.parse(boundary)), "dovanos-jam").length, 1);
  assert.equal(giftFilteredArticles(pkg, project(pkg, before), "uncontrolled-search").length, 0);
});
test("metadata/schema match visible facts, not schedule; organization and safe JSON-LD only", () => {
  const pkg = fixture(), live = project(pkg, before), page = live.find(p => p.id === "lt-hand-casting-guide");
  const schema = giftSchemas(pkg, page, live), meta = giftMetadata(pkg, page);
  assert.equal(schema[0]["@type"], "Article"); assert.equal(schema[0].author[0]["@type"], "Organization");
  assert.equal(schema[0].author[0].url, "https://gift.example/autoriai/redakcija");
  assert.equal(schema[0].datePublished, undefined); assert.equal(schema[0].dateModified, undefined);
  assert.equal(meta.openGraph.publishedTime, undefined);
  assert.equal(schema[1].itemListElement.at(-1).name, page.title);
  assert.equal(meta.alternates.canonical, page.url);
  assert.equal(giftMetadata(pkg, page, true).robots.index, false);
  assert.doesNotMatch(giftJsonLd({ title: "</script><script>alert(1)</script>" }), /<script|<\/script/);
  assert.doesNotMatch(htmlFor(pkg, "lt-hand-casting-guide"), /Memory Casting|Person|AggregateRating|Offer|datePublished/);
});

test("Shared article schema uses the actual projected index and truthful editorial dates across adapters", () => {
  const pkg = fixture(), live = project(pkg, before), page = live.find(p => p.id === "lt-hand-casting-guide");
  const index = live.find(p => p.type === "index");index.slug = "gidai";index.url = "https://gift.example/gidai";
  page.editorial.datePublished = "2026-10-01T08:00:00.000Z";page.editorial.dateModified = "2026-10-03T09:00:00.000Z";
  const navigation = {homeLabel:"Madbeauty",articleIndexSlug:"gidai",articleIndexLabel:"Gidai"};
  const schemas = giftSchemas(pkg,page,live,navigation);
  assert.equal(schemas[0].datePublished,page.editorial.datePublished);assert.equal(schemas[0].dateModified,page.editorial.dateModified);
  assert.equal(schemas[0].author[0]["@type"],"Organization");assert.equal(schemas[0].reviewedBy,undefined);
  assert.deepEqual(Array.from(schemas[1].itemListElement,x=>x.name),["Madbeauty","Gidai",page.title]);
  assert.equal(schemas[1].itemListElement[1].item,index.url);
  const collection=giftSchemas(pkg,index,live,navigation)[0];assert.equal(collection["@type"],"CollectionPage");assert.equal(collection.mainEntity.itemListElement.length,1);
  const noIndex=giftSchemas(pkg,page,live.filter(p=>p.id!==index.id),navigation);
  assert.equal(noIndex[1].itemListElement.length,2);assert.ok(!JSON.stringify(noIndex).includes("SLAPTAS BŪSIMAS"));
});
test("article index renders the approved orientation body, not just its description", () => {
  const pkg = fixture();
  const index = pkg.pages.find(page => page.id === "gift-articles");
  index.body = [{ type: "paragraph", text: "Pirmiausia pasirinkite gavėją, progą ir priimtiną biudžetą." }];
  index.revisionHash = v2RevisionHash(index); index.approval.revisionHash = index.revisionHash;
  assert.match(htmlFor(pkg, index.id), /Pirmiausia pasirinkite gavėją, progą ir priimtiną biudžetą\./);
});
test("support page plan retains all legacy paths without fictional Person or automatic approval", () => {
  const definitions = supportPageDefinitions({ name: "Redakcija", role: "Organizacija", bio: "AI naudojimas" });
  assert.equal(definitions.length, 12); assert.equal(new Set(definitions.map(p => p.id)).size, 12);
  for (const slug of ["", "straipsniai", "autoriai", "apie", "kontaktai", "redakcine-politika", "partneriu-nuorodu-atskleidimas", "privatumas", "slapukai", "taisykles", "autoriai/dovanos123-redakcija", "autoriai/aiste-redaktore"]) assert.ok(definitions.some(p => p.slug === slug));
  for (const slug of ["privatumas", "slapukai"]) assert.ok(definitions.find(p => p.slug === slug).checks.some(text => text.includes("LAUNCH BLOCKER")));
  assert.equal(definitions.find(p => p.slug === "autoriai/aiste-redaktore").type, "policy");
});
test("footer uses eligible original terms URL and does not invent an active automation-network link", () => {
  const pkg = fixture();
  const active = htmlFor(pkg, "gift-home");
  assert.match(active, /href="\/taisykles">Naudojimo taisyklės/);
  assert.doesNotMatch(active, /naudojimo-taisykles/);
  assert.match(active, /Mūsų verslas automatizuotas su verslomatika.lt/);
  assert.doesNotMatch(active, /href="[^\"]*verslomatika/);
  pkg.pages.find(page => page.id === "gift-terms").approval.status = "revoked";
  assert.doesNotMatch(htmlFor(pkg, "gift-home"), /href="\/taisykles"/);
});
test("contact form requires public privacy, keeps real email fallback and never requests marketing consent", () => {
  const pkg = fixture();
  const active = htmlFor(pkg, "gift-contact");
  assert.match(active, /action="\/uzklausa" method="post"/);
  for (const field of ["name", "email", "message", "consent", "website"]) assert.match(active, new RegExp(`name="${field}"`));
  assert.match(active, /href="\/privatumas"/); assert.match(active, /nėra prekių užsakymas ar sutikimas gauti reklaminį/);
  assert.match(active, /__nicheInterest/); assert.match(active, /globalPrivacyControl/); assert.match(active, /credentials:'omit'/);
  pkg.pages.find(page => page.slug === "privatumas").approval.status = "revoked";
  const inactive = htmlFor(pkg, "gift-contact");
  assert.doesNotMatch(inactive, /<form|action="\/uzklausa"/);
  assert.doesNotMatch(inactive, /__nicheInterest/);
  assert.match(inactive, /mailto:test@example.org/);
});
