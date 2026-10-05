import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { extractInlineLinks, sha256, verifySnapshot } from "./dovanos123-snapshot.mjs";

export function legacyInline(text, articleIds, changes = []) {
  const result = [];
  let cursor = 0;
  for (const link of extractInlineLinks(text)) {
    if (link.offset > cursor) result.push({ type: "text", text: text.slice(cursor, link.offset) });
    let target;
    if (link.target.startsWith("article:")) {
      const pageId = link.target.slice(8);
      if (articleIds.has(pageId)) target = { kind: "page", pageId };
    } else {
      try {
        const url = new URL(link.target);
        if (url.protocol === "https:" && !url.username && !url.password && !url.port) target = { kind: "external", url: url.href };
      } catch { /* Invalid targets remain readable labels and have an explicit loss report. */ }
    }
    if (target) result.push({ type: "link", text: link.label, target });
    else {
      result.push({ type: "text", text: link.label });
      changes.push({ reason: "ineligible-target-plain-label", originalTarget: link.target, label: link.label, offset: link.offset });
    }
    cursor = link.offset + link.length;
  }
  if (cursor < text.length) result.push({ type: "text", text: text.slice(cursor) });
  return result.length ? result : [{ type: "text", text }];
}

export function legacyBody(body, articleIds, changes = []) {
  const result = [];
  for (let index = 0; index < body.length; index++) {
    const text = body[index];
    const heading = /^(#{2,3}) (.*)$/s.exec(text);
    if (heading) result.push({ type: "richHeading", level: heading[1].length, content: legacyInline(heading[2], articleIds, changes) });
    else if (text.startsWith("• ")) {
      const items = [];
      while (index < body.length && body[index].startsWith("• ")) items.push(legacyInline(body[index++].slice(2), articleIds, changes));
      index--;
      result.push({ type: "richList", ordered: false, items });
    } else result.push({ type: "richParagraph", content: legacyInline(text, articleIds, changes) });
  }
  return result;
}

const writeReceipt = async (file, value) => {
  const temporary = `${file}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await fs.rename(temporary, file);
};

/** Studio-only migration. No approval, export, public import or domain activation occurs. */
export async function importLegacy({ capture, studioRoot, dataDir, model }) {
  const verified = verifySnapshot(capture);
  if (verified.siteId !== "dovanos123" || verified.activated) throw new Error("Expected a private Dovanos123 snapshot.");
  const dataBytes = await fs.readFile(path.join(capture, "legacy-data.json"));
  const data = JSON.parse(dataBytes);
  const inventory = JSON.parse(await fs.readFile(path.join(capture, "inventory.json"), "utf8"));
  const fingerprint = sha256(dataBytes);
  const receiptDir = path.join(dataDir, "gift-migrations");
  await fs.mkdir(receiptDir, { recursive: true });
  await fs.mkdir(path.join(dataDir, "sites"), { recursive: true });
  const receiptFile = path.join(receiptDir, "dovanos123.json");
  const lockFile = path.join(receiptDir, "dovanos123.lock");
  const lock = await fs.open(lockFile, "wx").catch(() => { throw new Error("Gift import already locked; inspect the existing migration process before retry."); });
  await lock.writeFile(JSON.stringify({ pid: process.pid, capture, createdAt: new Date().toISOString() }));
  try {
    let receipt;
    try { receipt = JSON.parse(await fs.readFile(receiptFile, "utf8")); } catch (error) { if (error.code !== "ENOENT") throw error; }
    if (receipt && receipt.sourceHash !== fingerprint) throw new Error("A different capture is already attached; reconcile a new migration revision, do not overwrite.");
    receipt ??= { siteId: "dovanos123", sourceHash: fingerprint, capturedAt: verified.capturedAt, activated: false, approved: false, assets: {}, pages: {}, adjustments: [], privateSourceIds: data.sources.filter((source) => source.public === false).map((source) => source.id) };
    model ??= await import(pathToFileURL(path.join(studioRoot, "src/model.mjs")).href);
    if (path.resolve(model.DATA) !== path.resolve(dataDir)) throw new Error("Studio DATA differs from explicit migration destination.");
    let site;
    try { site = await model.getSite("dovanos123"); } catch (error) { if (error.status !== 404) throw error; }
    if (site && (site.schemaVersion !== 2 || site.renderer !== "gift" || site.canonicalHost !== "dovanos123.lt")) throw new Error("Existing gift site has a different model; preserve it and reconcile explicitly.");
    if (site) for (const article of data.articles) {
      const collision = site.pages.find((page) => page.id === article.id || page.slug === `straipsniai/${article.slug}`);
      if (collision && !receipt.pages[article.id]) throw new Error(`Existing page without this migration receipt: ${article.id}`);
      if (collision && (collision.id !== article.id || collision.slug !== `straipsniai/${article.slug}`)) throw new Error(`ID/slug conflict: ${article.id}`);
    }
    if (!site) {
      site = await model.createSite({ canonicalHost: "dovanos123.lt", name: data.site.name, offer: data.site.description, schemaVersion: 2, renderer: "gift" });
      await model.editSite("dovanos123", { brand: { accent: data.site.accent }, audience: "Žmonės, ieškantys dovanos pagal gavėją, progą ir biudžetą.", facts: "Dovanos123 yra dovanų pasirinkimo informacinis portalas. Savininkas nurodė, kad MemoryCasting yra jo rankų liejimo rinkinių projektas. Pardavimas vyksta atskirame puslapyje; produkto kainos, checkout ir išsiuntimas šiame portale netvirtinami. Importuotas turinys laukia redakcinės patikros.", stage: "planning" });
    }
    await writeReceipt(receiptFile, receipt);
    const articleIds = new Set(data.articles.map((article) => article.id));
    const results = [];
    for (const article of data.articles) {
      const existingReceipt = receipt.pages[article.id];
      if (existingReceipt) {
        const current = (await model.getSite("dovanos123")).pages.find((page) => page.id === article.id);
        if (!current) throw new Error(`Previously imported page disappeared: ${article.id}`);
        results.push({ id: article.id, status: model.revisionHash(current) === existingReceipt.importedRevisionHash ? "unchanged" : "preserved-edited-revision" });
        continue;
      }
      const changes = [];
      const body = legacyBody(article.body, articleIds, changes);
      const authorSnapshots = article.authorIds.map((id) => {
        const author = data.authors.find((item) => item.id === id);
        if (!author) throw new Error(`Missing legacy author ${id}`);
        const { slug, name, role, bio, sameAs, siteId, locale } = author;
        return { id, slug, name, role, bio, sameAs, siteId, locale, kind: author.kind ?? "person" };
      });
      const sources = article.sourceIds.flatMap((id) => {
        const source = data.sources.find((item) => item.id === id);
        if (!source) throw new Error(`Missing legacy source ${id}`);
        if (source.public === false) return [];
        return [{ ...source, public: true, accessedAt: new Date(source.accessedAt).toISOString() }];
      });
      let featuredImageId = null;
      if (article.featuredImage) {
        const src = article.featuredImage.src;
        if (!receipt.assets[src]) {
          const bytes = await fs.readFile(path.join(capture, "media", src));
          const asset = await model.saveResponsiveAsset("dovanos123", {
            mime: "image/webp", alt: article.featuredImage.alt, credit: "",
            rights: "Esama projekto redakcinė iliustracija; kilmę ir teises patikrinti prieš approval.",
            prompt: `Migracijos šaltinis: ${src}; snapshot ${verified.capturedAt}; originalus generavimo prompt šiame capture nepatvirtintas.`,
          }, bytes);
          receipt.assets[src] = { id: asset.id, variants: asset.variants.map((variant) => variant.id), sourceHash: sha256(bytes), originalUrl: src };
          await writeReceipt(receiptFile, receipt);
        }
        featuredImageId = receipt.assets[src].id;
      }
      const editorial = {
        category: article.category, readingMinutes: article.readingMinutes, authors: authorSnapshots, sources,
        datePublished: null, dateModified: null, productRecommendation: article.productRecommendation ?? true,
        featuredImageId: null, relatedPageIds: article.relatedIds.filter((id) => articleIds.has(id)),
        commerceTargets: article.productRecommendation !== false ? [{ id: "memorycasting-hand-casting", url: data.site.productUrl, label: data.site.productName, relationship: "Savininko rankų liejimo rinkinių projektas; pardavimas vyksta atskirai.", verified: false, checkedAt: null }] : [],
      };
      const page = await model.addPage("dovanos123", {
        id: article.id, type: "article", slug: `straipsniai/${article.slug}`, title: article.title,
        description: article.excerpt, intent: article.title, publishAt: new Date(article.publishAt).toISOString(), body, editorial, cluster: article.category,
      });
      const sourceRecord = inventory.records.find((record) => record.id === article.id);
      const factChecks = [
        "Importuotas legacy turinys: patikrinti teiginius, nuorodas ir naudingumą prieš naujos revizijos approval.",
        "Tikra pirmos publikacijos ir reikšmingo atnaujinimo data nepatvirtinta; publishAt yra šaltinio planas.",
        ...(sourceRecord.authorIdentityReviewRequired ? ["Asmeninio demo autoriaus tapatybė nepatvirtinta: būtina patikra arba dokumentuota organizacijos autorystės korekcija."] : []),
        ...(article.featuredImage ? ["Vaizdo kilmę, teises, alt ir tikrą teminį atvaizdavimą patikrinti prieš approval."] : []),
        ...(article.productRecommendation !== false ? ["MemoryCasting komercinio tikslo prieinamumas ir produkto kelias nepatikrinti."] : []),
        ...(changes.length ? ["Inline target korekcijos yra migracijos ataskaitoje; peržiūrėti plain-label atitikmenis."] : []),
      ];
      const final = await model.editPage("dovanos123", page.id, { editorial: { ...editorial, featuredImageId }, media: featuredImageId ? [{ id: featuredImageId }] : [], factChecks });
      receipt.pages[article.id] = { importedRevisionHash: model.revisionHash(final), bodyHash: sourceRecord.bodyHash, originalState: article.publicationState, originalPath: sourceRecord.path, scheduleProvenance: sourceRecord.schedule.provenance, status: "review", authorIdentityReviewRequired: sourceRecord.authorIdentityReviewRequired };
      receipt.adjustments.push(...changes.map((change) => ({ pageId: article.id, ...change })));
      await writeReceipt(receiptFile, receipt);
      results.push({ id: article.id, status: "imported-review" });
    }
    return { siteId: "dovanos123", sourceHash: fingerprint, activated: false, approved: false, pages: results, assetFamilies: Object.keys(receipt.assets).length, receiptFile };
  } finally {
    await lock.close();
    await fs.unlink(lockFile);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const value = (flag) => args[args.indexOf(flag) + 1];
  for (const required of ["--capture", "--studio-root", "--data-dir"]) if (!args.includes(required)) throw new Error(`Required ${required}; import destinations must be explicit.`);
  const capture = path.resolve(value("--capture"));
  const studioRoot = path.resolve(value("--studio-root"));
  const dataDir = path.resolve(value("--data-dir"));
  process.env.STUDIO_DATA_DIR = dataDir;
  console.log(JSON.stringify(await importLegacy({ capture, studioRoot, dataDir }), null, 2));
}
