import { NextResponse, type NextRequest } from "next/server";
import { nicheSiteByHost, normalizedHost, publicNichePages } from "@/lib/niche-sites";
import { SITE_CONFIGS } from "@/lib/site-config";

const legacyHosts = new Map(
  Object.values(SITE_CONFIGS).flatMap((site) => site.domains.map((host) => [host, site.domains[0]] as const)),
);

function isPreview(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".vercel.app");
}

export function proxy(request: NextRequest) {
  const host = normalizedHost(request.headers.get("host"));
  const path = request.nextUrl.pathname;
  const niche = nicheSiteByHost(host);

  if (niche) {
    if (path === "/niche" || path.startsWith("/niche/")) return new Response("Not found", { status: 404 });
    if (path.startsWith("/content-assets/")) {
      const allowed = publicNichePages(niche).some((page) => page.media.some((media) => media.src === path));
      return allowed ? NextResponse.next() : new Response("Not found", { status: 404 });
    }
    if (path.startsWith("/_next/")) return NextResponse.next();
    if (path === "/favicon.svg" || path === "/favicon.ico") {
      const destination = request.nextUrl.clone();
      destination.pathname = `/niche/${niche.siteId}/brand-icon`;
      return NextResponse.rewrite(destination);
    }
    if (path.startsWith("/api/")) return new Response("Not found", { status: 404 });
    if (path === "/pokalbis" || path.startsWith("/pokalbis/")) {
      const actions: Record<string, string> = { sesija: "POST", busena: "GET", kontaktas: "POST", baigti: "POST", ui: "POST", atmintis: "GET", pamirsti: "POST", zinios: "POST", manifestas: "GET" };
      const action = path.slice("/pokalbis/".length);
      if (!actions[action]) return new Response("Not found", { status: 404 });
      if (request.method !== actions[action]) return new Response("Method not allowed", { status: 405 });
      const destination = request.nextUrl.clone();
      destination.pathname = `/niche/${niche.siteId}/voice/${action}`;
      return NextResponse.rewrite(destination);
    }
    if (path === "/ivykius" && request.method === "POST") {
      const destination = request.nextUrl.clone();
      destination.pathname = `/niche/${niche.siteId}/interest`;
      return NextResponse.rewrite(destination);
    }
    if (path === "/uzklausa" && request.method === "POST") {
      const destination = request.nextUrl.clone();
      destination.pathname = `/niche/${niche.siteId}/lead`;
      return NextResponse.rewrite(destination);
    }
    const destination = request.nextUrl.clone();
    destination.pathname = `/niche/${niche.siteId}${path === "/" ? "" : path}`;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-niche-original-path", path);
    const response = NextResponse.rewrite(destination, { request: { headers: requestHeaders } });
    response.headers.set("Cache-Control", "private, no-store");
    if (isPreview(host)) response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  const canonical = legacyHosts.get(host);
  if (canonical) {
    if (host !== canonical && !isPreview(host)) {
      const destination = request.nextUrl.clone();
      destination.hostname = canonical;
      destination.protocol = "https:";
      destination.port = "";
      return NextResponse.redirect(destination, 308);
    }
    if (path.startsWith("/niche/") || path.startsWith("/content-assets/")) return new Response("Not found", { status: 404 });
    return NextResponse.next();
  }

  if (isPreview(host)) {
    if (path.startsWith("/niche/") || path.startsWith("/content-assets/")) return new Response("Not found", { status: 404 });
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }
  return new Response("Unknown domain", { status: 404, headers: { "X-Robots-Tag": "noindex" } });
}

export const config = { matcher: "/:path*" };
