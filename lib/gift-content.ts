import type { ContentPackageV2, ProjectedContentPageV2 } from "./content-model-v2";
import { getHomeCategories } from "./homepage-data";
import type { SupportedLocale } from "./site-config";

/** Presentation helpers consume only the already time/approval/link-projected pages. */
export { contentPath as giftPath, contentFeaturedImage as giftFeaturedImage, contentAuthorPage as giftAuthorPage, contentDate as giftDate } from './content-presentation';
import { contentArticles as giftArticles } from './content-presentation';
export { giftArticles };
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
export function giftAuthors(pages: ProjectedContentPageV2[]) {
  return [...new Map(giftArticles(pages).flatMap(page => page.editorial.authors).map(author => [author.id, author])).values()];
}
