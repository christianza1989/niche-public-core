# Product catalog navigation

Promedical classification previously depended on the product's editorial `links`.
Replacing a description could silently remove the product from a category result
and leave its breadcrumb and related section empty. Classification now lives in
`config/promedical-catalogue.json`, independently of approved product content.
The sidecar contains public stable page/category IDs and manufacturer model codes;
its source digest identifies the reviewed catalog snapshot, not a new approval.

`productCatalogue` indexes only the caller's authoritative public projection.
`productNavigation` supplies the same category to the visible breadcrumb and
`BreadcrumbList`, and the same related set to SSR anchors and `llms-full.txt`.
No page body, approval hash, date or publication pause is rewritten. The cache is
bound to the supplied page-array identity; a later request with a new publication
projection cannot reuse an older request's eligible targets.

Selection is deterministic:

Catalog category order preserves an owner's adjudicated primary classification.
A cabinet on wheels remains primarily a cabinet, even when its manufacturer also
lists it as STJ/STE transport equipment. Secondary valid memberships stay intact.

- Prefer the first registered category with at least two other public products.
  A sparse leaf can use its real catalog parent; if every group is sparse, retain
  the first eligible category and show only available siblings. Current public
  path ancestors also participate in membership. Every recommended product must
  belong to the exact category shown in the breadcrumb and related section.
- Prefer matching model codes and letter variants of the complete numeric model
  stem, then title overlap within the displayed category. Keep all numeric
  components, including model years; do not merge distinct product IDs. This is
  navigation ranking, never a compatibility or interchangeable-parts claim.
- Show the category and up to three same-category products. Reserve two product
  slots when at least two eligible incoming guides exist. Add only guides whose
  projected links explicitly target the current product, newest publication first
  so a newly eligible guide can enter a full section. Deduplicate and cap the
  complete section at five anchors. A genuinely sparse group shows fewer siblings.

New guides appear through normal approval/date eligibility and incoming links;
they require no edit to a product. New category assignments belong in the catalog
sidecar, including future category IDs. They become visible through normal category
publication. Import compilation rejects unknown products, dangling category IDs
and missing or duplicate assignments. This does not approve or publish a category.

The catalog filter consumes these memberships too. Previous/next pagination alone
left distant products many links from the homepage, so a native details disclosure
also exposes every valid result-page link in SSR. The five-anchor cap applies to
the product's related section. URL graph depth is separate from the number of UI
interactions, canonical policy and actual search-engine indexing.

Run `node --test tests/product-navigation.test.mjs`, `npm run test:core`, TypeScript,
the normal build and `npm run test:seo-smoke` against an isolated local Worker.
Acceptance must also compare actual HTML/schema/LLM targets and target HTTP status
for the whole selected product inventory, exercise publication/revocation and
inspect desktop/320px output. Source-only assertions do not certify the rendered
site. This patch is scoped to the existing Promedical adapter; no deployment is
part of source delivery.

The adapter baseline predates later owner-approved description replacements.
Keep source review separate from content adoption: a later authorized build must
use the current immutable site package and its assets, never silently redeploy an
older Git content snapshot. The private companion acceptance binds the exact
current package digest used locally; this PR does not replace that package.
