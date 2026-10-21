# Existing Vinext builds on Cloudflare Pages

The regular build remains a full Module Worker. When an authorized launch must retain externally hosted DNS, Pages supports an external subdomain CNAME. Do not migrate apex nameservers, mail records or unrelated services merely to attach that subdomain. Check current provider documentation and actual account limits first; this adapter does not authorize publication or paid resources.

## Package the existing dynamic application

Run the maintained build first, then use a fresh private output directory:

```powershell
node scripts/package-pages-worker.mjs . .local/pages-release-r1
```

The helper bundles `dist/server` at its original module locations into `_worker.js`, copies the compiled public assets, excludes source maps and rejects reserved/private files. Vinext SSR chunks may dynamically import their original entry through `../index.js`; handing the unbundled graph directly to Pages allows Wrangler to relocate that entry and break those imports. The helper covers ordinary and backtick literal dynamic imports and preserves circular imports. It does not copy server configuration into the served asset tree or turn dynamic routes into static pages.

`_routes.json` invokes the existing Worker for content, media, forms and private paths, with exactly two exclusions: `/_next/static/*` and `/fonts/*`. These compiled framework/font bytes follow the incumbent Workers build's asset-first boundary; the application handler otherwise returns 404 for generated CSS/JS. They can be fetched on unknown hosts, as in the original build. Site photographs, `/content-assets/*`, `/images/*`, favicons and dynamic routes must retain the host/publication guards. Do not extend these exclusions to blanket static bypasses. The adjacent `.manifest.json` records the exact exception, original modules, asset hashes and output hashes outside the served directory. Keep the original failure and release evidence; an existing output is never overwritten.

## Isolate Pages configuration

Use an independently reviewed `wrangler.json` outside the Vite project ancestry. Otherwise Vite's generated `.wrangler/deploy/config.json` can redirect Wrangler back to its Workers configuration. `wrangler pages dev` does not accept the Workers `--config` flag: select the external configuration directory with `--cwd`.

Set `pages_build_output_dir` to the absolute prepared output. Preserve the built compatibility date/flags and all required application bindings; for this core the enquiry binding is `DB`. Supply the actual authorized database ID separately. Do not reuse an unrelated database or copy secrets, preview vars or placeholder IDs into production configuration.

```powershell
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js pages dev --cwd C:/owned/private-pages-config --ip 127.0.0.1 --port 5199 --inspector-port 0 --persist-to C:/owned/private-pages-state
```

For an ordinary loopback browser review, the existing local-only `--binding NICHE_DEV_SITE_ID=<siteId>` selects the site. Production configuration must omit that binding. Host-aware HTTP checks still exercise the true canonical host separately. Do not modify OS/browser DNS or bypass TLS for screenshots.

Before live deployment verify SSR, canonical/hreflang/schema/discovery, actual stylesheet HTTP 200 with `text/css` and JavaScript HTTP 200 with a JavaScript MIME type, loaded browser styling/hydration/images, unknown/foreign content/media host isolation and 404, plus the exact fresh D1 schema, durable form storage and failure rollback. File presence and an HTML crawler alone miss a stylesheet route returning 404. Preserve original prices and recompute submitted configurations server-side. Local form success does not prove operator email/INBOX delivery, public media permissions, legal facts or demand. Keep those gates explicit. After approved deployment, verify the actual domain and HTTPS; a package, provider upload or local simulator alone is not a live launch.

Provider references: [Pages Advanced Mode](https://developers.cloudflare.com/pages/functions/advanced-mode/), [Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/). Recheck their current terms and behavior when deploying.

## Focused source regression

With the repository's pinned dependencies already installed, run `node --test tests/pages-worker-package.test.mjs`. The fixtures create their own private `.local` parent, execute the bundled circular SSR graph and check guarded routing, private-file rejection and refusal to overwrite output. They do not build the application, create remote resources or deploy it. Preserve the first failure and exact artifact-specific browser/HTTP checks separately from this generic fixture result.
