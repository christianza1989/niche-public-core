# PhoneBridger production adapter

Dedicated Worker and EU-jurisdiction D1 for the owner-authorized PhoneBridger launch. The shared core publication predicate, schema, robots, sitemap, LLM formats, account module and mail transports remain the source of behavior. This is the custom design adapter for one niche, not a replacement for the existing multi-domain renderer. Other sites and the native input engine are untouched.

## Reproduce a release

Use the sibling companion checkout containing `sites/phonebridger/prototype`, its byte manifest, production transform and reviewed production package. Supply the existing application checkout containing the approved installers:

```powershell
node deploy/phonebridger/build.mjs ../nisiniai_puslapiai_monetizavimui <approved-application-checkout>
node node_modules/wrangler/bin/wrangler.js deploy --config deploy/phonebridger/wrangler.jsonc --dry-run
```

The build checks every prototype file hash before transforming it. It rejects changed contact/privacy copy without a matching Studio-reviewed edition. Deployment does not create editorial approval. The accepted homepage receives only publication metadata, a null guard, first-party measurement and restored download destinations; its main content and demo engine stay as approved. The owner separately authorized a shared header/footer on 6 October; all 19 routes now use the companion production shell and four scoped assets. Inner pages receive production service copy. The four account routes remain noindex and outside public discovery outputs.

Installer hashes must match `release/v1.1-auto-usb-1/package-verification.json`. Static Assets has a 25 MiB individual-file limit; the unchanged ZIP is delivered as a streamed concatenation of 20 MiB delivery parts. Those internal part URLs return 404 publicly. HTTP ranges work across part boundaries. This is delivery splitting, not repackaging. No R2 or paid plan was activated.

Generated files and all credentials live only in ignored `.sites-runtime/` or `.dev.vars`. The committed manifest includes 14 exact eligible public routes, five private routes and an explicit asset allowlist. Static Assets is never served ahead of the Worker guards. A fresh deployment binds asset files and release metadata together.

## Services and verification

Apply `schema.sql` only to the configured dedicated D1. `put-secrets.mjs` sends three locally supplied secret files through stdin, never command arguments. `AUTH_RATE_SECRET` keys temporary rate records; `HOSTINGER_MAIL_API_KEY` and `HOSTINGER_MAILBOX_ID` authorize only the owner-created hello mailbox. Mail API is the owner-approved optional Hostinger provider adapter; the maintained SMTP adapter remains available for other projects. Mail API does not expose Reply-To in its documented request schema, so the enquiry includes the visitor's reply address in its body. Do not claim delivery on API acceptance alone: match the exact self-test ID in the owner's inbox.

Enquiries are stored before delivery, with a generic user-facing failure if notification is unavailable. Do not automatically retry ambiguous provider timeouts: inspect the exact enquiry ID before manual recovery. Never inspect unrelated inbox messages. Accounts use salted scrypt hashes and revocable hashed eight-hour session tokens. Email verification, automated recovery and creator features are not enabled. Live hosted Checkout and storefront purchase records are described below; native paid unlocking is not implemented. Do not reduce password hashing strength to fit a hosting plan.

```powershell
node deploy/phonebridger/verify.mjs http://127.0.0.1:4191
node deploy/phonebridger/verify.mjs https://phonebridger.com
npm run test:core
npm run test:seo-smoke
```

Verification creates and removes only its own test account, checks CSRF and invalid passwords, tests every exact public revision, private-path rejection, sitemap/robots consistency, full installer hashes and a cross-part HTTP range. The public test must pass on the actual edge: local success does not prove CPU limits, TLS, DNS or mail delivery. Reports are private under `output/phonebridger-production/`; only sanitized acceptance results belong in Git.

For an explicitly authorized owner-mailbox delivery test, run `node deploy/phonebridger/mail-self-test.mjs https://phonebridger.com send` once. It creates a private attempt ledger before posting. If delayed, use `check` instead of `send`; it searches only the recorded subject ID and marker. It never browses unrelated mail. After confirmed receipt, remove only its recorded disposable D1 enquiry if cleanup is needed. DNS diagnosis may use an isolated public resolver with unchanged hostname/TLS validation; document that separately from ordinary browser/system resolution. Never change system DNS or disable certificate checks to make an acceptance test pass.

## Shop release

The owner-selected seller is MB Memocasting. The separately maintained `sites/phonebridger/shop-v2/` kit adds the product gallery, four setup choices, black/silver selection, compatibility, FAQs and a genuine-review empty state. The exact shop/terms bodies also require the Studio-reviewed edition. The current build emits 19 routes (14 public, five private) and 299 allowlisted assets. The homepage and original installers remain unchanged.

The additive `commerce-schema.sql` is for this dedicated D1 only. `lib/stripe-commerce.mjs` supplies server-authoritative hosted Checkout, durable stock reservations, signed webhook payment confirmation, owner-only order retrieval and paid/fulfilled/moderated reviews. These services now have 23 focused local tests plus actual hosted Stripe sandbox purchase/refund/expiry acceptance. Account history, private payment summaries and licence records, automatic digital fulfilment and protected operator dispatch/reconciliation are implemented. See PLAYGROUND.md for exact evidence and limits. See [COMMERCE.md](COMMERCE.md) for the complete activation and reconciliation contract.

Live Checkout is active on the canonical domain with a verified restricted key and six-event signing endpoint. Reviewed USD29/49/65/79 offers, one-time V1 purchase records, free shipping and manual supplier procurement are configured without fictional warehouse stock or transit promises. Two unpaid live Sessions were verified and expired through real signed events; no real funds were charged. Payouts remain paused for owner verification. Native paid unlocking, automated recovery and creator features are not implemented. Preview hosts cannot accept live payments. See the latest COMMERCE.md/LAUNCH_STATUS.md for exact evidence and operational limits.

## Current provider constraints

Cloudflare requires account-email verification before activating Worker routes; error 10034 must be resolved by the owner, not bypassed. Preserve all existing Hostinger MX, SPF, DKIM, DMARC and discovery records before changing nameservers. Bind apex and www as Worker custom domains only after the reviewed deployment is usable; HTTP and www redirect to canonical HTTPS. Do not activate R2 or upgrade Workers without the owner's spending authorization. Free Workers has a 10 ms CPU limit; account performance must be checked on the actual edge. Current launch results, including DNS-propagation limitations, are recorded separately in `LAUNCH_STATUS.md`.

Sources checked 6 October 2026: [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [account verification](https://developers.cloudflare.com/fundamentals/user-profiles/verify-email-address/), [Hostinger Mail OpenAPI](https://github.com/hostinger/mail-api/blob/main/openapi.json), [EU privacy obligations](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/obligations_en).
