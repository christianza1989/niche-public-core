# Hostinger mail from a native Worker

Use this transport only for an owned mailbox and an explicitly configured site.
Do not silently fall back after an uncertain SMTP or HTTPS acknowledgement.

## Proven platform boundary

On 2026-10-31 smtp.hostinger.com resolved to172.65.255.143. An actual remote
Workers socket probe failed before authentication with `proxy request failed,
cannot connect to the specified address`. Cloudflare documents that outbound
TCP to Cloudflare IPs is blocked:
https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/ .
Changing465 to587, relaxing TLS or rotating the mailbox password cannot fix
this network prohibition. Local Node SMTP success does not qualify Workers
SMTP delivery. Recheck the actual deployed runtime, not just local emulation.

## Explicit transport and unchanged mail semantics

`LEAD_MAIL_RELAY_ENABLED=1` selects HTTPS after an explicit native EMAIL binding
and before the legacy direct SMTP path. Configure an HTTPS `/v1/<siteId>` URL,
authenticated sender and a256-bit base64url token in a Worker secret. Keep
direct SMTP disabled for this deployment. Redirects and failed or mismatched
acknowledgements never cause a second send or provider fallback.

The Hostinger Node service uses the canonical `commerce-mail-gateway.mjs` and
`smtp-protocol.mjs`; it implements no separate SMTP protocol or mail contract.
Each client's token digest fixes its site, recipient and display name. The
authenticated mailbox is always the envelope/MIME sender. The customer's
address remains Reply-To. No customer controls the destination or sender.

MySQL stores only idempotency metadata and a content fingerprint, independently
of app deployments. A unique client/environment/message key is claimed as
unknown before SMTP DATA. Exact accepted replays return the existing receipt;
changed content conflicts; unknown delivery never resends automatically.
The native site's D1 remains the enquiry register. SMTP250 acknowledgement
proves server acceptance, not recipient INBOX placement.

## Build and deployment

From the public repository run `node scripts/build-lead-mail-relay.mjs <new-output>`.
It bundles the maintained modules and records their exact SHA256s. Upload a ZIP
of that output to a new dedicated Hostinger Node22 website, use Express with
entry `server.mjs`, `npm run build` and the committed dependency lockfile.
Never deploy it as a static site or over an existing WordPress install.

On a new empty website set RELAY_SMTP_USER, RELAY_SMTP_PASSWORD and
RELAY_CLIENTS_JSON (id/tokenHash/to/fromName). Keep passwords and raw tokens out
of Git, browser bundles and output logs. Hostinger's environment setter replaces
the complete list: never paste masked values back. Then its website database
setup appends DB_HOST/PORT/NAME/USER/PASSWORD and DATABASE_URL without deleting
existing variables. Do not rerun the full environment replace afterward unless
all real desired values are available.

Root, source and unknown paths return noindex404. Authenticated GET
`/v1/<siteId>/transport-check` checks durable storage and SMTP AUTH with no DATA.
Verify this first, then send one clearly marked message through the actual
hosted form. Check its own D1 row and distinguish saved, accepted and received.
Replaying an accepted transport request may inspect idempotency without another
email; never blindly retry an unknown message. Preserve web/mail DNS snapshots
and check MX, SPF, DKIM and DMARC independently after a hosting setup.

Rollback keeps the old WordPress origin and original web DNS targets intact.
Revert only the owned deployment; do not cancel Hostinger while it supplies mail.
