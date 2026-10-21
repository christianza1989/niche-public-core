import { productCatalogue } from './product-navigation.mjs';

export const CATALOG_PAGE_SIZE = 24;
const isProduct = p => p.type === 'product' && p.slug.startsWith('produktai/');
const isCategory = p => p.slug.startsWith('kategorijos/');

/** @param {import('./niche-sites').NichePage} page */
export function catalogueSku(page) {
  return page.intent.startsWith('Katalogo kodas: ') ? page.intent.split(' | ')[0].slice('Katalogo kodas: '.length) : page.slug.split('/').at(-1)?.toUpperCase() || '';
}

// The visible list and its canonical use exactly the same public memberships,
// filter and clamped page. Neither reconstructs category membership from prose.
/**
 * @param {import('./niche-sites').NichePackage} pkg
 * @param {import('./niche-sites').NichePage} page
 * @param {import('./niche-sites').NichePage[]} pages
 * @param {{q?:string, category?:string, p?:string}} query
 */
export function catalogueQuery(pkg, page, pages, query = {}) {
  const allProducts = pages.filter(isProduct);
  const categories = pages.filter(isCategory);
  const selected = isCategory(page) ? page : categories.find(c => c.slug.slice('kategorijos/'.length) === query.category);
  const catalogue = productCatalogue(pkg, pages);
  const selectedProducts = new Set((selected ? catalogue?.byCategory.get(selected.id) || [] : []).map(p => p.id));
  const normalize = v => v.toLocaleLowerCase('lt-LT').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const term = normalize((query.q || '').slice(0,100));
  const filtered = allProducts.filter(p => (!selected || selectedProducts.has(p.id)) && (!term || normalize(`${p.title} ${catalogueSku(p)} ${p.description}`).includes(term)));
  const requested = Number(query.p);
  const totalPages = Math.max(1, Math.ceil(filtered.length / CATALOG_PAGE_SIZE));
  const current = Number.isInteger(requested) ? Math.max(1, Math.min(totalPages, requested)) : 1;
  const shown = filtered.slice((current - 1) * CATALOG_PAGE_SIZE, current * CATALOG_PAGE_SIZE);
  return { allProducts, categories, selected, filtered, current, totalPages, shown, pageSize: CATALOG_PAGE_SIZE };
}

/**
 * @param {import('./niche-sites').NichePackage} pkg
 * @param {import('./niche-sites').NichePage} page
 * @param {import('./niche-sites').NichePage[]} pages
 * @param {string} search
 */
export function catalogueCanonical(pkg, page, pages, search = '') {
  const base = `https://${pkg.canonicalHost}/${page.slug}`;
  if (pkg.siteId !== 'promedical' || pkg.canonicalHost !== 'promedical.lt' || (page.slug !== 'produktai' && !isCategory(page))) return base;
  const params = new URLSearchParams(search);
  // Search, facets, sort, tracking and repeated p values never gain their own
  // canonical. Normalize p=1/invalid values back to the collection root.
  if ([...params.keys()].some(key => key !== 'p') || params.getAll('p').length !== 1) return base;
  const requested = Number(params.get('p'));
  if (!Number.isSafeInteger(requested) || requested < 2) return base;
  const { current } = catalogueQuery(pkg, page, pages, { p: params.get('p') });
  // An out-of-range URL already renders a clamped existing page: canonicalize
  // to that actual result page, never manufacture another indexable copy.
  return base + (current > 1 ? `?p=${current}` : '');
}
