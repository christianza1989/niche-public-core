import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { projectPublicPages } from "../lib/niche-links.mjs";
import {memoIndexablePages} from "../lib/memocasting-content.mjs";
import {projectContentPagesV2} from '../lib/content-projection-v2.mjs';
import {contentPagePath} from '../lib/content-renderers.mjs';
import {hostedPreviewAdmission} from '../lib/content-hosted-preview.mjs';
import {smokeRequestOptions,assertSmokeHostIsolation} from "../scripts/seo-smoke-transport.mjs";

const siteId = process.env.SEO_SMOKE_SITE_ID || "greitossvetaines";
const base = process.env.SEO_SMOKE_BASE_URL || "http://127.0.0.1:8787";
const pkg = JSON.parse(await readFile(resolve(`content-packages/${siteId}/content-package.json`), "utf8"));
const origin = `https://${pkg.canonicalHost}`;
const packages = JSON.parse(await readFile(resolve('lib/generated/content-packages.json'), 'utf8'));
const settings = JSON.parse(await readFile(resolve('config/niche-network.json'), 'utf8'));
const commerce=JSON.parse(await readFile(resolve('config/commerce-targets.json'),'utf8'));
const admissions=JSON.parse(await readFile(resolve('lib/generated/content-admissions.json'),'utf8'));
const preview=['hosted-preview','hosted-inquiries'].includes(admissions[siteId]?.scope)?hostedPreviewAdmission(admissions):null;
if(preview)assert.equal(new URL(base).origin,`https://${preview.previewHost}`,'hosted smoke requires the exact admitted origin');
const live = pkg.schemaVersion===2?projectContentPagesV2(pkg,packages,settings,commerce):projectPublicPages(pkg, packages, settings);
const indexable=pkg.schemaVersion===2?live:memoIndexablePages(pkg,live);
const pagePath=page=>pkg.schemaVersion===2?contentPagePath(pkg,page):page.slug?`/${page.slug}`:'/';
const renderedResources=new Set();
const declaredIcons=new Set();

async function get(path, host = preview?.previewHost||pkg.canonicalHost) {
  const target = new URL(path, base);
  return new Promise((resolveResponse, reject) => {
    const client = target.protocol === "https:" ? httpsRequest : httpRequest;
    const req = client(target, smokeRequestOptions(target,host), (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => resolveResponse({ response, body }));
      response.on("error", reject);
    });
    req.on("error", reject);
    req.end();
  });
}

assert.ok(live.some((page) => page.type === "home"), "pilot needs a live homepage");
for (const page of live) {
  const path = pagePath(page);
  const url = `${origin}${path}`;
  const { response, body } = await get(path);
  assert.equal(response.statusCode, 200, `${path} must be public`);
  assert.ok(body.includes(`<link rel="canonical" href="${url}"`), `${path} canonical`);
  assert.ok(body.includes('type="application/ld+json"'), `${path} JSON-LD`);
  assert.ok(body.includes(page.title.replaceAll("&", "&amp;")), `${path} visible title`);
  if(preview)assert.match(response.headers['x-robots-tag']||'',/noindex/);
  for(const [tag] of body.matchAll(/<(?:link|script)\b[^>]*>/g)){
    if(tag.startsWith('<link')&&/rel=["']icon["']/.test(tag)){const icon=tag.match(/\bhref=["']([^"']+)["']/)?.[1];if(icon?.startsWith('/')&&!icon.startsWith('//'))declaredIcons.add(icon);}
    const attribute=tag.startsWith('<script')?'src':/rel=["']stylesheet["']/.test(tag)?'href':null;
    const resource=attribute&&tag.match(new RegExp(`\\b${attribute}=["']([^"']+)["']`))?.[1];
    if(resource?.startsWith('/')&&!resource.startsWith('//'))renderedResources.add(resource);
  }
}
for(const resource of renderedResources){
  const {response,body}=await get(resource);
  assert.equal(response.statusCode,200,`rendered CSS/JS ${resource}`);
  assert.match(response.headers['content-type']||'',new URL(resource,base).pathname.endsWith('.css')?/text\/css/:/(?:text|application)\/javascript/);
  assert.ok(body.length>0,`nonempty resource ${resource}`);
  if(preview)assert.match(response.headers['x-robots-tag']||'',/noindex/);
}

// Static assets must not bypass the host-aware favicon rewrite in Workers.
const sharedFavicon = await readFile(resolve('public/favicon.svg'), 'utf8');
for (const path of ['/favicon.svg', '/favicon.ico']) {
  const { response, body } = await get(path);
  if(pkg.schemaVersion===2&&response.statusCode===307){
    const target=new URL(response.headers.location,base);
    assert.equal(target.origin,new URL(base).origin,'native icon stays on the transport host');
    assert.ok(declaredIcons.has(target.pathname),'native icon alias matches rendered metadata');
    assert.ok(live.some(page=>page.media.some(media=>media.src===target.pathname)),'native icon is currently publication-eligible');
    const icon=await get(target.pathname);assert.equal(icon.response.statusCode,200);assert.match(icon.response.headers['content-type']||'',/^image\//);assert.ok(icon.body.length>0);
  }else{
    assert.equal(response.statusCode, 200, `${path} niche status`);
    assert.match(response.headers['content-type'] || '', /image\/svg\+xml/);
    assert.ok(body.includes('<svg'), `${path} icon payload`);
    assert.notEqual(body.trim(), sharedFavicon.trim(), `${path} must use the niche icon, not a shared static asset`);
  }
  assertSmokeHostIsolation(await get(path,'unknown-domain.example'),{edge:new URL(base).protocol==='https:',markers:[pkg.site.name,pkg.pages.find(p=>p.type==='home')?.title],label:path});
}

const robots = await get("/robots.txt");
assert.equal(robots.response.statusCode, 200);
if(preview)assert.match(robots.body,/Disallow: \/\s/);
else assert.ok(robots.body.includes(`Sitemap: ${origin}/sitemap.xml`));

const sitemap = await get("/sitemap.xml");
assert.equal(sitemap.response.statusCode, 200);
assert.equal((sitemap.body.match(/<url>/g) || []).length, indexable.length);
for (const page of indexable) assert.ok(sitemap.body.includes(`<loc>${origin}${pagePath(page)}</loc>`));

for (const path of ["/llms.txt", "/llms-full.txt"]) {
  const { response, body } = await get(path);
  assert.equal(response.statusCode, 200, `${path} status`);
  assert.match(response.headers["content-type"] || "", /text\/markdown/);
  for (const page of indexable) assert.ok(body.includes(`${origin}${pagePath(page)}`), `${path}: ${page.slug}`);
  if (path === '/llms-full.txt') for (const page of indexable) for (const link of page.externalLinks ?? []) assert.ok(body.includes(link.url), `LLM sources: ${link.url}`);
}

const missing = await get("/__seo_smoke_missing__");
assert.equal(missing.response.statusCode, 404);
assert.ok(!missing.body.includes('rel="canonical"'), "404 must not claim the homepage canonical");

assert.equal((await get(`/niche/${siteId}`)).response.statusCode, 404, "internal site path must stay hidden");
assertSmokeHostIsolation(await get('/','unknown-domain.example'),{edge:new URL(base).protocol==='https:',markers:[pkg.site.name,pkg.pages.find(p=>p.type==='home')?.title],label:'homepage'});

console.log(`SEO core smoke passed: ${siteId}, ${live.length} public pages, ${renderedResources.size} rendered CSS/JS resources, robots, sitemap, llms, schemas, host isolation and 404.`);
