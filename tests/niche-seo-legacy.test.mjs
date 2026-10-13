import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {projectPublicPages} from '../lib/niche-links.mjs';
import {nicheSchemaGraph} from '../lib/niche-schema-core.mjs';
import {nicheSitemapXmlCore,nicheRobotsTextCore,nicheLlmsIndexCore,nicheLlmsFullCore} from '../lib/niche-seo-core.mjs';
const read=p=>readFile(new URL(p,import.meta.url),'utf8').then(JSON.parse);
const [baseline,packages,settings]=await Promise.all([read('./seo-legacy-baseline.json'),read('../lib/generated/content-packages.json'),read('../config/niche-network.json')]);
test('all nine incumbent packages retain exact SEO bytes from e42107b at the fixed clock',()=>{
 const hash=s=>createHash('sha256').update(s).digest('hex');
 assert.equal(packages.length,9);
 for(const pkg of packages){const old=baseline.packages.find(p=>p.siteId===pkg.siteId);assert.ok(old);
  const pages=projectPublicPages(pkg,packages,settings,Date.parse(baseline.clock)),operator=settings.operatorName||'MB Pinet';
  assert.equal(pages.length,old.pages);
  const outputs={sitemap:nicheSitemapXmlCore(pkg,pages),robots:nicheRobotsTextCore(pkg,false,true),llms:nicheLlmsIndexCore(pkg,pages),full:nicheLlmsFullCore(pkg,pages,operator),schema:JSON.stringify(pages.map(p=>nicheSchemaGraph(pkg,p,pages,operator)))};
  for(const [name,output]of Object.entries(outputs))assert.equal(hash(output),old.outputs[name],`${pkg.siteId}: ${name}`);
 }
});
