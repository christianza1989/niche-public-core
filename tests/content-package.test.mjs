import assert from "node:assert/strict";
import { test } from "node:test";
import { isPageVisible, pageRevisionHash, validateContentPackage } from "../scripts/content-package-core.mjs";

function fixture() {
  const page = {
    id: "home-1",
    siteId: "sample-site",
    type: "home",
    slug: "",
    title: "Pavyzdinis puslapis",
    description: "Trumpas aiškus paslaugos aprašymas.",
    intent: "Rasti paslaugą",
    body: [{ type: "paragraph", text: "Tikras paslaugos aprašymas ir naudinga informacija." }],
    publishAt: "2026-10-01T07:30:00.000Z",
    media: [],
    links: [],
  };
  page.revisionHash = pageRevisionHash(page);
  page.approval = { status: "approved", revisionHash: page.revisionHash, approvedAt: "2026-09-29T12:00:00.000Z", actorId: "review-agent" };
  return {
    schemaVersion: 1,
    siteId: "sample-site",
    canonicalHost: "sample-site.lt",
    locale: "lt-LT",
    generatedAt: "2026-09-29T13:00:00.000Z",
    site: {
      id: "sample-site", name: "Pavyzdinė svetainė", canonicalHost: "sample-site.lt", locale: "lt-LT",
      timezone: "Europe/Vilnius", brand: { accent: "#245b44" }, offer: "Aiški paslauga",
      contact: { email: "info@sample-site.lt", phone: "+37060000000" },
    },
    pages: [page],
  };
}

test('canonical home body capability changes approval hash and rejects tampering without changing legacy hashes',()=>{
 const pkg=fixture(),home=pkg.pages[0],legacyHash=home.revisionHash;
 home.bodyProjection='canonical';assert.notEqual(pageRevisionHash(home),legacyHash);
 assert.throws(()=>validateContentPackage(pkg),/hash|checksum|revision/i);
 home.revisionHash=pageRevisionHash(home);home.approval.revisionHash=home.revisionHash;
 assert.equal(validateContentPackage(pkg).pages[0].bodyProjection,'canonical');
 home.bodyProjection='partial';assert.throws(()=>validateContentPackage(pkg),/bodyProjection/);
});

test("approved immutable package passes validation", () => {
  assert.equal(validateContentPackage(fixture()).pages.length, 1);
});

test("responsive media permits 60 variants and rejects a 61st", () => {
  const pkg=fixture(),page=pkg.pages[0];
  page.media=Array.from({length:60},(_,i)=>({id:`asset-${i}`,src:`/content-assets/sample-site/asset-${i}.webp`,alt:`Originali kompozicija ${i}`,width:800,height:400,rights:'Synthetic test'}));
  page.revisionHash=pageRevisionHash(page);page.approval.revisionHash=page.revisionHash;
  assert.equal(validateContentPackage(pkg).pages[0].media.length,60);
  page.media.push({...page.media[0],id:'asset-61',src:'/content-assets/sample-site/asset-61.webp'});
  assert.throws(()=>validateContentPackage(pkg),/exceeds 60/);
});

test("a niche package may publish an email-only contact", () => {
  const pkg = fixture();
  delete pkg.site.contact.phone;
  assert.equal(validateContentPackage(pkg).site.contact.email, "info@sample-site.lt");
  pkg.site.contact.phone = "";
  assert.equal(validateContentPackage(pkg).site.contact.phone, "");
});

test("scheduled page is invisible until publishAt without a worker", () => {
  const page = fixture().pages[0];
  assert.equal(isPageVisible(page, Date.parse(page.publishAt) - 1), false);
  assert.equal(isPageVisible(page, Date.parse(page.publishAt)), true);
});

test("approval cannot survive a body edit", () => {
  const pkg = fixture();
  pkg.pages[0].body[0].text = "Pakeista po patvirtinimo";
  assert.throws(() => validateContentPackage(pkg), /revision hash mismatch/);
});

test("cross-site references are rejected", () => {
  const pkg = fixture();
  pkg.pages[0].siteId = "other-site";
  assert.throws(() => validateContentPackage(pkg), /page siteId mismatch/);
});

test("future link target can be packaged, but never points to a missing page", () => {
  const pkg = fixture();
  pkg.pages[0].links = [{ targetPageId: "future-page", label: "Būsimas gidas" }];
  pkg.pages[0].revisionHash = pageRevisionHash(pkg.pages[0]);
  pkg.pages[0].approval.revisionHash = pkg.pages[0].revisionHash;
  assert.throws(() => validateContentPackage(pkg), /unknown page/);
});

test("optional approved external sources preserve old hashes and protect new edits", () => {
  const pkg = fixture();
  const originalHash = pkg.pages[0].revisionHash;
  pkg.pages[0].externalLinks = [];
  assert.equal(pageRevisionHash(pkg.pages[0]), originalHash);
  assert.equal(validateContentPackage(pkg).pages.length, 1);

  pkg.pages[0].externalLinks = [{
    url: "https://example.org/research",
    label: "Tyrimo metodika",
    reason: "Paaiškina, kaip matuojamas rezultatas.",
  }];
  assert.notEqual(pageRevisionHash(pkg.pages[0]), originalHash);
  assert.throws(() => validateContentPackage(pkg), /revision hash mismatch/);
  pkg.pages[0].revisionHash = pageRevisionHash(pkg.pages[0]);
  pkg.pages[0].approval.revisionHash = pkg.pages[0].revisionHash;
  assert.equal(validateContentPackage(pkg).pages.length, 1);
  pkg.pages[0].externalLinks[0].reason = "Pakeista po patvirtinimo.";
  assert.throws(() => validateContentPackage(pkg), /revision hash mismatch/);
});

test("external sources must be labeled HTTPS links without credentials", () => {
  const pkg = fixture();
  pkg.pages[0].externalLinks = [{ url: "http://example.org/", label: "Šaltinis", reason: "Pagrindžia faktą" }];
  assert.throws(() => validateContentPackage(pkg), /public HTTPS URL/);
  pkg.pages[0].externalLinks[0].url = "https://person:secret@example.org/";
  assert.throws(() => validateContentPackage(pkg), /public HTTPS URL/);
  pkg.pages[0].externalLinks[0].url = "https://example.org/";
  pkg.pages[0].externalLinks[0].reason = "";
  assert.throws(() => validateContentPackage(pkg), /reason must be a non-empty string/);
});
