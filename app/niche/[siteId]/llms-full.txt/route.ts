import {memoPublishedProductPages} from '@/lib/memocasting-product-server';
import { headers } from "next/headers";
import { nicheSiteByHost, publicNichePage, publicNichePages } from "@/lib/niche-sites";
import { nicheLlmsFull } from "@/lib/niche-seo";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const pkg = nicheSiteByHost((await headers()).get("host"));
  if (!pkg || pkg.siteId !== siteId || !publicNichePage(pkg, "")) return new Response("Not found", { status: 404 });
  const pages=pkg.siteId==='memocasting'?await memoPublishedProductPages(publicNichePages(pkg),(await headers()).get('host')):publicNichePages(pkg);
  return new Response(nicheLlmsFull(pkg, pages), {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
