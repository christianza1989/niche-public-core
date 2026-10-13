import { publicNichePages, type NichePackage, type NichePage } from "@/lib/niche-sites";
import { nicheNetworkContact } from "@/lib/niche-network";
import { nicheSchemaGraph } from "./niche-schema-core.mjs";
import { nichePageUrlCore, nicheRobotsTextCore, nicheSitemapXmlCore, nicheLlmsIndexCore, nicheLlmsFullCore } from "./niche-seo-core.mjs";

export function nichePageUrl(pkg: NichePackage, page: NichePage): string {
  return nichePageUrlCore(pkg, page);
}
export function nicheStructuredData(pkg: NichePackage, page: NichePage) {
  return nicheSchemaGraph(pkg, page, publicNichePages(pkg), nicheNetworkContact(pkg.siteId).operatorName);
}
export function nicheJsonLd(pkg: NichePackage, page: NichePage): string {
  return JSON.stringify(nicheStructuredData(pkg, page)).replace(/</g, "\\u003c");
}
export function nicheRobotsText(pkg: NichePackage, preview: boolean, hasHomepage: boolean): string {
  return nicheRobotsTextCore(pkg, preview, hasHomepage);
}
export function nicheSitemapXml(pkg: NichePackage, pages: NichePage[]): string {
  return nicheSitemapXmlCore(pkg, pages);
}
export function nicheLlmsIndex(pkg: NichePackage, pages: NichePage[]): string {
  return nicheLlmsIndexCore(pkg, pages);
}
export function nicheLlmsFull(pkg: NichePackage, pages: NichePage[]): string {
  return nicheLlmsFullCore(pkg, pages, nicheNetworkContact(pkg.siteId).operatorName);
}
