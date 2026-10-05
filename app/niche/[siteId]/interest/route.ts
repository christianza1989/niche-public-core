import { env } from "cloudflare:workers";
import { headers } from "next/headers";
import { publicSiteByHost, publicSitePage } from "@/lib/public-site";

export const dynamic = "force-dynamic";
const allowedEvents = new Set(["pageview", "email_click", "phone_click"]);
const empty = (status = 204) => new Response(null, { status, headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } });

export async function POST(request: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const pkg = publicSiteByHost((await headers()).get("host"));
  if (!pkg || pkg.siteId !== siteId || !publicSitePage(pkg, "")) return empty(404);
  if (!request.headers.get("content-type")?.startsWith("application/json") || !request.body) return empty(400);
  const reader = request.body.getReader();
  let input = "";
  let length = 0;
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    // Small rejected bodies are drained without retaining them. Cancelling an
    // unread stream can break the next connection in the local Workers proxy.
    // Larger bodies still have a strict resource bound.
    if (length > 4096) { await reader.cancel(); return empty(413); }
    if (length <= 512) input += decoder.decode(value, { stream: true });
  }
  if (length > 512) return empty(413);
  input += decoder.decode();
  if(pkg.schemaVersion===2 && publicSitePage(pkg,'privatumas')?.type!=='policy') return empty(503);
  const origin = new URL(request.url).origin;
  const incomingOrigin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  try {
    if (incomingOrigin ? incomingOrigin !== origin : !referer || new URL(referer).origin !== origin) return empty(403);
  } catch { return empty(403); }
  if (/bot|crawler|spider|headless|lighthouse/i.test(request.headers.get("user-agent") || "") || request.headers.get("sec-gpc") === "1" || request.headers.get("dnt") === "1") return empty();
  let payload: { event?: unknown; path?: unknown };
  try { payload = JSON.parse(input); } catch { return empty(400); }
  if (!payload || typeof payload !== "object" || typeof payload.event !== "string" || !allowedEvents.has(payload.event) || typeof payload.path !== "string") return empty(400);
  const page = publicSitePage(pkg, payload.path === "/" ? "" : payload.path.replace(/^\//, ""));
  if (!page || payload.path !== (page.slug ? `/${page.slug}` : "/")) return empty(404);
  if (!env.DB) return empty(503);
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: pkg.site.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
  const day = `${parts.year}-${parts.month}-${parts.day}`;
  try {
    await env.DB.prepare("INSERT INTO niche_interest_daily (site_id, day, page_path, event, count) VALUES (?, ?, ?, ?, 1) ON CONFLICT(site_id, day, page_path, event) DO UPDATE SET count = count + 1")
      .bind(siteId, day, payload.path, payload.event).run();
  } catch {
    console.error(JSON.stringify({ event: "niche_interest_write_failed", siteId }));
    return empty(503);
  }
  return empty();
}
