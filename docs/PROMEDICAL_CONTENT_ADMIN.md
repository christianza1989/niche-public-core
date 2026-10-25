# Hosted content administration

Owner-requested extension; default guide list and separate Other texts tab.
The existing public homepage has no login link. `/admin` is a private noindex
application shell; `/admin/api/*` requires a server-authenticated session before
returning text, private media or settings. Other tenants return404.

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

Saving preserves a private draft. The authenticated human reads the final text,
checks six review areas and explicitly approves the saved revision. Media and
canonical package validation still apply. Guide publication remains paused at
the pre-existing cutoff until the owner deliberately resumes. Resume displays
how many versions become due immediately and requires an exact typed phrase;
concurrent approvals invalidate its policy version.

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
