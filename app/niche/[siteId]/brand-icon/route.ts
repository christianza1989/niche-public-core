import { headers } from "next/headers";
import { nicheSiteByHost } from "@/lib/niche-sites";

export async function GET(_request: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const pkg = nicheSiteByHost((await headers()).get("host"));
  if (!pkg || pkg.siteId !== siteId) return new Response("Not found", { status: 404 });
  if (pkg.siteId === "promedical") {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path fill="#c8323d" fill-rule="evenodd" d="M8 4h22c17 0 28 10 28 24S47 51 30 51H20v9H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4Zm18 9h8v10h10v8H34v10h-8V31H16v-8h10Z"/></svg>';
    return new Response(svg, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=3600", "x-content-type-options": "nosniff" } });
  }
  if (pkg.siteId === "fasadopastoliai") {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 38"><rect width="38" height="38" fill="#d4e84c"/><path d="M6 33V5h26v28M6 14h26M6 24h26M19 5v28M6 5l13 9 13-9M6 24l13 9 13-9" fill="none" stroke="#182d31" stroke-width="2.4"/></svg>';
    return new Response(svg, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=3600", "x-content-type-options": "nosniff" } });
  }
  if (pkg.siteId === "autoelektrikaivilniuje") {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#1949b8"/><path d="M3 10h12v20H3M37 10H25v20h12M15 20h10" fill="none" stroke="#fff" stroke-width="3"/><circle cx="20" cy="20" r="3" fill="#fff"/></svg>';
    return new Response(svg, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=3600", "x-content-type-options": "nosniff" } });
  }
  if (pkg.siteId === "laiptucentras") {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#203140"/><g fill="none" stroke="#f5f6f3" stroke-width="3.2" stroke-linejoin="miter"><path d="M9 49h14V35h14V21h14V9M9 55 55 9"/></g></svg>';
    return new Response(svg, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=3600", "x-content-type-options": "nosniff" } });
  }
  const letter = pkg.siteId === "greitossvetaines" ? "g" : pkg.site.name.slice(0, 1).toLowerCase().replace(/[^a-z]/g, "s");
  const accent = /^#[\da-f]{6}$/i.test(pkg.site.brand.accent) ? pkg.site.brand.accent : "#246f74";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="13" fill="${accent}"/><text x="17" y="47" fill="#fff" font-family="Arial,sans-serif" font-size="47" font-weight="bold">${letter}</text><circle cx="50" cy="46" r="5" fill="#b5e4b0"/></svg>`;
  return new Response(svg, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=3600", "x-content-type-options": "nosniff" } });
}
