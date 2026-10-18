import { headers } from "next/headers";
import { nicheSiteByHost, publicNichePage,nicheIndexingAllowedForHost } from "@/lib/niche-sites";
import { nicheRobotsText } from "@/lib/niche-seo";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const pkg = nicheSiteByHost((await headers()).get("host"));
  if (!pkg || pkg.siteId !== siteId) return new Response("Not found", { status: 404 });
  const preview = !nicheIndexingAllowedForHost(pkg,(await headers()).get("host"));
  const text = nicheRobotsText(pkg, preview, Boolean(publicNichePage(pkg, "")));
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
