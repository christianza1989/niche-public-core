import { headers } from "next/headers";
import { nicheSiteByHost, publicNichePage, publicNichePages } from "@/lib/niche-sites";
import { nicheLlmsIndex } from "@/lib/niche-seo";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const pkg = nicheSiteByHost((await headers()).get("host"));
  if (!pkg || pkg.siteId !== siteId || !publicNichePage(pkg, "")) return new Response("Not found", { status: 404 });
  return new Response(nicheLlmsIndex(pkg, publicNichePages(pkg)), {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
