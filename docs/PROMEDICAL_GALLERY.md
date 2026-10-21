# Promedical product galleries

Scope: preserve the existing Promedical product page, Figtree text roles, palette,
product descriptions, URL/inquiry identity, and publication projection. Replace
the single large image plus collapsed extra images with a discoverable gallery.

## Interface / typography checklist

- [x] Reuse `--text-small` (0.875rem), inherited font/colour and 1.5–1.6 line
  height for counters, image descriptions and functional controls.
- [x] Keep all family thumbnail links in SSR HTML; allow native direct-image
  navigation without JavaScript or when using a modified click.
- [x] Use object-fit contain, a reserved square primary region, explicit image
  dimensions and 80px thumbnails with targets larger than 44px.
- [x] Show current/total, selected thumbnail border, keyboard focus; support
  Left/Right/Home/End on thumbnails and enlarged view, native dialog focus trap,
  Escape and close-button return to the opener.
- [x] Keep enlargement empty before opening, first image eager/high and
  thumbnails lazy with matching responsive `sizes`; expose retry/direct-link
  recovery if the main image fails.
- [x] Product.image and sitemap use one representative per immutable family;
  first family also supplies the Promedical product OG/Twitter image.
- [x] React SSR, family privacy, projected approval/date/pause regressions pass.
- [x] Bounded mechanical detector: no findings for the new component/CSS.
- [ ] Integrated current-package desktop/mobile, dialog and keyboard browser
  confirmation. This requires the root's restored production-source app and
  imported media; a unit fixture does not claim that acceptance.
- [ ] Actual enlargement/reflow/user text-spacing evidence in that app.

`lib/niche-media.mjs` is the single family/responsive source. Optional `familyId`
is authoritative for new imports; the helper retains legacy alt/aspect fallback
for older immutable packages. No dimensions are counted as additional photos.

Image indexes accept only this site's eligible public WebP projection under
`/content-assets/<siteId>/`; originals and provenance remain private. The
existing sitemap route still enforces host and public-homepage eligibility.
No offers, prices, stock, ratings, reviews or fabricated product facts are added.

Source checks: `node --test tests/promedical-gallery.test.mjs
tests/niche-media.test.mjs` (9 tests), existing schema/link regression (7 tests),
focused ESLint (new component: no errors), Impeccable detector (empty findings).
The existing manual font stylesheet warning in `app/layout.tsx` is preserved.

This source delivery is separate from media coverage, content approval,
release/deployment, production HTTP verification and search indexing.
