import test from "node:test";
import assert from "node:assert/strict";
import { legacyInline, legacyBody } from "../scripts/dovanos123-legacy-import.mjs";
import { normalizeV2Blocks, bodyPlainText } from "../scripts/content-package-v2.mjs";

test("gift rich import keeps links in paragraphs, headings and repeated list items", () => {
  const ids = new Set(["a", "b"]);
  const input = ["## [[tas pats|article:a]]", "Prieš [[tas pats|article:b]] ir [[tas pats|article:a]].", "• [[tas pats|article:a]]", "• Toliau [[tas pats|article:b]]"];
  const changes = [];
  const body = legacyBody(input, ids, changes);
  assert.equal(body[0].type, "richHeading");
  assert.equal(body[2].type, "richList");
  assert.equal(body[2].items.length, 2);
  assert.deepEqual(body[1].content.filter((node) => node.type === "link").map((node) => node.target.pageId), ["b", "a"]);
  assert.deepEqual(changes, []);
  assert.deepEqual(normalizeV2Blocks(body), body);
  assert.equal(bodyPlainText(body), "tas pats\nPrieš tas pats ir tas pats.\ntas pats\nToliau tas pats");
});

test("unsafe, unknown and credential-bearing targets become labels with loss evidence", () => {
  const changes = [];
  const nodes = legacyInline("[[X|javascript:alert(1)]] [[Y|article:missing]] [[Z|https://user:pass@example.com/]] [[OK|https://example.com/test]]", new Set(), changes);
  assert.equal(nodes.filter((node) => node.type === "link").length, 1);
  assert.equal(changes.length, 3);
  assert.equal(nodes.map((node) => node.text).join(""), "X Y Z OK");
});
