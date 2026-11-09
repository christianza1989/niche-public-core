import {memoProductForSlug} from './memocasting-products.mjs';

// Explicit page roles: a future/translated or similarly named guide never
// becomes a commercial collection merely because its URL shares a prefix.
const giftCollections = new Set(['dovanos/moterims']);
const kitSkus = ['couple', 'family'];

export function memoIsGiftCollection(page) {
  return page?.type === 'service' && giftCollections.has(page.slug);
}

// Callers pass only their eligible, locale-filtered public projection.
// Do not construct products, offers or links for unapproved/future pages.
export function memoGiftCollectionProducts(page, eligiblePages) {
  if (!memoIsGiftCollection(page)) return [];
  return kitSkus.flatMap(sku => {
    const product = eligiblePages.find(item => item.type === 'product' && memoProductForSlug(item.slug)?.sku === sku);
    return product ? [product] : [];
  });
}
