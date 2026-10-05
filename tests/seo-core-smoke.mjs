import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { projectPublicPages } from "../lib/niche-links.mjs";

const siteId = process.env.SEO_SMOKE_SITE_ID || "greitossvetaines";
const base = process.env.SEO_SMOKE_BASE_URL || "http://127.0.0.1:8787";
const pkg = JSON.parse(await readFile(resolve(`content-packages/${siteId}/content-package.json`), "utf8"));
const origin = `https://${pkg.canonicalHost}`;
const packages = JSON.parse(await readFile(resolve('lib/generated/content-packages.json'), 'utf8'));
const settings = JSON.parse(await readFile(resolve('config/niche-network.json'), 'utf8'));
const live = projectPublicPages(pkg, packages, settings);

async function get(path, host = pkg.canonicalHost) {
  const target = new URL(path, base);
  return new Promise((resolveResponse, reject) => {
    const client = target.protocol === "https:" ? httpsRequest : httpRequest;
    const req = client(target, { headers: { Host: host } }, (response) => {
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
  const path = page.slug ? `/${page.slug}` : "/";
  const url = `${origin}${path}`;
  const { response, body } = await get(path);
  assert.equal(response.statusCode, 200, `${path} must be public`);
  assert.ok(body.includes(`<link rel="canonical" href="${url}"`), `${path} canonical`);
  assert.ok(body.includes('type="application/ld+json"'), `${path} JSON-LD`);
  assert.ok(body.includes(page.title.replaceAll("&", "&amp;")), `${path} visible title`);
}

// Static assets must not bypass the host-aware favicon rewrite in Workers.
const sharedFavicon = await readFile(resolve('public/favicon.svg'), 'utf8');
for (const path of ['/favicon.svg', '/favicon.ico']) {
  const { response, body } = await get(path);
  assert.equal(response.statusCode, 200, `${path} niche status`);
  assert.match(response.headers['content-type'] || '', /image\/svg\+xml/);
  assert.ok(body.includes('<svg'), `${path} icon payload`);
  assert.notEqual(body.trim(), sharedFavicon.trim(), `${path} must use the niche icon, not a shared static asset`);
  assert.equal((await get(path, 'unknown-domain.example')).response.statusCode, 404, `${path} unknown-host isolation`);
}

const robots = await get("/robots.txt");
assert.equal(robots.response.statusCode, 200);
assert.ok(robots.body.includes(`Sitemap: ${origin}/sitemap.xml`));

const sitemap = await get("/sitemap.xml");
assert.equal(sitemap.response.statusCode, 200);
assert.equal((sitemap.body.match(/<url>/g) || []).length, live.length);
for (const page of live) assert.ok(sitemap.body.includes(`<loc>${origin}${page.slug ? `/${page.slug}` : "/"}</loc>`));

for (const path of ["/llms.txt", "/llms-full.txt"]) {
  const { response, body } = await get(path);
  assert.equal(response.statusCode, 200, `${path} status`);
  assert.match(response.headers["content-type"] || "", /text\/markdown/);
  for (const page of live) assert.ok(body.includes(`${origin}${page.slug ? `/${page.slug}` : "/"}`), `${path}: ${page.slug}`);
  if (path === '/llms-full.txt') for (const page of live) for (const link of page.externalLinks ?? []) assert.ok(body.includes(link.url), `LLM sources: ${link.url}`);
}

const missing = await get("/__seo_smoke_missing__");
assert.equal(missing.response.statusCode, 404);
assert.ok(!missing.body.includes('rel="canonical"'), "404 must not claim the homepage canonical");

assert.equal((await get(`/niche/${siteId}`)).response.statusCode, 404, "internal site path must stay hidden");
assert.equal((await get("/", "unknown-domain.example")).response.statusCode, 404, "unknown host must not show a niche");

console.log(`SEO core smoke passed: ${siteId}, ${live.length} public pages, robots, sitemap, llms, schemas, host isolation and 404.`);
