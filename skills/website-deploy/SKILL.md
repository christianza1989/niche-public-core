---
name: website-deploy
description: Prepare, deploy and verify a website release on its intended hosting and domain, preserving existing DNS, mail and data. Use for first launches, production updates, hosting migrations or deployment runbooks; a local design/build request alone does not authorize publishing.
---

# Website Deploy

Deliver a reproducible release and an honest record of what works on the actual public host. Reuse the site's maintained build, publication and acceptance contracts; this skill does not replace its renderer or redesign accepted pages.

## Establish the release and its authority

Read repository instructions, active reservations, site contract, deployment configuration and previous launch record. Fetch/check Git state; reserve exact shared files through the project's coordination mechanism. Preserve other domains, native applications, frozen UI and customer data.

Identify site/domain, canonical origin, source commit, exact eligible content revisions, account/project, hosting plan, existing service owners and authorized live actions. Distinguish deploy, domain migration, mail integration and spending scope. Use authorization already given; do not repeat approvals merely because this is a first deployment. A runbook/skill request authorizes documentation, not a live rehearsal. Prepare concrete reviewable work before any still-required decision.

Use existing hosting when it satisfies the task. Match static versus server-rendered/API requirements and existing framework support. In a shared niche core, retain its host-aware renderer and common publication/SEO/media/service helpers. A dedicated adapter is a scoped decision, not a default separate project per niche. Do not add accounts, a database, email, checkout or paid storage to a static site without need and scope.

Read conditional references only when relevant:

- [Cloudflare release mechanics](references/cloudflare.md) for Workers, adapters, bindings, limits and activation failures. Use available provider skills/connectors and installed CLI help; consult current official docs when needed.
- [DNS and mail cutover](references/dns-mail.md) when changing DNS/delegation or testing delivery, including Hostinger credential distinctions.
- [Release evidence](references/release-evidence.md) before readiness assessment, cutover, rollback or handoff.

## Make the build and rollback concrete

Use the project's existing release-record format. Record public/private routes, artifact/revision identity, build command, target, required bindings, affected data/migrations, known defects and reversal plan. Keep secrets and private test identifiers outside Git and public assets. A repository clone transfers source, not credentials, database state or publication authority.

Build from approved source/content through maintained tools. The build must not manufacture editorial approval, alter publish dates or export private provenance. Use one eligible-content projection for HTML, links, media, schema, sitemap and selected machine-readable outputs. Preserve noindex previews and private routes; robots/noindex is not access control. Prevent asset precedence or SPA fallbacks from exposing private files or disguising missing pages as success.

Verify the compiled artifact with relevant existing checks and desktop/mobile browser review. Confirm assets decode, navigation/form/account states work as applicable, and downloads match approved release hashes. Preserve supplied binaries; packaging changes require their own authority. Inspect the real plan's runtime/resource limits before uploading, including expensive account operations and large-file delivery.

Record the previous deployed version and scoped DNS/config snapshot before replacement. Review migration ordering, backups/recovery and old/new code compatibility. Application rollback does not undo database writes, secrets, cron jobs or delegation; plan those separately. Never restore an old snapshot over intervening owner changes.

## Deploy without losing services

Confirm exact account, project, environment, region where applicable and database IDs before a write. Diff tracked configuration against live routing/bindings; reconcile intentional dashboard changes so the CLI does not silently overwrite them. Use pinned project tools/lockfiles. Supply credentials through provider secrets or private stdin/file channels, not echoed commands, URLs, Git or artifacts.

Prepare required schema/bindings/secrets with scoped, repeatable operations. Track migrations actually applied; local migration success does not imply production migration. Deploy the verified artifact to the intended target. A preview can test runtime but cannot replace canonical-host acceptance. Enforce the selected preview privacy model; noindex alone suffices only for previews intended to be publicly accessible.

For domain changes, prepare and verify the destination first, preserve unrelated DNS/mail services, then perform the authorized cutover using the DNS reference. Avoid nameserver migration when a website-record change is sufficient. Handle provider verification or interactive human gates explicitly; continue independent preparation while awaiting the required human action.

After a timeout or uncertain external write, query its result before retrying. Do not repeatedly deploy, resend notifications, replay migrations or change delegation to clear an unclassified failure. If target identity or outcome is uncertain, stop dependent writes, record the blocker and resolve it through read-only diagnosis or required user input.

## Verify the public result and close the release

Run relevant [acceptance cases](references/release-evidence.md) on the intended HTTPS domain and actual edge runtime. Use isolated disposable data only for authorized write tests. Prove durable storage, provider acceptance and inbox receipt separately when delivery is required. Remove only owned disposable records through supported cleanup; test messages or customer records are not blanket cleanup targets.

Separate local build, upload, active routing, ordinary DNS/TLS, hosted behavior and real delivery. A propagation issue may coexist with a functioning edge: label alternate-resolver evidence and leave ordinary-browser checks pending. Never disable TLS or alter system DNS/hosts settings to obtain a pass.

Fix observed defects within scope and rerun affected acceptance. Preserve historical/frozen defects and deferred capabilities; don't certify them as repaired or hide them under global PASS. Smoke tests do not establish capacity, uptime, indexing, AI visibility or real market demand.

Commit only owned source/runbook files after scoped staged-blob safety checks. Push/attach a PR when authorized; distinguish pushed, merged, installed and deployed versions. Update the operational record with release ID/time, canonical URL, checks, rollback and remaining dependencies. Credentials/data travel through private channels.

Feed demonstrated reusable gaps into maintained core skills/helpers under its improvement contract, with narrow coordination and validation. Keep site-specific incident evidence in its launch record. Do not universalize one provider's limits, mailbox, database or workaround.
