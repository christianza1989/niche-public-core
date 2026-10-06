# DNS and mail cutover

Read when DNS/delegation or delivery is part of the release. Website hosting, registrar DNS, mailboxes and outgoing credentials may belong to different accounts/products. Access to one does not establish access to others.

## Capture and preserve service boundaries

Record current authoritative nameservers, website records and complete available zone inventory with type, name, value, priority, TTL and proxy state. DNS enumeration cannot recover a whole zone; use its current owner/export plus targeted queries. Identify MX/SPF/DKIM/DMARC, autodiscovery, verification TXT, CAA, subdomains and other live records. Keep sensitive inventories private where required.

Inspect DNSSEC at the zone and registrar/parent DS delegation. Migration with stale DS can break validating resolvers. Follow current instructions for the actual signed/unsigned migration; never remove/recreate DS by guess or label a failed lookup as proof of no DS. See [Cloudflare DNSSEC](https://developers.cloudflare.com/dns/dnssec/) when that is the destination.

Decide whether a website record/route change suffices; moving nameservers affects the whole zone. Prepare destination records before delegation. Preserve email/discovery services as DNS-only when the proxy cannot carry their protocol. Do not blindly import parked website addresses replaced by the new host or discard unrelated subdomains.

Save a scoped change/rollback diff and reread current records before writing. Registrar confirmation proves accepted settings, not propagation. Check destination zone status, public NS/A/AAAA/DS answers, hostname TLS and redirects after cutover. Confirm existing mail DNS still resolves correctly.

## Diagnose propagation without hiding it

Compare authoritative answers, independent recursive resolvers and ordinary system/browser resolution. Distinguish NXDOMAIN/NODATA caches, IPv4/IPv6 reachability, stale positive records, inactive routes and certificate failures. Capture result/time/TTL instead of saying only "DNS is slow."

The first launch encountered a router's cached negative A while public A and local AAAA differed. Clearing client cache did not clear that router. An isolated diagnostic resolver can establish edge readiness while preserving hostname, SNI and normal certificate validation. Label alternate-resolver results. A provider preview proves only that host. Leave ordinary-domain browser acceptance pending until it succeeds; do not change hosts files, global/browser DNS or disable TLS to manufacture a pass.

Do not repeatedly change nameservers or deploy while a diagnosed cache expires. Arrange follow-up monitoring only when requested; otherwise report pending evidence and the usable URL.

## Delivery and Hostinger credential routing

Use the site's maintained enquiry/delivery service. Form success requires its actual contract; where enquiries must survive notification failure, save before notifying and make recovery observable. Database commit, provider acceptance and inbox receipt are separate results. Keep reply-address handling faithful to the provider schema.

For Hostinger, distinguish platform/registrar API, SMTP/mailbox and Mail API credentials. A Mail API key is not a platform token. A 401 on the wrong product does not prove all access unavailable or justify cycling a key through unrelated endpoints. Use connectors for their intended product. Mail request capabilities come from the [official OpenAPI](https://github.com/hostinger/mail-api/blob/main/openapi.json), not guessed fields; its root is `https://api.mail.hostinger.com`. Preserve working SMTP rather than forcing every site to migrate.

For an authorized self-test, record one unique attempt ID/time before sending to the explicitly allowed owner/test mailbox. Check only that identifier and marker. On timeout/delay, reconcile provider/enquiry/mailbox state; do not automatically resend. Inbox access is not permission to browse unrelated messages or contact customers. Clean up only owned disposable data when authorized; keep secrets, bodies and private IDs out of Git/public reports.
