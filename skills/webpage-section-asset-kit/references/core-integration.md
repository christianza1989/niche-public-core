# Shared-core integration

Applies to paired `niche-public-core` / `nisiniai-puslapiai-monetizavimui` repositories. Other projects retain their own media systems, facts and policies.

## Authority

Read core GITHUB_WORKSPACE and companion README, AGENTS, START_HERE, WORKSTREAMS, docs/MULTI_MACHINE, docs/INTEGRATING_A_PROJECT, SKILLS/PROJECT_CONTRACT and relevant site documents. This helper supplements builder/planner/audit/impeccable; it does not replace business evidence, design-diversity review or full site acceptance.

Shared workflow does not mean shared art direction. Document section purpose, chosen concept/selection actor, layers and review in `sites/<siteId>/DESIGN.md`. Respect the actual stage and owner scope. A shop-looking concept cannot activate commerce.

## Media/content

Read companion MEDIA_CORE and current importer/model. Use existing private provenance stores and importer, for example from that checkout:

```text
node content-studio/scripts/import-image.mjs <siteId> <source-file> --alt <actual-description> --rights <truthful-rights-statement> --prompt-file <exact-prompt-file>
```

Verify current options. Import is not approval or publication. Existing responsive/alpha policy, size limits, immutable IDs and page-family cap apply. Do not introduce a resize/Sharp optimizer per niche or rewrite approved families. Use current rendering helpers with true sizes/page-eligible families; native SVG and CSS remain namespaced UI resources.

Exact revision review/approval, export/import, publication projection, dates and domain eligibility remain independent gates. Agent review is not owner approval. Concept-only UI, prompts, local paths and factChecks stay private. No parallel SEO/contact/rendering engine.

## Git/distribution

Follow docs/MULTI_MACHINE: inspect state, distinct branch/checkout, register shared-file scope in GitHub coordination before edits, preserve sessions, stage exact reviewed paths and run existing repository-safety on staged blobs. Push/PR only under actual authorization; no force-push or inferred merge/deploy.

Core source distribution: `skills/webpage-section-asset-kit/`, linked by its core rule. It is not automatically installed on every machine and does not replace the companion SKILLS/catalog.json. Copy this folder into configured `$CODEX_HOME/skills/` (default `~/.codex/skills/`) to install personally. Synchronize from an explicitly chosen Git revision; local edits do not auto-publish. Do not add a duplicate companion catalog entry without its scoped process.

Do not modify shared runtime/schema/media processing, another site's design or native application for this helper. If implementation actually needs those changes follow their separate contracts. Documentation-only skill validation is not application/browser QA.
