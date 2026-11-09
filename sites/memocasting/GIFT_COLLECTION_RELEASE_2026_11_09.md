# Memory Casting gift collections — release record

## Scope and source

- Public source commit: `943f9694d69a85d706d3b3f2786aeaee8fc14d47` (this record does not change that deployed artifact).
- Approved package SHA-256: `07089ea39dfa3d925645a0487ce6108f8702c5d2fce098981781137563bf9eb0`, release `9ef4a0b4-666b-4931-a0dc-6a0c5c2f8d2d`.
- The release adds `/dovanos/kaledoms`, updates `/dovanos` and `/gidai/kaledines-dovanos`, and retains the 188 existing publication times. `/dovanos/moterims` remains published.
- Current runtime version after deployment: `32fe21af-bfc9-44d9-ba11-064bb7875953`; deployment `c6e3ab2d-41ae-458f-bfd5-0db57a4286ef` received 100% of traffic when checked on 2026-11-09. Previous version: `f24eb044-6bc2-4d3f-a0af-6139253f2a92`.
- The production artifact was built without private preview files. Cloudflare deployment used `--keep-vars`; the six actual bindings and runtime settings matched before and after deployment.

## Verification

- Production build and asset manifests passed; `test:core` passed 302/302; Wrangler dry-run with `--keep-vars` passed. Local exact-artifact SEO smoke passed for 140 currently public pages, including robots, sitemap, schema, LLM output, host isolation and 404 handling. Local commerce services were disconnected for this test.
- Hosted HTTPS returned 200 with the expected canonical and CollectionPage schema for `/dovanos/kaledoms`. The sitemap includes it, and `/dovanos` and `/gidai/kaledines-dovanos` contain visible anchors to it. `/dovanos/moterims` remained 200.
- Hosted catalog supplied enabled, in-stock products at €32 and €48; the storefront reported production readiness and payment connection. The checkout's embedded terms revision matched the active LT market revision. No payment, order or shipping label was created.
- The published collection was inspected in desktop and 390 × 844 mobile views; both product images and prices, the product links and guide link were visible. The checkout consent control was separately checked. The actual CUA outputs provide the visual evidence; separate screenshot files were not created.

## Rollback

Before rollback, re-read the currently active version and bindings. If the deployed version is still current and an immediate reversal is needed, restore the previous `f24eb044-6bc2-4d3f-a0af-6139253f2a92` Worker version using the provider's version deployment flow. This reverts website code and content only, not intervening database, order, payment or configuration data. Confirm the exact version ID before execution.
