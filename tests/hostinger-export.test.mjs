import test from 'node:test';import assert from 'node:assert/strict';
import {hostingerSourceFile,hostingerScopedInputs} from '../scripts/export-hostinger.mjs';
test('Hostinger source inventory excludes secrets, generated state and other media',()=>{
 for(const file of ['.env.production','.dev.vars.mail','.openai/hosting.json','node_modules/a.js','.next/cache/a','content-packages/other/assets/a.webp','public/content-assets/other/a.webp','sites/other/snapshot.json','migration/old.json','content-staging/other/package.json','lib/generated/content-packages.json'])assert.equal(hostingerSourceFile(file),false,file);
 for(const file of ['app/niche/[siteId]/lead/route.ts','db/hostinger-node-env.ts','public/fonts/kvapunaikinimas/OFL.txt'])assert.equal(hostingerSourceFile(file),true,file);
});
test('scoped deployment retains selected publication fences without mutating global policy',()=>{
 const network={guidePublicationPausedAtBySite:{selected:'2026-10-20',unpackaged:'2026-10-10'},contactsBySite:{selected:{email:'sales@example.lt'}}};
 const aliases={version:1,sites:{selected:{canonicalHost:'example.lt'},unpackaged:{canonicalHost:'other.lt'}}};
 const before=JSON.stringify({network,aliases}),out=hostingerScopedInputs(network,aliases,['selected']);
 assert.deepEqual(out.network.guidePublicationPausedAtBySite,{selected:'2026-10-20'});assert.deepEqual(Object.keys(out.aliases.sites),['selected']);assert.equal(JSON.stringify({network,aliases}),before);
});
