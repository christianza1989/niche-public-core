import { createHash } from "node:crypto";
import {validateV2Package,v2RevisionHash} from './content-package-v2.mjs';

const SITE_ID = /^[a-z0-9][a-z0-9-]{1,62}$/;
const PAGE_SLUG = /^(?:[a-z0-9]+(?:[-/][a-z0-9]+)*)?$/;
const HOST = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/;
const HEX_HASH = /^[a-f0-9]{64}$/;

function fail(message) {
  throw new Error(`Invalid content package: ${message}`);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireString(value, label) {
  if (typeof value !== "string" || !value.trim()) fail(`${label} must be a non-empty string`);
  return value;
}

function validUtc(value, label) {
  requireString(value, label);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) || !Number.isFinite(Date.parse(value))) {
    fail(`${label} must be an ISO UTC timestamp`);
  }
}

export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function pageRevisionHash(page) {
  if(page.contentVersion===2)return v2RevisionHash(page);
  const snapshot = {
    siteId: page.siteId,
    type: page.type,
    slug: page.slug,
    title: page.title,
    description: page.description,
    intent: page.intent,
    body: page.body,
    ...(page.bodyProjection !== undefined ? {bodyProjection:page.bodyProjection} : {}),
    publishAt: page.publishAt,
    media: page.media,
    links: page.links,
    ...(page.externalLinks?.length ? { externalLinks: page.externalLinks } : {}),
  };
  return createHash("sha256").update(stableStringify(snapshot), "utf8").digest("hex");
}

export function isPageVisible(page, now = Date.now()) {
  return page.approval?.status === "approved"
    && page.approval.revisionHash === page.revisionHash
    && Date.parse(page.publishAt) <= now;
}

export function validateContentPackage(pkg) {
  if(pkg?.schemaVersion===2)return validateV2Package(pkg);
  if (!isRecord(pkg) || pkg.schemaVersion !== 1) fail("schemaVersion must be 1");
  if (!SITE_ID.test(requireString(pkg.siteId, "siteId"))) fail("siteId has an invalid format");
  const host = requireString(pkg.canonicalHost, "canonicalHost");
  if (!HOST.test(host) || host !== host.toLowerCase()) fail("canonicalHost must be a lower-case domain name");
  requireString(pkg.locale, "locale");
  validUtc(pkg.generatedAt, "generatedAt");
  if (!isRecord(pkg.site) || pkg.site.id !== pkg.siteId || pkg.site.canonicalHost !== host || pkg.site.locale !== pkg.locale) {
    fail("site identity must match package identity");
  }
  requireString(pkg.site.name, "site.name");
  requireString(pkg.site.timezone, "site.timezone");
  requireString(pkg.site.offer, "site.offer");
  if (!isRecord(pkg.site.brand) || !/^#[0-9a-fA-F]{6}$/.test(pkg.site.brand.accent)) fail("site.brand.accent must be a hex color");
  if (!isRecord(pkg.site.contact)) fail("site.contact is required");
  requireString(pkg.site.contact.email, "site.contact.email");
  if (pkg.site.contact.phone !== undefined && typeof pkg.site.contact.phone !== "string") fail("site.contact.phone must be a string when supplied");
  if (!Array.isArray(pkg.pages) || pkg.pages.length < 1) fail("pages must contain a homepage");

  const ids = new Set();
  const slugs = new Set();
  let homeCount = 0;
  for (const page of pkg.pages) {
    if(page.contentVersion!==undefined||page.editorial!==undefined||page.siteSnapshot!==undefined)fail('v2 page fields require schemaVersion 2');
    if (!isRecord(page) || page.siteId !== pkg.siteId) fail("page siteId mismatch");
    const id = requireString(page.id, "page.id");
    const slug = page.slug;
    if (typeof slug !== "string") fail(`page ${id} slug must be a string`);
    if (ids.has(id) || slugs.has(slug)) fail(`duplicate page id or slug: ${id}`);
    ids.add(id);
    slugs.add(slug);
    if (!PAGE_SLUG.test(slug) || slug.startsWith("niche/") || slug.startsWith("api/")) fail(`unsafe slug: ${slug}`);
    if (!["home", "service", "product", "guide", "faq", "location"].includes(page.type)) fail(`invalid page type: ${id}`);
    if ((page.type === "home") !== (slug === "")) fail(`home page must use an empty slug: ${id}`);
    if(page.bodyProjection!==undefined&&(page.type!=='home'||page.bodyProjection!=='canonical'))fail('bodyProjection must be canonical and is supported only for a fully canonical home renderer');
    if (page.type === "home") homeCount += 1;
    requireString(page.title, `page ${id} title`);
    requireString(page.description, `page ${id} description`);
    requireString(page.intent, `page ${id} intent`);
    validUtc(page.publishAt, `page ${id} publishAt`);
    if (!Array.isArray(page.body) || !page.body.length) fail(`page ${id} body is empty`);
    for (const block of page.body) {
      if (!isRecord(block)) fail(`page ${id} has an invalid block`);
      if (["paragraph", "heading"].includes(block.type)) requireString(block.text, `page ${id} block text`);
      else if (block.type === "list") {
        if (!Array.isArray(block.items) || !block.items.length || block.items.some((item) => typeof item !== "string" || !item.trim())) fail(`page ${id} has an invalid list`);
      } else if (block.type === "image") requireString(block.assetId, `page ${id} image assetId`);
      else fail(`page ${id} has an unsupported block type`);
      if (block.type === "heading" && ![2, 3].includes(block.level)) fail(`page ${id} has an invalid heading level`);
    }
    if (!Array.isArray(page.media) || !Array.isArray(page.links)) fail(`page ${id} media and links must be arrays`);
    if(page.media.length>60)fail(`page ${id} media exceeds 60 variants`);
    const mediaIds = new Set();
    for (const media of page.media) {
      const assetId = requireString(media.id, `page ${id} media.id`);
      if (mediaIds.has(assetId)) fail(`page ${id} has duplicate media id ${assetId}`);
      mediaIds.add(assetId);
      if (!new RegExp(`^/content-assets/${pkg.siteId}/[a-zA-Z0-9._-]+\\.(?:webp|avif)$`).test(media.src)) fail(`page ${id} has unsafe media src`);
      requireString(media.alt, `page ${id} media.alt`);
      requireString(media.rights, `page ${id} media.rights`);
      if (!Number.isInteger(media.width) || media.width <= 0 || !Number.isInteger(media.height) || media.height <= 0) fail(`page ${id} has invalid image dimensions`);
    }
    for (const block of page.body) if (block.type === "image" && !mediaIds.has(block.assetId)) fail(`page ${id} references missing asset ${block.assetId}`);
    for (const link of page.links) {
      requireString(link.targetPageId, `page ${id} link target`);
      requireString(link.label, `page ${id} link label`);
    }
    if (page.externalLinks !== undefined) {
      if (!Array.isArray(page.externalLinks)) fail(`page ${id} externalLinks must be an array`);
      for (const [index, link] of page.externalLinks.entries()) {
        if (!isRecord(link)) fail(`page ${id} external link ${index} must be an object`);
        const url = requireString(link.url, `page ${id} external link ${index} url`);
        requireString(link.label, `page ${id} external link ${index} label`);
        requireString(link.reason, `page ${id} external link ${index} reason`);
        let parsed;
        try { parsed = new URL(url); } catch { fail(`page ${id} external link ${index} has an invalid URL`); }
        if (!url.startsWith("https://") || parsed.protocol !== "https:" || !parsed.hostname || parsed.username || parsed.password) {
          fail(`page ${id} external link ${index} must use a public HTTPS URL without credentials`);
        }
      }
    }
    if (!HEX_HASH.test(page.revisionHash) || !isRecord(page.approval) || page.approval.status !== "approved" || page.approval.revisionHash !== page.revisionHash) {
      fail(`page ${id} is not approved for this revision`);
    }
    validUtc(page.approval.approvedAt, `page ${id} approvedAt`);
    requireString(page.approval.actorId, `page ${id} approval.actorId`);
    if (pageRevisionHash(page) !== page.revisionHash) fail(`page ${id} revision hash mismatch`);
  }
  if (homeCount !== 1) fail("exactly one home page is required");
  for (const page of pkg.pages) for (const link of page.links) if (!ids.has(link.targetPageId)) fail(`page ${page.id} links to unknown page ${link.targetPageId}`);
  return pkg;
}
