# Memory Casting analytics: separate optional release

This feature is disabled unless the Worker has both `MEMO_GA4_ENABLED=1` and a valid `MEMO_GA4_MEASUREMENT_ID` (`G-…`). No property ID or enabled flag is committed. It applies only to eligible native **Lithuanian** pages at the exact HTTPS host `memocasting.lt`. Other languages, other hosts and an unavailable configuration render neither the consent UI nor a Google loader.

## Before enabling

- Select the actual owned GA4 property after reviewing the account inventory; do not create duplicate measurement.
- In its actual web stream, disable **all Enhanced Measurement**, including history pageviews, forms, outbound clicks, site search, downloads and videos. `send_page_view:false` alone does not disable history measurement.
- Keep Google Signals, advertising personalization, ads links and any additional Google tag destinations off. This implementation loads one Analytics destination and sends no advertising consent.
- Publish the matching native Lithuanian privacy information. The footer privacy link is derived from an eligible native page, not a hardcoded unpublished URL.
- Validate the exact hosted release with its real selected ID: no Google requests or cookies before choice or after rejection; one sanitized content pageview after opt-in; immediate withdrawal and clean revisit. Inspect request payloads and HTTP referrers, not only banner appearance or DebugView.

## Actual storage and measurement

`localStorage.memo_analytics_consent_v2` contains only `{version:2, choice:"granted"|"denied", at:<timestamp>}`. Version 2 explicitly includes source and purchase measurement; old content-only version 1 never becomes a grant. The choice expires after **180 days**. There is no visitor ID in this record. Missing, malformed, expired, future-dated or unreadable preferences do not grant consent. A grant must be successfully written and read back; unavailable storage fails closed.

`sessionStorage.memo_analytics_block_v1` contains only `1` after rejection. This tab-session safety latch prevents an old stored grant from returning when persisting withdrawal fails; successful explicit opt-in removes it. Both storage mechanisms must be available before loading Analytics. If withdrawal cannot be saved, tracking is disabled immediately, an error is shown and the document is not automatically reloaded. Removal of an old local preference is attempted, but no successful persistence is claimed when the browser blocks every storage mechanism. The running tab also latches withdrawal in memory. Consent expiry is checked with a bounded/rescheduled timer and again on pageshow, focus and visibility restoration.

The loader is Basic Consent Mode: the Google script is absent until persisted explicit opt-in. Before initializing it, the queue sets denied advertising consents and permits only analytics storage. Google Signals and ad personalization are disabled. GA cookie settings are `cookie_expires:15552000` (180 days), `cookie_update:false`, domain `memocasting.lt`, path `/`, `Secure; SameSite=Lax`.

The application sends a manual `page_view` for the supplied eligible native content route. Global defaults, destination config and the event all use the approved native title and canonical HTTPS path with **every query parameter and hash removed**. Source attribution separately permits only an external referring **origin**, and bounded source/medium/campaign/content/id tokens; no free-text search terms, click IDs, raw referrer paths or arbitrary query parameters. A consented tab-only entry expires after30minutes. No form values, customer names, email addresses, phone numbers, order access credentials, client secrets, User-ID or custom user properties are supplied. The server emits a `no-referrer` metadata policy and the loader uses `referrerPolicy=no-referrer`, covering HTTP referrers separately. Google still receives normal device/network information after consent.

`cart`, `checkout` and `uzsakymas` keep static sanitized metadata and never send a pageview. With persisted v2 consent they can initialize the tag to obtain the tag-generated client/session IDs. Unknown consent does not automatically open a checkout-blocking panel; the footer control is available. Before the embedded payment is opened, the bounded optional hand-off sends only these IDs and the consent proof to the same-origin order-authenticated analytics endpoint. An analytics failure never blocks payment. Other locales cannot use an existing Lithuanian grant. Memo uses normal document links; unexpected client navigation/unmount unloads the old runtime instead of creating duplicate automatic listeners.

Both initial actions have equal visual treatment. Settings remain available from one footer button. Withdrawal saves denial first, synchronously sets `ga-disable-<ID>`, removes the owned script, clears first-party `_ga` / `_ga_*` cookies at the configured host/domain scopes, and (after successful persistence) reloads to unload Google's initialized runtime. Other tabs respond to preference changes. Requests already in flight cannot be recalled. A storage failure never silently permits tracking in the current document.

## Ecommerce continuation

The browser never sends a `purchase` and never treats embedded `onComplete` as payment truth. The canonical commerce consumer emits `purchase` only from a verified paid order/domain fact and only with previously captured, still-valid v2 consent. It sends a stable non-access-bearing transaction ID, server-priced SKUs/options, quantities, item value, shipping and currency. Confirmed monetary refunds have a separate delivery row. The existing server cron runs independently of the owner's PC. See canonical `commerce-core/ANALYTICS.md` for isolation, retries, retention and refund ambiguity. No synthetic live purchase is an acceptance shortcut.

Withdrawal clears the local attribution entry and makes a same-origin authenticated request for any existing order stored in this tab, wiping unsent server measurement context. Other tabs recheck changed consent. Already sent requests cannot be recalled. Shop orders remain the financial truth: no consent, blockers, missing source, late asynchronous payment or an unknown refund transport result can make GA4 incomplete. Source reports require new consented visits; historical attribution is not invented.

## Evidence and limits

Focused tests cover configuration/host/locale gates, fresh/rejected/granted/revisited consent, malformed/expired preferences, read/write/access failures, sanitization, functional routes, withdrawal, cross-tab denial and unexpected client navigation. The local browser fixture is an isolated UI render on localhost: the production host guard deliberately prevents any real Google traffic there. It does not prove hosted real-ID collection, account settings, or conversion reporting.

Official references checked 2026-10-25:

- [Basic and advanced consent modes](https://developers.google.com/tag-platform/security/concepts/consent-mode)
- [Consent implementation](https://developers.google.com/tag-platform/security/guides/consent)
- [GA4 configuration parameters](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)
- [Manual pageviews and Enhanced Measurement](https://developers.google.com/analytics/devguides/collection/ga4/views)
- [Enhanced Measurement](https://support.google.com/analytics/answer/9216061)
- [Disable Analytics](https://developers.google.com/tag-platform/security/guides/privacy#turn_off_google_analytics)
