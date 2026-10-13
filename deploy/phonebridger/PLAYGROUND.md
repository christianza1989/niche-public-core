# PhoneBridger purchase playground

Owner-authorized end-to-end test, 6 October 2026. Public test shop: https://phonebridger-playground.phonebridger-app.workers.dev/shop. Its banner, Checkout text and downloaded records explicitly state simulation. No actual money, goods or native activation is supplied.

## Isolation and evidence

Final deployed playground version: `039baddd-39be-4bba-96a7-eca901fd6471`, using core `e2f670a` and companion `b32cada`. Final read-only provider/application reconciliation passed after deployment at 18:05 UTC on 6 October 2026. Production version and canonical acceptance are recorded in LAUNCH_STATUS.md.

`wrangler.playground.jsonc` has its own Worker, EU D1, Stripe sandbox, key, signing secret, operator secret and synthetic buyer. It has no canonical domain routes or Hostinger mailbox credentials. All HTML/API responses are noindex/private. The policy booleans, LT destination, $5 shipping, 2–5 day estimate and stock of ten per finish are **test fixtures**, not approved production business facts. Never copy these fixtures into `commerce-policy.json` or the production database.

The claimable Stripe sandbox was created through the official CLI with a dedicated ignored configuration. Unclaimed it expires on **13 October 2026**. The owner can claim it from the sandbox Checkout banner; claiming/onboarding must not be completed by inventing identity details. Do not use Stripe MCP in the anonymous sandbox until claimed. SDK/CLI access is sufficient for the tests below. If replacing the sandbox, update its exact account/D1/host binding and webhook together, not only a key.

Actual hosted Checkout was exercised through the browser with Stripe test cards and fictional buyer details:

- A declined test card left the physical order pending and issued no entitlement.
- `App + 2 holders`, black: $65 plus simulated $5 delivery, $70 USD. Stripe Session became complete/paid and PaymentIntent succeeded. The **real signed `checkout.session.completed` webhook** recorded payment and issued one test entitlement.
- Browser return, account history and licence download worked. The owner-private payment summary includes subtotal, shipping and total and explicitly is not a VAT invoice.
- Operator dispatch, repeated identical dispatch and delivery simulation consumed two black units once. The stock became eight; reservations became zero. This is database workflow evidence, not actual carrier delivery.
- One explicitly labelled test review with two stars was accepted, moderated and published only in the playground database. A real Stripe test refund succeeded for $70; its signed `charge.refunded` webhook revoked the entitlement and withdrew the review. The licence endpoint then returned 409.
- A separate unpaid silver Checkout Session was expired through the official Stripe API. Its signed `checkout.session.expired` webhook ended the order and released its reservation.
- Returning from an unpaid hosted Checkout restored the selected silver setup and displayed the cancellation message, while its order remained pending with no entitlement. The Session was then expired through Stripe to release its reservation.
- `App only`: $29 USD, $0 delivery. A second actual browser test payment succeeded. Its canonical PaymentIntent/charge was checked by the updated handler; digital fulfilment and entitlement issuance occurred automatically.

Private records are under `.sites-runtime/phonebridger-playground/`; screenshots are under ignored `output/phonebridger-production/`. `playground-verify.mjs` reads these private fixtures and compares provider Sessions to account-owned API records. It is **read-only**, does not fabricate payment events and cannot run without the preceding authorized tests. Local tests additionally cover duplicate/out-of-order events, wrong amount/mode, unauthorized access and stock contention; they do not certify real delayed-method settlement or an actual chargeback. No customer email, VAT invoice, native paid unlocking or shipping service is claimed.

## Reproduce safely

1. Keep the existing merchant/live policy disabled until its separate launch facts are ready. Use official CLI help/current docs to create or select a dedicated test sandbox. Prefer restricted keys; official anonymous keys currently use `rkcs_test_` and deliberately cannot read Accounts.
2. Capture provider setup output in ignored private files. Never print full CLI profiles, raw SDK errors or creation logs. Sanitization must cover **`rkcs_` as well as `rk_`, `sk_`, `pk_`, `whsec_` and claim links**. The staged-blob checker also compares exact locally known sandbox keys, operator keys and buyer credentials in either repository.
3. Apply `schema.sql`, `commerce-schema.sql` and `commerce-operations.sql` only to the isolated test D1. Seed explicitly labelled test inventory there. Supply `AUTH_RATE_SECRET`, `STRIPE_RESTRICTED_KEY`, `STRIPE_WEBHOOK_SECRET` and `COMMERCE_OPERATOR_SECRET` through Wrangler stdin/private files. Do not copy production mail secrets.
4. Register all six events listed in `COMMERCE.md`; deploy the same reviewed build with the playground configuration. Verify its actual host/header/catalog before creating a synthetic account or paying. A first route activation can briefly serve a provider HTML response; classify status/content type before parsing or retrying a write.
5. Use the normal shop/login/Checkout UI. Use official fake test cards, do not save card details, and do not accept real purchase agreements for the simulation. Confirm Stripe's sandbox banner. Never charge a real card to prove the integration.
6. Check actual provider state, signed webhook ledger, account-owned order, documents, stock and UI separately. Confirm refunds/expiry through provider events. Do not replace a missing real webhook proof with a locally signed fixture.
7. Record the exact tested Worker versions and commits. If configuration/handler changes, rerun the affected acceptance cases. Keep test reviews and stock out of production. Unclaimed sandbox expiry is a real dependency, not a permanent payment setup.

## Operator workflow

Use `operator.mjs <exact-HTTPS-origin> <private-secret-file> <private-action-json>`. The secret is read from a file and sent in Authorization, never in a URL or command argument. Customer cookies cannot authorize these operations. Record actual evidence before acting:

```json
{"action":"dispatch","orderId":"<32-hex-owned-order>","carrier":"<actual carrier>","trackingNumber":"<actual reference>","trackingUrl":"https://<actual carrier tracking>"}
{"action":"delivered","orderId":"<32-hex-owned-order>"}
{"action":"moderate","reviewId":"<pending review>","decision":"publish","reason":"publish"}
{"action":"reconcile","orderId":"<32-hex-owned-order>"}
```

Dispatch requires paid hardware and records immutable tracking; repeated matching dispatch cannot consume stock again. Delivery requires an existing dispatch. Reconciliation re-reads Stripe's canonical Session, never takes a client `paid` flag. Sessions missing from the persisted order require exact provider inspection before retrying. Do not expire or sweep ambiguous payments merely because a local reservation timer passed. Returned dispatched goods are not automatically restocked; inspect them first. A refund/dispute cannot be undone by a late payment event or delivery click.

The public production checkout remains disabled. Native activation, automatic purchase emails, tax invoicing, actual carrier tracking and owner verification are independent integration/launch work, not capabilities established by this playground.
