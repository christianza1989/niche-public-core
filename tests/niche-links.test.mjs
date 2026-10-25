import test from 'node:test';
import assert from 'node:assert/strict';
import { projectPublicPages, contextualParts, validateGuidePublicationPauses } from '../lib/niche-links.mjs';
import { readFile } from 'node:fs/promises';
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

test('guide pause retains published pages and freezes future discovery across tenants until explicitly removed', () => {
  const guide=(id,date)=>({...page(id,id,date),type:'guide'});
  const paused={schemaVersion:1,siteId:'a',canonicalHost:'a.lt',pages:[guide('published',now-2000),guide('future',now+1000),{...page('product','product',now+1000),type:'product'}]};
  paused.pages[0].links=[{targetPageId:'future',label:'Future'}];
  const reader={siteId:'b',canonicalHost:'b.lt',pages:[{...page('reader',''),externalLinks:[{url:'https://a.lt/future',label:'Future'}]}]};
  const config={...settings,networkLiveDomains:['a.lt'],guidePublicationPausedAtBySite:{a:new Date(now).toISOString()}};
  const original=JSON.stringify(paused);
  for(const clock of [now+2000,Date.parse('2099-01-01T00:00:00Z')]){
    const visible=projectPublicPages(paused,[paused,reader],config,clock);
    assert.deepEqual(visible.map(p=>p.id),['published','product']);
    assert.deepEqual(visible[0].links,[]);
    assert.deepEqual(projectPublicPages(reader,[paused,reader],config,clock)[0].externalLinks,[]);
  }
  assert.deepEqual(projectPublicPages(paused,[paused,reader],config,now-3000),[],'pause cannot publish ahead of the actual request clock');
  const revoked=structuredClone(paused);revoked.pages[0].approval.status='revoked';
  assert.deepEqual(projectPublicPages(revoked,[revoked,reader],config,now+2000).map(p=>p.id),['product']);
  const resumed={...config,guidePublicationPausedAtBySite:{}};
  assert.deepEqual(projectPublicPages(paused,[paused,reader],resumed,now+2000).map(p=>p.id),['published','future','product']);
  assert.equal(projectPublicPages(reader,[paused,reader],resumed,now+2000)[0].externalLinks.length,1);
  assert.equal(JSON.stringify(paused),original,'approved source bytes remain untouched');
});

test('compiler rejects unknown sites and malformed publication pause times', () => {
  const pkgs=[{siteId:'a',schemaVersion:1}];
  assert.doesNotThrow(()=>validateGuidePublicationPauses({},pkgs));
  assert.doesNotThrow(()=>validateGuidePublicationPauses({guidePublicationPausedAtBySite:{a:new Date(now).toISOString()}},pkgs));
  for(const pauses of [null,[],{missing:new Date(now).toISOString()},{a:'invalid'},{a:''},{a:'2026-02-30T00:00:00.000Z'},{a:'2026-10-13'}])assert.throws(()=>validateGuidePublicationPauses({guidePublicationPausedAtBySite:pauses},pkgs));
});

test('historical Promedical pause retains two guides and leaves all other sites unchanged', async () => {
  const packages=JSON.parse(await readFile(new URL('../lib/generated/content-packages.json',import.meta.url),'utf8'));
  const config=JSON.parse(await readFile(new URL('../config/niche-network.json',import.meta.url),'utf8'));
  const baseline={...config,guidePublicationPausedAtBySite:{}};
  const pkg=packages.find(p=>p.siteId==='promedical');
  const later=Date.parse('2026-11-23T00:00:00Z');
  const historical={...config,guidePublicationPausedAtBySite:{promedical:'2026-10-13T19:26:54.000Z'}};
  const frozen=projectPublicPages(pkg,packages,historical,later);
  assert.equal(frozen.filter(p=>p.type==='guide').length,2);
  assert.equal(projectPublicPages(pkg,packages,baseline,later).filter(p=>p.type==='guide').length,57);
  assert.deepEqual(frozen.filter(p=>p.type==='product'),projectPublicPages(pkg,packages,baseline,later).filter(p=>p.type==='product'));
  for(const other of packages.filter(p=>p.siteId!=='promedical'))assert.deepEqual(projectPublicPages(other,packages,config,later),projectPublicPages(other,packages,baseline,later));
});

test('owner-approved withdrawal retains two old guides and keeps retired procurement guide absent', async () => {
  const packages=JSON.parse(await readFile(new URL('../lib/generated/content-packages.json',import.meta.url),'utf8'));
  const config=JSON.parse(await readFile(new URL('../config/niche-network.json',import.meta.url),'utf8'));
  const pkg=packages.find(p=>p.siteId==='promedical');
  const pages=projectPublicPages(pkg,packages,config,Date.parse('2026-11-23T00:00:00Z'));
  assert.equal(pages.filter(p=>p.type==='guide').length,2);
  assert(!pages.some(p=>p.slug==='gidai/irangos-pirkimo-uzklausa'));
  assert.equal(pkg.site.contact.email,'sales@azprekyba.lt');
  assert.equal(pages.filter(p=>p.type==='product').length,1407);
});
