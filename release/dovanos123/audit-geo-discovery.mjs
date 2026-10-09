import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const releaseDir = path.dirname(fileURLToPath(import.meta.url));
const pkgBytes = await readFile(path.join(releaseDir, 'content-package.json'));
const pkg = JSON.parse(pkgBytes);
const origin = `https://${pkg.canonicalHost}`;
const endpoints = ['/robots.txt', '/sitemap.xml', '/llms.txt', '/llms-full.txt'];
const responses = {};
for (const pathname of endpoints) {
  const response = await fetch(origin + pathname, { redirect: 'manual' });
  const body = await response.text();
  assert.equal(response.status, 200, pathname);
  assert.match(response.headers.get('cache-control') || '', /private,\s*no-store/i, pathname + ' cache');
  responses[pathname] = { status: response.status, cacheControl: response.headers.get('cache-control'), body };
}

const sitemap = responses['/sitemap.xml'].body;
const index = responses['/llms.txt'].body;
const full = responses['/llms-full.txt'].body;
const pages = new Map(pkg.pages.map(page => [page.id, page]));
const articles = pkg.pages.filter(page => page.type === 'article');
const articleEvidence = [];
for (const page of articles) {
  const heading = `## ${page.title}\n`;
  const start = full.indexOf(heading);
  assert.notEqual(start, -1, `${page.id} title`);
  const next = full.indexOf('\n## ', start + heading.length);
  const section = full.slice(start, next < 0 ? undefined : next);
  const canonical = `${origin}/${page.slug}`;
  assert.ok(section.includes(`URL: ${canonical}`), `${page.id} canonical`);
  assert.ok(index.includes(`](${canonical})`), `${page.id} index link`);
  assert.ok(sitemap.includes(`<loc>${canonical}</loc>`), `${page.id} sitemap`);
  if (page.editorial.datePublished) assert.ok(section.includes(`Publikavimo data: ${page.editorial.datePublished}`), `${page.id} publication date`);
  if (page.editorial.dateModified) assert.ok(section.includes(`Turinio atnaujinimo data: ${page.editorial.dateModified}`), `${page.id} modified date`);
  for (const author of page.editorial.authors) {
    const profiles = pkg.pages.filter(candidate => candidate.type === 'author' && candidate.editorial.authors.some(identity => identity.id === author.id));
    if (profiles.length === 1) {
      const profileUrl = `${origin}/${profiles[0].slug}`;
      assert.ok(section.includes(`Autoriaus profilis: [${author.name}](${profileUrl})`), `${page.id} author profile`);
    }
  }
  for (const link of page.links) {
    const target = pages.get(link.targetPageId);
    if (target) assert.ok(section.includes(`Susijęs atsakymas: [${link.label}](${origin}/${target.slug})`), `${page.id} related ${link.targetPageId}`);
  }
  for (const link of page.externalLinks ?? []) assert.ok(section.includes(`Šaltinis: [${link.label}](${link.url}) — ${link.reason}`), `${page.id} source ${link.url}`);
  articleEvidence.push({ id: page.id, path: `/${page.slug}`, published: Boolean(page.editorial.datePublished), modified: Boolean(page.editorial.dateModified), profileLinks: page.editorial.authors.length, relatedLinks: page.links.length, externalLinks: (page.externalLinks ?? []).length });
}
assert.equal((sitemap.match(/<url>/g) || []).length, pkg.pages.length, 'complete sitemap count');
assert.ok(index.includes(`Kontaktas: ${pkg.site.contact.email}`), 'index contact');
assert.ok(index.includes(`${origin}/llms-full.txt`), 'index full export');

const record = {
  schemaVersion: 1,
  siteId: pkg.siteId,
  origin,
  checkedAt: new Date().toISOString(),
  workerVersion: '5dd0cd85-93e4-4a1c-9892-b191d0c20b60',
  deployedAt: '2026-10-07T10:34:16.442355Z',
  sourceCommit: 'c922d0bb0b75fee27d666cb35bd5a41b91766b3d',
  packageSha256: createHash('sha256').update(pkgBytes).digest('hex'),
  endpoints: Object.fromEntries(endpoints.map(pathname => [pathname, { status: responses[pathname].status, cacheControl: responses[pathname].cacheControl }])),
  inventory: { pages: pkg.pages.length, articles: articles.length, sitemapUrls: (sitemap.match(/<url>/g) || []).length },
  articleChecks: { articlesChecked: articleEvidence.length, allPassed: true, publicationDates: articleEvidence.filter(page => page.published).length, modifiedDates: articleEvidence.filter(page => page.modified).length, authorProfileLinks: articleEvidence.reduce((sum, page) => sum + page.profileLinks, 0), relatedLinks: articleEvidence.reduce((sum, page) => sum + page.relatedLinks, 0), externalSources: articleEvidence.reduce((sum, page) => sum + page.externalLinks, 0) },
  articles: articleEvidence,
  limits: ['This verifies the deployed text outputs and cache headers; it does not establish search indexing, AI citations, rankings or demand.'],
};
await writeFile(path.join(releaseDir, 'POST-GEO-DISCOVERY-20261007.json'), JSON.stringify(record, null, 2) + '\n');
console.log(JSON.stringify({ ...record.inventory, ...record.articleChecks, workerVersion: record.workerVersion, packageSha256: record.packageSha256, allEndpointsNoStore: Object.values(record.endpoints).every(item => /private,\s*no-store/i.test(item.cacheControl)) }, null, 2));
