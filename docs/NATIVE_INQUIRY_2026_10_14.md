# Native V2 inquiry

2026-10-14. Public base: `5924a2eb858cf45e736bc5e79a2f07cfbbc39af2`; companion: `faea0e75ca4bad441b8905898f052fef020acc17`. Scope: [public issue 34](https://github.com/christianza1989/niche-public-core/issues/34), branch `codex/verslomatika-native-inquiry-20261014` in a separate worktree.

Native V2 previously rendered only a mailto link and rejected every POST before the maintained inquiry handlers. It now renders the contact form on the published `kontaktai` contact page only when a published `privatumas` policy is available. Existing contact information remains visible. Published pages with that privacy policy use the existing aggregate interest component.

The proxy admits only native POSTs at `/uzklausa` and `/ivykius` and rewrites them to the existing host-aware D1 handlers. Internal API paths, other write routes and methods, foreign hosts and withheld home pages remain denied. Existing body limits, origin checks, consent, honeypot, storage, privacy signals and notification flags are retained. No second mail, contact or analytics core was added.

## Validation

- First routing regression: one failure (405 instead of the intended inquiry rewrite), one pass. The old render test also failed because it explicitly prohibited forms and tracking; that obsolete expectation was replaced with the new approved scope and withheld-privacy assertions.
- Current targeted routing/render/handler SQLite regression: 13 passes. Required `npm run test:core`: 68 passes. Production build passed. `test:seo-smoke` initially failed because no server was listening; against an owned local server on port 8896 it passed all seven existing public pages, SEO outputs, schemas, host isolation and 404 checks.
- A separate synthetic native fixture used an owned local Wrangler server on port 8897 and a dedicated local D1 directory. The first nested persistence path failed with SQLite `CANTOPEN`; a shorter owned path was initialized with the unchanged canonical DDL and succeeded. This is local fixture configuration evidence, not a production database migration.
- The first HTTP probe used an IP origin with a different Host and correctly returned 403. Using the same native hostname and port for Host and Origin returned 200; a foreign Origin still returned 403.
- Real isolated Chrome submitted the native HTML form. Direct read-only verification of that local D1 row confirmed `site_id=nativeqa`, `status=new`, and `source_path=/kontaktai`. An actual HTTP interest POST returned 204 and incremented the native site's pageview aggregate. Mail flags were disabled; no inbox delivery is claimed.
- Chrome inspected 1280×800, 390×700, 320×700 and 390×700 with 200% root text enlargement. Empty form validation, valid long text, focus indication, 44px form targets and absence of horizontal document overflow passed. Desktop, phone and enlarged text screenshots were visually reviewed. This text enlargement check is separate from native browser zoom.

Ignored local evidence: `output/native-inquiry/browser-1791969727628/receipt.private.json`, source-hashed screenshots, preserved earlier HTTP receipt and regression failure logs. These synthetic artifacts are not shipped as real customer evidence. No normal signed-in platform account was used.

## Typography and language

The existing native System font, reading width, surface and accent hierarchy are preserved. Inputs inherit readable text and expose explicit labels, a visible keyboard focus indicator, a required consent control and the actual privacy link. Final form copy was separately reviewed in Lithuanian, including the 20-character minimum and storage-versus-mail result wording. No prices, service capacity or commercial claims were invented.

## Delivery limits

Canonical private journal: `upgrade-cebae466-b643-46c7-b226-2f8e3f99a1fa` in the companion core. Original checkouts, other sites, homepage and production are untouched. This local renderer/inquiry repair does not establish full website Foundation, agent model, calibration, hosted channel, inbox or deployment acceptance. Those gates require their own current-source evidence.
