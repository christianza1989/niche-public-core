# Memory Casting analytics: separate optional release

This feature is disabled unless the Worker has both `MEMO_GA4_ENABLED=1` and a valid `MEMO_GA4_MEASUREMENT_ID` (`G-…`). No property ID or enabled flag is committed. It applies only to eligible native **Lithuanian** pages at the exact HTTPS host `memocasting.lt`. Other languages, other hosts and an unavailable configuration render neither the consent UI nor a Google loader.

## Before enabling

- Select the actual owned GA4 property after reviewing the account inventory; do not create duplicate measurement.
- In its actual web stream, disable **all Enhanced Measurement**, including history pageviews, forms, outbound clicks, site search, downloads and videos. `send_page_view:false` alone does not disable history measurement.
- Keep Google Signals, advertising personalization, ads links and any additional Google tag destinations off. This implementation loads one Analytics destination and sends no advertising consent.
- Publish the matching native Lithuanian privacy information. The footer privacy link is derived from an eligible native page, not a hardcoded unpublished URL.
- Validate the exact hosted release with its real selected ID: no Google requests or cookies before choice or after rejection; one sanitized content pageview after opt-in; immediate withdrawal and clean revisit. Inspect request payloads and HTTP referrers, not only banner appearance or DebugView.

## Actual storage and measurement

`localStorage.memo_analytics_consent_v1` contains only `{version:1, choice:"granted"|"denied", at:<timestamp>}`. The choice expires after **180 days**. There is no visitor ID in this record. Missing, malformed, expired, future-dated or unreadable preferences do not grant consent. A grant must be successfully written and read back; unavailable storage fails closed.

`sessionStorage.memo_analytics_block_v1` contains only `1` after rejection. This tab-session safety latch prevents an old stored grant from returning when persisting withdrawal fails; successful explicit opt-in removes it. Both storage mechanisms must be available before loading Analytics. If withdrawal cannot be saved, tracking is disabled immediately, an error is shown and the document is not automatically reloaded. Removal of an old local preference is attempted, but no successful persistence is claimed when the browser blocks every storage mechanism. The running tab also latches withdrawal in memory. Consent expiry is checked with a bounded/rescheduled timer and again on pageshow, focus and visibility restoration.

The loader is Basic Consent Mode: the Google script is absent until persisted explicit opt-in. Before initializing it, the queue sets denied advertising consents and permits only analytics storage. Google Signals and ad personalization are disabled. GA cookie settings are `cookie_expires:15552000` (180 days), `cookie_update:false`, domain `memocasting.lt`, path `/`, `Secure; SameSite=Lax`.

The application sends only a manual `page_view` for the supplied eligible native content route. Global defaults, destination config and the event all use the approved native title, canonical HTTPS path with **every query parameter and hash removed**, and an empty `page_referrer`. No form values, customer names, email addresses, phone numbers, order identifiers, client secrets, User-ID or custom user properties are supplied. When enabled, the server also emits a `no-referrer` metadata policy and the loader script uses `referrerPolicy=no-referrer`, covering HTTP referrers separately. This does **not** describe all Google processing as anonymous: Google still receives normal device/network information after consent.

`cart`, `checkout` and `uzsakymas` are functional pages: the Lithuanian footer can change the preference but those pages do not load the tag or send pageviews. Other locales cannot use an existing Lithuanian grant. Memo uses normal document links; an unexpected client navigation or unmount with an initialized runtime disables it and reloads the current document, preserving consent and analytics cookies, instead of creating duplicate automatic-event listeners.

Both initial actions have equal visual treatment. Settings remain available from one footer button. Withdrawal saves denial first, synchronously sets `ga-disable-<ID>`, removes the owned script, clears first-party `_ga` / `_ga_*` cookies at the configured host/domain scopes, and (after successful persistence) reloads to unload Google's initialized runtime. Other tabs respond to preference changes. Requests already in flight cannot be recalled. A storage failure never silently permits tracking in the current document.

## Ecommerce is a separate stage

No purchase event is implemented or claimed. The existing Stripe embedded `onComplete` requests an order-status refresh; it is not proof of server-verified payment. A future purchase adapter must use the verified paid order, avoid PII and deduplicate a stable transaction identifier without inventing paid receipts or making a live test purchase.

## Evidence and limits

Focused tests cover configuration/host/locale gates, fresh/rejected/granted/revisited consent, malformed/expired preferences, read/write/access failures, sanitization, functional routes, withdrawal, cross-tab denial and unexpected client navigation. The local browser fixture is an isolated UI render on localhost: the production host guard deliberately prevents any real Google traffic there. It does not prove hosted real-ID collection, account settings, or conversion reporting.

Official references checked 2026-10-25:

- [Basic and advanced consent modes](https://developers.google.com/tag-platform/security/concepts/consent-mode)
- [Consent implementation](https://developers.google.com/tag-platform/security/guides/consent)
- [GA4 configuration parameters](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)
- [Manual pageviews and Enhanced Measurement](https://developers.google.com/analytics/devguides/collection/ga4/views)
- [Enhanced Measurement](https://support.google.com/analytics/answer/9216061)
- [Disable Analytics](https://developers.google.com/tag-platform/security/guides/privacy#turn_off_google_analytics)
