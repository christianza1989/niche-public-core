import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { nicheSiteByHost, publicNichePage, publicNichePages } from "@/lib/niche-sites";
import { voiceWidgetEnabled } from "@/lib/niche-voice";
export const dynamic = "force-dynamic";
export const revalidate = 0;
type Params = Promise<{ siteId: string; slug?: string[] }>;
export default async function NichePageView({ params, searchParams }: { params: Params; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { siteId, slug = [] } = await params;
  const pkg = nicheSiteByHost((await headers()).get("host"));
  if (!pkg || pkg.siteId !== siteId) notFound();
  const page = publicNichePage(pkg, slug.join("/"));
  if (!page) notFound();
  const props = { pkg, page, livePages: publicNichePages(pkg) };
  if (siteId === "promedical") {
    const { PromedicalSite } = await import("@/components/niche/promedical-site");
    const query = await searchParams || {};
    const value = (key: string) => typeof query[key] === "string" ? query[key] as string : undefined;
    return <PromedicalSite {...props} query={{ q: value("q"), category: value("category"), p: value("p") }} />;
  }
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
