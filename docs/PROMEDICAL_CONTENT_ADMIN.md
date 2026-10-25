# Hosted content administration

Owner-requested extension; default guide list and separate Other texts tab.
The existing public homepage has no login link. `/admin` is a private noindex
application shell; owner `/admin/api/*` routes require a server-authenticated session before
returning text, private media or settings. Other tenants return404.
The guide list includes lazy thumbnails. Reading preview shows its cover and
all assigned image families, with responsive sizes deduplicated. Publication
date/time, Save date and Publish are directly available above the reading view;
publication still requires the exact saved revision's human review and obeys
the existing pause. These controls do not resume the whole guide queue.

## Sources and persistence

The canonical compiled registry is unchanged. `db/content-admin.sql` adds only
editorial tables to the existing DB binding. The enabled site's async loader
selects approved, due revisions from D1 and feeds the existing common public
projection. Draft save, approval and global guide pause are separate operations.
An already-live hosted version remains live while its replacement is scheduled.
URL, media, contacts, private context and links cannot be replaced by edit input.

`vendor/content-studio/authoring.mjs` is generated from the companion's pure
Studio domain. Its `source.json` lists exact input/artifact hashes. Regenerate
using the companion `content-studio/scripts/export-hosted-authoring.mjs` with
`STUDIO_PUBLIC_CORE_DIR` pointing here. Do not hand-maintain a second approve
kernel. The V2 schema import is portable static JSON; no filesystem reader enters
the hosted runtime.

## Setup and operation

`CONTENT_ADMIN_ENABLED=1` opts in only Promedical. Create the additive schema,
one pending account and a short-lived32-byte enrollment token hash through an
authorized private deployment operation. The owner privately opens the setup
link and chooses their own15–128 character password. No secret or usable token
belongs in Git, logs, public HTML or a support message. The fragment is removed
before the app requests enrollment metadata; the token is one-use.

The production cookie is Secure/HttpOnly/SameSite=Strict,8h maximum and30min idle.
Writes require exact Origin and session-bound CSRF. Login has persisted IP/account
limits and scrypt N16384/r8/p5 with independent random salts. No password/email
transport dependency or open self-registration. `CONTENT_ADMIN_DEV_ORIGIN`
exists only for isolated loopback QA; never set it in production.
POST payloads are bounded and consumed before an Origin/auth rejection. This
preserves the next HTTP keep-alive request in the local Workers proxy; regression
coverage includes rejected CSRF/Origin followed by successful logout in workerd.

Saving preserves a private draft. The authenticated human reads the final text,
checks six review areas and explicitly approves the saved revision. Media and
canonical package validation still apply. Guide publication remains paused at
the pre-existing cutoff until the owner deliberately resumes. Resume displays
how many versions become due immediately and requires an exact typed phrase;
concurrent approvals invalidate its policy version.
Repeating a pause preserves its original cutoff; it cannot act as an unconfirmed
resume. If a session expires during editing, the unsaved fields remain in memory;
the owner signs in in a separate tab, then retries save with a refreshed CSRF
token. The editor does not persist private text in browser local storage.

Before an independent compiled content deployment, export/back up editorial
tables and compare base revisions. A conflicting compiled base is authoritative
for public rendering and is shown as a conflict in the editor; the preserved
draft remains readable and must be manually reconciled, not silently overwritten.
For rollback, first export changed drafts/approved history, return to the prior
Worker version and retain the additive tables. Worker rollback does not restore
D1 data. Reissue setup only through a separately authorized private operator
action; there is no unauthenticated reset endpoint.

Tests: server auth/expiry/CSRF/origin/rate limits, one-use setup, real SQLite
persistence/CAS/audit, canonical approval, future/history/pause projection, and
full HTTP login/read/save/reload/logout. Actual workerd+D1 and framework/host
acceptance are separate runtime evidence; a Node unit PASS is not deployment.

## Draft-only automation (separate capability)

`GET /admin/api/drafts/{id}` reads the draft text, date, CAS etag and conflict
state. `POST` to that exact path accepts only `{etag, changes}`; changes may
contain only `title`, `description` and `body`. Existing canonical `saveDraft`
validation, revision hashing, history and atomic CAS are reused. The actor is
`automation:codex-drafts`, never the human owner. Only guides and categories
are eligible; products, home and other page types return 404. Approved/live
revisions, review evidence, dates, URLs, links, media and publication policy
cannot be changed through this capability. H2/H3 structure is retained.

The endpoint is disabled unless the Worker has `CONTENT_ADMIN_DRAFT_TOKEN`
as a secret containing 32 cryptographically random bytes encoded as base64url
(43 characters). Provision through the authorized secret-management operation;
never put its value in Git, Drive, a message, a command argument or a log.
Use the same secret from the client's secret manager through its environment.
Replace the secret to rotate access; remove it to revoke access. No database
migration or owner password is needed. Provisioning/deployment is a separate
operator action; a source PR does not enable the endpoint.

Send `Authorization: Bearer …` only to the configured canonical HTTPS host.
No query string, cookie, Origin or browser Fetch Metadata is accepted. Browser
owner routes reject Authorization headers even alongside a valid cookie; the
machine key cannot invoke save/publish/restore/policy/enrollment/login there.
Requests remain bounded to 512 KiB and responses are private/no-store/noindex.
Token hashes are compared at fixed length with constant-time comparison.

After deployment and authorized secret provisioning:

1. `node scripts/content-admin-draft.mjs read PAGE_ID` retrieves the current text
   and etag. Inspect any existing draft before changing it.
2. Prepare a private JSON file containing `id`, that exact `etag` and the
   intended `changes`. Do not submit a historical full page object.
3. `node scripts/content-admin-draft.mjs save INPUT.json` saves only the draft.
   The client has a fixed Promedical HTTPS destination, rejects redirects and
   does not retry errors. On 409, read and reconcile the fresh revision; never
   refresh an etag blindly. Compiled-base conflicts still require the existing
   editorial backup and reconciliation procedure.
4. Read again and compare the saved fields. The owner reviews and publishes
   the exact final revision in `/admin`; dates do not grant publishing rights.

The editor can add empty paragraph/H2/H3/list blocks without throwing, and an
unchanged date is omitted from draft saves so timestamp precision survives.
Browser regression: `tests/browser/content-admin-editor.mjs` accepts an isolated
Playwright Page, current admin JS/CSS strings and a screenshot directory. It
fulfills fixture requests locally and exercises add/save/reload/mobile layout.

References: [Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
and [constant-time Web Crypto comparisons](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/).
