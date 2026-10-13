import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {projectPublicPages} from '../lib/niche-links.mjs';
import {nicheSchemaGraph} from '../lib/niche-schema-core.mjs';
import {nicheSitemapXmlCore,nicheRobotsTextCore,nicheLlmsIndexCore,nicheLlmsFullCore} from '../lib/niche-seo-core.mjs';
const read=p=>readFile(new URL(p,import.meta.url),'utf8').then(JSON.parse);
const [baseline,packages,settings]=await Promise.all([read('./seo-legacy-baseline.json'),read('../lib/generated/content-packages.json'),read('../config/niche-network.json')]);
test('incumbent SEO retains its historical bytes except the reviewed guide-hub CollectionPage migration',()=>{
 const hash=s=>createHash('sha256').update(s).digest('hex');
 assert.equal(packages.length,9);
 for(const pkg of packages){const old=baseline.packages.find(p=>p.siteId===pkg.siteId);assert.ok(old);
  const pages=projectPublicPages(pkg,packages,settings,Date.parse(baseline.clock)),operator=settings.operatorName||'MB Pinet';
  assert.equal(pages.length,old.pages);
  const schemas=pages.map(p=>{
   const data=nicheSchemaGraph(pkg,p,pages,operator);
   // Current main intentionally migrated the guide index. Validate its exact
   // public inventory before comparing all remaining bytes with the old clock.
   if(p.slug==='gidai'){
    const entity=data['@graph'].find(x=>x['@id']===`https://${pkg.canonicalHost}/gidai#webpage`);
    assert.equal(entity['@type'],'CollectionPage');
    assert.deepEqual(entity.hasPart,pages.filter(x=>x.type==='guide').map(x=>({'@type':'WebPage',name:x.title,url:`https://${pkg.canonicalHost}/${x.slug}`})));
    entity['@type']='WebPage';delete entity.hasPart;
   }
   return data;
  });
  const outputs={sitemap:nicheSitemapXmlCore(pkg,pages),robots:nicheRobotsTextCore(pkg,false,true),llms:nicheLlmsIndexCore(pkg,pages),full:nicheLlmsFullCore(pkg,pages,operator),schema:JSON.stringify(schemas)};
  for(const [name,output]of Object.entries(outputs))assert.equal(hash(output),old.outputs[name],`${pkg.siteId}: ${name}`);
 }
});
