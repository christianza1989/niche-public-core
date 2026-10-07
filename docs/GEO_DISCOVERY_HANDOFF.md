# Shared GEO discovery integration — 2026-10-07

User requested current GEO research and automatic content-to-discovery updates for every niche. Companion scope: `lib/content-seo-v2.mjs` and targeted discovery regressions only. Shared publication projection, approval/package schemas, renderer identities, routes and bot preferences remain authoritative.

Instruction/loader/checker work: [primary PR31](https://github.com/christianza1989/nisiniai-puslapiai-monetizavimui/pull/31). Current baseline: V1/V2 routes dynamically render `llms.txt`/`llms-full.txt` with no-store; V2 full output omits approved publication/review dates and non-inline approved related/external links. No production deployment, DNS, WAF, customer data or paid measurement is part of this source change.

Status: reserved; source validation and precise handoff follow implementation. Historical approved packages and prior deployment receipts are not rewritten.
