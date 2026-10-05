import { readFile, writeFile } from 'node:fs/promises';
import { connect } from 'node:tls';
import { Readable, Writable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { smtpSession } from '../lib/smtp-protocol.mjs';
const raw = await readFile(new URL('../.dev.vars.hostinger', import.meta.url), 'utf8');
const settings = Object.fromEntries(raw.trim().split('\n').map(line => { const i = line.indexOf('='); return [line.slice(0, i), JSON.parse(line.slice(i + 1))]; }));
const config = { user: settings.LEAD_SMTP_USER, password: settings.LEAD_SMTP_PASSWORD, timeoutMs: 15000 };
const socket = connect({ host: 'smtp.hostinger.com', port: 465, servername: 'smtp.hostinger.com', rejectUnauthorized: true });
socket.on('error', () => {});
try {
  const id = randomUUID();
  const send = process.argv.includes('--send-self-test');
  await smtpSession({ readable: Readable.toWeb(socket), writable: Writable.toWeb(socket), close: async () => { socket.destroy(); } }, config,
    send ? { to: config.user, subject: '[Nišų sistema] Hostinger pristatymo testas', text: `Aiškiai pažymėtas sistemos bandymas, ne kliento užklausa.\nPatikros ID: ${id}\nBendras gavėjas: info@pinet.lt\nDomenas kiekvienoje tikroje užklausoje bus nurodytas atskirai.`, id } : null);
  const result = { date: new Date().toISOString(), tlsVerified: true, authenticated: true, acceptedBySmtp: send, testId: send ? id : null, recipient: config.user };
  await writeFile(new URL('../output/mail/hostinger-smtp-verification.json', import.meta.url), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} catch { socket.destroy(); console.error('Hostinger SMTP verification failed; credential values and server responses suppressed.'); process.exitCode = 1; }
