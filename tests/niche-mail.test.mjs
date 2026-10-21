import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

test('actual mail dispatcher uses one explicit native transport, preserves MIME and rejects unsafe headers', async () => {
  const moduleUrl = new URL(`../.sites-runtime/mail-test-${randomUUID()}.mjs`, import.meta.url);
  await mkdir(new URL('../.sites-runtime/', import.meta.url), { recursive: true });
  await build({ entryPoints: [fileURLToPath(new URL('../lib/niche-mail.ts', import.meta.url))],
    outfile: fileURLToPath(moduleUrl), bundle: true, platform: 'node', format: 'esm', plugins: [{
      name: 'test-platform-boundary', setup(b) {
        b.onResolve({ filter: /^cloudflare:(sockets|email)$/ }, args => ({ path: args.path, namespace: 'platform-test' }));
        b.onLoad({ filter: /.*/, namespace: 'platform-test' }, args => ({ contents: args.path.endsWith('sockets')
          ? 'export function connect(){throw new Error("Unexpected SMTP attempt");}'
          : 'export class EmailMessage {constructor(from,to,raw){this.from=from;this.to=to;this.raw=raw;}}' }));
      },
    }] });
  try {
    const { sendNicheLeadMail } = await import(moduleUrl.href);
    const mail = { from: 'uzklausos@promedical.lt', to: 'info@promedical.lt', fromName: 'Promedical',
      replyTo: 'info@promedical.lt', subject: '[promedical.lt] Poreikio užklausa qa-123', text: 'Pažymėtas sistemos bandymas.', id: 'qa-123' };
    const sent = [];
    const env = { LEAD_EMAIL: { async send(message) { sent.push(message); return { messageId: 'accepted-123' }; } },
      LEAD_SMTP_ENABLED: '1', LEAD_SMTP_USER: 'unused@example.invalid', LEAD_SMTP_PASSWORD: 'unused-test-value' };
    assert.equal(await sendNicheLeadMail(env, mail), true);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].from, mail.from);
    assert.equal(sent[0].to, mail.to);
    assert.match(sent[0].raw, /Message-ID: <qa-123@promedical\.lt>/);
    assert.match(sent[0].raw, /Reply-To: <info@promedical\.lt>/);
    assert.match(sent[0].raw, /From: =\?UTF-8\?B\?UHJvbWVkaWNhbA==\?= <uzklausos@promedical\.lt>/);
    assert.equal(Buffer.from(sent[0].raw.split('\r\n\r\n')[1].replace(/\r\n/g, ''), 'base64').toString(), mail.text);
    for (const changed of [{ subject: 'Bad\r\nBcc: attacker@example.invalid' }, { fromName: 'Bad\r\nBcc: attacker@example.invalid' }, { to: 'bad@example.invalid\r\nDATA' }, { from: undefined }]) {
      await assert.rejects(sendNicheLeadMail(env, { ...mail, ...changed }));
      assert.equal(sent.length, 1, 'Validation must reject before sending');
    }
    let attempts = 0;
    const failure = new Error('Unknown provider acceptance');
    await assert.rejects(sendNicheLeadMail({ ...env, LEAD_EMAIL: { async send() { attempts += 1; throw failure; } } }, mail), error => error === failure);
    assert.equal(attempts, 1, 'Do not duplicate a failed native request through SMTP');
    assert.equal(await sendNicheLeadMail({}, mail), false, 'Ordinary unbound local preview sends no mail');
    await assert.rejects(sendNicheLeadMail({ ...env, LEAD_EMAIL: undefined }, mail), /Unexpected SMTP attempt/, 'Unbound enabled tenants retain the SMTP path');
  } finally {
    await unlink(moduleUrl);
  }
});
