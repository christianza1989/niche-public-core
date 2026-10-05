// Real HTTP integration against the dedicated local preview. No microphone or provider calls.
import assert from "node:assert/strict";
import { request } from "node:http";
import { randomUUID } from "node:crypto";
const base = new URL(process.env.VOICE_SMOKE_BASE_URL || "http://localhost:5187");

async function call(path, method = "GET", body, origin = `http://traktoriupadangos.lt`) {
  return new Promise((resolve, reject) => {
    const content = body === undefined ? "" : JSON.stringify(body);
    const req = request(new URL(path, base), { method, headers: { Host: "traktoriupadangos.lt", Origin: origin,
      "Content-Type": "application/json", "Content-Length": Buffer.byteLength(content) } }, res => {
      let data = ""; res.setEncoding("utf8");
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, data }));
    });
    req.on("error", reject); req.end(content);
  });
}
assert.equal((await call("/pokalbis/sesija")).status, 405);
assert.equal((await call("/pokalbis/nezinomas")).status, 404);
assert.equal((await call("/pokalbis/manifestas")).status, 401);
assert.equal((await call("/pokalbis/manifestas", "POST", {})).status, 405);
assert.equal((await call("/niche/traktoriupadangos/voice/sesija", "POST", {})).status, 404);
assert.equal((await call("/pokalbis/sesija", "POST", {}, "https://attacker.example")).status, 403);
const admitted = await call("/pokalbis/sesija", "POST", { consent: true, request_id: randomUUID() });
assert.equal(admitted.status, 503);
assert.equal(JSON.parse(admitted.data).detail, "voice_not_ready",
  "The real core must accept HMAC and the approved manifest before its M0 readiness gate rejects audio.");
console.log("Voice web smoke passed: aliases, methods, internal path isolation, origin, HMAC, manifest and readiness gate.");
