import type { ContentPackageV2, ProjectedContentPageV2, AuthorV2 } from "./content-model-v2";
import { getHomeCategories } from "./homepage-data";
import type { SupportedLocale } from "./site-config";

/** Presentation helpers consume only the already time/approval/link-projected pages. */
export function giftArticles(pages: ProjectedContentPageV2[]) {
  return pages.filter(page => page.type === "article").sort((a, b) => Date.parse(b.publishAt) - Date.parse(a.publishAt) || a.id.localeCompare(b.id));
}
export function giftTopics(pkg: ContentPackageV2, pages: ProjectedContentPageV2[]) {
  const ids = new Set(giftArticles(pages).map(page => page.id));
  return getHomeCategories(pkg.locale as SupportedLocale).map(topic => ({ ...topic, available: topic.articleIds.some(id => ids.has(id)) }));
}
export function giftFilteredArticles(pkg: ContentPackageV2, pages: ProjectedContentPageV2[], topic?: string) {
  const all = giftArticles(pages);
  if (!topic) return all;
  const category = giftTopics(pkg, pages).find(item => item.slug === topic);
  // Unknown filters do not create uncontrolled indexable pseudo-categories.
  return category ? all.filter(page => category.articleIds.includes(page.id)) : [];
}
export const giftPath = (page: ProjectedContentPageV2) => "/" + page.slug;
export const giftFeaturedImage = (page: ProjectedContentPageV2) => page.media.find(asset => asset.id === page.editorial.featuredImageId);
export function giftAuthorPage(author: AuthorV2, pages: ProjectedContentPageV2[]) {
  return pages.find(page => page.type === "author" && page.slug === `autoriai/${author.slug}` && page.editorial.authors.some(item => item.id === author.id));
}
export function giftAuthors(pages: ProjectedContentPageV2[]) {
  return [...new Map(giftArticles(pages).flatMap(page => page.editorial.authors).map(author => [author.id, author])).values()];
}
export const giftDate = (value: string, locale: string, timezone: string) => new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: timezone }).format(new Date(value));
