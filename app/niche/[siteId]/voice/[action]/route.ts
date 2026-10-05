import { nicheSiteByHost, publicNichePage } from "@/lib/niche-sites";
import { voiceCoreRequest, voiceManifestResponse } from "@/lib/niche-voice";
export const dynamic = "force-dynamic";
type Params = Promise<{ siteId: string; action: string }>;

async function handle(request: Request, { params }: { params: Params }) {
  const { siteId, action } = await params;
  const pkg = nicheSiteByHost(request.headers.get("host"));
  if (!pkg || pkg.siteId !== siteId || !publicNichePage(pkg, "")) return new Response("Not found", { status: 404 });
  const methods: Record<string, string> = { sesija: "POST", busena: "GET", kontaktas: "POST", baigti: "POST", ui: "POST", atmintis: "GET", pamirsti: "POST", zinios: "POST", manifestas: "GET" };
  if (methods[action] !== request.method) return new Response("Method not allowed", { status: 405 });
  if (action === "manifestas") return voiceManifestResponse(pkg, request);
  if (request.method !== "GET" && request.headers.get("origin") !== new URL(request.url).origin) {
    return Response.json({ error: "invalid_origin" }, { status: 403 });
  }
  if (request.method === "GET" && request.headers.get("sec-fetch-site") === "cross-site") {
    return Response.json({ error: "invalid_origin" }, { status: 403 });
  }
  let body: Record<string, unknown> = {};
  if (request.method === "POST") {
    if (!request.headers.get("content-type")?.startsWith("application/json") || !request.body) {
      return Response.json({ error: "invalid_request" }, { status: 400 });
    }
    const reader = request.body.getReader();
    const parts: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 3000) { await reader.cancel(); return Response.json({ error: "request_too_large" }, { status: 413 }); }
      parts.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
    try { body = JSON.parse(new TextDecoder().decode(bytes)); }
    catch { return Response.json({ error: "invalid_json" }, { status: 400 }); }
    if (!body || Array.isArray(body) || typeof body !== "object") return Response.json({ error: "invalid_request" }, { status: 400 });
  } else body = { conversation_id: new URL(request.url).searchParams.get("conversation_id") };
  return voiceCoreRequest(pkg, action, body, request.headers.get("x-voice-session") || "",
    request.headers.get("cookie") || "", new URL(request.url).protocol === "https:");
}
export const POST = handle;
export const GET = handle;
