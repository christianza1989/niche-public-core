# Private commerce mail service

Disabled standalone service-binding Worker using the existing shared SMTP protocol and authenticated Hostinger sender. No public route, new provider, credentials, production resource or live mail is created by this source.

The canonical integration/acceptance receipt is in companion `sites/memocasting/COMMERCE_MAIL_INTEGRATION.md` (core PR101), linked with public PR31. The parent commerce adapter uses the `COMMERCE_MAIL` binding; do not connect it to the storefront's public `/prekyba` gateway.

Private configuration: COMMERCE_STORE_ID, COMMERCE_ENVIRONMENT, COMMERCE_MAIL_DB, COMMERCE_MAIL_ENABLED, SMTP_USER, SMTP_PASSWORD and sandbox-only COMMERCE_TEST_RECIPIENTS. SMTP_USER/PASSWORD must be configured privately through the existing credential admission workflow. From must equal SMTP_USER; no spoofed site sender. The existing SMTP helper uses the established MB Pinet sender label.

Run `node --test tests/commerce-mail-gateway.test.mjs` and `node workers/commerce-mail/verify-local.mjs`. The native fixture uses installed workerd compatibility2026-05-22, while the new configuration is2026-10-12; that exact-date production runtime gate is outstanding. Dry-run builds are packaging checks. No test opens an actual SMTP socket or authenticates with a provider.

An unknown send must be reconciled by an operator using positive provider/mailbox evidence. Do not delete its claim, expire it or silently retry. Accepted means DATA250; a matching INBOX receipt is separate. Database retention/deletion/backups and production identity must be agreed before activation. Ledger hashes prevent modified replays; no message body or SMTP credential is persisted.
