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
  Left/Right/Home/End on thumbnails and enlarged view, native dialog with explicit first/last focus wrapping,
  Escape and close-button return to the opener.
- [x] Keep enlargement empty before opening, first image eager/high and
  thumbnails lazy with matching responsive `sizes`; expose retry/direct-link
  recovery if the main image fails.
- [x] Product.image and sitemap use one representative per immutable family;
  first family also supplies the Promedical product OG/Twitter image.
- [x] React SSR, family privacy, projected approval/date/pause regressions pass.
- [x] Bounded mechanical detector: no findings for the new component/CSS.
- [x] Actual source30/NEREZ1101 five-frame gallery in private SSR/hydration review:
  desktop1280, mobile390/320, loaded fonts/images, no horizontal text overflow,
  thumbnail/Home/End, next image, Escape/focus return and Tab/Shift-Tab wrapping.
  The harness imports the actual component/CSS; telemetry and inquiry submission
  are disabled, SEO schemas are not manufactured for raw drafts.
- [x] Forced initial image404 plus cached failure before hydration: mounted
  completion check exposes retry/direct link; retry remains available for a
  persistent404 and selecting a working frame removes the error state.
- [ ] All representative and full candidate galleries after import completes.
- [x] Actual320px user text-spacing override: line height1.5, paragraph spacing2em,
  letter spacing.12em and word spacing.16em. Main/dialog text and controls remain
  available without horizontal overflow.
- [x] All ten representative galleries imported; actual browser loading/geometry
  checks include the single-image product, 12/13-image galleries and shared
  diagrams. Source434 frame11 stays200x56 in both main and enlarged views;
  source419 has13 thumbnails at320px without horizontal overflow.
- [ ] Actual200% browser enlargement remains UNVERIFIED. Current IAB exposes
  viewport emulation without a verified browser zoom control; narrow reflow and
  the separate text-spacing fixture are not represented as browser zoom.

`lib/niche-media.mjs` is the single family/responsive source. Optional `familyId`
is authoritative for new imports; the helper retains legacy alt/aspect fallback
for older immutable packages. No dimensions are counted as additional photos.

Image indexes accept only this site's eligible public WebP projection under
`/content-assets/<siteId>/`; originals and provenance remain private. The
existing sitemap route still enforces host and public-homepage eligibility.
No offers, prices, stock, ratings, reviews or fabricated product facts are added.

Source checks: `node --test tests/promedical-gallery.test.mjs
tests/niche-media.test.mjs` (13 tests), complete public regression (78 tests),
focused ESLint (new component: no errors), Impeccable detector (empty findings).
The existing manual font stylesheet warning in `app/layout.tsx` is preserved.

Images in the primary and enlarged view have native pixel bounds so a genuine
low-resolution manufacturer fallback is not stretched to fill the region.
The image area stays reserved; low-resolution content remains centred. Exact
source limits are reported separately, without invented higher-resolution URLs.

Explicit immutable family identity is authoritative even when integer output
dimensions change the aspect ratio of a very wide colour strip. A real1280x60
family with1200x56/800x38/640x30/360x17 variants has one SSR thumbnail,
one Product.image entry and one sitemap image. No perceptual deletion is used.

This source delivery is separate from media coverage, content approval,
release/deployment, production HTTP verification and search indexing.

Private integration evidence is kept outside Git under
`D:/Core/output/promedical-gallery-execution-20261021`. Its fixed baseline is the
actual deployed packageSHAe84a27e204e9303258f7fa5e042993170537d745342ba71a6181d1191da98a8c
and Workera8c1f6c5-604f-4ad3-ab4e-85931d4192cd, including the already-live1402
product rewrites. No new gallery draft is represented as approved or deployed.
The owner requested a complete private review before any publication.
