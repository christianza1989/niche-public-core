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

Deployment ID, applied migration, direct owner capability and actual canonical guest/auth/customer/creator/mobile/cross-account/discount checks are recorded after upload. The operator uses only isolated disposable QA records for write acceptance, never synthetic paid records or public reviews. Any live technical Checkout is left unpaid and expired through Stripe after checking the exact amount. The user's own account is not impersonated or logged into by the agent.

Known separate limitations: automated provider payouts/onboarding, native paid activation, email verification/recovery and support email notifications remain unavailable. The UI says so explicitly. The creator can test the live panel and acceptance/link/code/content/performance flows; genuine commissions appear only after actual verified eligible customer payments.
