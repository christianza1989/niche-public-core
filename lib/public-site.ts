import { nicheSiteByHost, publicNichePages, type NichePackage } from './niche-sites';
import { contentPackageByHost, publicContentPages, type ContentPackageV2 } from './content-model-v2';

// Forms and measurement consume the same host and publication projection as HTML.
export function publicSiteByHost(host: string | null | undefined): NichePackage | ContentPackageV2 | null {
  return nicheSiteByHost(host) || contentPackageByHost(host);
}
export function publicSitePages(pkg: NichePackage | ContentPackageV2, now = Date.now()) {
  return pkg.schemaVersion === 2 ? publicContentPages(pkg, now) : publicNichePages(pkg, now);
}
export function publicSitePage(pkg: NichePackage | ContentPackageV2, slug: string, now = Date.now()) {
  return publicSitePages(pkg, now).find(page => page.slug === slug);
}
