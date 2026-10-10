# Native V2 niche rendering

The `niche` renderer now consumes native schemaVersion2 pages without converting rich blocks to V1. `publicContentPages` remains the publication and link authority. The same projected inventory drives page lookup, navigation, cards, rich links, sources, responsive media, canonical/JSON-LD, sitemap and LLM outputs. There is no new scheduler, eligibility predicate or per-customer SEO engine.

The bounded admission supports `lt-LT` `gift` and `niche` packages. Every permit binds the exact original package bytes, site, host and renderer. Production still requires the existing schema/routing/SEO/forms/media/time/revocation/isolation/ownership/DNS/contacts/inbox/privacy evidence. A `.example` fixture is explicitly testOnly. Actual-host local-preview packages still compile only in an isolated output checkout, serve only through localhost/127.0.0.1, and return noindex. No package, hostname or deployment is activated by this source change.

Gift rich rendering and metadata APIs are compatibility exports from shared components/helpers. Gift categories, author URL defaults and V1 niche compositions retain their existing behavior. Native guides receive Article schema using approved editorial authors, sources and dates; publishAt does not invent publication or modification history. Links to profiles and indexes reference eligible page IDs. The default native shell is a functional content adapter, not acceptance of a customer's brand, design or phase-one site.

Native contact pages display only the approved siteSnapshot email as a mailto link. The operator is the approved snapshot value. The V2 export contract still rejects unknown email/operator; the renderer supplies no Pinet fallback. Native POST endpoints return 405: this slice does not activate forms, tracking, voice, SMTP or delivery claims. Existing gift/V1 backend paths remain in place. Sources/media are shown only when present in the approved package; this adapter does not verify them or manufacture assets.

## Reproduce the isolated HTTP checks

Run from an installed own public checkout. Each `prepare` requires a NEW directory under this checkout's output; it copies Git source files into an isolated build, creates labelled test fixtures, retains original package bytes and uses a real wall-clock publication boundary three minutes later. No existing sandbox or active package is overwritten. The test's small synthetic WebP assets are generated using the existing installed Sharp dependency; they are not customer assets or visual acceptance.

```powershell
node tests/native-niche-v2-http.mjs prepare output/native-v2-http/dovanos-memorycasting
cd output/native-v2-http/dovanos-memorycasting
$env:NICHE_DEV_SITE_ID='previewqa'
npm run build
npm run start -- --port 8897
```

In another terminal in the own source checkout, while its owned preview is running:

```powershell
node tests/native-niche-v2-http.mjs check output/native-v2-http/dovanos-memorycasting before
# After the exact boundary printed by prepare, using real wall clock:
node tests/native-niche-v2-http.mjs check output/native-v2-http/dovanos-memorycasting after
$env:SEO_SMOKE_BASE_URL='http://127.0.0.1:8897'
# In the isolated build checkout, retains the existing V1 pilot acceptance:
npm run test:seo-smoke
```

To check withdrawal, stop only this owned preview, run `retire` from the source checkout, then rebuild/restart that same isolated build and run `check ... retired`. This produces a new exact-byte admitted immutable fixture release excluding the guide and its references; old package bytes and copied static media remain in place. The static media must nevertheless become inaccessible through the host/date/publication gate.

```powershell
node tests/native-niche-v2-http.mjs retire output/native-v2-http/dovanos-memorycasting
# Rebuild/restart the owned isolated preview, then:
node tests/native-niche-v2-http.mjs check output/native-v2-http/dovanos-memorycasting retired
```

Each check writes a separate dated PASS or FAIL receipt under sandbox output with request method/host/path/status/body digest, package digest and observed wall clock. A failed before-date window requires a new sandbox; retain the failed receipt. The harness also checks current/future rich links, real WebP responses, variant srcset, media aliases, cross-host media isolation, direct internal paths, unknown hosts, localhost-only local-preview restrictions, noindex, exact snapshot contacts, gift compatibility and independent peer hosts. Unit tests additionally exercise in-memory approval revocation and original snapshot immutability.

Local implementation checks on 2026-10-10: `npm run test:core` 58 PASS/0 skipped; real production Worker HTTP before/after/retired phases 31/32/31 requests PASS; existing V1 `npm run test:seo-smoke` PASS for all seven pilot pages; isolated native/gift/V1 builds PASS. Actual Playwright review covered homepage and guide at 1440×1000 and 390×844. A scoped CSS correction restored heading hierarchy and visible ordered-list markers after the shared reset; final mobile DOM showed 390px width/scrollWidth, loaded images, 24px bold h2 and decimal ol. These synthetic fixtures do not demonstrate real contact delivery or a customer's site quality.

This is local source/adapter acceptance. Customer editorial review, observed sources, media review, useful complete guides, contact delivery, production evidence, actual hosting, DNS and demand remain separate gates. No full F1 or launch claim follows from these checks.
