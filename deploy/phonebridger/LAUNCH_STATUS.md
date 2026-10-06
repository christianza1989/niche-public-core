# Launch acceptance — 6 October 2026

**Live:** https://phonebridger.com, with www and HTTP redirected to the canonical HTTPS origin. The owner authorized PhoneBridger hosting, DNS, durable enquiries, email/password accounts and Hostinger mailbox delivery. Creator and live paid commerce remain deferred; the isolated purchase playground is verified below. No paid Cloudflare plan or R2 subscription was activated.

## Verified preparation

- Source prototype byte attestation and the exact Studio-reviewed 14-page public package pass. The build emits 18 routes, including four noindex account routes, and 290 allowlisted assets.
- Local Worker HTTP checks pass for every public revision, canonical responses, private-path denial, sitemap/robots, registration/session/invalid password/CSRF/revocation, both complete installer hashes and a range crossing the Windows delivery-part boundary.
- The original ZIP and APK were not repackaged. Delivery splitting satisfies Static Assets' 25 MiB file limit.
- The contact form saves to isolated D1 before notifying Hostinger. A uniquely identified local form self-test was actually found in the hello mailbox; provider acceptance alone was not treated as receipt. Private IDs and message details remain outside Git.
- Four new focused service tests and the existing core suite pass: 56/56. Existing incumbent SEO output remains byte-identical in its fixed-clock comparisons. The actual local SEO smoke also passes.
- The EU-jurisdiction D1 schema and three remote secrets are installed. The Worker, both custom domains and daily retention cron are active. Final deployed version: `053dd6f5-ca6e-408e-bfca-bdc4bbad59c7`.
- All nine existing Hostinger mail DNS records are preserved in the active Cloudflare zone. Hostinger confirms the nameservers changed to asa/sullivan; public resolvers confirm the new delegation.
- No parent DNSSEC DS record was returned by a public DS lookup on 6 October. Recheck immediately before cutover.

## Live acceptance

Earlier Cloudflare error **10034** was resolved by the owner's email confirmation. No verification bypass or plan upgrade was used. Both workers.dev and the canonical domain pass actual edge HTTP checks: all 14 exact public revisions, metadata, robots/sitemap, private-path rejection, registration/session/password rejection/CSRF/revocation and both full installer hashes with cross-part ranges. Password hashing works on the tested free-plan edge without reducing strength. HTTP and www preserve path/query in their 308 HTTPS canonical redirects.

A uniquely identified live `https://phonebridger.com/api/contact` request saved to the dedicated production D1, was accepted by Hostinger and was found in the hello inbox. Only that disposable test enquiry was removed from D1 after confirmation; the mailbox message remains. Real enquiries are untouched. `mail-self-test.mjs` records a send attempt before posting and offers check-only reconciliation, so a delayed or ambiguous response is never automatically replayed.

**DNS propagation limitation:** the computer's/router's resolver briefly cached a negative A answer while the new AAAA record already resolved. Normal fetch/browser attempts timed out. The canonical-domain acceptance test used an isolated diagnostic resolver querying public 1.1.1.1, preserving the requested hostname and normal certificate verification. No hosts-file, system/browser DNS or TLS-security setting was changed. Public 1.1.1.1 and 8.8.8.8 return Cloudflare addresses, and normal TLS-validated HTTPS requests to those addresses pass. The deployed UI is also rendered through workers.dev while local DNS catches up. Do not relabel that as a successful normal-resolver browser test of the apex.

Email verification and automated account recovery remain unavailable and disclosed. Checkout/creator/fulfilment are deferred. Free-tier acceptance is a measured test result, not a capacity or uptime guarantee. Historical homepage performance/ARIA findings remain recorded; this launch does not certify those frozen-surface issues as repaired. Re-run checks against eventual merged revisions; these deployed commits are still in scoped open PRs.

## Shop preparation — 6 October 2026

**Published and checked:** Worker `99a6fa36-da93-43c8-b9dc-c95e9a124787`, implementation core `28ec496` with companion `cbc0c20`. The additive ten-command migration ran only on the dedicated production D1; no products, inventory or reviews were seeded. The build produces 19 routes (14 public, five private) and 294 allowlisted assets. All 70 core tests and the actual built-Worker SEO smoke pass. Normal DNS/TLS canonical-domain HTTP checks now pass, including all exact public revisions, private files/order protection, disabled checkout, public review shape, auth/CSRF, full installer hashes and cross-part ranges. The ordinary in-app browser renders `https://phonebridger.com/shop` and finish selection changes both images and receipt without observed console errors or broken loaded images. This release did not need the earlier isolated DNS workaround. Historical propagation evidence above remains historical.

The owner selected MB Memocasting for proposed paid orders. The new shop preserves the immutable prototype and accepted homepage. Its production overlay includes a product gallery, four bundles, black/silver choice, saved/query selection, compatibility, FAQs and honest review states. The shop's enquiry action retains the actual selected bundle in the contact form. Mobile checks at 390 and 320 pixels found no horizontal overflow or broken visible images; desktop and gallery interactions were rendered through the in-app browser without console errors.

The additive commerce service uses server-authoritative totals, durable idempotency and stock reservations, raw SDK-verified webhook signatures, private account-owned orders, paid/fulfilled review qualification and audited moderation. Fourteen focused commerce tests pass. The incumbent SEO byte comparisons and actual built-Worker SEO smoke pass. Production publishing evidence is recorded after the exact release deployment; these local tests do not prove provider Checkout or fulfilment.

**Paid checkout remains disabled:** the account has outstanding owner verification and payouts disabled; runtime Stripe keys/signing secret, actual hardware inventory/shipping, tax/return terms and final paid licence delivery are unconfirmed. No live Stripe product, charge, refund or fabricated review was created. The beta stays free. The entitlement helper is an order record, not native paid activation. Creator work remains deferred. Activation requires [COMMERCE.md](COMMERCE.md), not a boolean-only policy edit.

## Purchase playground and order operations — 6 October 2026

Production Worker `3d6455c4-7ff4-4c73-a7c1-997acd4bd2da` and isolated playground Worker `039baddd-39be-4bba-96a7-eca901fd6471` use core implementation `e2f670a` and companion `b32cada`. The byte-checked build emits 19 routes, 14 public and five private, with 295 allowlisted assets. All 75 core tests pass, including 19 commerce tests. Existing fixed-clock SEO comparisons remain unchanged. The canonical-domain verifier passes actual HTTPS redirects, all public editorial revisions, private namespace/auth/CSRF/order guards, disabled production checkout, full original installer hashes and cross-part ranges.

The first post-deployment Windows stream ended early. Its cause was not established. A subsequent full canonical acceptance run and two further complete Windows downloads returned the exact expected 59,235,840 bytes and SHA-256. Record this observed transient honestly; these successful samples do not establish uninterrupted download reliability or capacity.

Before the production migration, the dedicated production D1 was exported to an ignored private backup. The single additive `commerce-operations.sql` statement then created delivery metadata; no customer records or production stock/reviews were replaced or seeded. A separate operator secret was supplied through private stdin. Existing account/mail secrets, domain routes and DNS were preserved. Production checkout policy stays disabled.

Actual browser purchases in the isolated Stripe sandbox succeeded for the $70 physical test bundle and the $29 digital test bundle. Real signed provider webhooks confirmed payment, digital fulfilment, a full test refund and unpaid Session expiry. Decline/cancel behavior, owned account history/document downloads, once-only stock consumption through simulated dispatch/delivery, and refund withdrawal of a labelled test review were checked. Final read-only provider/application reconciliation passes after the final deploy. The ordinary browser renders the paid order and canonical shop; desktop and 320-pixel order layouts were inspected. See [PLAYGROUND.md](PLAYGROUND.md) for reproducible evidence, sandbox expiry and limits.

**Live activation remains unfinished:** owner verification, live runtime Stripe credentials, real inventory/shipping and commercial tax/return/licence terms are unresolved. No real funds were charged. No automatic purchase email, VAT invoice, carrier delivery or native paid activation is certified. The native input engine, accepted homepage and original installers remain unchanged. These implementation commits are pushed in the existing open PRs; pushed/deployed does not mean merged.

For scoped application rollback, the preceding production version is `99a6fa36-da93-43c8-b9dc-c95e9a124787`. The additive table can remain for compatibility; do not restore the private backup over intervening customer changes. Worker rollback does not reverse data or secrets. Playground resources are isolated from the canonical site and mailbox.

## Shared header/footer release — 6 October 2026

The owner authorized replacing the homepage navigation/footer to match all inner pages. Production version **3a7a058b-e193-4521-88c5-ea94cef1a649** serves the companion's single shell on all **19 routes**, with four dedicated shared assets. The immutable prototype, homepage main content/demo and original installers remain byte-attested. Public content revisions are unchanged because the replaced chrome is outside reviewed main copy.

Canonical HTTP checks pass for exactly one identical header/footer on every route and exact deployed CSS/JS/SVG assets. The ordinary browser rendered the homepage, shop and contact page; active navigation, 320-pixel reflow, 44-pixel header targets, Escape/focus return and mobile footer access were checked. A fixed shop summary initially covered the footer and is now hidden while the footer is visible. An inherited homepage heading weight was corrected to match inner pages. No homepage console errors were observed. Screenshots remain in ignored local output. The standalone local Workers preview stalled; canonical browser acceptance succeeded through the existing live tab.

The core suite passes **78 tests**, including 22 commerce tests; the generic SEO smoke passes for its seven-page pilot. Full canonical acceptance on version 903fe869-2a7c-4b6f-920c-cd938f477689 passed account/CSRF/order privacy, 14 public revisions, installer hashes and cross-part ranges. Later changes were limited to shared chrome; final shell assets/routes and rendered behavior were rechecked separately.

The additive procurement table was applied to the dedicated production D1 before deployment, without replacing customer data or seeding inventory. The backend supports an explicit immutable manual-dropship model and protected private supplier exports. The owner confirmed free worldwide shipping and non-VAT-registered MB Memocasting. Payment acceptance now checks the exact merchant and Stripe charges_enabled; payout verification is tracked separately rather than confused with payment capability. This preparation does **not** activate live checkout: policy remains disabled, the owner must finish the prepared restricted-key creation, and the live webhook and reviewed commercial edition still need completion. No real charge or supplier purchase was made.

The preceding stable Worker version was 3d6455c4-7ff4-4c73-a7c1-997acd4bd2da. Scoped rollback may retain the additive procurement table. DNS, mailbox and other application credentials were preserved.

## DNS cutover / rollback inventory

Old nameservers: `apollo.dns-parking.com`, `athena.dns-parking.com`.
Prepared Cloudflare nameservers: `asa.ns.cloudflare.com`, `sullivan.ns.cloudflare.com`.
Old parking records: apex A `2.57.91.91` TTL 50; www CNAME `phonebridger.com` TTL 300. They are replaced by Worker custom domains rather than carried forward as website origin records.

| Type | Name | Value | TTL | Priority |
| --- | --- | --- | --- | --- |
| MX | @ | mx1.hostinger.com | 14400 | 5 |
| MX | @ | mx2.hostinger.com | 14400 | 10 |
| TXT | @ | v=spf1 include:_spf.mail.hostinger.com ~all | 3600 | — |
| TXT | _dmarc | v=DMARC1; p=none | 3600 | — |
| CNAME | hostingermail-a._domainkey | hostingermail-a.dkim.mail.hostinger.com | 300 | — |
| CNAME | hostingermail-b._domainkey | hostingermail-b.dkim.mail.hostinger.com | 300 | — |
| CNAME | hostingermail-c._domainkey | hostingermail-c.dkim.mail.hostinger.com | 300 | — |
| CNAME | autodiscover | autodiscover.mail.hostinger.com | 300 | — |
| CNAME | autoconfig | autoconfig.mail.hostinger.com | 300 | — |

All mail CNAMEs remain DNS-only. Preserve any later owner changes before saving a cutover; this snapshot is a record, not authorization to overwrite newer records.
