import { headers } from "next/headers";
import { nicheSiteByHost, normalizedHost, publicNichePage, publicNichePages } from "@/lib/niche-sites";
import { nicheSitemapXml } from "@/lib/niche-seo";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const pkg = nicheSiteByHost((await headers()).get("host"));
  if (!pkg || pkg.siteId !== siteId) return new Response("Not found", { status: 404 });
  const host = normalizedHost((await headers()).get("host"));
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".vercel.app") || !publicNichePage(pkg, "")) {
    return new Response("Not found", { status: 404, headers: { "X-Robots-Tag": "noindex" } });
  }
  return new Response(nicheSitemapXml(pkg, publicNichePages(pkg)), {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
