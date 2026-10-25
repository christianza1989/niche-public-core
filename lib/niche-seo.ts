import { nicheOrigin, nichePagePath, publicNichePages, type NicheBlock, type NichePackage, type NichePage } from "@/lib/niche-sites";
import { nicheNetworkContact } from "@/lib/niche-network";
import { nicheSchemaGraph, nicheEditorialDates } from "./niche-schema-core.mjs";
import {memoSchemaGraph,memoProfilePath} from './memocasting-structure.mjs';
import { memoIndexablePages } from './memocasting-content.mjs';
import {memoLabels,memoRoute} from './memocasting-locales.mjs';
import { galleryImageSitemapTags } from "./niche-gallery.mjs";
import { productNavigationText } from "./product-navigation.mjs";

export function nichePageUrl(pkg: NichePackage, page: NichePage): string {
  return `${nicheOrigin(pkg)}${nichePagePath(page)}`;
}

export function nicheStructuredData(pkg: NichePackage, page: NichePage, pages = publicNichePages(pkg)) {
  return (pkg.siteId==='memocasting'?memoSchemaGraph:nicheSchemaGraph)(pkg, page, pages, nicheNetworkContact(pkg.siteId).operatorName);
}

export function nicheJsonLd(pkg: NichePackage, page: NichePage, pages?: NichePage[]): string {
  return JSON.stringify(nicheStructuredData(pkg, page, pages)).replace(/</g, "\\u003c");
}

export function nicheRobotsText(pkg: NichePackage, preview: boolean, hasHomepage: boolean): string {
  if (preview || !hasHomepage) return "User-agent: *\nDisallow: /\n";
  return `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /uzklausa\nSitemap: ${nicheOrigin(pkg)}/sitemap.xml\n`;
}

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character] ?? character);
}

export function nicheSitemapXml(pkg: NichePackage, pages: NichePage[]): string {
  pages=memoIndexablePages(pkg,pages) as NichePage[];
  const entries = pages.map((page) => `<url><loc>${escapeXml(nichePageUrl(pkg, page))}</loc><lastmod>${escapeXml(nicheEditorialDates(page).modified)}</lastmod>${galleryImageSitemapTags(pkg, page)}</url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${entries}</urlset>`;
}

function blockText(block: NicheBlock): string {
  if (block.type === "paragraph") return block.text;
  if (block.type === "heading") return `${"#".repeat(block.level)} ${block.text}`;
  if (block.type === "list") return block.items.map((item) => `- ${item}`).join("\n");
  return "";
}

export function nicheLlmsIndex(pkg: NichePackage, pages: NichePage[]): string {
  pages=memoIndexablePages(pkg,pages) as NichePage[];
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
  pages=memoIndexablePages(pkg,pages) as NichePage[];
  const byId = new Map(pages.map(page => [page.id, page]));
  return [
    `# ${pkg.site.name}`,
    `> ${pkg.site.offer}`,
    "",
    "Toliau pateikiami tik šiuo metu vieši puslapiai. Kai pagrindinis puslapis turi atskirą dizaino šabloną, jo santrauką papildo viešas HTML.",
    ...pages.map((page) => {
      const labels=pkg.siteId==='memocasting'?memoLabels[memoRoute(page).language]:null;
      const profile=pkg.siteId==='memocasting'?memoProfilePath(page,pages):null;
      return [
      "",
      `## ${page.title}`,
      `URL: ${nichePageUrl(pkg, page)}`,
      page.description,
      ...(page.type === "guide" ? [
        labels?`${labels.author}: MB Memocasting${profile?' ('+nicheOrigin(pkg)+profile+')':''}; ${labels.editorial}`:`Autorius: ${nicheNetworkContact(pkg.siteId).operatorName}; tekstas rengtas su AI pagal nurodytus šaltinius.`,
        `${labels?.published??'Publikavimo data'}: ${nicheEditorialDates(page).published}`,
        `${labels?.reviewed??'Turinio peržiūra'}: ${nicheEditorialDates(page).modified}`] : []),
      ...(page.type === "home" && !["traktoriupadangos","memocasting","promedical"].includes(pkg.siteId) ? [] : ["", ...page.body.map(blockText).filter(Boolean)]),
      ...productNavigationText(pkg,page,pages),
      ...page.links.flatMap(link => { const target = byId.get(link.targetPageId); return target ? [`${labels?.related??'Susijęs atsakymas'}: [${link.label}](${nichePageUrl(pkg, target)})`] : []; }),
      ...(page.externalLinks ?? []).map(link => `${labels?.sources??'Šaltinis'}: [${link.label}](${link.url}) — ${link.reason}`),
    ].join("\n");}),
  ].join("\n");
}
