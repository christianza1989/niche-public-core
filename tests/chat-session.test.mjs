import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
const api = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL("../lib/chat-session.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: api, Date, JSON, Number, Object });
function storage() { const data = new Map(); return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) }; }
const saved = () => ({ version: 1, expiresAt: api.chatExpiry(1000), open: true,
  session: { conversation_id: "conversation-one", session_token: "private-session" },
  lines: [{ id: "one", speaker: "client", text: "Two devices" }],
  pending: { id: "same-id-on-retry", text: "Two devices" }, contactRevisions: { email: 2 } });
test("same-host checkpoint retains pending idempotency and contact revision, excludes contact values", () => {
  const store = storage(), item = saved(); item.email = "private@example.test"; item.session.room_token = "voice-secret";
  api.saveChat(store, "one.test", item); const restored = api.readChat(store, "one.test", 1100);
  assert.equal(restored.session.session_token, "private-session"); assert.equal(restored.pending.id, "same-id-on-retry");
  assert.equal(restored.contactRevisions.email, 2); assert.equal(restored.lines[0].text, "Two devices");
  assert.equal(restored.email, undefined); assert.equal(restored.session.room_token, undefined);
  assert.equal(api.readChat(store, "other.test", 1100), null);
});
test("expired, corrupted and future-extended checkpoints cannot revive a session", () => {
  const store = storage(); api.saveChat(store, "one.test", saved());
  assert.equal(api.readChat(store, "one.test", 1900000), null); assert.equal(store.data.size, 0);
  store.setItem("pinet:active-chat:one.test", "broken"); assert.equal(api.readChat(store, "one.test", 1100), null);
  const item = saved(); item.expiresAt = 999999999; api.saveChat(store, "one.test", item);
  assert.equal(api.readChat(store, "one.test", 1100), null);
});
test("end/reset clears only owned host; unavailable storage never blocks chat", () => {
  const store = storage(); api.saveChat(store, "one.test", saved()); api.saveChat(store, "other.test", saved());
  api.clearChat(store, "one.test"); assert.equal(api.readChat(store, "one.test", 1100), null); assert.ok(api.readChat(store, "other.test", 1100));
  const unavailable = { getItem() { throw Error("disabled"); }, setItem() { throw Error("quota"); }, removeItem() { throw Error("disabled"); } };
  assert.equal(api.readChat(unavailable, "one.test", 1100), null); api.saveChat(unavailable, "one.test", saved()); api.clearChat(unavailable, "one.test");
});
