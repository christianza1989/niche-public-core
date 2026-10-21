import promedicalCatalogue from '../config/promedical-catalogue.json' with { type: 'json' };

// Catalog relations are independent of editorial links/approval bytes. Callers
// supply the SAME eligible page projection used by routing, schema and exports.
const cache = new WeakMap();
const pathFor = page => `/${page.slug}`;
const category = p => p.slug?.startsWith('kategorijos/');
const product = p => p.type === 'product' && p.slug?.startsWith('produktai/');
const safe = (pkg, p) => p.siteId === pkg.siteId && typeof p.slug === 'string'
  && !/[?#\\\s]/u.test(p.slug) && !p.slug.startsWith('/')
  && p.slug.split('/').every(part => part && part !== '.' && part !== '..');
const model = p => p.intent?.match(/^Katalogo kodas: (.*?) \|/u)?.[1] || '';
const normalized = s => s.toUpperCase().replace(/[^A-Z0-9]/gu, '');
// A ranking hint, never a compatibility or interchangeable-part claim. Preserve
// all digits: ZV2234 and ZV2235 are different models; CN11/18 is not CN11/19.
const family = s => s.toUpperCase().replace(/[\s*]/gu, '')
  .match(/^(.+?\d)[A-Z/-]*$/u)?.[1].replace(/[^A-Z0-9]/gu, '') || '';
const tokens = p => new Set(p.title.toLocaleLowerCase('lt').match(/[\p{L}\p{N}]+/gu) || []);
const overlap = (a, b) => {
  let common = 0;
  for (const t of a) if (b.has(t)) common++;
  return common / Math.max(1, a.size + b.size - common);
};

export function validateProductCatalogue(catalogue, pkg) {
  if (catalogue.version !== 1 || catalogue.siteId !== pkg.siteId || !/^[a-f0-9]{64}$/u.test(catalogue.sourceSha256)) throw new Error('Invalid product catalog identity');
  const byId = new Map(pkg.pages.map(p => [p.id, p]));
  for (const p of pkg.pages.filter(product)) {
    const entry = catalogue.products?.[p.id];
    if (!entry || typeof entry.model !== 'string' || !entry.model.trim() || !Array.isArray(entry.categoryIds) || !entry.categoryIds.length || new Set(entry.categoryIds).size !== entry.categoryIds.length) throw new Error(`Missing or duplicate catalog assignment: ${p.id}`);
    for (const id of entry.categoryIds) if (!byId.has(id) || !category(byId.get(id)) || !safe(pkg, byId.get(id))) throw new Error(`Invalid catalog category: ${id}`);
  }
  for (const id of Object.keys(catalogue.products)) if (!byId.has(id) || !product(byId.get(id))) throw new Error(`Unknown catalog product: ${id}`);
}

export function productCatalogue(pkg, publicPages, catalogue = promedicalCatalogue) {
  if (pkg.siteId !== catalogue.siteId || pkg.canonicalHost !== 'promedical.lt') return null;
  let entries = cache.get(publicPages);
  if (!entries) { entries = new Map(); cache.set(publicPages, entries); }
  if (entries.has(catalogue)) return entries.get(catalogue);
  const pages = publicPages.filter(p => safe(pkg, p));
  const byId = new Map(pages.map(p => [p.id, p]));
  const categoriesBySlug = new Map(pages.filter(category).map(p => [p.slug, p]));
  const memberships = new Map(), byCategory = new Map(), features = new Map();
  for (const p of pages.filter(product)) {
    const registered = catalogue.products[p.id];
    const sku = registered?.model || model(p);
    features.set(p.id, { sku: normalized(sku), family: family(sku), words: tokens(p) });
    // Never reconstruct a product classification from its prose or outgoing
    // editorial links. New assignments are edits to the catalog sidecar.
    const direct = (registered?.categoryIds || []).map(id => byId.get(id)).filter(p => p && category(p));
    const ids = new Set(direct.map(p => p.id));
    // A newly public parent category participates without a product text edit.
    for (const d of direct) {
      const segments = d.slug.split('/');
      for (let length = 2; length < segments.length; length++) {
        const parent = categoriesBySlug.get(segments.slice(0,length).join('/'));
        if (parent) ids.add(parent.id);
      }
    }
    const assigned = [...ids].map(id => byId.get(id));
    memberships.set(p.id, assigned);
    for (const c of assigned) {
      if (!byCategory.has(c.id)) byCategory.set(c.id, []);
      byCategory.get(c.id).push(p);
    }
  }
  const result = { byId, memberships, byCategory, features, pages, navigation: new Map() };
  entries.set(catalogue, result);
  return result;
}

export function productNavigation(pkg, page, publicPages, catalogue = promedicalCatalogue) {
  const index = productCatalogue(pkg, publicPages, catalogue);
  if (!index || !product(page) || !index.byId.has(page.id)) return { category: null, related: [] };
  if (index.navigation.has(page.id)) return index.navigation.get(page.id);
  const assigned = index.memberships.get(page.id) || [];
  // Prefer the first registered category with two other public products. This
  // may be a real catalog parent when a leaf is sparse. The breadcrumb, category
  // link, filter and EVERY recommended product then refer to that SAME category.
  const currentCategory = assigned.find(c => (index.byCategory.get(c.id)?.length || 0) >= 3) || assigned[0] || null;
  const candidates = (index.byCategory.get(currentCategory?.id) || [])
    .filter(p => p.id !== page.id).map(p => ({ p, categoryId: currentCategory.id }));
  const own = index.features.get(page.id);
  const ranked = candidates.map(x => {
    const other = index.features.get(x.p.id);
    return { ...x, variant: own.sku && own.sku === other.sku ? 2 : own.family && other.family === own.family ? 1 : 0, similarity: overlap(own.words, other.words) };
  }).sort((a,b) => b.variant - a.variant || b.similarity - a.similarity || a.p.slug.localeCompare(b.p.slug, 'lt') || a.p.id.localeCompare(b.p.id));
  const guides = index.pages.filter(p => p.type === 'guide' && p.id !== page.id && p.links?.some(l => l.targetPageId === page.id))
    .sort((a,b) => Date.parse(b.publishAt) - Date.parse(a.publishAt) || a.slug.localeCompare(b.slug, 'lt') || a.id.localeCompare(b.id));
  const link = (p, kind) => ({ id: p.id, label: p.title, href: pathFor(p), kind });
  // One category + 2 products reserves room for up to 2 incoming guides.
  // With at most 1 guide, show 3 products. Sparse catalog groups stay sparse.
  const productCount = guides.length > 1 ? 2 : 3;
  const related = [
    ...(currentCategory ? [link(currentCategory, 'category')] : []),
    ...ranked.slice(0, productCount).map(x => ({ ...link(x.p, 'product'), categoryId: x.categoryId })),
    ...guides.map(p => link(p, 'guide')),
  ].filter((x,i,a) => x.id !== page.id && a.findIndex(y => y.id === x.id) === i).slice(0,5);
  const result = { category: currentCategory, related };
  index.navigation.set(page.id, result);
  return result;
}

const escape = s => String(s).replace(/[&<>"']/gu, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function productNavigationText(pkg, page, publicPages, catalogue = promedicalCatalogue) {
  const nav = productNavigation(pkg, page, publicPages, catalogue);
  const anchor = x => `<a href="${escape(`https://${pkg.canonicalHost}${x.href}`)}">${escape(x.label)}</a>`;
  return [
    ...(nav.category ? [`Kelias: ${anchor({href:'/',label:pkg.site.name})} → ${anchor({href:pathFor(nav.category),label:nav.category.title})} → ${escape(page.title)}`] : []),
    ...(nav.related.length ? ['Susiję:', ...nav.related.map(x => `- ${anchor(x)}`)] : []),
  ];
}
