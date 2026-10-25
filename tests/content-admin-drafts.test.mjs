import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { testD1 } from './helpers/content-admin-d1.mjs';
import { handleContentAdmin } from '../lib/content-admin-api.mjs';
import { pageRecord, readPublishedEdits, saveDraft } from '../lib/content-admin-store.mjs';
import { revisionHash } from '../vendor/content-studio/authoring.mjs';

function fixture() {
  const page = (id, type, slug) => {
    const p = { id, siteId: 'promedical', type, slug, title: 'Fixture title', description: 'Fixture description',
      body: [{ type: 'paragraph', text: 'Isolated fixture text.' }], media: [], links: [], publishAt: '2026-01-01T10:00:10.793Z' };
    p.revisionHash = revisionHash(p);
    p.approval = { status: 'approved', revisionHash: p.revisionHash, actorId: 'fixture-owner' };
    return p;
  };
  return { siteId: 'promedical', canonicalHost: 'example.test', site: { timezone: 'Europe/Vilnius' },
    pages: [page('guide', 'guide', 'gidai/test'), page('category', 'faq', 'kategorijos/test'),
      page('product', 'product', 'kategorijos/product'), page('home', 'home', '')] };
}

test('draft capability persists only text through canonical CAS; owner publications, dates and product state survive', async () => {
  const db = testD1(), pkg = fixture(), key = randomBytes(32).toString('base64url');
  const env = { DB: db, CONTENT_ADMIN_ENABLED: '1', CONTENT_ADMIN_DRAFT_TOKEN: key };
  const request = (path, method = 'GET', input, headers = {}, bindings = env, url = 'https://example.test') =>
    handleContentAdmin(new Request(url + '/admin/api/' + path, { method,
      headers: { authorization: 'Bearer ' + key, ...(method === 'POST' ? { 'content-type': 'application/json' } : {}), ...headers },
      ...(input === undefined ? {} : { body: JSON.stringify(input) }) }), pkg, bindings, p => p.pages, {});
  try {
    await db.prepare('INSERT INTO content_admin_settings(site_id,context_json,paused_at,updated_at) VALUES(?,?,?,?)').bind('promedical', '{}', '2026-01-02T00:00:00Z', 1).run();
    const settingsBefore = await db.prepare('SELECT * FROM content_admin_settings').all();
    for (const id of ['guide', 'category']) {
      const before = await pageRecord(db, pkg, id);
      const first = await (await request('drafts/' + id)).json();
      assert.equal(first.etag, before.etag);
      assert.deepEqual(Object.keys(first).sort(), ['conflict', 'draft', 'etag', 'id', 'updatedAt']);
      const changes = { title: 'Private fixture', body: [{ type: 'heading', level: 3, text: 'Fixture H3' }, { type: 'paragraph', text: 'Fixture body' }] };
      const r = await request('drafts/' + id, 'POST', { etag: first.etag, changes });
      assert.equal(r.status, 200); assert.match(r.headers.get('cache-control'), /no-store/);
      assert.match(r.headers.get('x-robots-tag'), /noindex/);
      const after = await pageRecord(db, pkg, id);
      assert.equal(after.draft.title, changes.title); assert.deepEqual(after.draft.body, changes.body);
      assert.equal(after.draft.publishAt, before.draft.publishAt); assert.equal(after.draft.approval, undefined);
      assert.deepEqual(after.approved, before.approved);
      assert.equal((await request('drafts/' + id, 'POST', { etag: first.etag, changes })).status, 409);
      assert.equal((await (await request('drafts/' + id)).json()).etag, after.etag);
    }
    assert.deepEqual((await readPublishedEdits(db, pkg)).pkg.pages, pkg.pages);
    const history = await db.prepare('SELECT * FROM content_admin_history').all();
    assert.equal(history.results.length, 2);
    const audit = await db.prepare('SELECT * FROM content_admin_audit').all();
    assert(audit.results.every(r => r.actor_email === 'automation:codex-drafts'));
    assert.deepEqual(await db.prepare('SELECT * FROM content_admin_settings').all(), settingsBefore);

    const etag = (await pageRecord(db, pkg, 'guide')).etag;
    for (const field of ['approval', 'editorialReview', 'publishedRevision', 'localDate', 'localTime', 'publishAt', 'slug', 'media', 'links', 'externalLinks', 'siteId', 'status']) {
      assert.equal((await request('drafts/guide', 'POST', { etag, changes: { [field]: 'forbidden' } })).status, 400, field);
    }
    for (const changes of [null, [], {}, { body: [] }, { body: [{ type: 'script', text: 'x' }] }]) {
      assert.equal((await request('drafts/guide', 'POST', { etag, changes })).status, 400);
    }
    assert.equal((await request('drafts/guide', 'POST', { etag, changes: { title: 'x' }, evidence: {} })).status, 400);
    for (const id of ['product', 'home', 'missing']) assert.equal((await request('drafts/' + id)).status, 404);
    for (const path of ['drafts/guide/publish', 'drafts/guide/approve', 'drafts/guide/release']) assert.equal((await request(path, 'POST', {})).status, 404);
    for (const path of ['texts/guide/publish', 'texts/guide/save', 'texts/guide/restore', 'policy', 'login', 'enroll']) {
      assert.equal((await request(path, 'POST', {})).status, 403);
    }
    assert.equal((await request('texts/guide')).status, 403);
    assert.equal((await request('drafts/guide', 'DELETE')).status, 405);
    assert.equal((await request('drafts/guide', 'GET', undefined, { authorization: 'Bearer invalid' })).status, 401);
    assert.equal((await request('drafts/guide', 'GET', undefined, {}, { ...env, CONTENT_ADMIN_DRAFT_TOKEN: undefined })).status, 503);
    assert.equal((await request('drafts/guide', 'GET', undefined, {}, { ...env, CONTENT_ADMIN_DRAFT_TOKEN: randomBytes(32).toString('base64url') })).status, 401);
    for (const headers of [{ origin: 'https://example.test' }, { cookie: 'owner=fixture' }, { 'sec-fetch-site': 'same-origin' }]) {
      assert.equal((await request('drafts/guide', 'GET', undefined, headers)).status, 403);
    }
    assert.equal((await request('drafts/guide?token=unused')).status, 403);
    for (const host of ['http://example.test', 'https://foreign.test']) assert.equal((await request('drafts/guide', 'GET', undefined, {}, env, host)).status, 403);
    assert.equal((await request('drafts/guide', 'POST', { etag, changes: { title: 'x' } }, { 'content-type': 'text/plain' })).status, 415);
    assert.equal((await request('drafts/guide', 'POST', { etag, changes: { title: 'x'.repeat(524289) } })).status, 413);
    const malformed = new Request('https://example.test/admin/api/drafts/guide', { method: 'POST', body: '{', headers: { authorization: 'Bearer ' + key } });
    assert.equal((await handleContentAdmin(malformed, pkg, env, p => p.pages, {})).status, 400);
    const foreign = await handleContentAdmin(new Request('https://example.test/admin/api/drafts/guide'), { ...pkg, siteId: 'foreign' }, env, p => p.pages, {});
    assert.equal(foreign.status, 404);
    assert.equal((await db.prepare('SELECT count(*) AS n FROM content_admin_history').first()).n, 2, 'rejections produce no write history');

    // Owner and importer share the same CAS, so neither overwrites an unseen edit.
    await saveDraft(db, pkg, 'guide', { title: 'Owner edit' }, etag, 'fixture-owner');
    assert.equal((await request('drafts/guide', 'POST', { etag, changes: { title: 'stale machine' } })).status, 409);
    pkg.pages[0].revisionHash = 'new-compiled-base';
    const conflicted = await (await request('drafts/guide')).json(); assert.equal(conflicted.conflict, true);
    assert.equal((await request('drafts/guide', 'POST', { etag: conflicted.etag, changes: { title: 'wrong lineage' } })).status, 409);
  } finally { db.close(); }
});
