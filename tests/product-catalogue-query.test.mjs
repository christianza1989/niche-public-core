import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { catalogueCanonical, catalogueQuery, catalogueSku } from '../lib/product-catalogue-query.mjs';
import { projectPublicPages } from '../lib/niche-links.mjs';
import { productCatalogue } from '../lib/product-navigation.mjs';

const packages = JSON.parse(readFileSync(new URL('../lib/generated/content-packages.json', import.meta.url)));
const settings = JSON.parse(readFileSync(new URL('../config/niche-network.json', import.meta.url)));
const pkg = packages.find(p => p.siteId === 'promedical');
const pages = projectPublicPages(pkg, packages, settings, Date.parse('2026-10-21T14:00:00Z'));
const root = pages.find(p => p.slug === 'produktai');
const base = 'https://promedical.lt/produktai';

test('every real public collection page has its own canonical and a distinct result slice', () => {
  let checked = 0;
  const before = JSON.stringify(pkg);
  for (const page of pages.filter(p => p.slug === 'produktai' || p.slug.startsWith('kategorijos/'))) {
    const first = catalogueQuery(pkg, page, pages);
    const sets = new Set([JSON.stringify(first.shown.map(p => p.id))]);
    for (let p = 2; p <= first.totalPages; p++) {
      const query = catalogueQuery(pkg, page, pages, { p:String(p) });
      const key = JSON.stringify(query.shown.map(p => p.id));
      assert.ok(query.shown.length && !sets.has(key), `${page.slug} page${p} distinct`);
      sets.add(key);
      assert.equal(catalogueCanonical(pkg, page, pages, `?p=${p}`), `https://promedical.lt/${page.slug}?p=${p}`);
      checked++;
    }
  }
  assert.ok(checked > 250, 'exercise full production catalogue');
  assert.equal(JSON.stringify(pkg), before, 'never mutate title, meta, prose or approval');
});

test('all additional query keys and duplicate p values keep the root canonical', () => {
  for (const query of ['?p=2&q=voz', '?q=&p=2', '?category=x&p=2', '?sort=price&p=2', '?p=2&order=asc', '?p=2&utm_source=test', '?p=2&p=3', '?p=2&P=3']) {
    assert.equal(catalogueCanonical(pkg, root, pages, query), base, query);
  }
});

test('first, malformed and out-of-range pages do not create canonical duplicates', () => {
  for (const query of ['', '?p=1', '?p=0', '?p=-2', '?p=', '?p=NaN', '?p=2.5', '?p=Infinity']) assert.equal(catalogueCanonical(pkg, root, pages, query), base, query);
  const last = catalogueQuery(pkg, root, pages).totalPages;
  assert.equal(catalogueCanonical(pkg, root, pages, '?p=9999'), `${base}?p=${last}`);
  assert.equal(catalogueCanonical(pkg, root, pages, '?p=02'), `${base}?p=2`);
  const sparse = pages.find(p => p.slug.startsWith('kategorijos/') && catalogueQuery(pkg,p,pages).totalPages === 1);
  assert.equal(catalogueCanonical(pkg, sparse, pages, '?p=2'), `https://promedical.lt/${sparse.slug}`);
});

test('products, guides and other tenant canonicals remain unchanged', () => {
  assert.equal(catalogueCanonical(pkg,pages.find(p => p.slug === ''),pages,'?p=2'), 'https://promedical.lt/');
  for (const page of pages.filter(p => p.type === 'product' || p.type === 'guide')) {
    assert.equal(catalogueCanonical(pkg,page,pages,'?p=2'), `https://promedical.lt/${page.slug}`);
  }
  for (const other of packages.filter(p => p.siteId !== 'promedical' && p.schemaVersion === 1)) {
    for (const page of other.pages.slice(0,3)) assert.equal(catalogueCanonical(other,page,other.pages,'?p=2'), `https://${other.canonicalHost}/${page.slug}`);
  }
});

test('extracting the list preserves exact catalog order, category memberships and code search', () => {
  const index = productCatalogue(pkg,pages);
  for (const page of pages.filter(p => p.slug === 'produktai' || p.slug.startsWith('kategorijos/'))) {
    const actual = catalogueQuery(pkg,page,pages);
    const expected = pages.filter(p => p.type === 'product' && p.slug.startsWith('produktai/') && (page === root || index.byCategory.get(page.id)?.some(x => x.id === p.id)));
    assert.deepEqual(actual.filtered.map(p => p.id),expected.map(p => p.id));
  }
  const product = pages.find(p => p.type === 'product' && /[/ -]/.test(catalogueSku(p)));
  const result = catalogueQuery(pkg,root,pages,{q:catalogueSku(product)});
  assert.ok(result.filtered.some(p => p.id === product.id));
  const name = catalogueSku(product);
  assert.equal(name, product.intent.split(' | ')[0].slice('Katalogo kodas: '.length));
});
