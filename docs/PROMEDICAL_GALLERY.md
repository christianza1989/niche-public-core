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
- [x] All1,408 actual candidate routes and8,352 unique WebP files pass private
  HTTP/MIME/byte/SHA checks after native integrity and final attachment.
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

Initial source checks: `node --test tests/promedical-gallery.test.mjs
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

## Final private acceptance — 2026-10-21

Tested renderer source:5fd20118327044fe8d0df6ee2280fa85f2a53194, including
current-main F01 navigation and F02 pagination. The merge preserves catalogue
canonical handling and the first gallery family's social image. All94 public
tests, TypeScript with1,024MiB heap, focused lint and normal build pass. One
pre-existing manual-font-stylesheet warning remains. All ten compiled content
packages equal the frozen approved baseline. Actual local Worker SEO smoke
passes1,854 routes;306 pagination probes cover296 later pages and ten controls.

All1,408 manufacturer products were inventoried. After298 proven duplicate
anchors,7,454 per-product frames map to2,801 immutable source families and8,352
responsive WebP files. The largest page has46 variants within the unchanged60
limit. Native verification rechecks hashes, dimensions, canonical records,
alpha and order. Every actual candidate route and unique variant passes private
HTTP verification. All23,183 contextual alt values equal the owner's authorized
existing product title. All1,909 historical published revisions and501
nonproduct pages remain identical. One missing manufacturer original has a
genuine200x56 fallback retained without enlargement.

Current functional UI checks cover390/320px reflow,13-frame thumbnails,
selection, native dialog, Escape/focus return and200x56 main/dialog bounds.
Actual200% browser zoom remains unverified. The1280px DOM geometry was checked;
the IAB desktop screenshot captures only the visible left pane. The current
Lighthouse pair uses the same final UI with single-family versus five-family
candidate data: scores51/52, LCP16.86/16.39s, CLS approximately0.000013/0.000015.
These private Vite results include roughly7MB development JavaScript; they are
not production CWV acceptance or evidence of a causal improvement.

Read-only reconciliation preserves the separately deployed current F02 Worker
4262d312-9ee9-4324-8344-24ef2e98bf54 with all ten original content packages and
operational settings unchanged. Initial a8c and intermediate F01 snapshots
remain historical; no rollback was performed. The exact raw candidate SHA is
`b81a0f07cb0c7fddd5ce0c868a5f8f71ebd4f219430954f48920f1a02118874c`.
The owner manifest is `READY_FOR_OWNER_REVIEW_NOT_APPROVED`:41/45 plan actions
complete. Approve/release/deploy, new production CDN/WAF checks and indexing
remain outside private acceptance. No new gallery approval or deployment was
performed; private Studio/media payloads remain outside this source PR.

## Subsequent owner-authorized live publication — 2026-10-21

The owner reviewed the private gallery preview and explicitly authorized live
publication. The immutable private acceptance above is retained as history.
The canonical1408-product media release preserves the latest separately
published70 text corrections, all501 nonproduct pages, F01/F02 behavior,
Lithuanian URLs/redirects and55 held guides. Published package SHA256:
`26907ad9a442f8327097a43f74a909b23ad768ec6664fa5152389ba1f2e51237`.
Active Worker version `1351de1b-50a0-493d-986c-3e3ff275fcb7`, deployment
`22f961ec-b024-442b-bfd0-ee0750de1320`,100% traffic. Previous version for rollback:
`56e75e7d-f297-4782-aefc-4f09ecd6f8ca`, preserving the latest text corrections.

Publication uses this source with the final canonical approved package imported
into an isolated build directory. Run the **complete normal build after import**
so the framework server's public asset index includes every new media path.
Data-only compiled-JSON replacement leaves new images404 despite copied files;
the local Worker canary caught this before deployment. The final normal build
indexes all9191 release assets. A representative actual local production build
passes ten product routes/218 images, plus55 held-guide and208 held-media404s.
Public94 tests and companion Studio62 tests pass.

Exact deployed payloads, canonical approval/release receipts, production HTTP
and UI evidence remain private under
`D:/Core/output/promedical-gallery-execution-20261021/live-publication-20261021`.
This Git source snapshot is not a replacement for that current approved release.
Future publication must reconcile current production before another overlay;
shared Studio drafts were not overwritten. The source PR remains draft and
main was not merged. Actual new-image indexing and AI visibility are separate
from technical delivery and are not inferred from user-agent probes.

Final actual production HTTPS verification passes all1408 product routes,
7454 visible image families and8352 unique WebP files with MIME/byte/SHA checks
and zero failures. Product.image and1854-URL sitemap match visible families;
existing301 controls pass. All55 held guides and208 exclusive held-media paths
remain404. Live390/320px selection/dialog/focus/13-frame checks pass. The final
Cloudflare read confirms the expected100% active version and preserved bindings
and operational settings. Evidence is `live-gallery-verification.json`,
`production-http.json`, `browser/live-ui.json` and `browser/live-mobile.jpg`
under the private publication workspace. Plan44/45 complete:actual new-image
indexing remains unverified. Actual200% zoom and production CWV are not claimed.
