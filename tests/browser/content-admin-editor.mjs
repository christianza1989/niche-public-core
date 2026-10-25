// Run with a Playwright Page and the repository's admin.js/admin.css contents.
// All requests are fulfilled locally; no account, database or website is used.
export async function verifyEditor(page, source, css, screenshotDirectory) {
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const original = { id: 'fixture', siteId: 'promedical', type: 'guide', slug: 'gidai/fixture',
    title: 'Bandomasis juodraštis', description: 'Izoliuota redaktoriaus patikra.',
    body: [{ type: 'paragraph', text: 'Pradinė pastraipa.' }], media: [], externalLinks: [],
    publishAt: '2026-10-09T15:11:10.793Z', revisionHash: 'original' };
  let record = { base: original, draft: structuredClone(original), approved: original, live: original,
    etag: 'original:0', conflict: false, updatedAt: null };
  const writes = [], errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('https://admin-fixture.invalid/**', async route => {
    const r = route.request(), path = new URL(r.url()).pathname;
    if (path.startsWith('/brand/')) return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="40"><text x="0" y="28" font-size="24">Fixture</text></svg>' });
    if (path === '/admin.js') return route.fulfill({ contentType: 'text/javascript', body: source });
    if (path === '/admin.css') return route.fulfill({ contentType: 'text/css', body: css });
    if (!path.startsWith('/admin/api/')) return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="lt"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/admin.css"><div id="app"></div><div id="announcements" role="status"></div><script type="module" src="/admin.js"></script></html>' });
    let data;
    if (path.endsWith('/session')) data = { email: 'fixture@example.test', csrf: 'fixture-only', site: { timezone: 'Europe/Vilnius' } };
    else if (path.endsWith('/policy')) data = { pausedAt: '2026-10-13T00:00:00Z', version: 1 };
    else if (path.endsWith('/texts/fixture') && r.method() === 'GET') data = record;
    else if (path.endsWith('/texts/fixture/save') && r.method() === 'POST') {
      const input = r.postDataJSON(); writes.push(input);
      record = { ...record, draft: { ...record.draft, ...input.changes, revisionHash: 'draft' }, etag: 'original:' + writes.length, updatedAt: Date.now() };
      data = record;
    } else throw new Error('Unexpected request: ' + r.method() + ' ' + path);
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) });
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('https://admin-fixture.invalid/admin/text/fixture?mode=edit');
  await page.getByRole('button', { name: 'Išsaugoti juodraštį', exact: true }).waitFor();
  for (const [button, text] of [['Pridėti pastraipą', 'Nauja pastraipa.'], ['Pridėti H2 antraštę', 'Naujas skyrius'], ['Pridėti H3 antraštę', 'Naujas poskyris'], ['Pridėti sąrašą', 'Pirmas punktas\nAntras punktas']]) {
    await page.getByRole('button', { name: button, exact: true }).click();
    await page.locator('.blocks .block').last().locator('textarea').fill(text);
  }
  const done = page.waitForResponse(r => r.url().endsWith('/texts/fixture/save'));
  await page.getByRole('button', { name: 'Išsaugoti juodraštį', exact: true }).click(); await done;
  await page.getByRole('button', { name: 'Išsaugoti juodraštį', exact: true }).waitFor();
  await page.reload();
  await page.getByRole('button', { name: 'Išsaugoti juodraštį', exact: true }).waitFor();
  check(writes.length === 1, 'exactly one draft save');
  check(!('localDate' in writes[0].changes) && !('localTime' in writes[0].changes), 'unchanged timestamp must not be resubmitted');
  check(record.draft.publishAt === original.publishAt, 'timestamp precision retained');
  check(writes[0].changes.body[3].level === 3, 'H3 is preserved');
  check(writes[0].changes.body[4].items.length === 2, 'list structure survives');
  check(await page.locator('.blocks .block').count() === 5, 'all blocks survive reload');
  check(record.approved === original && record.live === original, 'no publication');
  await page.screenshot({ path: screenshotDirectory + '/editor-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no mobile horizontal overflow');
  await page.screenshot({ path: screenshotDirectory + '/editor-mobile.png', fullPage: true });
  check(errors.length === 0, errors.join('\n'));
  return { passed: true, draftSaves: writes.length, blocks: 5, h3: true, timestampPreserved: true, errors };
}
