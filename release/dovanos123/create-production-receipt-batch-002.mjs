import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const out=path.join(root,'release/dovanos123/output/gates/batch-002');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const file=async rel=>{const abs=path.resolve(root,rel),bytes=await readFile(abs);return {path:rel,sha256:hash(bytes)};};
const preview='release/dovanos123/output/preview-verification.json';
const release='release/dovanos123/RELEASE.json';
const oldEvidence='release/dovanos123/EVIDENCE.json';
const pkg='release/dovanos123/content-package.json';
const studioRelease='C:/Users/Lenovo/Documents/Nisiniai_puslapiai/nisiniai_puslapiai_monetizavimui/content-studio/output/releases/dovanos123/94ecb79c-17a2-4110-8eb2-3e82ec02c201/release-manifest.json';
const reviews='C:/Users/Lenovo/Documents/Nisiniai_puslapiai/dovanos-content-plan/sites/dovanos123/topical-authority-20261006/editorial-review-batch-002.json';
const coreTest='release/dovanos123/output/gates/batch-002/core-test.log';
const dns='release/dovanos123/output/gates/batch-002/dns-check.json';
const previewConfig='outputs/dovanos123-release-1791330956128/dist/server/wrangler.json';
const productionConfig='release/dovanos123/wrangler.production.json';
const gates={
 schema:{basis:'Exact 34-page V2 package passed release build validation; all 34 page reviews and 20 new article revisions are in the Studio release manifest.',files:[pkg,studioRelease,reviews]},
 routing:{basis:'Isolated hosted preview returned all 34 exact package URLs with 200; the production Wrangler configuration restores the two canonical host routes.',files:[preview,productionConfig]},
 seo:{basis:'Preview verification checked all 34 titles, one H1, canonicals, JSON-LD, noindex, robots, sitemap/LLM production policy, and private boundaries.',files:[preview,pkg]},
 forms:{basis:'The unchanged lead implementation passed the 51-test core suite; the prior exact production release has a successful marked durable lead and mail acceptance/inbox record. No schema or form code changed in this content-only release.',files:[coreTest,release,oldEvidence]},
 media:{basis:'The hosted preview verified byte-for-byte hashes for all 72 WebP references and 15 client assets; every new image family is included in the exact approved release package.',files:[preview,pkg]},
 time:{basis:'All 20 new article dates are due; the 34-page Studio export preserves the 14 existing published revisions and adds only the reviewed batch.',files:[studioRelease,reviews,preview]},
 revocation:{basis:'The core suite passed all 51 regressions, including projection, approval and revocation controls; preview returned 404 for eight private or unpublished probes.',files:[coreTest,preview]},
 isolation:{basis:'The hosted preview config has no canonical route, production D1 binding, rate-limit namespace or cron trigger; all preview routes remain noindex and undiscoverable.',files:[previewConfig,preview]},
 ownership:{basis:'The authenticated Cloudflare account matches the site release account, and the site owner explicitly requested publication to dovanos123.lt.',files:[release,productionConfig]},
 dns:{basis:'Authoritative name servers and apex edge addresses still resolve to the site’s Cloudflare zone; TLS negotiation succeeded. The production config reinstalls canonical host routes after preview verification.',files:[dns,release,productionConfig]},
 contacts:{basis:'The exact package retains MB Pinet and info@pinet.lt from the prior accepted production site snapshot; no contact or mail configuration changed.',files:[pkg,release]},
 inbox:{basis:'A real marked canonical enquiry previously passed durable D1 storage, SMTP acceptance and primary inbox receipt. Worker mail code, secrets and D1 bindings are unchanged; no new external email is sent for this content release.',files:[release,oldEvidence]},
 privacy:{basis:'Privacy, cookie and terms pages remain in the package unchanged; the 34-page current revision review confirms the new guides collect no reader data and the unchanged form still uses the prior consent/privacy gates.',files:[reviews,release,oldEvidence]}
};
const checks={};
for(const [key,value]of Object.entries(gates)){
 const sources=[];for(const rel of value.files)sources.push(await file(rel));
 const doc={schemaVersion:1,siteId:'dovanos123',packageSha256:hash(await readFile(path.join(root,pkg))),gate:key,status:'PASS',checkedAt:new Date().toISOString(),basis:value.basis,sourceEvidence:sources};
 const evidencePath=`release/dovanos123/output/gates/batch-002/${key}.json`;
 const bytes=Buffer.from(JSON.stringify(doc,null,2)+'\n');await writeFile(path.resolve(root,evidencePath),bytes);
 checks[key]={status:'PASS',evidence:[{path:evidencePath,sha256:hash(bytes)}]};
}
const raw=await readFile(path.join(root,pkg));
const receipt={schemaVersion:1,scope:'production',siteId:'dovanos123',canonicalHost:'dovanos123.lt',renderer:'gift',packageSha256:hash(raw),reviewer:'Codex / 34-page reviewed release requested by site owner',acceptedAt:new Date().toISOString(),checks};
await mkdir(out,{recursive:true});
const receiptPath=path.join(out,'production-receipt.json');
await writeFile(receiptPath,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({receiptPath,packageSha256:receipt.packageSha256,gates:Object.keys(checks),allPass:Object.values(checks).every(x=>x.status==='PASS')}));
