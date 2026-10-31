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
