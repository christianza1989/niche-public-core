// Explicit own-mailbox integration probe. Never run it in ordinary UI QA.
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { writeFile, readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { spawnSync } from 'node:child_process';
const base = process.env.NICHE_MAIL_TEST_BASE || 'http://127.0.0.1:8791';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
const marker = `Hostinger formos patikra ${crypto.randomUUID()}`;
const dir = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject';
const file = readdirSync(dir).find(name => name.endsWith('.sqlite') && name !== 'metadata.sqlite');
const db = new DatabaseSync(`${dir}/${file}`);
let id;
try {
  const response = await fetch(`${base}/uzklausa`, { method: 'POST', headers: { origin: base, referer: `${base}/gidas/traktoriaus-padangu-zymejimas` },
    body: new URLSearchParams({ name: marker, email: 'info@pinet.lt', message: 'Savininko pašto ir formos techninė patikra. Tai nėra kliento užklausa ar padangų užsakymas.', consent: 'yes', website: '' }) });
  assert.equal(response.status, 200);
  const text = await response.text();
  const lead = db.prepare('SELECT id,site_id,source_path,status FROM niche_leads WHERE name = ?').get(marker);
  assert.ok(lead); id = lead.id;
  assert.equal(lead.site_id, 'traktoriupadangos');
  assert.equal(lead.source_path, '/gidas/traktoriaus-padangu-zymejimas');
  assert.equal(lead.status, 'notified', 'Worker must confirm SMTP acceptance');
  assert.ok(text.includes('perduota operatoriaus pašto serveriui'));
  const imap = spawnSync(process.execPath, ['scripts/verify-hostinger-inbox.mjs', id], { stdio: 'pipe', windowsHide: true, timeout: 20000 });
  assert.equal(imap.status, 0, 'Own message must be received in Hostinger INBOX');
  const received = JSON.parse(await readFile('output/mail/hostinger-inbox-verification.json', 'utf8'));
  assert.equal(received.testId, id); assert.equal(received.received, true);
  const proof = { date: new Date().toISOString(), siteId: lead.site_id, sourcePath: lead.source_path, leadId: id,
    durableStored: true, smtpAccepted: true, ownInboxReceived: true, syntheticLeadRemoved: true };
  await writeFile('output/mail/niche-form-verification.json', JSON.stringify(proof, null, 2));
  console.log(JSON.stringify(proof));
} finally {
  if (id) db.prepare('DELETE FROM niche_leads WHERE id = ? AND name = ?').run(id, marker);
  else db.prepare('DELETE FROM niche_leads WHERE name = ?').run(marker);
  db.close();
}
