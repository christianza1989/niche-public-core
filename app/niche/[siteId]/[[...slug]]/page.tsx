import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { nicheSiteByHost, publicNichePage, publicNichePages } from "@/lib/niche-sites";
import { contentPackageByHost, publicContentPages } from '@/lib/content-model-v2';
import { contentMetadata } from '@/lib/content-page-seo';
import { NativeContentSite } from '@/components/niche/native-content-site';
import { voiceWidgetEnabled } from "@/lib/niche-voice";
export const dynamic = "force-dynamic";
export const revalidate = 0;
type Params = Promise<{ siteId: string; slug?: string[] }>;
export async function generateMetadata({ params }: { params: Params }) {
  const {siteId, slug=[]} = await params;
  const pkg = contentPackageByHost((await headers()).get("host"));
  if (!pkg) return {}; // V1 compositions retain their existing metadata.
  if (pkg.siteId!==siteId || pkg.site.renderer!=="niche") notFound();
  const pages=publicContentPages(pkg);
  const page=pages.find(item=>item.slug===slug.join("/"));
  if (!page || !pages.some(item=>item.type==="home" && item.slug==="")) notFound();
  return contentMetadata(pkg,page,false,["article","guide"]);
}
export default async function NichePageView({ params }: { params: Params }) {
  const { siteId, slug = [] } = await params;
  const host = (await headers()).get("host");
  const native = contentPackageByHost(host);
  if (native) {
    if (native.siteId!==siteId || native.site.renderer!=="niche") notFound();
    const livePages=publicContentPages(native);
    const page=livePages.find(item=>item.slug===slug.join("/"));
    if (!page || !livePages.some(item=>item.type==="home" && item.slug==="")) notFound();
    return <NativeContentSite pkg={native} page={page} livePages={livePages} />;
  }
  const pkg = nicheSiteByHost(host);
  if (!pkg || pkg.siteId !== siteId) notFound();
  const page = publicNichePage(pkg, slug.join("/"));
  if (!page) notFound();
  const props = { pkg, page, livePages: publicNichePages(pkg) };
  if (siteId === "traktoriupadangos") {
    const { TractorSite } = await import("@/components/niche/tractor-site");
    const enabled = voiceWidgetEnabled(pkg);
    const Widget = enabled ? (await import("@/components/niche/voice-widget")).VoiceWidget : null;
    return <><TractorSite {...props} />{Widget && <Widget />}</>;
  }
  if (siteId === "roletaiklaipedoje") { const { RoletaiklaipedojeSite } = await import("@/components/niche/roletaiklaipedoje-site"); return <RoletaiklaipedojeSite {...props} />; }
  if (siteId === "akmenas") { const { AkmenasSite } = await import("@/components/niche/akmenas-site"); return <AkmenasSite {...props} />; }
  if (siteId === "auksarankiams") { const { AuksarankiamsSite } = await import("@/components/niche/auksarankiams-site"); return <AuksarankiamsSite {...props} />; }
  if (siteId === "laiptucentras") { const { LaiptucentrasSite } = await import("@/components/niche/laiptucentras-site"); return <LaiptucentrasSite {...props} />; }
  if (siteId === "miniekskavatoriai") { const { MiniekskavatoriaiSite } = await import("@/components/niche/miniekskavatoriai-site"); return <MiniekskavatoriaiSite {...props} />; }
  if (siteId === "autoelektrikaivilniuje") { const { AutoelektrikaivilniujeSite } = await import("@/components/niche/autoelektrikaivilniuje-site"); return <AutoelektrikaivilniujeSite {...props} />; }
  if (siteId === "fasadopastoliai") { const { FasadopastoliaiSite } = await import("@/components/niche/fasadopastoliai-site"); return <FasadopastoliaiSite {...props} />; }
  const { GenericNicheSite } = await import("@/components/niche/generic-site");
  return <GenericNicheSite {...props} />;
}

