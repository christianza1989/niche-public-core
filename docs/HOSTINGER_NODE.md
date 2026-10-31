# Hostinger native Node target

This explicit target serves one approved V1 niche package on an existing
Business/Cloud Node slot. It uses the same React site renderer, publication/media
projection, SEO and lead route as the Workers target. It does not reimplement the
form or promise support for every Workers binding/SQLite query.

`HOSTINGER_NODE_RUNTIME=1` selects Node-only Workers-env, TLS socket and unavailable
native-email aliases. The MySQL adapter preserves bound statement/result shapes
for the canonical portable lead SQL. It does not translate SQLite. The default
Workers and read-only Vercel paths are unchanged. Server-only boundaries prevent
the environment module entering a client component.

Build with `npm run build:hostinger`. The production entry is
`scripts/start-hostinger.mjs`; Hostinger's generic `express` application setting
runs this Node entry even though the application uses Next's production API.
Use build script name `build`, not `npm run build`, in Hostinger API settings.
The exported package maps `build`/`start` to the explicit Hostinger scripts.
Root/output directory is `.` and Node version is24.

The server listens on all interfaces but gives Next the logical internal
hostname `localhost`. NextURL normalizes loopback IPs: binding that normalized
rewrite to a differently named internal origin otherwise self-proxies into a
protected internal route and produces404. For the Node target only, form origin
checks use HTTPS and the already-resolved public Host instead of that internal
loopback URL. Unknown hosts are rejected by the one-site Node entry; forwarded
host is considered only for an internal loopback Host and an explicit allowlist.

Set the complete non-database environment before calling Hostinger's automatic
database setup: it appends generated DB credentials without returning the
password. Never replace a later masked set or send `********` back as a value.
Required: `HOSTINGER_NODE_RUNTIME=1`, `HOSTINGER_CANONICAL_HOST`,
`NODE_ENV=production`, plus `LEAD_SMTP_USER`/`LEAD_SMTP_PASSWORD` and
`LEAD_SMTP_ENABLED=1` for connected mail. Keep voice off when not requested.
Database setup supplies local MySQL connection variables; the adapter requires
localhost/127.0.0.1/::1 and UTF-8. Startup creates only the dedicated lead table,
checks connectivity and authenticates SMTP without sending a message before
listening. SMTP DATA has no automatic retry or provider fallback.

`HOSTINGER_PRUNE_DEV=1` prunes development dependencies after the build. It refuses
a symlinked/shared dependency tree. Runtime loads the built Next configuration,
so TypeScript/Vite/Wrangler are not needed to evaluate the source config. Never
enable pruning against a local preview whose node_modules is a shared junction.

For an isolated free staging domain, set `HOSTINGER_STAGE_HOST` to that exact
hostingersite.com hostname and `HOSTINGER_CANONICAL_HOST` to the approved real
domain. The entry maps that host and only its exact same-origin form attribution
to the canonical site and returns a noindex header. Use a separate stage database,
`LEAD_SMTP_ENABLED=0`, and `HOSTINGER_SMTP_PREFLIGHT=1`: actual SMTP auth is tested,
but form test records cannot send mail. Do not set a stage alias on production.

Export only committed, reviewed source and a verified native Studio release:

```powershell
node scripts/export-hostinger.mjs --release D:/Core/output/<native-release-dir> --output D:/Core/output/<new-artifact-dir>
```

The exporter verifies package/asset hashes, rejects synthetic approvals/reserved
test domains, copies tracked source and this site's local fonts, excludes secret
and generated state, and imports only the selected native package. Pause/alias
records for unpackaged sites are projected out of deployment inputs only; fences
for an included site remain and canonical global policy is never edited.
Archive the directory contents at ZIP root, excluding node_modules/build output;
assert archive size≤50MB and record its SHA/source/release manifest. Upload via
Hostinger's authenticated TUS grant, verify201/204 and final offset, then build.

Back up the existing website's files and database before replacing it. Qualify
the isolated hosted stage (all routes/assets, SEO, real mobile/desktop UI,
bounded form/origin/consent behavior and persisted records) first. Preserve mail
DNS and original DB. After cutover verify actual HTTPS content, canonical www
redirects, robots/sitemap/LLM output, native images/fonts, old WP endpoint removal,
and source/runtime logs. A new real email test needs explicit send authorization;
SMTP auth or acceptance alone is not an inbox receipt. Do not use the earlier
multi-form mail-disabled verifier on a mail-enabled production site.
