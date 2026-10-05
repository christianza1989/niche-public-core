import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { makeGiftEditorialCandidate, GIFT_REVIEW_IDS } from "../content/gift-editorial-2026-10-05.mjs";
import { verifySnapshot, sha256 } from "./dovanos123-snapshot.mjs";

const args = process.argv.slice(2), value = flag => args[args.indexOf(flag) + 1];
for (const flag of ["--capture", "--studio-root", "--data-dir", "--source-dir", "--output-dir"]) if (!args.includes(flag)) throw new Error(`Required ${flag}`);
if (!args.includes("--prepare")) throw new Error("Explicit --prepare required. This tool never approves or activates content.");
const capture = path.resolve(value("--capture")), studioRoot = path.resolve(value("--studio-root")), dataDir = path.resolve(value("--data-dir"));
const sourceDir = path.resolve(value("--source-dir")), outputDir = path.resolve(value("--output-dir"));
const manifest = verifySnapshot(capture);
if (manifest.siteId !== "dovanos123") throw new Error("Unexpected source site.");
process.env.STUDIO_DATA_DIR = dataDir;
const model = await import(pathToFileURL(path.join(studioRoot, "src/model.mjs")).href);
if (path.resolve(model.DATA) !== dataDir) throw new Error("Unexpected studio DATA.");
const receiptFile = path.join(dataDir, "gift-editorial/dovanos123-20261005.json");
const lockFile = path.join(dataDir, "gift-migrations/dovanos123.lock");
await fs.mkdir(path.dirname(lockFile), { recursive: true });
const lock = await fs.open(lockFile, "wx");
await lock.writeFile(JSON.stringify({ pid: process.pid, kind: "editorial-candidate", createdAt: new Date().toISOString() }));
const saveJson = async (file, data) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file + ".tmp", JSON.stringify(data, null, 2) + "\n");
  await fs.rename(file + ".tmp", file);
};
try {
  let receipt;
  try { receipt = JSON.parse(await fs.readFile(receiptFile, "utf8")); } catch (error) { if (error.code !== "ENOENT") throw error; }
  let site = await model.getSite("dovanos123");
  if (site.schemaVersion !== 2 || site.renderer !== "gift" || site.stage !== "planning") throw new Error("Private gift planning site required.");
  if (!receipt) {
    if (site.pages.some(page => page.approval || page.publishedRevision)) throw new Error("First preparation refuses any existing approval; review existing revisions explicitly.");
    const imported = JSON.parse(await fs.readFile(path.join(dataDir, "gift-migrations/dovanos123.json"), "utf8"));
    const support = JSON.parse(await fs.readFile(path.join(dataDir, "gift-migrations/dovanos123-support.json"), "utf8"));
    const original = { ...imported.pages, ...support.pages };
    for (const page of site.pages) if (!original[page.id] || model.revisionHash(page) !== (original[page.id].importedRevisionHash ?? original[page.id].revisionHash)) throw new Error(`Preserve unrelated editorial revision: ${page.id}`);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(path.join(outputDir, "before-site.json"), JSON.stringify(site, null, 2) + "\n", { flag: "wx" });
    receipt = { siteId: site.id, capture: manifest.capturedAt, createdAt: new Date().toISOString(), beforeHashes: Object.fromEntries(site.pages.map(page => [page.id, model.revisionHash(page)])), assets: {}, changes: {}, approved: false, activated: false, outputDir };
    await saveJson(receiptFile, receipt);
  }
  if (receipt.capture !== manifest.capturedAt || receipt.outputDir !== outputDir) throw new Error("Editorial receipt/source/output mismatch.");
  const prompts = JSON.parse(await fs.readFile(path.join(sourceDir, "prompts.json"), "utf8"));
  for (const [key, filename, alt] of [
    ["hand", "hand-casting-editorial-v2.png", "AI iliustracija: dviejų susikibusių rankų skulptūra ant pagrindo"],
    ["couple", "christmas-couple-editorial-v2.png", "Popieriaus koliažo AI iliustracija: pora prie stalo su kalėdine dovana"],
    ["man", "christmas-man-editorial-v2.png", "AI iliustracija: puodelis, užrašinė ir kelioninė rankinė ant šviesaus stalo"],
  ]) {
    const bytes = await fs.readFile(path.join(sourceDir, filename)), sourceHash = sha256(bytes);
    if (receipt.assets[key]) { if (receipt.assets[key].sourceHash !== sourceHash) throw new Error(`Generated asset changed: ${key}`); continue; }
    const asset = await model.saveResponsiveAsset("dovanos123", { mime: "image/png", alt, credit: "AI redakcinė iliustracija, ne konkretaus produkto ar jo bandymo nuotrauka.", rights: "Sukurta šiam projektui naudojant OpenAI imagegen 2026-10-05; originali redakcinė AI iliustracija be prekės ženklų. Generavimo aprašas ir originalas išsaugoti privačiai.", prompt: prompts.prompts[key] }, bytes);
    receipt.assets[key] = { id: asset.id, groupId: asset.groupId, sourceHash, filename, variants: asset.variants.map(item => ({ id: item.id, src: item.src, width: item.width, height: item.height, sha256: item.sha256 })) };
    await saveJson(receiptFile, receipt);
  }
  const registry = JSON.parse(await fs.readFile(new URL("../config/commerce-targets.json", import.meta.url), "utf8"));
  const target = registry.targets.find(item => item.id === "memorycasting-information");
  if (!target || target.purpose !== "information" || target.status !== "ready" || target.canonicalUrl !== "https://memorycasting.lt/" || Date.parse(target.expiresAt) <= Date.now()) throw new Error("Current informational commerce verification required.");
  if (!receipt.plan) {
    const beforeSite = JSON.parse(await fs.readFile(path.join(outputDir, "before-site.json"), "utf8"));
    const commerce = { id: target.id, url: target.canonicalUrl, label: "Memory Casting: rankų liejimo rinkinių informacija", relationship: "Šio portalo savininko projektas; komercinė informacinė rekomendacija, ne nepriklausomas bandymas ar patvirtintas checkout.", verified: true, checkedAt: receipt.createdAt };
    receipt.plan = makeGiftEditorialCandidate(beforeSite, { assets: receipt.assets, reviewedAt: receipt.createdAt, commerce });
    // Correct all six legacy fictional bylines, but never approve the other three pages.
    for (const page of beforeSite.pages.filter(page => page.editorial.authors.some(author => author.kind === "person"))) {
      if (GIFT_REVIEW_IDS.includes(page.id)) continue;
      receipt.plan.changes.push({ id: page.id, authorCorrectionOnly: true, input: { editorial: { ...page.editorial, authors: [receipt.plan.author], dateModified: receipt.createdAt }, factChecks: page.factChecks.filter(note => !note.includes("Asmeninio demo autoriaus")).concat("Organizacijos byline korekcija atlikta; visas šio trumpo ar seno straipsnio turinys dar nėra redakciškai priimtas.") } });
    }
    await saveJson(receiptFile, receipt);
  }
  if (args.includes("--refresh-candidate")) {
    if (typeof model.editDraftAssetMetadata !== "function") throw new Error("Fresh studio metadata API required; do not rewrite raw studio data.");
    for (const id of GIFT_REVIEW_IDS) {
      const page = site.pages.find(item => item.id === id);
      if (page.approval || page.publishedRevision || model.revisionHash(page) !== receipt.changes[id]?.revisionHash) throw new Error(`Refresh preserves newer/approved revision: ${id}`);
    }
    for (const [key, alt, credit] of [
      ["hand", "Dviejų susikibusių rankų skulptūros iliustracija ant apvalaus pagrindo", "Rankų liejinio kompozicijos iliustracija, ne konkretaus rinkinio rezultato nuotrauka."],
      ["couple", "Popieriaus koliažo iliustracija: pora prie stalo su kalėdine dovana", ""],
      ["man", "Puodelio, užrašinės ir kelioninės rankinės iliustracija ant šviesaus stalo", ""],
    ]) {
      site = await model.getSite("dovanos123");
      const asset = site.assets.find(item => item.id === receipt.assets[key].id);
      if (asset.alt === alt && asset.credit === credit) continue;
      const familyIds = new Set(site.assets.filter(item => item.groupId === asset.groupId).map(item => item.id));
      const affected = site.pages.filter(page => page.media.some(item => familyIds.has(item.id)));
      for (const page of affected) if (!GIFT_REVIEW_IDS.includes(page.id) || page.approval || page.publishedRevision || model.revisionHash(page) !== receipt.changes[page.id]?.revisionHash) throw new Error(`Metadata refresh preserves unrelated/approved page: ${page.id}`);
      const previousHashes = Object.fromEntries(affected.map(page => [page.id, model.revisionHash(page)]));
      const changed = await model.editDraftAssetMetadata(site.id, asset.id, { alt, credit }, "codex-gift-editorial-private-review");
      site = await model.getSite(site.id);
      for (const id of changed.affectedPageIds) {
        receipt.changes[id].amendments ??= [];
        receipt.changes[id].amendments.push({ reason: "semantic-image-description-with-private-generation-provenance", previousHash: previousHashes[id] });
        receipt.changes[id].revisionHash = model.revisionHash(site.pages.find(page => page.id === id));
      }
      receipt.metadataChanges ??= []; receipt.metadataChanges.push({ key, alt, credit, ...changed });
      await saveJson(receiptFile, receipt);
    }
    const beforeSite = JSON.parse(await fs.readFile(path.join(outputDir, "before-site.json"), "utf8"));
    const refreshed = makeGiftEditorialCandidate(beforeSite, { assets: receipt.assets, reviewedAt: receipt.createdAt, commerce: receipt.plan.changes.find(change => change.id === "gift-home").input.editorial.commerceTargets[0] });
    for (const next of refreshed.changes) {
      site = await model.getSite("dovanos123");
      const page = site.pages.find(item => item.id === next.id), currentHash = model.revisionHash(page);
      if (page.approval || page.publishedRevision || currentHash !== receipt.changes[page.id].revisionHash) throw new Error(`Content refresh preserves newer/approved revision: ${page.id}`);
      const comparable = { ...page, ...next.input, editorial: { ...next.input.editorial, dateModified: page.editorial.dateModified }, media: page.media };
      const previous = receipt.plan.changes.find(change => change.id === page.id);
      if (model.revisionHash(comparable) !== currentHash) {
        next.input.editorial.dateModified = new Date().toISOString();
        const updated = await model.editPage(site.id, page.id, next.input);
        receipt.changes[page.id].amendments ??= [];
        receipt.changes[page.id].amendments.push({ reason: "independent-ai-editorial-review-corrections", previousHash: currentHash });
        receipt.changes[page.id].revisionHash = model.revisionHash(updated); previous.input = next.input;
      }
    }
    receipt.plan.losses = refreshed.losses; await saveJson(receiptFile, receipt);
  }
  if (args.includes("--amend-index")) {
    const page = site.pages.find(item => item.id === "gift-articles");
    if (page.approval || page.publishedRevision || model.revisionHash(page) !== receipt.changes[page.id]?.revisionHash) throw new Error("Index amendment cannot overwrite a newer/approved revision.");
    const beforeSite = JSON.parse(await fs.readFile(path.join(outputDir, "before-site.json"), "utf8"));
    const refreshed = makeGiftEditorialCandidate(beforeSite, { assets: receipt.assets, reviewedAt: receipt.createdAt, commerce: receipt.plan.changes.find(change => change.id === "gift-home").input.editorial.commerceTargets[0] });
    const next = refreshed.changes.find(change => change.id === page.id);
    const previous = receipt.plan.changes.find(change => change.id === page.id);
    if (JSON.stringify(previous.input.body) !== JSON.stringify(next.input.body)) {
      const input = { ...next.input, editorial: { ...next.input.editorial, dateModified: new Date().toISOString() } };
      const updated = await model.editPage(site.id, page.id, input);
      receipt.changes[page.id].amendments ??= [];
      receipt.changes[page.id].amendments.push({ reason: "useful-index-orientation-before-independent-review", previousHash: receipt.changes[page.id].revisionHash });
      receipt.changes[page.id].revisionHash = model.revisionHash(updated);
      previous.input = input; await saveJson(receiptFile, receipt);
    }
  }
  for (const change of receipt.plan.changes) {
    site = await model.getSite("dovanos123");
    const page = site.pages.find(item => item.id === change.id), currentHash = model.revisionHash(page);
    if (receipt.changes[change.id]) {
      if (currentHash !== receipt.changes[change.id].revisionHash) throw new Error(`Preserve newer revision; preparation stops: ${change.id}`);
      continue;
    }
    if (currentHash !== receipt.beforeHashes[change.id] || page.approval || page.publishedRevision) throw new Error(`Concurrent revision/approval: ${change.id}`);
    const updated = await model.editPage(site.id, page.id, change.input);
    receipt.changes[page.id] = { previousHash: currentHash, revisionHash: model.revisionHash(updated), authorCorrectionOnly: change.authorCorrectionOnly === true };
    await saveJson(receiptFile, receipt);
  }
  site = await model.getSite("dovanos123");
  for (const page of site.pages) if (!receipt.changes[page.id] && model.revisionHash(page) !== receipt.beforeHashes[page.id]) throw new Error(`Unrelated page changed: ${page.id}`);
  const review = { siteId: site.id, canonicalHost: site.canonicalHost, sourceCapture: manifest.capturedAt, preparedAt: receipt.createdAt, approved: false, activated: false, site: site.pages.find(page => page.type === "home").siteSnapshot, assets: receipt.assets, sources: receipt.plan.changes.filter(change => GIFT_REVIEW_IDS.includes(change.id)).flatMap(change => change.input.editorial.sources), losses: receipt.plan.losses, pages: site.pages.filter(page => GIFT_REVIEW_IDS.includes(page.id)).map(page => ({ ...model.revisionPayload(page), revisionHash: model.revisionHash(page), factChecks: page.factChecks })), authorCorrections: Object.keys(receipt.changes).filter(id => !GIFT_REVIEW_IDS.includes(id)), remainingDrafts: site.pages.filter(page => !GIFT_REVIEW_IDS.includes(page.id)).map(page => ({ id: page.id, slug: page.slug, factChecks: page.factChecks })) };
  await saveJson(path.join(outputDir, "review-candidate.json"), review);
  receipt.completedAt = new Date().toISOString(); await saveJson(receiptFile, receipt);
  console.log(JSON.stringify({ siteId: site.id, reviewCandidate: path.join(outputDir, "review-candidate.json"), reviewPages: review.pages.length, correctedOtherBylines: review.authorCorrections.length, assets: Object.values(receipt.assets).reduce((sum, item) => sum + item.variants.length, 0), approval: false, activated: false, receiptFile }, null, 2));
} finally {
  await lock.close(); await fs.unlink(lockFile);
}
