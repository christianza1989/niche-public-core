import type { ProjectedContentPageV2, AuthorV2 } from './content-model-v2';
/** Presentation only: callers must supply the shared projected public inventory. */
export function contentArticles(pages: ProjectedContentPageV2[], types: string[] = ['article']) {
  return pages.filter(page => types.includes(page.type)).sort((a,b) => Date.parse(b.publishAt)-Date.parse(a.publishAt)||a.id.localeCompare(b.id));
}
export const contentPath = (page: ProjectedContentPageV2) => '/' + page.slug;
export const contentFeaturedImage = (page: ProjectedContentPageV2) => page.media.find(asset => asset.id === page.editorial.featuredImageId);
export function contentAuthorPage(author: AuthorV2, pages: ProjectedContentPageV2[], anySlug = false) {
  return pages.find(page => page.type === 'author' && (anySlug || page.slug === `autoriai/${author.slug}`) && page.editorial.authors.some(item=>item.id===author.id));
}
export const contentDate = (value: string, locale: string, timezone: string) => new Intl.DateTimeFormat(locale,{dateStyle:'long',timeZone:timezone}).format(new Date(value));
