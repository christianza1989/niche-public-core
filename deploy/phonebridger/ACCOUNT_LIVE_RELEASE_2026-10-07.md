# Customer and creator canonical release — 7 October 2026

## Authority and edition

The human explicitly requested: "mums reikia ikelti kad viskas jau butu live, as testuosiu viska kaip creator kelk viska i online" and supplied the exact existing account for creator access. This supersedes the earlier sandbox-only publication boundary. Publish customer/creator functionality to the existing `phonebridger.com` Worker and dedicated production D1; grant only that account creator capability, leaving its password/session and actual terms acknowledgement unchanged. The private operational file records its identity; no personal email, cookie or credential is committed here.

The enabled commercial edition `phonebridger-creators-v1-20261007` retains the already prepared 25% commission / 5% entered-code discount / 30-day attribution proposal, now with an explicit live flag. Old sandbox terms remain immutable and separate. Only an approved creator who accepts the current live edition qualifies a code/link. Frozen first new-customer purchase, no-self, refund/chargeback, hold and USD25 monthly payout eligibility rules remain. No real automatic payout/provider onboarding is implemented or enabled; live operator test settlement/reservation calls remain rejected. No underlying payment credentials or identity documents are requested by this release.

## Scope and preparation

Paired core PR7/companion PR28, source design in PhoneBridger `design/website/account-workspace`. Changes are confined to the dedicated affiliate module/terms/config/tests and the account workspace's environment-aware English labels. Preserve the shared core's unrelated niches, frozen homepage/prototype, existing live purchase/legal edition, already published binaries, customer accounts/orders and all native mouse/pairing/configuration files. No DNS, mail binding, paid plan or provider-wide merchant changes.

Previous canonical Worker: `eff640d2-76e6-4292-8ba0-75da4f4c5b8b`. Account identity matched the intended Cloudflare account. Deployed binding inspection confirmed the production D1 ID `03b08a79-d7d5-4b91-a3ca-1cb9e06f59af`, existing assets/rate/operator/Stripe/mail secrets and fetch/scheduled handlers. Existing plain vars/domains/cron remain; only `AFFILIATE_LIVE=1` is added.

Before migration, the existing schema was exported into ignored private runtime storage. Migration is additive `account-schema.sql`; no previous account/commerce table is replaced. Owner capability is a direct authorized grant with audit record, not a fabricated application or preaccepted contract. Old code rollback preserves all new data; it removes the new panels/program until a corrected deployment. Do not restore a database snapshot over intervening customer writes.

Preparation passed: 100 core tests including separate signed test/live Checkout+canonical refund and forbidden live test-payout calls; dedicated attested build with 14 approved public editions/301 allowlisted assets; original installer byte sizes/hashes; production dry run. Hosted completed payments/refunds are not established by fixture tests. No real charge, refund or payout is authorized merely to run automated acceptance.

## Deployment acceptance

Canonical Worker `fef51fad-ab14-4718-a3bd-03e24ca9844b` was deployed on 7 October 2026 from core `efaa25f` / companion `78f2dae`. The account schema migration completed before upload. The exact owner account has approved creator capability and one initial link; its live terms were not preaccepted and its login was not changed.

Actual ordinary `https://phonebridger.com` verification passed: all 14 exact public revisions, HTTP/www canonical redirects, private namespace rejection, real registration/session/wrong-password/CSRF/revocation, live shop catalog, both original complete installer hashes and a cross-part download range. Public content/legal purchase editions and existing routing/mail/D1 bindings remain unchanged.

Actual disposable live QA passed registration, application, separate approval, UI acceptance of live terms, own link/code and 17 account/creator routes at 1440/390/320 (51 combinations). No body overflow, undecoded images or uncaught browser errors; live mode labels replaced sandbox labels. Guest workspace API returned 401; another account's creator API returned 403. Images were awaited through actual decode, rather than assuming page API completion meant all image requests had finished.

The shop API created one actual live technical Checkout at USD27.55 from USD29 with the accepted QA creator code. Stripe's canonical Session had `livemode=true`, expected order identity and currency. It was never paid, then was expired through Stripe; the real signed expiry reached the application. The owned order became expired with no entitlement or commission, and another account's order read returned 404. No real funds were charged or refunded. Completed paid/refunded live outcomes remain for the owner's manual testing, rather than being relabelled from fixture tests.

Only disposable own QA links were archived, QA creator capability suspended and the two QA accounts deleted through the existing authenticated API after acceptance. The expired technical order/immutable attribution/audit remain; no real account/order or the human's creator grant was removed. Sanitized reports and screenshots are ignored under `output/phonebridger-account-live`; source-design review has safe copies without personal customer information.

Wrangler `d1 execute --file` uses bulk import and can return execution metadata instead of SELECT rows. Identity/readback checks used the exact single SELECT through `--command`. An initial metadata-only account lookup was corrected before the capability grant; failed grant validation made no data write. The Stripe SDK expiry signature also requires empty params before the request-options/idempotency argument; its rejected first call was reconciled against the exact persisted open unpaid Session before the corrected expiry. No extra Checkout was created.

Known separate limitations: automated provider payouts/onboarding, native paid activation, email verification/recovery and support email notifications remain unavailable. The UI says so explicitly. The creator can test the live panel and acceptance/link/code/content/performance flows; genuine commissions appear only after actual verified eligible customer payments.
