import { nicheOrigin, nichePagePath, publicNichePages, type NicheBlock, type NichePackage, type NichePage } from "@/lib/niche-sites";
import { nicheNetworkContact } from "@/lib/niche-network";
import { nicheSchemaGraph, nicheEditorialDates } from "./niche-schema-core.mjs";
import {pageAlternates,languageConfig,pageLanguage} from './niche-languages.mjs';

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
  const entries = pages.map((page) => `<url><loc>${escapeXml(nichePageUrl(pkg, page))}</loc><lastmod>${escapeXml(nicheEditorialDates(page).modified)}</lastmod>${pageAlternates(pkg,page,pages).map((a:{locale:string,path:string})=>`<xhtml:link rel="alternate" hreflang="${escapeXml(a.locale)}" href="${escapeXml(nicheOrigin(pkg)+a.path)}"/>`).join('')}</url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries}</urlset>`;
}

function blockText(block: NicheBlock): string {
  if (block.type === "paragraph") return block.text;
  if (block.type === "heading") return `${"#".repeat(block.level)} ${block.text}`;
  if (block.type === "list") return block.items.map((item) => `- ${item}`).join("\n");
  return "";
}

export function nicheLlmsIndex(pkg: NichePackage, pages: NichePage[]): string {
  const origin = nicheOrigin(pkg);
  const multilingual=!!languageConfig(pkg);
  return [
    `# ${pkg.site.name}`,
    `> ${pkg.site.offer}`,
    "",
    multilingual?"## Published pages by language":"## Publikuoti puslapiai",
    ...pages.map((page) => `- [${page.title}](${nichePageUrl(pkg, page)}): ${page.description}`),
    "",
    `${multilingual?'Contact':'Kontaktai'}: ${pkg.site.contact.email}${pkg.site.contact.phone ? `, ${pkg.site.contact.phone}` : ""}`,
    `${multilingual?'Full approved public content':'Išplėstas patvirtinto turinio sąrašas'}: ${origin}/llms-full.txt`,
  ].join("\n");
}

export function nicheLlmsFull(pkg: NichePackage, pages: NichePage[]): string {
  const byId = new Map(pages.map(page => [page.id, page]));
  const multilingual=!!languageConfig(pkg);
  return [
    `# ${pkg.site.name}`,
    `> ${pkg.site.offer}`,
    "",
    multilingual?"Only currently approved, public pages follow. Each page retains its language, sources and editorial content.":"Toliau pateikiami tik šiuo metu vieši puslapiai. Kai pagrindinis puslapis turi atskirą dizaino šabloną, jo santrauką papildo viešas HTML.",
    ...pages.map((page) => [
      "",
      `## ${page.title}`,
      `URL: ${nichePageUrl(pkg, page)}`,
      ...(multilingual?[`Language: ${pageLanguage(pkg,page)}`]:[]),
      page.description,
      ...(page.type === "guide" ? [`${multilingual?'Author':'Autorius'}: ${nicheNetworkContact(pkg.siteId).operatorName}; ${multilingual?'AI-assisted drafting; sources and editorial policy are linked.':'tekstas rengtas su AI pagal nurodytus šaltinius.'}`, `${multilingual?'Publication date':'Publikavimo data'}: ${nicheEditorialDates(page).published}`, `${multilingual?'Content reviewed':'Turinio peržiūra'}: ${nicheEditorialDates(page).modified}`] : []),
      ...(page.type === "home" && pkg.siteId !== "traktoriupadangos"&&!multilingual ? [] : ["", ...page.body.map(blockText).filter(Boolean)]),
      ...page.links.flatMap(link => { const target = byId.get(link.targetPageId); return target ? [`${multilingual?'Related':'Susijęs atsakymas'}: [${link.label}](${nichePageUrl(pkg, target)})`] : []; }),
      ...(page.externalLinks ?? []).map(link => `${multilingual?'Source':'Šaltinis'}: [${link.label}](${link.url}) — ${link.reason}`),
    ].join("\n")),
  ].join("\n");
}
