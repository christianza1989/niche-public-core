import { env } from "cloudflare:workers";
import { publicNichePages, type NichePackage } from "@/lib/niche-sites";
import { nicheNetworkContact } from "@/lib/niche-network";

function setting(key: "VOICE_WIDGET_ENABLED" | "VOICE_CORE_URL" | "VOICE_EDGE_SECRET") {
  return env[key] || process.env[key] || "";
}

export function voiceWidgetEnabled(pkg: NichePackage) {
  return pkg.siteId === "traktoriupadangos" && setting("VOICE_WIDGET_ENABLED") === "1";
}

async function sha(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), x => x.toString(16).padStart(2, "0")).join("");
}

async function manifest(pkg: NichePackage) {
  const contact = nicheNetworkContact(pkg.siteId);
  if (pkg.site.contact.email !== contact.email) throw new Error("contact_mismatch");
  const pages = await Promise.all(publicNichePages(pkg).map(async page => {
    const text = page.body.map(block => block.type === "paragraph" || block.type === "heading"
      ? block.text : block.type === "list" ? block.items.join("\n") : "").join("\n");
    return { id: page.id, title: page.title, url: `https://${pkg.canonicalHost}/${page.slug}`,
      text, revision_hash: page.revisionHash,
      projection_hash: await sha(JSON.stringify({ title: page.title, text, externalLinks: page.externalLinks || [] })) };
  }));
  return { site_id: pkg.siteId, canonical_host: pkg.canonicalHost, contact_email: pkg.site.contact.email,
    operator: contact.operatorName, deployment_id: await sha(JSON.stringify(pages.map(p => p.projection_hash))),
    generated_at: new Date().toISOString(), pages };
}

export async function voiceManifestResponse(pkg: NichePackage, request: Request) {
  const secret = setting("VOICE_EDGE_SECRET");
  const timestamp = request.headers.get("x-pinet-timestamp") || "";
  const nonce = request.headers.get("x-pinet-nonce") || "";
  if (!secret || !/^\d{10,11}$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 45
    || !/^[a-f0-9-]{36}$/.test(nonce)) return Response.json({ error: "authentication_required" }, { status: 401 });
  const canonical = [timestamp, nonce, "GET", "/pokalbis/manifestas", pkg.siteId, await sha("")].join("\n");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const signature = request.headers.get("x-pinet-signature") || "";
  if (!/^[a-f0-9]{64}$/.test(signature)) return Response.json({ error: "authentication_required" }, { status: 401 });
  const bytes = new Uint8Array(signature.match(/../g)!.map(part => parseInt(part, 16)));
  if (!await crypto.subtle.verify("HMAC", key, bytes, new TextEncoder().encode(canonical))) {
    return Response.json({ error: "authentication_required" }, { status: 401 });
  }
  return Response.json(await manifest(pkg), { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}

export async function voiceCoreRequest(pkg: NichePackage, action: string, body: Record<string, unknown>, token: string,
  cookieHeader = "", secureCookie = true) {
  const base = setting("VOICE_CORE_URL"), secret = setting("VOICE_EDGE_SECRET");
  if (!base || !secret || !voiceWidgetEnabled(pkg)) return Response.json({ error: "voice_not_ready" }, { status: 503 });
  const url = new URL(base);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname))) {
    return Response.json({ error: "invalid_core_configuration" }, { status: 503 });
  }
  const cid = body.conversation_id;
  const memoryAction = action === "atmintis" || action === "pamirsti";
  const cookieName = `pinet_voice_${pkg.siteId}`;
  const cookieValue = cookieHeader.split(";").map(part => part.trim()).find(part => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1) || "";
  const memoryToken = /^[a-f0-9]{64}$/.test(cookieValue) ? cookieValue : "";
  if (action !== "sesija" && !memoryAction && (typeof cid !== "string" || !/^[a-f0-9-]{36}$/.test(cid))) {
    return Response.json({ error: "invalid_session" }, { status: 400 });
  }
  const paths: Record<string, string> = { sesija: "", busena: "", kontaktas: "/contact", baigti: "/end", ui: "/ui", zinios: "/knowledge" };
  const path = memoryAction ? `/v1/sites/${pkg.siteId}/memory`
    : `/v1/sites/${pkg.siteId}/sessions${action === "sesija" ? "" : `/${cid}${paths[action]}`}`;
  const method = action === "busena" || action === "atmintis" ? "GET" : action === "pamirsti" ? "DELETE" : "POST";
  let payload: Record<string, unknown> = {};
  if (action === "sesija") {
    if (body.consent !== true) return Response.json({ error: "consent_required" }, { status: 400 });
    if (typeof body.request_id !== "string" || !/^[a-f0-9-]{36}$/.test(body.request_id)) {
      return Response.json({ error: "invalid_request_id" }, { status: 400 });
    }
    if (body.remember !== undefined && typeof body.remember !== "boolean") return Response.json({ error: "invalid_memory_choice" }, { status: 400 });
    payload = { request_id: body.request_id, knowledge: await manifest(pkg), notice_version: "voice-local-v2",
      consent: true, mode: "voice", remember: body.remember === true, memory_token: memoryToken || null };
  } else if (action === "kontaktas") {
    payload = { channel: body.channel, value: body.value, purpose: "followup", consent: body.consent,
      notice_version: "voice-local-v1", ...(body.base_revision === undefined ? {} : { base_revision: body.base_revision }) };
  } else if (action === "ui") payload = { request_id: body.request_id, state: body.state };
  else if (action === "zinios") payload = await manifest(pkg);
  const serialized = method === "GET" || method === "DELETE" ? "" : JSON.stringify(payload);
  const timestamp = String(Math.floor(Date.now() / 1000)), nonce = crypto.randomUUID();
  const canonical = [timestamp, nonce, method, path, await sha(serialized)].join("\n");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key,
    new TextEncoder().encode(canonical))), x => x.toString(16).padStart(2, "0")).join("");
  try {
    const result = await fetch(new URL(path, base), { method, redirect: "manual", signal: AbortSignal.timeout(12000),
      headers: { "Content-Type": "application/json", "x-pinet-timestamp": timestamp, "x-pinet-nonce": nonce,
        "x-pinet-signature": signature, "x-pinet-session": token, "x-pinet-memory": memoryToken }, ...(method === "POST" ? { body: serialized } : {}) });
    if (result.status >= 300 && result.status < 400) throw new Error("core_redirect_rejected");
    const reader = result.body?.getReader();
    if (!reader) throw new Error("empty_core_result");
    const parts: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 50000) { await reader.cancel(); throw new Error("oversized_core_result"); }
      parts.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
    const data: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("invalid_core_result");
    const responseBody = { ...data } as Record<string, unknown>;
    const headers = new Headers({ "Content-Type": "application/json", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" });
    const returnedMemory = responseBody.memory_token;
    const maxAge = responseBody.memory_max_age;
    delete responseBody.memory_token; delete responseBody.memory_max_age;
    const attributes = `Path=/; HttpOnly; SameSite=Lax${secureCookie ? "; Secure" : ""}`;
    if (result.ok && action === "sesija" && typeof returnedMemory === "string" && /^[a-f0-9]{64}$/.test(returnedMemory)) {
      const duration = typeof maxAge === "number" && Number.isInteger(maxAge) ? Math.max(0, Math.min(maxAge, 2592000)) : 0;
      headers.set("Set-Cookie", `${cookieName}=${returnedMemory}; ${attributes}; Max-Age=${duration}`);
    }
    if (result.ok && action === "pamirsti") headers.set("Set-Cookie", `${cookieName}=; ${attributes}; Max-Age=0`);
    return new Response(JSON.stringify(responseBody), { status: result.status, headers });
  } catch (error) {
    console.error(JSON.stringify({ event: "voice_core_unavailable", code: error instanceof Error ? error.name : "upstream_failure" }));
    return Response.json({ error: "voice_temporarily_unavailable" }, { status: 503 });
  }
}
