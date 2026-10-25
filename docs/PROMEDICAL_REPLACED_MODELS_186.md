# Promedical replaced-model retirement (decision 186)

Twelve obsolete products (1260 and 1338–1348) advertised replacement models that do not have current product pages. Their canonical URLs and original manufacturer aliases now redirect directly to their existing main catalogue categories. Redirects preserve query parameters and contain no chains.

The immutable package starts from accepted live version 185A and removes only those 12 product records. All 1395 remaining product records, other page records and genuine approvals stay unchanged. No 185B or 186B drafts are included.

The repository package lagged the live site: 499 non-product snapshots have newer actual approvals than their repository counterparts. Importing these already deployed snapshots preserves the approved homepage, categories and guides. The import adds 90 referenced immutable image files, verifies their hashes and leaves existing asset filenames and bytes intact. Other sites' source packages remain unchanged.

Package SHA256: `08e4498d156cc3b8d53b7cef0c8de36357df5b3f313b07f371fee61fcb35edba`.

Expected acceptance:

- 1896 package pages, 1395 products, 9191 referenced package assets and 8305 distinct product assets.
- All 24 canonical and short URL spellings redirect to three eligible categories; GET, HEAD and query preservation are checked.
- Withdrawn products disappear from category cards, related links, sitemap, LLM exports and schema. The 36 newly unused product image URLs return 404.
- The 55 held guides and their 156 associated image URLs remain unavailable.
- F02 has 292 additional pages. All 733 prior collection URLs remain in acceptance, including four last-page URLs that now clamp to the last valid page.

The deployed no-sale catalogue changes from decision 184 are retained. This data/config PR does not take over the separate renderer/editor PRs. The production build preserves the actual accepted 185A renderer, settings and bindings. A later deployment from main must also include the current production renderer/editor code.

The canonical private withdrawal uses `revokePage` for the 12 records, then `packageForSite` and the immutable overlay exporter. Two unchanged genuine 185A approvals serve only as anchors required by the exporter. No new approval or invented approval/revision hash is used.

Focused source tests cover redirect spellings, query preservation, target eligibility, chains and every remaining product's navigation. Full source tests and actual candidate acceptance are reported separately in the PR. Operational receipts, raw data and screenshots remain private.

Scope coordination: [issue 76](https://github.com/christianza1989/niche-public-core/issues/76).