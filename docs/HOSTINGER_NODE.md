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

### Single-site resource isolation and browser caching

The kvapunaikinimas export writes a target-only page entry that calls the same
`nichePageContext` publication/host gate and imports its original renderer only.
Conditional server imports in the network page are not sufficient CSS isolation
in Next: unrelated site CSS/client references can enter the initial graph.
Qualify the exported production graph, including nested CSS imports; source unit
tests alone cannot prove that the delivered page avoids other sites' resources.
Other export targets retain their existing entry until individually qualified.

Node-only headers give UUID WebP media and content-versioned font URLs a one-year
browser lifetime. Keep unversioned fonts, page HTML and form responses outside
that rule; verify real response headers independently of CDN HIT status. Font
versions must match actual bytes in both font-face and preload references.
For 500px square carousel originals, Node serves bounded 300/500px Next image
variants with negotiated AVIF/WebP. Original approved media remains unchanged;
high-DPI screens retain the 500px candidate. Verify both formats, dimensions,
cache behavior and visual fidelity on the hosted stage before production.
Next16's internal image fetch drops Host headers. On this tenant-aware target,
the optimizer therefore fetches only the narrowly allowlisted canonical HTTPS
media path; publication/host guards remain enforced instead of allowing anonymous
internal static requests. Keep remote patterns exact and private-IP access off.
Advertise the optimized candidates through an AVIF picture source. Keep the
approved original WebP family as the img fallback: recompressing its 500px WebP
at quality85 can make it larger, so fallback browsers must retain original bytes.
The picture uses display:contents to preserve the existing slide/image geometry.
Verify the production vhost too: this legacy CloudLinux target serves public
images/fonts outside the custom Node handler. Neither Next public-file headers,
CDN purge nor a document-root header block reached those responses, unlike stage.
The explicit target therefore copies unchanged eligible media and content-hashed
fonts into .next/static/niche-assets after the build. The exporter alone rewrites
font CSS URLs; default Workers CSS and original public URLs stay intact. Modern
img srcsets, background URLs and preloads select the managed delivery paths.
Every copied file retains its SHA; no resizing/recompression occurs in this step.
Fail the build if the selected release contains future/revoked/paused pages:
never bypass publication gates by copying private future assets into static.
Requalify exact response headers and byte hashes on the actual target, not only
stage. Preserve all provider/IP rules; do not replace .htaccess or cache HTML/forms.

Back up the existing website's files and database before replacing it. Qualify
the isolated hosted stage (all routes/assets, SEO, real mobile/desktop UI,
bounded form/origin/consent behavior and persisted records) first. Preserve mail
DNS and original DB. After cutover verify actual HTTPS content, canonical www
redirects, robots/sitemap/LLM output, native images/fonts, old WP endpoint removal,
and source/runtime logs. A new real email test needs explicit send authorization;
SMTP auth or acceptance alone is not an inbox receipt. Do not use the earlier
multi-form mail-disabled verifier on a mail-enabled production site.

When Hostinger initially installs production dependencies only, the opt-in build
installs the locked build dependencies before compilation and prunes them again
before publishing. Both installation and pruning refuse shared symlinked modules.
The Node entry redirects the accepted www host to its canonical HTTPS host.
After a WordPress conversion, check every URL for old LiteSpeed/Nitro responses:
an accepted CDN purge does not prove the origin page cache is gone. Retained
NitroPack `CacheLookup on` rules can replay old pages even when the hosting
cache setting is already off. Back up the current .htaccess, remove the obsolete
WordPress cache/PHP rewrites, preserve provider Passenger and security/IP rules,
and disable that legacy lookup. Retain CDN/browser asset caching and verify all
native pages, robots and sitemaps without cache-busting. Do not copy one site's
Passenger paths or IP rules to another domain.
