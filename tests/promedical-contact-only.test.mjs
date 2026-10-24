import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

test('Promedical renders contact-only navigation across page families while preserving catalogue and contacts', async () => {
  const output = new URL(`../.sites-runtime/contact-only-${randomUUID()}.mjs`, import.meta.url);
  await fs.mkdir(new URL('../.sites-runtime/', import.meta.url), {recursive:true});
  const bundle = await build({
    entryPoints:[fileURLToPath(new URL('../components/niche/promedical-site.tsx',import.meta.url))],
    outfile:fileURLToPath(output), bundle:true, format:'esm', platform:'node', metafile:true,
    external:['react','react-dom'], loader:{'.css':'empty'}, jsx:'automatic',
    tsconfig:fileURLToPath(new URL('../tsconfig.json',import.meta.url)), plugins:[{
      name:'local-binding',setup(b){
        b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'binding',namespace:'test'}));
        b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const env = {};'}));
      }
    }]
  });
  try {
    // The removed client must not hydrate, read old saved items or submit a form.
    assert.ok(!Object.keys(bundle.metafile.inputs).some(p=>/promedical-inquiry/.test(p)));
    const {PromedicalSite} = await import(output.href);
    const pkg=JSON.parse(await fs.readFile(new URL('../content-packages/promedical/content-package.json',import.meta.url),'utf8'));
    const pages=pkg.pages;
    const families=[pages.find(p=>p.type==='home'), pages.find(p=>p.slug==='kontaktai'),
      pages.find(p=>p.slug==='produktai'),pages.find(p=>p.slug.startsWith('kategorijos/')),
      pages.find(p=>p.type==='product'),pages.find(p=>p.type==='guide')];
    assert.ok(families.every(Boolean));
    const before=JSON.stringify(pkg);
    for(const page of families){
      const html=renderToStaticMarkup(React.createElement(PromedicalSite,{pkg,page,livePages:pages}));
      assert.doesNotMatch(html,/Užklausos sąrašas|Pridėti į užklausą|Peržiūrėti užklausą|Parengti užklausą|name="email"|localStorage|action="\/uzklausa"/);
      assert.match(html,/href="\/produktai"/);
      assert.ok(html.includes(`href="mailto:${pkg.site.contact.email}"`));
      assert.ok(html.includes(`href="tel:${pkg.site.contact.phone.replace(/\s/g,'')}"`));
      assert.match(html,/type="application\/ld\+json"/);
      assert.match(html,/role="search"/);
      if(page.slug==='kontaktai')assert.equal((html.match(/<form\b/g)||[]).length,1,'only catalogue search remains');
      if(page.type==='product'){
        assert.match(html,/Katalogo kodas/);
        assert.match(html,/"@type":"Product"/);
        assert.ok(html.includes(page.media[0].src));
      }
      if(page.slug==='produktai')assert.match(html,/Produktų paieškos rezultatai/);
    }
    assert.equal(JSON.stringify(pkg),before,'renderer does not mutate page data');
  } finally {
    await fs.unlink(output);
    await fs.rm(new URL(output.href.replace(/\.mjs$/,'.css')), {force:true});
  }
});
