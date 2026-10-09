import { NextResponse, type NextRequest } from "next/server";
import { nicheSiteByHost, normalizedHost, publicNichePages } from "@/lib/niche-sites";
import { SITE_CONFIGS } from "@/lib/site-config";
import { contentPackageByHost, publicContentPages, localContentAdmission, contentAdmissionScope, hasLocalPreviewContent } from "@/lib/content-model-v2";
import mediaAliases from '@/config/content-media-aliases.json';
import { visibleMediaAlias } from '@/lib/content-media-aliases.mjs';

const legacyHosts = new Map(
  Object.values(SITE_CONFIGS).flatMap((site) => site.domains.map((host) => [host, site.domains[0]] as const)),
);

function isPreview(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".vercel.app");
}

export function proxy(request: NextRequest) {
  const host = normalizedHost(request.headers.get("host"));
  const path = request.nextUrl.pathname;
  // An isolated actual-host preview must never fall back to the old gift app
  // on an unrelated deployment preview hostname.
  if(host.endsWith('.vercel.app') && hasLocalPreviewContent()) return new Response('Private preview',{status:404,headers:{'X-Robots-Tag':'noindex, nofollow','Cache-Control':'private, no-store'}});
  const niche = nicheSiteByHost(host);

  const gift = !niche ? contentPackageByHost(host) : null;
  if (gift) {
    if(contentAdmissionScope(gift)==='local-preview' && host!=='localhost' && host!=='127.0.0.1') return new Response('Private preview',{status:404,headers:{'X-Robots-Tag':'noindex, nofollow','Cache-Control':'private, no-store'}});
    if (gift.site.renderer !== 'gift') return new Response('Unsupported content renderer', { status: 404 });
    if (/^\/(gift|niche)(\/|$)/.test(path) || path.startsWith('/api/')) return new Response('Not found', { status: 404 });
    if (!isPreview(host) && host !== gift.canonicalHost) {
      const destination=request.nextUrl.clone();destination.hostname=gift.canonicalHost;destination.protocol='https:';destination.port='';
      return NextResponse.redirect(destination,308);
    }
    const live=publicContentPages(gift);
    if (!live.some(page=>page.type==='home'&&page.slug==='')) return new Response('Not found',{status:404});
    if(path.startsWith('/content-assets/'))return live.some(page=>page.media.some(media=>media.src===path))?NextResponse.next():new Response('Not found',{status:404});
    // Old article originals must not bypass the new publication/media gate.
    if(path.startsWith('/images/')){
      const asset=visibleMediaAlias(gift,live,mediaAliases,path);
      if(!asset)return new Response('Not found',{status:404});
      const target=request.nextUrl.clone();target.pathname=asset;target.search='';
      const response=NextResponse.redirect(target,307);response.headers.set('Cache-Control','private, no-store');return response;
    }
    if(path.startsWith('/_next/')||path.startsWith('/fonts/'))return NextResponse.next();
    const destination=request.nextUrl.clone();
    const seo:Record<string,string>={'/robots.txt':'robots','/sitemap.xml':'sitemap','/llms.txt':'llms','/llms-full.txt':'llms-full','/favicon.svg':'favicon','/favicon.ico':'favicon'};
    destination.pathname=seo[path]?`/gift/${gift.siteId}/seo/${seo[path]}`:path==='/uzklausa'&&request.method==='POST'?`/niche/${gift.siteId}/lead`:path==='/ivykius'&&request.method==='POST'?`/niche/${gift.siteId}/interest`:`/gift/${gift.siteId}${path==='/'?'':path}`;
    const requestHeaders=new Headers(request.headers);requestHeaders.set('x-gift-original-path',path);
    requestHeaders.set('x-gift-filtered',path==='/straipsniai' && Boolean(request.nextUrl.searchParams.get('tema')?.trim())?'1':'0');
    const response=NextResponse.rewrite(destination,{request:{headers:requestHeaders}});
    response.headers.set('Cache-Control','private, no-store');
    if(isPreview(host)||localContentAdmission(gift))response.headers.set('X-Robots-Tag','noindex, nofollow');
    return response;
  }

  if (niche) {
    if (path === '/gift' || path.startsWith('/gift/')) return new Response('Not found',{status:404});
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
      const actions: Record<string, string> = { sesija: "POST", busena: "GET", kontaktas: "POST", baigti: "POST", ui: "POST", atmintis: "GET", pamirsti: "POST", zinios: "POST", manifestas: "GET", zinute: "POST" };
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
    if (path.startsWith("/niche/") || path.startsWith('/gift/') || path.startsWith("/content-assets/")) return new Response("Not found", { status: 404 });
    return NextResponse.next();
  }

  if (isPreview(host)) {
    if (path.startsWith("/niche/") || path.startsWith('/gift/') || path.startsWith("/content-assets/")) return new Response("Not found", { status: 404 });
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }
  return new Response("Unknown domain", { status: 404, headers: { "X-Robots-Tag": "noindex" } });
}

export const config = { matcher: "/:path*" };
