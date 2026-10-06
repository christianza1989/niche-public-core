# Release evidence and recovery record

Use existing launch records and verifiers. These decision fields and acceptance cases are not a compulsory new schema or fixed test quota. The site's maintained contract sets gates; a documented limitation does not waive one. If a required gate remains unverified, report partial activation/readiness rather than full completion.

## Identify the edition

Record site/canonical origin; source commit and dirty scope; eligible content/package revision and artifact identity; account/project/environment; effective config and tool/runtime versions; data bindings; deployed version/time; authorization; prior version and scoped rollback. Record pending merge separately when a branch was deployed. Credentials and production datasets are private operational state.

For each applicable check record **implemented / locally verified / hosted verified / pending / blocked / deferred**, with time, exact host/edition and evidence. Not-applicable means outside the actual contract; missing required credentials are dependencies. Preserve historical defects and original evidence.

## Observable acceptance cases

| Area | Evidence on the intended release |
| --- | --- |
| DNS/TLS | Correct delegation/records, valid hostname certificate, ordinary browser access; label alternate-resolver diagnosis. |
| Canonical routing | Intended apex/www/HTTP policy, path/query preservation, no loops, correct missing-page status. |
| Published content | Required public routes return exact eligible editions; draft/future/revoked routes and media stay excluded. |
| Search/machine outputs | Canonical/schema/sitemap/links agree with eligible HTML; intended robots/noindex; optional LLM output shares projection. This does not prove indexing. |
| Private boundaries | Account/admin/provenance/internal files protected as appropriate; no fallback/asset exposure or authenticated shared-cache leaks. |
| Rendered UI | Hosted desktop/mobile, valid images, no unexpected overflow/console failures, primary journey and keyboard/touch controls work. Preserve real performance/accessibility evidence. |
| Enquiries, if required | Validation/failure behavior, durable record, authorized send attempt, provider acceptance and exact inbox receipt separately. |
| Accounts, if required | Disposable registration/login, wrong password, cookie/session/CSRF protection and logout/revocation at actual edge limits; disclose unavailable recovery/verification. |
| Downloads, if present | MIME/disposition, full approved byte hash, ranges/boundaries if supported; internal delivery objects not publicly exposed. |
| Data/operations | Correct production bindings, applied migrations, required retention/jobs and recovery; existing data/unrelated domains preserved. |
| Measurement, if required | Per-domain setup, privacy/consent and actual permitted collection; local tests are not demand. |

Use read-only checks first. Writes are limited to authorized services and disposable own data. Do not enable payments, email customers, browse unrelated inboxes or run destructive migrations merely to complete this matrix.

## When something fails

Classify packaging, permissions/verification, effective config, routing, DNS/cache, TLS, runtime budget, migration, application or delivery failure before another write. Reconcile ambiguity using recorded version/attempt IDs. Repair a concrete cause and retest its path; blind repeated deploys are not diagnosis.

For reversal, compare the prior version with current state and newer owner changes. Separate code rollback from data restoration, secrets/bindings, cron and delegation. Preserve customer submissions and accounts unless explicitly authorized otherwise. If reversal loses data or undoes unrelated work, stop that mutation and present the concrete decision while continuing safe diagnosis.

## Handoff

Give canonical URL/edition, completed evidence, unresolved gates/limitations and a correctly labelled fallback preview when useful. Link sanitized operational records/PR. State pushed, merged, installed and deployed separately. A measured free-tier release is not a capacity/uptime guarantee; publishing is not proof of demand.
