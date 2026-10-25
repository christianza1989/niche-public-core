import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { draftRequest } from '../scripts/content-admin-draft.mjs';
test('draft client uses only the fixed HTTPS endpoint, never follows redirects or retries conflicts', async () => {
  const token = randomBytes(32).toString('base64url'); let calls = 0;
  const fetcher = async (url, options) => {
    calls++; assert.equal(url, 'https://promedical.lt/admin/api/drafts/fixture');
    assert.equal(options.redirect, 'error'); assert.equal(options.headers.authorization, 'Bearer ' + token);
    assert.equal(options.method, 'POST'); assert.deepEqual(JSON.parse(options.body), { etag: 'old:1', changes: { title: 'Fixture' } });
    return new Response('{}', { status: 409 });
  };
  await assert.rejects(draftRequest('fixture', { etag: 'old:1', changes: { title: 'Fixture' } }, token, fetcher), /409/);
  assert.equal(calls, 1);
  await assert.rejects(draftRequest('../foreign', undefined, token, fetcher), /Invalid/);
  await assert.rejects(draftRequest('fixture', undefined, '', fetcher), /secret manager/);
  assert.equal(calls, 1);
});
