# Staged content packages

`content-staging/<siteId>` contains reviewed candidates imported through the shared
`scripts/import-content-package.mjs --shadow` path. These files are versioned for
handoff, but are not read by the public compiled registry, served as public assets,
or admitted to a live host. Do not put private studio drafts, originals, review
notes, customer records or credentials here.

The Dovanos123 candidate contains 11 approved page revisions and 15 responsive
WebP files. Its exact bytes are bound by `dovanos123/handoff.json` and tested by
`tests/dovanos123-staging.test.mjs`. This transfer manifest is not an activation
receipt and cannot substitute for `content-v2-admission.mjs` production evidence.

Next steps and preserved limits: [Dovanos123 GitHub handoff](../docs/DOVANOS123-GITHUB-HANDOFF-2026-10-06.md).
