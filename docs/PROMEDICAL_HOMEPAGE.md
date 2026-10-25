# Promedical selected homepage renderer

Private migration of the owner-selected 1440px homepage. This source change does
not approve, release, or activate new editorial content.

`promedicalHomepageModel` accepts the selected four-section body only when all
nine card targets exist in the caller's eligible page universe and all thirteen
canonical image families are present. The normal approved-page projection stays
outside the component. Existing approved packages retain the previous homepage
renderer until the new exact revision is reviewed and approved through Studio.

- Business copy, stable home ID, card labels and images come from the page.
- Three inquiry CTAs use `/kontaktai`; no inquiry form or mail workflow returns.
- Search is native GET `/produktai?q=…`; Mayo remains first.
- Gidai appears only in the footer, including the existing secondary-page header.
- The selected red Pro logo and self-hosted Roboto preserve the prototype.
- CSS is a scoped CSS Module; catalogue/product templates and galleries retain
  their previous layout and media logic.
- Organization logo supplements the shared schema graph only for the new home.
- Tracking uses the existing single first-party component. Private QA replaces
  that component with a no-transmission adapter.

Before merging/deploying, complete the ordinary vinext/Cloudflare build and
exact-candidate runtime acceptance. A separate optimized Vite SSR review is not
evidence that the framework production build passed. No compiled registry or
approval hash may be patched to activate this draft. Refresh the actual live
package, other nine packages and runtime settings before any later release.
