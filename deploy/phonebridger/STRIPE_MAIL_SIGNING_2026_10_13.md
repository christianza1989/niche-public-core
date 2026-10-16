# PhoneBridger sender, creator credentials and Windows signing

Implementation: 13 October 2026; resumed inspection: 16 October 2026. This supplements, and does not replace, the dated launch audit.

## Published changes

Public source `51118722bca13225bba7dd0defd27862182fe625` is deployed as Worker version `6c68c0a4-7519-401b-85a5-73bcf462b8a3`, created 13 October at 18:04 UTC. Cloudflare deployment history on 16 October still identifies this as the latest deployment. Prior version `f6ca95ba-bb81-4052-b4b4-0260bc13479a` remains the preceding audit release.

- Dedicated inquiry notifications now pass the PhoneBridger sender name to the shared Hostinger adapter. Other sites retain their existing default.
- `/llms-full.txt` uses the accepted commerce seller, MB Memocasting. Canonical HTTP inspection on 16 October returns 200, contains MB Memocasting and does not contain the inherited MB Pinet seller.
- Creator payout integration optionally uses `CREATOR_STRIPE_KEY`, falling back to the existing key when absent. This allows a separately scoped backend key without replacing the checkout credential.

The implementation passed all 130 core tests and the dedicated production build on 13 October. No native source, installer, mouse manifest, customer records, migrations, DNS or bank transfer changed. Original launch/browser/performance evidence retains its original date and limits.

## Provider status at the resumed inspection

The existing Stripe credential still identifies the intended merchant. Live merchant charges and merchant payouts are enabled. Actual `GET /v2/core/accounts` still returns 403 with missing `v2_account_storer_read`. Legacy Write selections alone do not establish V2 access.

The owner explicitly approved creating `phonebridger-creator-server` on 16 October, with Balance Read; Account Links, Accounts, Transfers and Connect Accounts Write, including the five inherited Connect Accounts permissions. Backend integration purpose was selected. All unrelated resource groups remain None. This permission may enable account management and commission transfers; it is not read-only access.

Submission reached Stripe's owner-verification dialog. The owner must complete authentication in the same browser/device. At this recorded checkpoint the key has not been revealed, no credential has been captured or uploaded, and Cloudflare secret names confirm that `CREATOR_STRIPE_KEY` is absent. Verify creation outcome before retrying; do not create a duplicate key. After verification, validate the new key with read-only V2 requests before storing it in that one Worker secret. Creation approval is not proof that V2 access will work.

Subsequent 16 October outcome: the owner completed email and authenticator verification and Stripe created the one named restricted key. Read-only checks identify the intended merchant and successfully read its balance. Both an unfiltered and a recipient-filtered V2 list still return 403 for missing `v2_account_storer_read`; V2 merchant retrieval is also forbidden. The key has therefore not been installed in Cloudflare. The saved resource editor confirms the approved selections; there is no separately exposed V2 Account Storer row. A backend-purpose key alone did not resolve this permission error.

The merchant Connect page separately still displayed its initial setup screen. The owned session opened its personalized setup guide and selected the previously approved buyer-to-platform funds flow. No liability acknowledgement has yet been accepted. The next page requires an explicit agreement covering refunds, disputes, fines, onboarding/compliance, recipient support and fraud/negative-balance losses, and shows Radar at EUR 0.00 per screened transaction and EUR 1.00 per connected account, with no billing period specified there. This is an additional provider setup gate, not proof that it explains or fixes the V2 permission error. A specific approval is pending before accepting that page.

Public [Lithuanian Connect pricing](https://stripe.com/en-lt/connect/pricing), checked 16 October, lists EUR 2 per monthly active account and 0.25% plus EUR 0.10 per bank payout for platform-managed pricing; account activity is defined by a bank/debit-card payout in that month. Actual merchant pricing and additional services must be reconciled with the final provider review. Existing PhoneBridger live webhook configuration remains enabled for the six checkout/refund/dispute event types at `/api/shop/webhook`; merely listing its configuration does not establish a newly delivered payment event.

Creator email verification, program terms acknowledgment and Stripe-hosted identity/bank onboarding belong to the account owner. Do not perform those steps by impersonating the owner or claim that an API credential completes them. Real referral purchase, refund/reversal, commission settlement and bank arrival remain unverified. Do not trigger a live transfer as a diagnostic.

Contact remains `hello@phonebridger.com`; creator login remains the previously approved Gmail account. Hostinger provider credentials are already configured. Earlier received messages and the new sender implementation do not prove that a new message was delivered after this change. No new message was sent during this resumed check.

## Windows publisher signing

The companion guide `sites/phonebridger/launch-audit-20261013/WINDOWS_SIGNING_LT.md` explains Azure Artifact Signing Public Trust organization validation and a separate signed release. Microsoft eligibility and Basic pricing were rechecked on 16 October: EU organizations can apply; Basic is USD 9.99/account/month for 5,000 signatures, with USD 0.005 excess signatures. Final taxes and local quote are subject to Azure billing. No Azure subscription or signing resource was purchased or provisioned.

Sources: [Microsoft setup](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart), [Microsoft pricing tiers](https://learn.microsoft.com/en-us/azure/artifact-signing/how-to-change-sku).

The accepted Windows beta remains unsigned. Publisher signing and native commercial license activation are separate open gates. Frozen mouse code, baseline hashes and accepted release bundles must remain unchanged. Sign and version a separate release copy only after actual provider validation and the required baseline/package checks.

## Source delivery and recovery

Public follow-up: draft PR33; companion follow-up: draft PR125. Their deployment does not imply merge to main. On 16 October companion main `808581d919d06cb4a2d151cc7f9ec1be1782aba2` was integrated in the owned branch; the only textual merge conflict was the append-only WORKSTREAMS history, with both histories preserved. The affected locale and committed-coverage regressions pass (2/2).

Scope rollback is the dedicated sender/LLM identity and optional creator key selection. Do not rotate the existing checkout key, restore a stale database, rewrite journal history or overwrite original accepted installers. Secret installation is separate from code rollback and requires recording its actual outcome.
