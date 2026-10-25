import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// A fixed HTTPS destination and redirect rejection keep the credential off other hosts.
export async function draftRequest(id, input, token, fetcher = fetch) {
  if (!/^[a-z0-9-]{1,80}$/.test(id)) throw new Error('Invalid page ID');
  if (!/^[A-Za-z0-9_-]{43}$/.test(token || '')) throw new Error('Set CONTENT_ADMIN_DRAFT_TOKEN through your secret manager');
  const r = await fetcher(`https://promedical.lt/admin/api/drafts/${id}`, {
    method: input === undefined ? 'GET' : 'POST', redirect: 'error',
    signal: AbortSignal.timeout(30000),
    headers: { authorization: `Bearer ${token}`, ...(input === undefined ? {} : { 'content-type': 'application/json' }) },
    ...(input === undefined ? {} : { body: JSON.stringify(input) })
  });
  if (!r.ok) throw new Error(`Draft request failed (${r.status}); no automatic retry. Read the current draft before retrying.`);
  return r.json();
}

async function main() {
  const [command, argument, extra] = process.argv.slice(2);
  if (extra || !argument || !['read', 'save'].includes(command)) throw new Error('Usage: node scripts/content-admin-draft.mjs read ID | save INPUT.json');
  let id = argument, input;
  if (command === 'save') {
    const source = JSON.parse(await fs.readFile(argument, 'utf8'));
    if (Object.keys(source).some(k => !['id', 'etag', 'changes'].includes(k))) throw new Error('Input must contain only id, etag and changes');
    id = source.id; input = { etag: source.etag, changes: source.changes };
  }
  const result = await draftRequest(id, input, process.env.CONTENT_ADMIN_DRAFT_TOKEN);
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
