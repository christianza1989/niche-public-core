import test from 'node:test';
import assert from 'node:assert/strict';
import { projectPublicPages, contextualParts } from '../lib/niche-links.mjs';
const now = Date.now();
const page = (id, slug, date = now - 1000) => ({ id, slug, publishAt: new Date(date).toISOString(), revisionHash: id,
  approval: { status: 'approved', revisionHash: id }, links: [] });
const a = { siteId: 'a', canonicalHost: 'a.lt', pages: [page('source', '')] };
const b = { siteId: 'b', canonicalHost: 'b.lt', pages: [page('target', 'gidas', now + 1000)] };
const settings = { networkDomains: ['a.lt', 'b.lt', 'empty.lt'], networkLiveDomains: ['b.lt'] };
test('cross-domain targets share approval/time/deployment guards and raw approval stays intact', () => {
  const source = structuredClone(a); source.pages[0].externalLinks = [
    { url: 'https://b.lt/gidas', label: 'Gidas' }, { url: 'https://empty.lt/privatus', label: 'Neįdiegtas' },
    { url: 'https://manufacturer.example/spec', label: 'Gamintojo šaltinis' } ];
  source.pages[0].links = [{ targetPageId: 'missing', label: 'Trūksta' }];
  assert.equal(projectPublicPages(source, [source,b], settings, now)[0].externalLinks.length, 1);
  assert.equal(projectPublicPages(source, [source,b], settings, now)[0].links.length, 0);
  assert.equal(projectPublicPages(source, [source,b], settings, now+2000)[0].externalLinks.length, 2);
  assert.equal(projectPublicPages(source, [source,b], { ...settings, networkLiveDomains: [] }, now+2000)[0].externalLinks.length, 1);
  const revoked = structuredClone(b); revoked.pages[0].approval.status = 'revoked';
  assert.equal(projectPublicPages(source, [source,revoked], settings, now+2000)[0].externalLinks.length, 1);
  assert.equal(source.pages[0].externalLinks.length, 3, 'immutable reviewed source is not edited');
});
test('contextual links use literal natural anchors, preserve text and cannot link inside words', () => {
  const text = 'padangos. Padangų žymėjimo gidas padeda; šį padangų žymėjimo gidą perskaitykite.';
  const parts = contextualParts(text, [{ label: 'Padangų žymėjimo gidas', href: '/gidas' }, { label: 'padang', href: '/blogas' }, { label: 'padeda', href: 'javascript:alert(1)' }]);
  assert.equal(parts.map(part => part.text).join(''), text);
  assert.deepEqual(parts.filter(part => part.href), [{ text: 'Padangų žymėjimo gidas', href: '/gidas' }]);
  assert.deepEqual(contextualParts('Pradžia ir netinka', [
    { label: 'Pradžia', href: '/' }, { label: 'netinka', href: '//unapproved.example' }
  ]).filter(part => part.href), [{ text: 'Pradžia', href: '/' }]);
});
