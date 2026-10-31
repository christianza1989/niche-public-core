# Read-only Cloudflare content preview

Use a separate `hosted-preview` V2 admission to review an already reviewed
package on one exact `worker.account.workers.dev` host. It is not production
admission: ownership/DNS/contacts/INBOX/privacy launch evidence is still required
by the unchanged production scope. Loopback-only receipts remain loopback-only.

Operate in an owned `output/` worktree. Import the exact native Studio release
with a hash-bound `schemaVersion:1` receipt, `scope:"hosted-preview"`,
`testOnly:true`, `readOnly:true`, `previewHost`, actual reviewer/date, and PASS
evidence for schema/routing/seo/forms/media/time/revocation/isolation. Keep the
package canonical host unchanged. Use the normal importer and compiler.

Create checkout-local, untracked `.openai/hosted-preview.json` with `siteId`, `accountId`,
`workerName`, and `previewHost`. Verify the account's registered subdomain and
that this dedicated Worker name is unused before first deployment. Build with
`CONTENT_HOSTED_PREVIEW=1`; inspect `dist/server/wrangler.json` before deployment.
Use the installed Wrangler to deploy that compiled config. Do not deploy a
local-preview build or repurpose another site's Worker. Preview URLs and custom
routes are disabled. No domain/DNS cutover takes place.

Worker-first mode must explicitly forward `/_next/static/` to `ASSETS`; Vinext
reserves that namespace and otherwise returns404. The canonical Worker entry
uses `hostedPreviewAssetResponse` after the exact-host/method gate. For an
existing compiled build missing this boundary, run
`node scripts/prepare-hosted-preview-runtime.mjs` in the owned output checkout
and deploy the returned config. The deterministic adapter copies the exact
canonical guard, delegates all other requests to the original compiled Core,
and records input/output hashes. It preserves the original build/config and
does not alter content, admissions, bindings, routes or launch requirements.

Every request passes the Worker boundary, including static files. Only the exact
HTTPS host or consistent loopback authority is admitted. All responses carry
`noindex, nofollow, noarchive` and `private, no-store`; robots disallows crawling.
Non-GET/HEAD requests fail before body parsing, D1, telemetry or mail. There is no
live DB/mail/storage binding and no successful inquiry receipt. Forms remain
visually reviewable and use the existing failure message on submission.
This is a publicly reachable review address, not access-controlled hosting;
never include private or unapproved content. Check remote pages, media/aliases,
mobile/desktop interactions, read-only forms and isolation after deployment.

## Owner-authorized inquiry activation on the review host

`hosted-inquiries` is a separate scope with `testOnly:true`, `readOnly:false`,
an exact `previewHost` and `inquiry:{transport:"hostinger-api",sender,recipient}`.
The recipient must be the package contact. Retain all eight local checks and
add real `inquiry-authorization` and `mail-authentication` evidence. This does
not satisfy production ownership/DNS/INBOX/privacy admission or change the
canonical site/domain. Existing hosted-preview receipts stay read-only.

Build the native application with this receipt, a dedicated D1 database,
mailbox resource and a unique rate-limit namespace in the checkout-local
hosting config. The build enables only the existing site-bound Hostinger API
transport. Put its mailbox-scoped key into a Worker secret using protected
file/stdin; never put credentials into vars, generated JS or repository files.
Generate binding types from the actual deployment config. Entry-only adaptation
of a read-only build cannot activate inquiries; a full native build is required.

Only same-origin POST `/uzklausa` can reach the shared native lead handler.
Other writes remain blocked. Missing bindings/secrets or a mismatched sender /
site fail before body consumption. The platform rate limit permits10 per60s
per site/IP, before native validation/storage/mail; unavailable limiting fails
closed. Native consent, honeypot, bounded fields, durable claim, replay/conflict
and no automatic retry after uncertain acceptance remain unchanged. Keep
noindex/no-store and verify the real browser form, exact D1 row, provider
acceptance and recipient receipt separately.

Hostinger Mail API v1 does not expose custom Reply-To/Message-ID. Preserve the
validated customer email in the existing notification body and disclose the
provider limitation; do not claim a reply header or INBOX delivery from204.
