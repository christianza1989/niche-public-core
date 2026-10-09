# Dovanos123 Cloudflare release — 2026-10-06

Canonical origin: https://dovanos123.lt. Service `dovanos123-preview` is retained across the preview → production transition. Account `d102163f74a45ab6d33bca786ce281ec`; own EU D1 `dovanos123-production`, ID `4fd42638-6c82-446f-9314-9aaa1c4189c6`. Never substitute the PhoneBridger database or a shared placeholder binding.

## Exact content and build

The current 34-page package has SHA-256 `f5746acd121f1195f8b1746dae63c85f517e6f3ea45bb01389da8490a2e48c2b`: the 14 previously live pages plus 20 newly written and reviewed gift guides. All 72 approved WebP files are paired with this exact release in `release/dovanos123/assets`; the separate 11-page `content-staging/dovanos123` research handoff remains byte-for-byte unchanged.

Install pinned dependencies with `npm ci`. Stage/commit owned source before building: the release builder copies only Git-indexed framework source to a new isolated `outputs/` directory, imports this one package, and copies its approved assets/fonts. It never traverses private state, previous niche packages or unrelated media. The node_modules junction reuses the pinned local install.

```powershell
node release/dovanos123/build.mjs preview
$env:SEO_SMOKE_PROFILE='dovanos123-release'
npm run test:seo-smoke
npm run test:core
```

The generated `release/dovanos123/output/latest-preview.json` identifies its exact isolated checkout. Deploy that checkout's `dist/server/wrangler.json` with the pinned Wrangler CLI. Hosted preview admits only the exact own workers.dev hostname, emits noindex and disables discovery. Canonical production requires an exact production acceptance receipt containing all 13 maintained gates and their actual evidence hashes:

```powershell
node release/dovanos123/build.mjs production <private-production-receipt.json>
# Read latest-production.json, then deploy its target/dist/server/wrangler.json.
node release/dovanos123/verify.mjs https://dovanos123.lt
```

Do not turn pending DNS/TLS evidence into PASS to produce a receipt. The original V1 smoke remains the default profile for existing sites; the explicit gift profile verifies all 14 routes, canonical/JSON-LD/one-H1, exact approved image bytes, client assets, preview or canonical discovery, private boundaries and production redirects.

## Bindings, migration and delivery

Only this fresh release D1 received `0004_niche_leads.sql`, `0005_niche_interest_daily.sql`, and `0006_niche_lead_delivery.sql` through scoped remote execute. The latter is also in the migration journal. The tables are idempotently created; do not replay unrelated schema/data migrations or point a generic database command at another site.

Required secrets: `LEAD_SMTP_ENABLED=1`, `MAIL_RELAY_URL`, `MAIL_RELAY_SITE=dovanos123`, `MAIL_RELAY_KEY`. This optional release transport gate accepts a relay without the mailbox password. The password was deleted from this Worker after real delivery verification. Keep relay credentials in a private secrets channel.

One D1 batch stores a validated lead and its delivery job. Atomic claim/60-second lease prevents concurrent dispatch; failed attempts back off for up to eight attempts. An every-15-minute cron drains due own-site jobs and applies retention. Hostinger relay recipients are restricted to info@pinet.lt for this site, with the client's email as Reply-To; redundant Reply-To equal to sender is omitted. Real own marked form tests proved durable storage, SMTP acceptance and exact primary-INBOX receipt separately. Honeypot, consent, Origin/size guards and edge rate limits remain enabled.

Personal lead/job data expires after 180 days; aggregate daily interest after 365 days. No marketing subscription, checkout, stock or order completion is implied by a demand enquiry. Review failed jobs through a scoped own-site D1 query and Cloudflare logs; do not dump customer message bodies or credentials into logs. Observability uses 0.1 sampling; an external uptime/on-call service is not configured.

## Backup and rollback

A private remote D1 SQL export on 2026-10-06 was restored in isolated SQLite with integrity `ok`, preserving the four own marked test leads and four jobs. Neither an export URL nor SQL containing enquiries belongs in Git. Use [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) and scoped private exports for later recovery; check the actual account's recovery window before relying on it. Restore only after reviewing newer submissions and pausing writes.

Code rollback does not reverse D1 writes, secrets, cron or registrar delegation. Keep the last deployment/version and existing database identity. Before migration the DNS zone contained only A `2.57.91.91` plus www CNAME to apex; nameservers were lunar/solar.dns-parking.com. Cloudflare now owns the authoritative zone; a preserved old Hostinger zone was bridged to current Cloudflare edge addresses for resolver-cache continuity. Temporary `_acme-challenge` TXT values mirror only this site's managed certificate verification during cutover; keep them until validation/cache continuity no longer requires them. Do not reset the whole zone or alter pinet.lt mail.

Canonical HTTPS, browser access, www/HTTP routing and real canonical form delivery must be recorded separately from preview success. No audit score, search indexing, AI visibility, production Lighthouse score, demand or capacity guarantee is claimed by this release.
