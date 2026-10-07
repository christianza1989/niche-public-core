# PhoneBridger account and creator workspace — 7 October 2026

Historical sandbox preparation below. The subsequent explicit human publication request and canonical release supersede its live-disabled status: see [ACCOUNT_LIVE_RELEASE_2026-10-07.md](ACCOUNT_LIVE_RELEASE_2026-10-07.md). Live referrals/accounting are enabled under a separate immutable edition; automatic provider payouts remain unavailable.

Implemented on `codex/phonebridger-account-creator-20261007`, depending on production integration PR 1. [Core PR 7](https://github.com/christianza1989/niche-public-core/pull/7) pairs with [companion PR 28](https://github.com/christianza1989/nisiniai-puslapiai-monetizavimui/pull/28). Neither has been merged. Only the isolated playground was deployed; canonical production was not redeployed by this session.

## Implemented behavior

The existing salted scrypt account and revocable Secure/HttpOnly session authorize owned orders, licences, verified downloads, profile, manual setup checklist, password/session management and support. Support saves bounded consented/redacted diagnostics and idempotent tickets; a separate operator can reply. Email notifications, email verification/recovery and native activation/installed device status are unavailable and described honestly. Installer metadata and hashes come from the already published release.

Creator capability needs an application, separate operator approval and acknowledgement of the current sandbox proposal. Approved creators get server-owned links/codes, UTC period metrics, masked referrals, currency-separated balances, append-only commission events, CSV, payout history, real downloadable media assets and submitted HTTPS content links. Buyer names/emails/full order IDs/addresses are not exposed. Link conversion excludes orders attributed to entered codes; aggregates do not truncate to the latest detailed records.

Checkout freezes the attribution, rate, basis and terms. Eligible entered code precedes last eligible link; direct visits retain attribution. Expired/self/existing-customer referrals do not qualify. Only verified canonical Stripe payment qualifies; duplicate/out-of-order events retry reconciliation. Cumulative partial refunds reverse proportionally once. Digital/physical holds, concurrent payout reservation, failure/retry and refund during reservation are tested. Provider transfer/onboarding is not implemented or represented as a real payout.

Private routes/APIs are explicitly admitted with `noindex, nofollow` and `private, no-store`. Public discovery, approved content and prototype attestation checks remain. Source design is PhoneBridger `design/website/account-workspace`; the build consumes companion `sites/phonebridger/account-workspace`. The small `shop-v2/shop.js` code field appears only when the server catalog exposes sandbox creator discounts. The homepage and native application are unchanged.

## Verification

- `npm run test:core`: 97/97 passed, including ownership, signed commerce and new workspace/affiliate tests.
- Dedicated build: 19 public routes, 14 approved content pages and 301 allowlisted assets passed; published installer hashes unchanged.
- `account-browser.cjs`: actual local registration/session, persisted settings/support, application/separate approval/link, another account denied, service failure/retry, drawer Escape/focus passed. All 17 routes at 1440/768/390/320 had no body overflow, broken images or uncaught errors (68 combinations).
- Hosted isolated D1 application/approval/link/attribution and UI at 1440/390/320 passed. Another account's order returned 404; creator API returned 403. Cache/index headers matched.
- Actual shop created hosted Stripe sandbox Checkout with creator code: USD 29.00 became USD 27.55. After navigation lost a response body, the exact persisted order/Session was reconciled read-only; no replacement Checkout was created.
- That Session remains unpaid. Stripe's agent-specific flow requests absent Link CLI. No real credentials were supplied or restriction bypassed. Actual hosted payment/refund remain unverified; signed payment/refund tests use canonical provider fixtures and are not claimed as a completed hosted purchase.
- Staged generic and exact-private-value scans passed before implementation commits. Keys, cookies, synthetic customers and runtime/deployment state remain ignored.

Screenshots/reports live in ignored `output/phonebridger-account` and `output/phonebridger-account-hosted`. Nonzero screenshots are isolated local D1 visual fixtures, never production ledger records.

## Local reproduction

```powershell
node deploy/phonebridger/build.mjs ../nisiniai_puslapiai_monetizavimui C:/Users/Lenovo/Documents/PhoneBridger
npm run test:core
```

Apply `schema.sql`, `commerce-schema.sql`, `commerce-operations.sql`, `account-schema.sql` with Wrangler `d1 execute --local --config deploy/phonebridger/account-local/wrangler.jsonc --persist-to .sites-runtime/phonebridger-account-local --file <schema>`, then:

```powershell
node node_modules/wrangler/bin/wrangler.js dev --config deploy/phonebridger/account-local/wrangler.jsonc --local --persist-to .sites-runtime/phonebridger-account-local --ip 127.0.0.1 --port 4195 --inspector-port 0
node deploy/phonebridger/account-browser.cjs
```

The browser runner needs Playwright and installed Chrome/configured channel. It refuses non-loopback before local fixture insertion. Local config has its own directory so production `.dev.vars` cannot be inherited. Pinned Wrangler/workerd rejected a newer compatibility date before startup; local runtime uses 2026-05-22 without changing production dependencies/date.

## Deployment and activation

Only `phonebridger-playground` and its existing isolated D1 changed. Its schema was backed up before the additive migration. Initial sandbox Worker version: `2ae0b991-f4d0-499f-84d6-b609d0ddf13d`. Final UI refresh: `c8e06f46-3306-48e2-b4f0-4192fa7d7bc3`, core implementation `a74c664` plus companion `0791976`; only the two workspace CSS/JS assets changed in this upload. Source design/review images are PhoneBridger commit `5fe0bad`. Production D1, DNS, live Stripe policy/orders, native mouse baseline/releases and pairing/configuration were untouched.

`affiliateEnabled` requires both `PLAYGROUND=1` and `AFFILIATE_SANDBOX=1`; `affiliate-terms.json` has `approvedForLive: false`. Live creator qualification/discounts remain closed. This does not disable existing live shop commerce. No real partner transfer API is called.

The reviewable proposal: 25% of eligible merchandise actually paid after discount, excluding taxes/shipping; 5% audience discount with entered code; first new-customer purchase only; 30-day attribution; digital hold 30 days; hardware release after both 30 days from sale and 14 days from confirmed delivery; monthly payout on the 15th, USD 25 minimum. No self-referrals, recruitment commissions or automatic 30% tier. Refunds proportionally reduce the frozen commission.

Before live creator finance, human approval must produce a new immutable commercial edition and a separately reviewed live implementation: provider onboarding/transfers, identity/tax requirements, dispute/chargeback handling and new data disclosures/retention. Sandbox acknowledgement is a proposal acknowledgement. Customer-only production activation can be reviewed separately with the additive migration, support ownership/retention and disclosure text. Existing approved public legal/content editions must not be silently rewritten.
