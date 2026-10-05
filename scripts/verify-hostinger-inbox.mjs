import { readFile, writeFile } from 'node:fs/promises';
import { connect } from 'node:tls';
const raw = await readFile(new URL('../.dev.vars.hostinger', import.meta.url), 'utf8');
const config = Object.fromEntries(raw.trim().split('\n').map(line => { const i = line.indexOf('='); return [line.slice(0, i), JSON.parse(line.slice(i + 1))]; }));
const verification = JSON.parse(await readFile(new URL('../output/mail/hostinger-smtp-verification.json', import.meta.url), 'utf8'));
const id = process.argv[2] || verification.testId;
if (!/^[a-z0-9-]+$/i.test(id || '')) throw new Error('Provide the self-test Message-ID, not an inbox query.');
const quote = value => `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
const socket = connect({ host: 'imap.hostinger.com', port: 993, servername: 'imap.hostinger.com', rejectUnauthorized: true });
socket.on('error', () => {}); socket.setTimeout(12000, () => socket.destroy());
let buffer = ''; let waiting;
socket.on('data', chunk => { buffer += chunk.toString('utf8'); if (buffer.length > 65536) socket.destroy(); waiting?.(); });
const wait = async predicate => {
  while (!predicate(buffer)) await new Promise((resolve, reject) => {
    waiting = resolve;
    const fail = () => { waiting = null; reject(new Error('IMAP unavailable')); };
    socket.once('error', fail); socket.once('close', fail);
    waiting = () => { socket.off('error', fail); socket.off('close', fail); waiting = null; resolve(); };
  });
};
try {
  await wait(value => value.includes('\r\n')); if (!buffer.startsWith('* OK')) throw new Error('IMAP greeting failed'); buffer = '';
  const command = async (tag, text) => {
    socket.write(`${tag} ${text}\r\n`); await wait(value => new RegExp(`(?:^|\\r\\n)${tag} (OK|NO|BAD) `).test(value));
    const result = buffer; buffer = ''; if (!new RegExp(`${tag} OK `).test(result)) throw new Error('IMAP request rejected'); return result;
  };
  await command('A1', `LOGIN ${quote(config.LEAD_SMTP_USER)} ${quote(config.LEAD_SMTP_PASSWORD)}`);
  await command('A2', 'SELECT INBOX');
  const result = await command('A3', `UID SEARCH HEADER Message-ID ${quote(`<${id}@pinet.lt>`)}`);
  const received = /^\* SEARCH \d/m.test(result);
  await command('A4', 'LOGOUT');
  const evidence = { date: new Date().toISOString(), tlsVerified: true, imapAuthenticated: true, mailbox: 'INBOX', testId: id, received };
  await writeFile(new URL('../output/mail/hostinger-inbox-verification.json', import.meta.url), JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence)); if (!received) process.exitCode = 2;
} catch { console.error('IMAP verification failed; credentials and inbox content suppressed.'); process.exitCode = 1; }
finally { socket.destroy(); }
