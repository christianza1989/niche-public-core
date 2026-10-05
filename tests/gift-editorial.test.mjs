import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { legacyBody } from "../scripts/dovanos123-legacy-import.mjs";
import { supportPageDefinitions } from "../scripts/dovanos123-support-pages.mjs";
import { makeGiftEditorialCandidate, GIFT_REVIEW_IDS, INITIAL_GIFT_ARTICLES } from "../content/gift-editorial-2026-10-05.mjs";
import { bodyPlainText, inlineNodes, validateV2Package, v2RevisionHash, v2RevisionPayload } from "../scripts/content-package-v2.mjs";

// Capture source only. Synthetic approvals stay in memory, never in the actual studio or registry.
function fixture() {
  const data = JSON.parse(fs.readFileSync(new URL("../migration/dovanos123/20261004T200201Z/legacy-data.json", import.meta.url), "utf8"));
  const site = { id: "dovanos123", name: "Gift editorial test", canonicalHost: "gift-editorial.example", locale: "lt-LT", timezone: "Europe/Vilnius", brand: { accent: "#f06f4f" }, offer: "Only a test", contact: { email: "test@example.org" }, renderer: "gift", operatorName: "Test organization" };
  const { id, siteId, locale, slug, name, role, bio, kind, sameAs } = data.authors.find(item => item.kind === "organization");
  const author = { id, siteId, locale, slug, name, role, bio, kind, sameAs };
  const editorial = (authors = []) => ({ category: "Dovanų idėjos", readingMinutes: 4, authors, sources: [], datePublished: null, dateModified: null, featuredImageId: null, productRecommendation: false, relatedPageIds: [], commerceTargets: [] });
  const page = input => ({ siteId: site.id, contentVersion: 2, media: [], links: [], externalLinks: [], siteSnapshot: site, publishAt: "2026-10-04T00:00:00.000Z", intent: input.title, ...input });
  const ids = new Set(data.articles.map(item => item.id));
  const pages = data.articles.map(article => page({ id: article.id, type: "article", slug: `straipsniai/${article.slug}`, title: article.title, description: article.excerpt, body: legacyBody(article.body, ids), editorial: { ...editorial(), relatedPageIds: article.relatedArticleIds || [] } }));
  pages.push(...supportPageDefinitions(author).map(definition => page({ id: definition.id, type: definition.type, slug: definition.slug, title: definition.title, description: definition.description, body: definition.body, editorial: editorial(definition.author ? [author] : []) })));
  const assets = Object.fromEntries(["hand", "couple", "man"].map(key => [key, { id: `test-${key}`, src: `/content-assets/dovanos123/test-${key}.webp`, alt: `Test ${key}`, rights: "Synthetic test only", width: 1200, height: 800 }]));
  const commerce = { id: "memorycasting-information", url: "https://memorycasting.lt/", label: "Informacija", relationship: "Savininko projektas; ne bandymas", verified: true, checkedAt: "2026-10-05T00:00:00.000Z" };
  return { site: { ...site, pages }, assets, commerce };
}

test("editorial candidate closes only the reviewed dependency set and leaves legal drafts outside", () => {
  const { site, assets, commerce } = fixture(), original = JSON.stringify(site);
  const candidate = makeGiftEditorialCandidate(site, { assets, commerce, reviewedAt: "2026-10-05T00:00:00.000Z" });
  assert.equal(candidate.changes.length, 11); assert.equal(JSON.stringify(site), original);
  assert.ok(!GIFT_REVIEW_IDS.includes("gift-privacy")); assert.ok(!GIFT_REVIEW_IDS.includes("gift-terms"));
  assert.ok(candidate.losses.some(loss => loss.target === "lt-gifts-personalized"));
  const pages = candidate.changes.map(change => {
    const originalPage = site.pages.find(item => item.id === change.id);
    const { factChecks, ...publicInput } = change.input;
    const page = v2RevisionPayload({ ...originalPage, ...publicInput, media: change.input.media.map(item => Object.values(assets).find(asset => asset.id === item.id)) });
    page.revisionHash = v2RevisionHash(page); page.approval = { status: "approved", actorId: "in-memory-test-only", approvedAt: "2026-10-05T00:00:00.000Z", revisionHash: page.revisionHash };
    assert.ok(factChecks.length); // Preparation cannot accidentally grant approval.
    for (const node of inlineNodes(page)) if (node.type === "link" && node.target.kind === "page") assert.ok(GIFT_REVIEW_IDS.includes(node.target.pageId));
    return page;
  });
  const { pages: ignored, ...publicSite } = site;
  assert.equal(ignored.length, 41);
  validateV2Package({ schemaVersion: 2, siteId: site.id, canonicalHost: site.canonicalHost, locale: site.locale, site: publicSite, pages, generatedAt: "2026-10-05T00:00:00.000Z" });
});

test("reviewed initial guides have truthful title/author/claims and preserve old URLs and schedule", () => {
  const { site, assets, commerce } = fixture();
  const { changes } = makeGiftEditorialCandidate(site, { assets, commerce, reviewedAt: "2026-10-05T00:00:00.000Z" });
  for (const id of INITIAL_GIFT_ARTICLES) {
    const input = changes.find(change => change.id === id).input;
    assert.equal(input.editorial.authors[0].kind, "organization");
    assert.equal(input.editorial.datePublished, null);
    assert.ok(!("slug" in input)); assert.ok(!("publishAt" in input));
    assert.ok(bodyPlainText(input.body).length > 2000); // Guards against substituting old skeletal demos, not an SEO word quota.
    assert.doesNotMatch(bodyPlainText(input.body), /Kolegei|konkretaus prekės|Įtraukiau|pateikiu|10 000|4\.9\/5|100%/);
    assert.ok(input.editorial.sources.every(source => source.public && !source.url.includes("developers.google")));
    assert.equal(input.editorial.commerceTargets[0].id, "memorycasting-information");
  }
  const hand = changes.find(change => change.id === "lt-hand-casting-guide").input;
  assert.match(hand.title, /kaip išsirinkti/); assert.match(hand.description, /Ne gamintojo darbo instrukcija/);
  assert.match(bodyPlainText(hand.body), /kas padės/);
  const couple = changes.find(change => change.id === "lt-christmas-couple").input;
  assert.ok(!couple.body.some(block => block.content?.map(node => node.text).join("") === "Išvada"));
  assert.match(bodyPlainText(couple.body), /suderinę su pora/);
  assert.ok(bodyPlainText(changes.find(change => change.id === "gift-articles").input.body).length >= 120);
});
