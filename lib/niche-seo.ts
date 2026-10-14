import { nicheOrigin, nichePagePath, publicNichePages, type NichePackage, type NichePage } from "@/lib/niche-sites";
import { nicheNetworkContact } from "@/lib/niche-network";
import { nicheSchemaGraph, nicheEditorialDates } from "./niche-schema-core.mjs";
import { nicheReadingBody } from "./niche-reading-core.mjs";

export function nichePageUrl(pkg: NichePackage, page: NichePage): string {
  return `${nicheOrigin(pkg)}${nichePagePath(page)}`;
}

export function nicheStructuredData(pkg: NichePackage, page: NichePage) {
  return nicheSchemaGraph(pkg, page, publicNichePages(pkg), nicheNetworkContact(pkg.siteId).operatorName);
}

export function nicheJsonLd(pkg: NichePackage, page: NichePage): string {
  return JSON.stringify(nicheStructuredData(pkg, page)).replace(/</g, "\\u003c");
}

export function nicheRobotsText(pkg: NichePackage, preview: boolean, hasHomepage: boolean): string {
  if (preview || !hasHomepage) return "User-agent: *\nDisallow: /\n";
  return `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /uzklausa\nSitemap: ${nicheOrigin(pkg)}/sitemap.xml\n`;
}

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character] ?? character);
}

export function nicheSitemapXml(pkg: NichePackage, pages: NichePage[]): string {
  const entries = pages.map((page) => `<url><loc>${escapeXml(nichePageUrl(pkg, page))}</loc><lastmod>${escapeXml(nicheEditorialDates(page).modified)}</lastmod></url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`;
}

export function nicheLlmsIndex(pkg: NichePackage, pages: NichePage[]): string {
  const origin = nicheOrigin(pkg);
  return [
    `# ${pkg.site.name}`,
    `> ${pkg.site.offer}`,
    "",
    "## Publikuoti puslapiai",
    ...pages.map((page) => `- [${page.title}](${nichePageUrl(pkg, page)}): ${page.description}`),
    "",
    `Kontaktai: ${pkg.site.contact.email}${pkg.site.contact.phone ? `, ${pkg.site.contact.phone}` : ""}`,
    `Išplėstas patvirtinto turinio sąrašas: ${origin}/llms-full.txt`,
  ].join("\n");
}

export function nicheLlmsFull(pkg: NichePackage, pages: NichePage[]): string {
  const byId = new Map(pages.map(page => [page.id, page]));
  return [
    `# ${pkg.site.name}`,
    `> ${pkg.site.offer}`,
    "",
    "Toliau pateikiami tik šiuo metu vieši puslapiai. Kai pagrindinis puslapis turi atskirą dizaino šabloną, jo santrauką papildo viešas HTML.",
    ...pages.map((page) => [
      "",
      `## ${page.title}`,
      `URL: ${nichePageUrl(pkg, page)}`,
      page.description,
      ...(page.type === "guide" ? [`Autorius: ${nicheNetworkContact(pkg.siteId).operatorName}; tekstas rengtas su AI pagal nurodytus šaltinius.`, `Publikavimo data: ${nicheEditorialDates(page).published}`, `Turinio peržiūra: ${nicheEditorialDates(page).modified}`] : []),
      "", ...nicheReadingBody(pkg.siteId, page),
      ...page.links.flatMap(link => { const target = byId.get(link.targetPageId); return target ? [`Susijęs atsakymas: [${link.label}](${nichePageUrl(pkg, target)})`] : []; }),
      ...(page.externalLinks ?? []).map(link => `Šaltinis: [${link.label}](${link.url}) — ${link.reason}`),
    ].join("\n")),
  ].join("\n");
}
