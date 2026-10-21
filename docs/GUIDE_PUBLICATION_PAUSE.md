# Preserve an existing guide publication pause

`projectPublicPages` supports the optional `guidePublicationPausedAtBySite` setting: a site ID maps to an exact ISO UTC cutoff. Guide eligibility uses the earlier of request time and cutoff; other page types retain the common request clock. Approval and integrity gates still apply. Internal and owned-domain citation links use the same eligibility decision, so held guides do not leak through alternate outputs.

An invalid timestamp, unknown site or malformed mapping fails closed. With no mapping the previous behavior is unchanged. This preserves existing deployments during a narrow content replacement; it does not authorize changing publication dates or activating a schedule.

Regression: `node --test tests/guide-publication-pause.test.mjs`. Canonical reviewed replacement/export guidance stays in companion Core `CONTENT_CORE.md`; do not clone approval or export rules here.
