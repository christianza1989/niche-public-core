import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readLegacyData, makeInventory, extractInlineLinks, captureSnapshot, verifySnapshot, sha256 } from "../scripts/dovanos123-snapshot.mjs";

const root = process.cwd();
const at = "2026-10-04T09:00:00Z";

test("gift capture is deterministic and does not mutate module/global dates", () => {
  const originalDate = Date;
  const a = readLegacyData(root, at);
  const b = readLegacyData(root, at);
  assert.deepEqual(a, b);
  assert.equal(Date, originalDate);
  assert.ok(a.articles.every((article) => article.siteId === "dovanos123"));
  assert.equal(a.scheduledIds.length, 20);
  const inventory = makeInventory(a, at);
  assert.deepEqual(inventory.collisions, []);
  assert.ok(inventory.records.every((record) => record.migrationApproval === "pending"));
  assert.ok(inventory.records.some((record) => record.schedule.provenance === "relative-demo-at-snapshot"));
  const fixed = inventory.records.find((record) => record.id === a.scheduledIds[0]);
  assert.equal(fixed.schedule.utc, "2026-09-28T04:30:00.000Z");
  assert.equal(fixed.schedule.historicalPublicationVerified, false);
});

test("inline link inventory retains every occurrence and exact position", () => {
  const text = "[[toks pat|article:a]] ir [[toks pat|article:b]] ir [[toks pat|article:a]]";
  const links = extractInlineLinks(text);
  assert.equal(links.length, 3);
  assert.deepEqual(links.map((link) => link.target), ["article:a", "article:b", "article:a"]);
  for (const link of links) assert.equal(text.slice(link.offset, link.offset + link.length), `[[${link.label}|${link.target}]]`);
});

test("snapshot refuses overwrite, unsafe location and application/secret dependencies", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "gift-snapshot-test-"));
  // Only fixture code is written here, not actual workspace configuration.
  fs.mkdirSync(path.join(temporary, "lib"));
  for (const filename of ["content.ts", "new-articles.ts", "scheduled-articles-2026.ts", "site-config.ts", "homepage-data.ts"]) fs.copyFileSync(path.join(root, "lib", filename), path.join(temporary, "lib", filename));
  const destination = path.join(temporary, "migration/dovanos123/capture");
  const result = captureSnapshot(temporary, destination, at);
  const manifest = JSON.parse(fs.readFileSync(path.join(destination, "manifest.json")));
  assert.equal(manifest.activated, false);
  assert.equal(result.inventoryHash, sha256(fs.readFileSync(path.join(destination, "inventory.json"))));
  assert.ok(verifySnapshot(destination).checkedFiles > 2);
  assert.throws(() => captureSnapshot(temporary, destination, at), /already exists/);
  assert.throws(() => captureSnapshot(temporary, path.join(temporary, "elsewhere"), at), /inside migration/);
  fs.writeFileSync(path.join(temporary, "lib/content.ts"), 'import "./secret";');
  assert.throws(() => readLegacyData(temporary, at), /Unapproved legacy dependency/);
  assert.throws(() => readLegacyData(root, "not-a-date"), /valid explicit/);
  fs.appendFileSync(path.join(destination, "legacy-data.json"), " ");
  assert.throws(() => verifySnapshot(destination), /missing or changed/);
});
