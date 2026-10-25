# Promedical selected homepage renderer

Migration of the owner-selected 1440px homepage. The owner subsequently authorized
publishing it and adapting the secondary site to its white/gray/red design.
Editorial approval/release remains a separate canonical Studio operation; this
source change does not bypass it.

`promedicalHomepageModel` accepts the selected four-section body only when all
nine card targets exist in the caller's eligible page universe and all thirteen
canonical image families are present. The normal approved-page projection stays
outside the component. Existing approved packages retain the previous homepage
renderer until the new exact revision is reviewed and approved through Studio.

- Business copy, stable home ID, card labels and images come from the page.
- Three inquiry CTAs use `/kontaktai`; no inquiry form or mail workflow returns.
- Search is native GET `/produktai?q=…`; Mayo remains first.
- Gidai appears only in the footer, including the existing secondary-page header.
- Selected red Pro logo: slightly enlarged, lossless640/1280px technical variants
  from the original owner-selected PNG. Self-hosted Roboto matches the prototype.
- Shared selected header/footer on every Promedical page. Gray surfaces, red
  actions,1440px frame and readable typography carry across catalogue/products/
  editorial pages. Gallery logic, content, URLs and catalogue behavior remain.
- Organization logo supplements the shared schema graph on Promedical pages.
- Tracking uses the existing single first-party component. Private QA replaces
  that component with a no-transmission adapter.

Before deploying, complete the ordinary vinext/Cloudflare build and
exact-candidate runtime acceptance. A separate optimized Vite SSR review is not
evidence that the framework production build passed. No compiled registry or
approval hash may be patched to activate this draft. Refresh the actual live
package, other nine packages and runtime settings before any later release.
