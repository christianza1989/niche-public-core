# PhoneBridger production adapter

Dedicated Worker and EU-jurisdiction D1 for the owner-authorized PhoneBridger launch. The shared core publication predicate, schema, robots, sitemap, LLM formats, account module and mail transports remain the source of behavior. This is the custom design adapter for one niche, not a replacement for the existing multi-domain renderer. Other sites and the native input engine are untouched.

## Reproduce a release

Use the sibling companion checkout containing `sites/phonebridger/prototype`, its byte manifest, production transform and reviewed production package. Supply the existing application checkout containing the approved installers:

```powershell
node deploy/phonebridger/build.mjs ../nisiniai_puslapiai_monetizavimui <approved-application-checkout>
node node_modules/wrangler/bin/wrangler.js deploy --config deploy/phonebridger/wrangler.jsonc --dry-run
```

The build checks every prototype file hash before transforming it. It rejects changed contact/privacy copy without a matching Studio-reviewed edition. Deployment does not create editorial approval. The accepted homepage receives only publication metadata, a null guard, first-party measurement and restored download destinations; its appearance and demo engine stay as approved. Inner pages receive production service copy. The four account routes remain noindex and outside public discovery outputs.

Installer hashes must match `release/v1.1-auto-usb-1/package-verification.json`. Static Assets has a 25 MiB individual-file limit; the unchanged ZIP is delivered as a streamed concatenation of 20 MiB delivery parts. Those internal part URLs return 404 publicly. HTTP ranges work across part boundaries. This is delivery splitting, not repackaging. No R2 or paid plan was activated.

Generated files and all credentials live only in ignored `.sites-runtime/` or `.dev.vars`. The committed manifest includes 14 exact eligible public routes, four private account routes and an explicit asset allowlist. Static Assets is never served ahead of the Worker guards. A fresh deployment binds asset files and release metadata together.

## Services and verification

Apply `schema.sql` only to the configured dedicated D1. `put-secrets.mjs` sends three locally supplied secret files through stdin, never command arguments. `AUTH_RATE_SECRET` keys temporary rate records; `HOSTINGER_MAIL_API_KEY` and `HOSTINGER_MAILBOX_ID` authorize only the owner-created hello mailbox. Mail API is the owner-approved optional Hostinger provider adapter; the maintained SMTP adapter remains available for other projects. Mail API does not expose Reply-To in its documented request schema, so the enquiry includes the visitor's reply address in its body. Do not claim delivery on API acceptance alone: match the exact self-test ID in the owner's inbox.

Enquiries are stored before delivery, with a generic user-facing failure if notification is unavailable. Do not automatically retry ambiguous provider timeouts: inspect the exact enquiry ID before manual recovery. Never inspect unrelated inbox messages. Accounts use salted scrypt hashes and revocable hashed eight-hour session tokens. Email verification, automated recovery, paid licences, checkout and creator features are not enabled. Do not reduce password hashing strength to fit a hosting plan.

```powershell
node deploy/phonebridger/verify.mjs http://127.0.0.1:4191
node deploy/phonebridger/verify.mjs https://phonebridger.com
npm run test:core
npm run test:seo-smoke
```

Verification creates and removes only its own test account, checks CSRF and invalid passwords, tests every exact public revision, private-path rejection, sitemap/robots consistency, full installer hashes and a cross-part HTTP range. The public test must pass on the actual edge: local success does not prove CPU limits, TLS, DNS or mail delivery. Reports are private under `output/phonebridger-production/`; only sanitized acceptance results belong in Git.

## Current provider constraints

Cloudflare requires account-email verification before activating Worker routes; error 10034 must be resolved by the owner, not bypassed. Preserve all existing Hostinger MX, SPF, DKIM, DMARC and discovery records before changing nameservers. Bind apex and www as Worker custom domains only after the reviewed deployment is usable; www redirects to apex. Do not activate R2 or upgrade Workers without the owner's spending authorization. Free Workers has a 10 ms CPU limit; production account performance still requires an actual edge test.

Sources checked 6 October 2026: [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [account verification](https://developers.cloudflare.com/fundamentals/user-profiles/verify-email-address/), [Hostinger Mail OpenAPI](https://github.com/hostinger/mail-api/blob/main/openapi.json), [EU privacy obligations](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/obligations_en).
