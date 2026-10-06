# Launch acceptance — 6 October 2026

**Live:** https://phonebridger.com, with www and HTTP redirected to the canonical HTTPS origin. The owner authorized PhoneBridger hosting, DNS, durable enquiries, email/password accounts and Hostinger mailbox delivery. Creator and paid commerce remain deferred. No paid Cloudflare plan or R2 subscription was activated.

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

The owner selected MB Memocasting for proposed paid orders. The new shop preserves the immutable prototype and accepted homepage. Its production overlay includes a product gallery, four bundles, black/silver choice, saved/query selection, compatibility, FAQs and honest review states. The shop's enquiry action retains the actual selected bundle in the contact form. Mobile checks at 390 and 320 pixels found no horizontal overflow or broken visible images; desktop and gallery interactions were rendered through the in-app browser without console errors.

The additive commerce service uses server-authoritative totals, durable idempotency and stock reservations, raw SDK-verified webhook signatures, private account-owned orders, paid/fulfilled review qualification and audited moderation. Fourteen focused commerce tests pass. The incumbent SEO byte comparisons and actual built-Worker SEO smoke pass. Production publishing evidence is recorded after the exact release deployment; these local tests do not prove provider Checkout or fulfilment.

**Paid checkout remains disabled:** the account has outstanding owner verification and payouts disabled; runtime Stripe keys/signing secret, actual hardware inventory/shipping, tax/return terms and final paid licence delivery are unconfirmed. No live Stripe product, charge, refund or fabricated review was created. The beta stays free. The entitlement helper is an order record, not native paid activation. Creator work remains deferred. Activation requires [COMMERCE.md](COMMERCE.md), not a boolean-only policy edit.

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
