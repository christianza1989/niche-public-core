import {memoProductForSlug} from './memocasting-products.mjs';

// Explicit page roles: a future/translated or similarly named guide never
// becomes a commercial collection merely because its URL shares a prefix.
const giftCollections = new Set([
  'dovanos/moterims', 'dovanos/kaledoms', 'dovanos/vyrams', 'dovanos/mamai',
  'dovanos/valentino-dienai', 'dovanos/porai', 'dovanos/seimai',
  'dovanos/kaledoms/mamai', 'dovanos/kaledoms/moterims', 'dovanos/kaledoms/vyrams',
  'dovanos/kaledoms/seimai', 'dovanos/kaledoms/tevams', 'dovanos/personalizuotos',
  'dovanos/originalios', 'dovanos/seneliui', 'dovanos/mociutei', 'dovanos/mamos-dienai',
  'dovanos/gimtadieniui/vyrui', 'dovanos/gimtadieniui/mamai', 'dovanos/gimtadieniui/moterims',
]);
const kitSkus = ['couple', 'family'];
const guideCollections = new Map(Object.entries({
  'gidai/kaledines-dovanos': ['dovanos/kaledoms'],
  'gidai/dovanos-moterims': ['dovanos/moterims'],
  'gidai/dovanos-vyrams': ['dovanos/vyrams'],
  'gidai/dovanos-mamai': ['dovanos/mamai', 'dovanos/gimtadieniui/mamai'],
  'gidai/dovanos-valentino-dienai': ['dovanos/valentino-dienai'],
  'gidai/dovana-porai': ['dovanos/porai', 'dovanos/valentino-dienai'],
  'gidai/dovana-seimai': ['dovanos/seimai'],
  'gidai/kaledines-dovanos-mamai': ['dovanos/kaledoms/mamai'],
  'gidai/kaledines-dovanos-moterims': ['dovanos/kaledoms/moterims'],
  'gidai/kaledines-dovanos-vyrams': ['dovanos/kaledoms/vyrams'],
  'gidai/kaledines-dovanos-seimai': ['dovanos/kaledoms/seimai'],
  'gidai/kaledines-dovanos-tevams': ['dovanos/kaledoms/tevams'],
  'gidai/personalizuotos-dovanos': ['dovanos/personalizuotos'],
  'gidai/originalios-dovanos': ['dovanos/originalios'],
  'gidai/dovanos-seneliams': ['dovanos/seneliui', 'dovanos/mociutei'],
  'gidai/dovanos-seneliui': ['dovanos/seneliui'],
  'gidai/dovanos-mociutei': ['dovanos/mociutei'],
  'gidai/dovanos-mamos-dienai': ['dovanos/mamos-dienai'],
  'gidai/dovanos-gimtadienio-proga': ['dovanos/gimtadieniui/vyrui', 'dovanos/gimtadieniui/mamai', 'dovanos/gimtadieniui/moterims'],
}));

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

// Only pages already admitted by the server's revision and time filter may be
// shown here; the registry does not make a draft or future page public.
export function memoGiftCollectionsForGuide(page, eligiblePages) {
  if (page?.type !== 'guide') return [];
  const slugs = guideCollections.get(page.slug) || [];
  return slugs.flatMap(slug => {
    const target = eligiblePages.find(candidate => candidate.slug === slug && memoIsGiftCollection(candidate));
    return target ? [target] : [];
  });
}

export function memoGiftCollectionsForIndex(page, eligiblePages) {
  return page?.slug === 'dovanos' ? eligiblePages.filter(memoIsGiftCollection) : [];
}
