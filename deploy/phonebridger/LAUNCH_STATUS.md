# Launch acceptance — 6 October 2026

The owner authorized PhoneBridger hosting, DNS, durable enquiries, email/password accounts and Hostinger mailbox delivery. Creator and paid commerce remain deferred. No paid Cloudflare plan or R2 subscription was activated.

## Verified preparation

- Source prototype byte attestation and the exact Studio-reviewed 14-page public package pass. The build emits 18 routes, including four noindex account routes, and 290 allowlisted assets.
- Local Worker HTTP checks pass for every public revision, canonical responses, private-path denial, sitemap/robots, registration/session/invalid password/CSRF/revocation, both complete installer hashes and a range crossing the Windows delivery-part boundary.
- The original ZIP and APK were not repackaged. Delivery splitting satisfies Static Assets' 25 MiB file limit.
- The contact form saves to isolated D1 before notifying Hostinger. A uniquely identified local form self-test was actually found in the hello mailbox; provider acceptance alone was not treated as receipt. Private IDs and message details remain outside Git.
- Four new focused service tests and the existing core suite pass: 56/56. Existing incumbent SEO output remains byte-identical in its fixed-clock comparisons. The actual local SEO smoke also passes.
- The EU-jurisdiction D1 schema and three remote secrets are installed. The Worker uploaded successfully; its route activation did not complete.
- All nine existing Hostinger mail DNS records are present in the pending Cloudflare zone. The registrar's nameservers have not been changed.
- No parent DNSSEC DS record was returned by a public DS lookup on 6 October. Recheck immediately before cutover.

## Remaining launch gate

Cloudflare returned error **10034** because the account's email is unverified. The dashboard also displays its account verification request. A resend was requested; the owner must follow the verification email. Do not bypass this gate or assert that the uploaded Worker is publicly reachable.

After verification: deploy, run the actual workers.dev tests, assess the account hashing cost on the actual edge without weakening it, recheck and preserve mail DNS, change nameservers, activate the zone, bind apex/www custom domains and verify TLS, canonical redirects, public metadata, live form receipt and authenticated sessions. Re-run tests against the eventual merged revisions. Local tests do not prove public readiness.

The free Worker CPU allowance may require a separately authorized hosting budget for password hashing. No plan upgrade is implied by deployment authorization. Email verification and automated account recovery are not implemented and the website discloses that limitation.

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
