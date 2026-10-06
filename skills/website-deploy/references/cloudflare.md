# Cloudflare release mechanics

Read for an authorized Cloudflare target. These lessons come from the first core launch on 2026-10-06; verify changing provider behavior against official docs and installed tooling before execution. No account IDs, credentials or universal plan choice belong here.

## Choose the existing deployment path

Inspect scripts, framework adapter, lockfile and generated deployment configuration. Use the supported build/deploy flow; some adapters generate the operative Wrangler config under the build directory. Do not create a competing root config or swap adapters during a routine release. Available `cloudflare`, `wrangler`, `workers-best-practices` and framework-specific skills can supply mechanics; their absence is not a reason to install unrelated products.

Cloudflare distinguishes custom domains from routes to an existing origin. Inspect incumbent hosting and use the intended model. Read [custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/) before attachment; verify zone readiness and conflicting records. Registrar access does not prove access to the destination Cloudflare account.

## Preflight, then mutate once

Read [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/) for the adapter/environment. Compare live and tracked domains, bindings and scheduled jobs. Pin the installed CLI; avoid a silent latest-version upgrade. Choose compatibility date/flags against the tested runtime rather than automatically using today's date.

For a project that owns a standalone Wrangler config, these illustrate command shape. Replace the path and append the intended named environment where configured:

```text
node node_modules/wrangler/bin/wrangler.js --version
node node_modules/wrangler/bin/wrangler.js deploy --config <project-config> --dry-run
node node_modules/wrangler/bin/wrangler.js deploy --config <project-config>
```

The last command mutates the authorized target; it is not documentation validation. Dry-run checks packaging, not account verification, DNS, deployed CPU behavior or delivery. Inspect adapter commands/help rather than copying these into a Sites-managed or generated-config project.

Confirm production binding IDs and migration state. Avoid development DBs or replaying applied SQL. Store secrets through supported provider mechanisms, preferably stdin from ignored storage; verify presence without printing values. Query uncertain upload/secret/migration outcomes before retrying. Do not overlap installers or deployments.

## Runtime and delivery constraints

Check the real plan and current [Workers limits](https://developers.cloudflare.com/workers/platform/limits/). Measure relevant operations on the actual edge, especially password hashing, streaming and memory use. Local Node/Miniflare success is insufficient. Do not weaken hashing to fit a budget or silently activate a paid plan.

If an approved download exceeds individual-asset limits, inspect existing delivery first. Bounded streaming or approved object storage may fit; neither is universal. Preserve exact binary hashes and range semantics. For transport chunks, test cross-boundary ranges and reject direct internal chunk URLs. Do not recompile/repackage a frozen native release to solve a hosting limit. Record separate storage costs and authority before activation.

Asset precedence matters: public/private guards must execute before assets on guarded paths. Inspect actual adapter routing and test negative paths against deployed files; a guard in source does not prove it runs first. Preserve cache isolation for authenticated/API responses and appropriate caching for versioned public media.

## Activation and recovery

Record deployment/version ID, target and effective config after upload. Verify the actual domain after binding/cutover; an uploaded Worker can lack active routes. Account verification error 10034 occurred in the first launch. Use [account verification guidance](https://developers.cloudflare.com/fundamentals/user-profiles/verify-email-address/) and the owner's action instead of bypassing it or changing account identity. Recheck activation before another upload.

Record prior application version, DNS baseline, bindings and migration compatibility. Consult [rollback documentation](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/) before execution: code rollback is not database restoration or reversal of every external setting. Use the DNS reference for delegation and release-evidence reference for acceptance.
