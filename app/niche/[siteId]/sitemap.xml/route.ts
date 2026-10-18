import { headers } from "next/headers";
import { nicheSiteByHost, publicNichePage, publicNichePages,nicheIndexingAllowedForHost } from "@/lib/niche-sites";
import { nicheSitemapXml } from "@/lib/niche-seo";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const pkg = nicheSiteByHost((await headers()).get("host"));
  if (!pkg || pkg.siteId !== siteId) return new Response("Not found", { status: 404 });
  if (!nicheIndexingAllowedForHost(pkg,(await headers()).get("host")) || !publicNichePage(pkg, "")) {
    return new Response("Not found", { status: 404, headers: { "X-Robots-Tag": "noindex" } });
  }
  return new Response(nicheSitemapXml(pkg, publicNichePages(pkg)), {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
