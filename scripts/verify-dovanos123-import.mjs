import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifySnapshot, sha256 } from "./dovanos123-snapshot.mjs";
import { legacyBody } from "./dovanos123-legacy-import.mjs";
import { validateV2Draft, v2RevisionHash } from "./content-package-v2.mjs";
import { supportPageDefinitions } from "./dovanos123-support-pages.mjs";

export function verifyGiftImport(capture, dataDir) {
  verifySnapshot(capture);
  const data = JSON.parse(fs.readFileSync(path.join(capture, "legacy-data.json"), "utf8"));
  const site = JSON.parse(fs.readFileSync(path.join(dataDir, "sites/dovanos123.json"), "utf8"));
  const receipt = JSON.parse(fs.readFileSync(path.join(dataDir, "gift-migrations/dovanos123.json"), "utf8"));
  const ids = new Set(data.articles.map((article) => article.id));
  const problems = [];
  const check = (condition, message) => { if (!condition) problems.push(message); };
  check(site.schemaVersion === 2 && site.renderer === "gift" && site.stage === "planning", "Site model/renderer/stage changed.");
  check(receipt.sourceHash === sha256(fs.readFileSync(path.join(capture, "legacy-data.json"))), "Capture receipt hash mismatch.");
  check(receipt.activated === false && receipt.approved === false, "Import must remain private.");
  const pageChecks = [];
  const supportChecks = [];
  const legacyDimensionCorrections = [];
  for (const article of data.articles) {
    const page = site.pages.find((item) => item.id === article.id);
    if (!page) { problems.push(`Missing ${article.id}`); continue; }
    const changes = [];
    const converted = legacyBody(article.body, ids, changes);
    check(page.slug === `straipsniai/${article.slug}`, `Changed URL ${article.id}`);
    check(page.title === article.title && page.description === article.excerpt, `Changed title/excerpt ${article.id}`);
    check(JSON.stringify(page.body) === JSON.stringify(converted), `Changed body/order/inline ${article.id}`);
    check(page.publishAt === new Date(article.publishAt).toISOString(), `Changed schedule moment ${article.id}`);
    check(page.editorial.datePublished === null && page.editorial.dateModified === null, `Invented history ${article.id}`);
    check(page.approval === null && page.publishedRevision === null && page.factChecks.length > 0, `Accidental approval ${article.id}`);
    check(page.editorial.sources.every((source) => source.public === true), `Private source ${article.id}`);
    check(v2RevisionHash(page) === receipt.pages[article.id]?.importedRevisionHash, `Edited import ${article.id}`);
    try { validateV2Draft(page, page.siteSnapshot); } catch (error) { problems.push(`${article.id}: ${error.message}`); }
    const asset = site.assets.find((item) => item.id === page.editorial.featuredImageId);
    check(!article.featuredImage || Boolean(asset), `Missing featured image ${article.id}`);
    if (asset) {
      const family = site.assets.filter((item) => item.groupId === asset.groupId);
      const original = JSON.parse(fs.readFileSync(path.join(dataDir, "media-originals/dovanos123", `${asset.groupId}.json`), "utf8"));
      check(family.every((item) => page.media.some((attached) => attached.id === item.id)), `Truncated media family ${article.id}`);
      check(family.every((item) => item.width <= original.width), `Upscaled media ${article.id}`);
      check(original.sourceSha256 === receipt.assets[article.featuredImage.src].sourceHash, `Changed private original ${article.id}`);
      if (original.width !== article.featuredImage.width || original.height !== article.featuredImage.height) legacyDimensionCorrections.push({ articleId: article.id, declared: [article.featuredImage.width, article.featuredImage.height], decoded: [original.width, original.height], public: [asset.width, asset.height] });
      for (const item of family) {
        const file = path.join(dataDir, "media/dovanos123", path.basename(item.src));
        check(fs.existsSync(file) && sha256(fs.readFileSync(file)) === item.sha256, `Changed media ${item.id}`);
      }
    }
    pageChecks.push({ id: article.id, path: `/${page.slug}`, inlineCorrections: changes.length, mediaVariants: page.media.length });
  }
  const supportFile = path.join(dataDir, "gift-migrations/dovanos123-support.json");
  if (fs.existsSync(supportFile)) {
    const support = JSON.parse(fs.readFileSync(supportFile, "utf8"));
    const author = data.authors.find(item => item.kind === "organization");
    check(support.approved === false && support.activated === false, "Support pages must remain private.");
    for (const definition of supportPageDefinitions(author)) {
      const page = site.pages.find(item => item.id === definition.id);
      if (!page) { problems.push(`Missing support page ${definition.id}`); continue; }
      check(page.slug === definition.slug && page.type === definition.type, `Changed support path/type ${definition.id}`);
      check(page.approval === null && page.publishedRevision === null && page.factChecks.length > 0, `Accidental support approval ${definition.id}`);
      check(page.editorial.datePublished === null && page.editorial.dateModified === null, `Invented support history ${definition.id}`);
      check(v2RevisionHash(page) === support.pages[page.id]?.revisionHash, `Edited support draft ${definition.id}`);
      try { validateV2Draft(page, page.siteSnapshot); } catch (error) { problems.push(`${page.id}: ${error.message}`); }
      supportChecks.push({ id: page.id, path: "/" + page.slug, mediaVariants: page.media.length });
    }
  }
  for (const asset of site.assets) {
    const file = path.join(dataDir, "media/dovanos123", path.basename(asset.src));
    check(fs.existsSync(file) && sha256(fs.readFileSync(file)) === asset.sha256, `Changed asset ${asset.id}`);
  }
  if (problems.length) throw new Error(`Gift import verification failed:\n${problems.join("\n")}`);
  return { checkedAt: new Date().toISOString(), siteId: site.id, captureHash: receipt.sourceHash, pagesChecked: pageChecks.length, supportPagesChecked: supportChecks.length, articleAssetFamilies: Object.keys(receipt.assets).length, totalAssetFamilies: new Set(site.assets.map(asset => asset.groupId)).size, responsiveFiles: site.assets.length, approved: 0, publicHostActivated: false, legacyDimensionCorrections, checks: pageChecks, supportChecks };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [capture, dataDir, reportDir] = process.argv.slice(2);
  if (!capture || !dataDir) throw new Error("Usage: node scripts/verify-dovanos123-import.mjs <capture> <studio-data-dir>");
  const report = verifyGiftImport(path.resolve(capture), path.resolve(dataDir));
  if (reportDir) {
    const destination = path.resolve(reportDir), allowed = path.resolve("output/dovanos123-integration");
    if (destination !== allowed && !destination.startsWith(allowed + path.sep)) throw new Error("Verification reports must stay under output/dovanos123-integration.");
    fs.mkdirSync(destination, { recursive: true });
    const filename = `import-${report.checkedAt.replace(/[:.]/g, "-")}.json`;
    fs.writeFileSync(path.join(destination, filename), JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
    console.log(JSON.stringify({ ...report, reportFile: path.join(destination, filename) }, null, 2));
  } else console.log(JSON.stringify(report, null, 2));
}
