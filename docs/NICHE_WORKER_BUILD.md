# Isolated niche Worker builds

The default compiler validates and emits the complete approved registry.
`NICHE_BUILD_SITE_ID` selects one site only after all source packages, admissions,
catalogues, aliases and publication pauses have passed the existing validators.
It does not approve content or replace the canonical public-page projection.

Generated packages, admissions and `niche-network.json` are a matched set.
Runtime projection and SEO smoke read the generated settings. An isolated build
retains its own publication pause, omitting settings for absent packages. Source
policy is unchanged; unknown pauses still fail full-registry validation.

After the paired repository freshness gate, o3tech production in PowerShell:

```powershell
$env:NICHE_BUILD_SITE_ID='o3tech'
$env:O3TECH_DEPLOYMENT='production'
npm run build
```

Stop on compilation failure. This Vite profile rejects another deployment
profile, local preview overrides, or other sites in its compiled registry.
Deploy `dist/server/wrangler.json`, with the site's own database/secrets and
owned static assets. Static review exports are not production runtimes.

Clear both variables and compile again before the complete multi-site test
suite: existing regression fixtures require the full actual registry. This
does not redeploy the separate compiled Worker artifact.

Acceptance requires the actual compiled Worker: owned pages, SEO endpoints,
host/media isolation, form validation and durable storage. SMTP acceptance and
inbox receipt remain separate from local tests. Upload without active DNS and
routes is not actual-domain cutover.
