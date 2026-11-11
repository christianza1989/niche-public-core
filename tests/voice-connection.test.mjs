import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync(new URL("../lib/voice-connection.ts", import.meta.url), "utf8");
const exports = {};
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} }).outputText, { exports, setTimeout, clearTimeout, Error });
const events = { ParticipantConnected: "participantConnected", ParticipantAttributesChanged: "participantAttributesChanged", Disconnected: "disconnected" };
function room() { return Object.assign(new EventEmitter(), { remoteParticipants: new Map() }); }
function clean(value) { for (const event of Object.values(events)) assert.equal(value.listenerCount(event), 0); }

test("already joined consultant resolves and releases listeners", async () => {
  const value = room(); value.remoteParticipants.set("consultant", { isAgent: true, attributes: { "pinet.voice.ready": "true" } });
  await exports.waitForVoiceAgent(value, events, 30); clean(value);
});
test("ordinary participants do not impersonate the dispatched consultant", async () => {
  const value = room();
  const waiting = exports.waitForVoiceAgent(value, events, 100);
  let finished = false; waiting.then(() => { finished = true; });
  value.remoteParticipants.set("other", { isAgent: false, attributes: { "pinet.voice.ready": "true" } }); value.emit(events.ParticipantConnected);
  await Promise.resolve(); assert.equal(finished, false);
  value.remoteParticipants.set("consultant", { isAgent: true, attributes: {} }); value.emit(events.ParticipantConnected);
  await Promise.resolve(); assert.equal(finished, false);
  value.remoteParticipants.get("consultant").attributes["pinet.voice.ready"] = "true";
  value.emit(events.ParticipantAttributesChanged);
  await waiting; clean(value);
});
test("missing worker times out rather than leaving a silent active call", async () => {
  const value = room();
  await assert.rejects(exports.waitForVoiceAgent(value, events, 5), /Konsultantas šiuo metu nepasiekiamas/); clean(value);
});
test("disconnect during dispatch fails promptly and releases listeners", async () => {
  const value = room(); const waiting = exports.waitForVoiceAgent(value, events, 100);
  value.emit(events.Disconnected);
  await assert.rejects(waiting, /Ryšys nutrūko/); clean(value);
});
