import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const source = process.argv[2];
if (!source) throw new Error('Provide the user-supplied credentials file path. Never pass the password on the command line.');
const raw = await readFile(source, 'utf8');
const login = raw.split(/\r?\n/).find(line => line.includes('@'))?.split('=').at(-1)?.trim();
// The supplied file omits .lt from the login; the owner's explicit mailbox is authoritative.
const user = login === 'info@pinet' ? 'info@pinet.lt' : login;
const passwordLine = raw.split(/\r?\n/).find(line => /password|slapta(?:z|ž)odis/i.test(line));
const password = passwordLine?.replace(/^.*?(?:password|slapta(?:z|ž)odis)\s*[-=:]?\s*/i, '').trim();
if (user !== 'info@pinet.lt' || !password || /[\r\n]/.test(password)) throw new Error('Credential format not recognized; no secret was written.');
const root = path.resolve(import.meta.dirname, '..');
const target = path.join(root, '.dev.vars.hostinger');
await writeFile(target, `LEAD_SMTP_ENABLED="1"\nLEAD_SMTP_USER=${JSON.stringify(user)}\nLEAD_SMTP_PASSWORD=${JSON.stringify(password)}\n`, { mode: 0o600 });
await mkdir(path.join(root, 'output/mail'), { recursive: true });
console.log('Hostinger secrets saved only to ignored .dev.vars.hostinger. Default previews remain mail-disabled.');
