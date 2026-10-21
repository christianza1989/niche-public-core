// Local integration test: actual HTTP handlers and durable D1 SQLite writes.
// It never sends email or imports synthetic contacts into content packages.
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { readdirSync } from 'node:fs';

const base = process.env.NICHE_SMOKE_BASE_URL || 'http://127.0.0.1:8787';
assert.match(new URL(base).hostname, /^(127\.0\.0\.1|localhost)$/, 'local test only');
const dir = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject';
const file = readdirSync(dir).find(name => name.endsWith('.sqlite') && name !== 'metadata.sqlite');
assert.ok(file, 'local D1 file required');
const db = new DatabaseSync(`${dir}/${file}`);
const marker = `local-qa-${crypto.randomUUID()}@example.invalid`;
const siteId = 'promedical';
const before = db.prepare('SELECT COALESCE(SUM(count),0) AS total FROM niche_interest_daily WHERE site_id = ?').get(siteId).total;

async function post(path, body, overrides = {}) {
  return new Promise((resolve, reject) => {
    const req = request(new URL(path, base), { method: 'POST', agent: false, headers: {
      origin: base, 'content-type': 'application/json', 'content-length': Buffer.byteLength(body), 'user-agent': 'NicheLocalIntegration/1', ...overrides,
    } }, response => {
      let text = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { text += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, text }));
    });
    req.on('error', reject);
    req.end(body);
  });
}
const event = JSON.stringify({ event: 'email_click', path: '/' });
assert.equal((await post('/ivykius', event)).status, 204);
assert.equal((await post('/ivykius', event)).status, 204);
assert.equal(db.prepare('SELECT SUM(count) AS total FROM niche_interest_daily WHERE site_id = ?').get(siteId).total, before + 2, 'accepted events are durable');
assert.equal((await post('/ivykius', event, { origin: 'https://unrelated.example' })).status, 403);
assert.equal((await post('/ivykius', '{}')).status, 400);
assert.equal((await post('/ivykius', JSON.stringify({ event: 'email_click', path: '/produktai/nepublikuotas-testinis-modelis' }))).status, 404, 'draft path rejected');
assert.equal((await post('/ivykius', 'x'.repeat(513))).status, 413);
assert.equal((await post('/ivykius', event, { dnt: '1' })).status, 204);
assert.equal((await post('/ivykius', event, { 'sec-gpc': '1' })).status, 204);
assert.equal((await post('/ivykius', event, { 'user-agent': 'HeadlessChrome Lighthouse' })).status, 204);
// The proxy rejects these before a body handler. Empty POSTs verify the route
// boundary without triggering the local Wrangler unread-body transport bug.
assert.equal((await post(`/niche/${siteId}/interest`, '')).status, 404, 'internal route hidden');
assert.equal((await post('/ivykius', '', { host: 'unknown-domain.example' })).status, 404);
assert.equal(db.prepare('SELECT SUM(count) AS total FROM niche_interest_daily WHERE site_id = ?').get(siteId).total, before + 2, 'rejected/private/bot events never increment');

const form = new URLSearchParams({ name: 'Vietinis QA', email: marker, message: 'Sintetinė Promedical QA užklausa: ZV1253N-PZ — 2 vnt. Tai nėra tikro kliento poreikis.', consent: 'yes', website: '' });
const formHeaders = { 'content-type': 'application/x-www-form-urlencoded', referer: `${base}/kontaktai` };
try {
  const invalid = new URLSearchParams(form); invalid.delete('consent');
  assert.equal((await post('/uzklausa', invalid.toString(), formHeaders)).status, 400);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM niche_leads WHERE email = ?').get(marker).count, 0);
  const success = await post('/uzklausa', form.toString(), formHeaders);
  assert.equal(success.status, 200);
  assert.match(success.text, /vietinės peržiūros bandymas/);
  const lead = db.prepare('SELECT site_id,source_path,status FROM niche_leads WHERE email = ?').get(marker);
  assert.deepEqual({ ...lead }, { site_id: siteId, source_path: '/kontaktai', status: 'new' });
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM niche_leads WHERE email = ? AND site_id <> ?').get(marker, siteId).count, 0);
} finally {
  db.prepare('DELETE FROM niche_leads WHERE email = ?').run(marker);
  db.prepare("UPDATE niche_interest_daily SET count = count - 2 WHERE site_id = ? AND page_path = '/' AND event = 'email_click' AND day = ?")
    .run(siteId, new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vilnius', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()));
  db.close();
}
console.log('Niche integration passed: durable aggregate events, privacy/bot guards, host/draft isolation, form validation and stored site-specific inquiry. No email sent; synthetic lead removed.');
