import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { contentPackageByHost, publicContentPages } from "@/lib/content-model-v2";
import { GiftSite } from "@/components/gift/gift-site";
import { giftMetadata } from "@/lib/gift-seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;
type Props = { params: Promise<{ siteId: string; slug?: string[] }>; searchParams: Promise<{ tema?: string }> };
async function resolve(props: Props) {
  const { siteId, slug = [] } = await props.params;
  const pkg = contentPackageByHost((await headers()).get("host"));
  if (!pkg || pkg.siteId !== siteId || pkg.site.renderer !== "gift") notFound();
  const livePages = publicContentPages(pkg, Date.now());
  const page = livePages.find(item => item.slug === slug.join("/"));
  if (!page) notFound();
  const query = await props.searchParams;
  const topic = page.slug === "straipsniai" && typeof query?.tema === "string" ? query.tema.trim().toLowerCase().slice(0, 100) : undefined;
  return { pkg, page, livePages, topic };
}
export async function generateMetadata(props: Props) {
  const data = await resolve(props);
  return giftMetadata(data.pkg, data.page, Boolean(data.topic));
}
export default async function GiftPage(props: Props) {
  return <GiftSite {...await resolve(props)} />;
}
