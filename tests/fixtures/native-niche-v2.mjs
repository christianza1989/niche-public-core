import { v2RevisionHash, validateV2Package } from '../../scripts/content-package-v2.mjs';

export function nativeFixture({ siteId = 'nativeqa', renderer = 'niche', boundary = '2030-01-01T00:00:00.000Z' } = {}) {
  const site = { id: siteId, name: `Izoliuotas ${siteId} bandymas`, canonicalHost: `${siteId}.example`, locale: 'lt-LT', timezone: 'Europe/Vilnius', brand: { accent: '#31554a' }, offer: 'Tik izoliuoto bandymo pasiūlymas.', contact: { email: `${siteId}@example.org` }, renderer, operatorName: 'Bandymo organizacija' };
  const author = { id: 'editor', siteId, locale: site.locale, slug: 'redakcija', name: 'Bandymo redakcija', role: 'Bandymo turinio rengimas', bio: 'Izoliuoto bandymo organizacija.', kind: 'organization', sameAs: [] };
  const make = (id, type, slug) => ({ id, type, slug, siteId, contentVersion: 2, title: `Bandymo puslapis ${id}`, description: 'Izoliuoto bandymo aprašymas.', intent: 'Patikrinti bendrą rendererį.', body: [{ type: 'paragraph', text: 'Naudingas bandymo turinys.' }], media: [], links: [], externalLinks: [], publishAt: '2020-01-01T00:00:00.000Z', siteSnapshot: structuredClone(site), editorial: { category: 'Bandymo gidai', readingMinutes: 3, authors: ['article', 'guide', 'author'].includes(type) ? [author] : [], sources: [], datePublished: null, dateModified: null, featuredImageId: null, productRecommendation: false, relatedPageIds: [], commerceTargets: [] } });
  const indexSlug = renderer === 'gift' ? 'straipsniai' : 'gidai';
  const current = make('current', renderer === 'gift' ? 'article' : 'guide', `${indexSlug}/dabartinis`);
  const target = { kind: 'page', pageId: 'future' };
  current.body = [{ type: 'richHeading', level: 2, content: [{ type: 'link', text: 'Kitas atsakymas', target }] }, { type: 'richParagraph', content: [{ type: 'text', text: 'Palyginkite ' }, { type: 'link', text: 'kitą atsakymą', target }, { type: 'text', text: ' ir pasirinkite.' }] }, { type: 'richList', ordered: true, items: [[{ type: 'link', text: 'Kitas atsakymas', target }], [{ type: 'link', text: 'Kito projekto atsakymas', target: { kind: 'network', siteId: 'peerqa', pageId: 'current' } }]] }];
  current.editorial.relatedPageIds = ['future'];
  current.editorial.sources = [{ id: 'primary', title: 'Bandymo šaltinis', publisher: 'Bandymas', url: 'https://primary.example/source', accessedAt: '2020-01-01T00:00:00.000Z', public: true }];
  current.media = [640, 1280, 1600].map(width => ({ id: `current-${width}`, src: `/content-assets/${siteId}/current-${width}.webp`, width, height: width * 9 / 16, alt: 'Izoliuoto bandymo temos vaizdas', rights: 'Test fixture only' }));
  current.editorial.featuredImageId = 'current-1600';
  const future = make('future', current.type, `${indexSlug}/veliau`);
  future.title = 'SLAPTAS BŪSIMAS BANDYMO GIDAS'; future.publishAt = boundary;
  future.media = [{ id: 'future-image', src: `/content-assets/${siteId}/future.webp`, width: 640, height: 360, alt: 'Būsimo bandymo gido vaizdas', rights: 'Test fixture only' }];
  future.editorial.featuredImageId = 'future-image';
  const pages = [make('home', 'home', ''), make('index', 'index', indexSlug), make('profile', 'author', renderer === 'gift' ? 'autoriai/redakcija' : 'redakcija'), make('privacy', 'policy', 'privatumas'), make('contact', 'contact', 'kontaktai'), current, future];
  const pkg = { schemaVersion: 2, siteId, canonicalHost: site.canonicalHost, locale: site.locale, site, pages, generatedAt: '2020-01-01T00:00:00.000Z' };
  return approveFixture(pkg);
}

export function approveFixture(pkg) {
  for (const page of pkg.pages) { page.revisionHash = v2RevisionHash(page); page.approval = { status: 'approved', revisionHash: page.revisionHash, approvedAt: '2020-01-01T00:00:00.000Z', actorId: 'isolated-fixture-only' }; }
  return validateV2Package(pkg);
}

/** A new immutable test release retires a page; original fixture bytes stay intact. */
export function retiredFixture(original) {
  const pkg = structuredClone(original);
  pkg.pages = pkg.pages.filter(page => page.id !== 'future');
  for (const page of pkg.pages) {
    const nodes = items => items.map(node => node.type === 'link' && node.target.kind === 'page' && node.target.pageId === 'future' ? { type: 'text', text: node.text } : node);
    page.body = page.body.map(block => block.content ? { ...block, content: nodes(block.content) } : block.type === 'richList' ? { ...block, items: block.items.map(nodes) } : block);
    page.links = page.links.filter(link => link.targetPageId !== 'future');
    page.editorial.relatedPageIds = page.editorial.relatedPageIds.filter(id => id !== 'future');
  }
  return approveFixture(pkg);
}
