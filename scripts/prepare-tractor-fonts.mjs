import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const directory = new URL('../public/fonts/traktoriupadangos/', import.meta.url);
await mkdir(directory, { recursive: true });
const cssUrl = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Manrope:wght@400;500;600;700&display=swap';
const css = await (await fetch(cssUrl, { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' } })).text();
const selected = [...css.matchAll(/\/\* (latin(?:-ext)?) \*\/\s*(@font-face\s*\{[^}]+\})/g)];
if (!selected.length) throw new Error('Expected Google Fonts latin/latin-ext WOFF2 rules');
const files = new Map(); const records = []; const rules = [];
for (const [, subset, rule] of selected) {
  const source = rule.match(/url\((https:[^)]+)\)/)?.[1];
  const family = rule.match(/font-family: '([^']+)'/)?.[1].toLowerCase().replaceAll(' ', '-');
  if (!source || !family) throw new Error('Unexpected font rule');
  let filename = files.get(source);
  if (!filename) {
    const response = await fetch(source); if (!response.ok) throw new Error('Font download failed');
    const bytes = Buffer.from(await response.arrayBuffer());
    filename = `${family}-${subset}-${createHash('sha256').update(bytes).digest('hex').slice(0, 12)}.woff2`;
    await writeFile(new URL(filename, directory), bytes); files.set(source, filename);
    records.push({ source, filename, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  rules.push(rule.replace(source, `/fonts/traktoriupadangos/${filename}`));
}
for (const family of ['barlowcondensed', 'manrope']) {
  const response = await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${family}/OFL.txt`);
  if (!response.ok) throw new Error('Font license unavailable');
  await writeFile(new URL(`${family}-OFL.txt`, directory), await response.text());
}
await writeFile(new URL('fonts.css', directory), rules.join('\n'));
await writeFile(new URL('provenance.json', directory), JSON.stringify({ retrievedAt: new Date().toISOString(), cssUrl, files: records }, null, 2));
console.log(JSON.stringify({ files: files.size, bytes: records.reduce((sum, item) => sum + item.bytes, 0) }));
