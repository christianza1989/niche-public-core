import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { GIFT_REVIEW_IDS } from "../content/gift-editorial-2026-10-05.mjs";

const args = process.argv.slice(2), value = flag => args[args.indexOf(flag) + 1];
for (const flag of ["--studio-root", "--data-dir", "--candidate", "--acceptance", "--output-dir"]) if (!args.includes(flag)) throw new Error(`Required ${flag}`);
if (!args.includes("--approve-local-editorial")) throw new Error("Explicit local editorial approval required. This tool never activates a host.");
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const candidateFile = path.resolve(value("--candidate")), acceptanceFile = path.resolve(value("--acceptance"));
const candidateRaw = await fs.readFile(candidateFile), acceptanceRaw = await fs.readFile(acceptanceFile);
const candidate = JSON.parse(candidateRaw), acceptance = JSON.parse(acceptanceRaw);
if (acceptance.schemaVersion !== 1 || acceptance.scope !== "local-editorial-only" || acceptance.verdict !== "ACCEPTED_FOR_LOCAL_EDITORIAL" || !acceptance.reviewer || !Number.isFinite(Date.parse(acceptance.reviewedAt))) throw new Error("Independent local editorial acceptance required.");
if (digest(candidateRaw) !== acceptance.candidateSha256 || candidate.siteId !== "dovanos123" || candidate.canonicalHost !== "dovanos123.lt") throw new Error("Acceptance does not bind this exact candidate.");
const accepted = new Map(acceptance.pages.map(page => [page.id, page.revisionHash]));
if (accepted.size !== GIFT_REVIEW_IDS.length || acceptance.pages.length !== accepted.size || candidate.pages.length !== accepted.size || GIFT_REVIEW_IDS.some(id => !accepted.has(id))) throw new Error("Acceptance must cover exactly the reviewed eleven pages.");
for (const page of candidate.pages) if (accepted.get(page.id) !== page.revisionHash || acceptance.pages.find(item => item.id === page.id).verdict !== "ACCEPTED_FOR_LOCAL_EDITORIAL") throw new Error(`Candidate hash mismatch: ${page.id}`);
const studioRoot = path.resolve(value("--studio-root")), dataDir = path.resolve(value("--data-dir")), outputDir = path.resolve(value("--output-dir"));
if (!outputDir.replaceAll("\\", "/").includes("/output/dovanos123-editorial/")) throw new Error("Export must stay in the dedicated private editorial output directory.");
process.env.STUDIO_DATA_DIR = dataDir; process.env.STUDIO_OUTPUT_DIR = outputDir;
const model = await import(pathToFileURL(path.join(studioRoot, "src/model.mjs")).href);
if (path.resolve(model.DATA) !== dataDir || path.resolve(model.OUTPUT) !== outputDir) throw new Error("Unexpected studio data/export root.");
const lockFile = path.join(dataDir, "gift-migrations/dovanos123.lock"), receiptFile = path.join(dataDir, "gift-editorial/dovanos123-20261005.json");
const lock = await fs.open(lockFile, "wx");
const saveJson = async (file, data) => { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file + ".tmp", JSON.stringify(data, null, 2) + "\n"); await fs.rename(file + ".tmp", file); };
try {
  await lock.writeFile(JSON.stringify({ pid: process.pid, kind: "independent-ai-editorial-approval", createdAt: new Date().toISOString() }));
  const receipt = JSON.parse(await fs.readFile(receiptFile, "utf8"));
  let site = await model.getSite("dovanos123");
  if (site.schemaVersion !== 2 || site.renderer !== "gift" || site.stage !== "planning" || site.pages.length !== 41 || receipt.activated) throw new Error("Private 41-page planning site required.");
  const unrelatedHashes = {};
  for (const page of site.pages) {
    const hash = model.revisionHash(page);
    if (accepted.has(page.id)) {
      if (hash !== accepted.get(page.id) || receipt.changes[page.id]?.revisionHash !== hash) throw new Error(`Preserve newer draft: ${page.id}`);
      if ((page.approval || page.publishedRevision) && (page.approval?.revisionHash !== hash || page.publishedRevision?.revisionHash !== hash || model.revisionHash(page.publishedRevision) !== hash)) throw new Error(`Conflicting approval: ${page.id}`);
    } else {
      if (page.approval || page.publishedRevision || hash !== (receipt.changes[page.id]?.revisionHash ?? receipt.beforeHashes[page.id])) throw new Error(`Preserve unrelated page: ${page.id}`);
      unrelatedHashes[page.id] = hash;
    }
  }
  const media = new Map(candidate.pages.flatMap(page => page.media.map(item => [item.id, item])));
  if (media.size !== 15 || acceptance.media.length !== 15 || new Set(acceptance.media.map(item => item.id)).size !== 15) throw new Error("Exact fifteen reviewed media variants required.");
  for (const item of acceptance.media) {
    const expected = media.get(item.id), asset = site.assets.find(asset => asset.id === item.id);
    if (!item.verified || !expected || !asset || item.src !== expected.src || item.width !== expected.width || item.height !== expected.height || asset.src !== item.src) throw new Error(`Media acceptance mismatch: ${item.id}`);
    if (digest(await fs.readFile(path.join(dataDir, "media/dovanos123", path.basename(item.src)))) !== item.sha256) throw new Error(`Media bytes changed: ${item.id}`);
  }
  receipt.localEditorialAcceptance = { path: acceptanceFile, sha256: digest(acceptanceRaw), candidateSha256: digest(candidateRaw), reviewer: acceptance.reviewer, reviewedAt: acceptance.reviewedAt, scope: acceptance.scope };
  await saveJson(receiptFile, receipt);
  for (const id of GIFT_REVIEW_IDS) {
    site = await model.getSite(site.id);
    const page = site.pages.find(page => page.id === id);
    if (model.revisionHash(page) !== accepted.get(id)) throw new Error(`Concurrent revision: ${id}`);
    if (page.approval?.status === "approved" && page.publishedRevision?.revisionHash === accepted.get(id)) continue;
    // Notes are private review state, excluded from the accepted revision payload.
    const cleared = await model.editPage(site.id, id, { factChecks: [] });
    if (model.revisionHash(cleared) !== accepted.get(id)) throw new Error(`Review clearance changed accepted content: ${id}`);
    const approved = await model.approvePage(site.id, id, "codex-independent-ai-editorial-review-local-only");
    if (approved.approval.revisionHash !== accepted.get(id) || model.revisionHash(approved.publishedRevision) !== accepted.get(id)) throw new Error(`Approval changed accepted content: ${id}`);
    receipt.localApprovals ??= {}; receipt.localApprovals[id] = approved.approval;
    await saveJson(receiptFile, receipt);
  }
  site = await model.getSite(site.id);
  for (const [id, hash] of Object.entries(unrelatedHashes)) {
    const page = site.pages.find(page => page.id === id);
    if (page.approval || page.publishedRevision || model.revisionHash(page) !== hash) throw new Error(`Unrelated revision changed: ${id}`);
  }
  let exported, raw;
  if (receipt.exported) {
    const expectedPath = path.join(outputDir, site.id, "content-package.json");
    if (path.resolve(receipt.exported.path) !== expectedPath) throw new Error("Existing export belongs to another output directory.");
    raw = await fs.readFile(expectedPath);
    if (digest(raw) !== receipt.exported.sha256) throw new Error("Existing shadow export changed; preserve exact admission bytes.");
    const existing = JSON.parse(raw), current = model.packageForSite(site);
    current.generatedAt = existing.generatedAt;
    if (JSON.stringify(current) !== JSON.stringify(existing)) throw new Error("Existing export no longer matches current immutable approvals.");
    exported = receipt.exported;
  } else {
    exported = await model.exportPackage(site.id); raw = await fs.readFile(exported.path);
  }
  const pkg = JSON.parse(raw);
  if (exported.pages !== 11 || exported.assets !== 15 || pkg.pages.some(page => accepted.get(page.id) !== page.revisionHash)) throw new Error("Export diverged from independent acceptance.");
  receipt.approved = true; receipt.activated = false; receipt.exported = { ...exported, sha256: digest(raw), scope: "private-shadow-local-editorial", exportedAt: exported.exportedAt ?? new Date().toISOString() };
  await saveJson(receiptFile, receipt);
  await saveJson(path.join(outputDir, "LOCAL-EDITORIAL-EXPORT.json"), { ...receipt.exported, acceptance: receipt.localEditorialAcceptance, approvedPageIds: GIFT_REVIEW_IDS, remainingDrafts: Object.keys(unrelatedHashes), productionActivated: false, legalApproved: false, formsEnabled: false, metricsEnabled: false });
  console.log(JSON.stringify(receipt.exported, null, 2));
} finally { await lock.close(); await fs.unlink(lockFile); }
