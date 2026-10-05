# dovanos123.lt — first-phase audit

PARTIAL_NOT_READY. Pradinis vertinimas 2026-10-04T21:03:02Z; papildytas po nepriklausomo vietinio redakcinio priėmimo. Tai ne produkcijos ar visos svetainės priėmimas. Kokybės balas neskaičiuojamas. Toliau nepaminėti kriterijai lieka UNVERIFIED.

## Inventory and versions

Capture: `migration/dovanos123/20261004T200201Z/`, source hash `4b1444e2f28a2102f9e7284a0bd679e911a969447c01076a8220fa6437a78bcc`. 45 inventorizuoti adresai. M1 pradinė būsena: 41 privatus studijos puslapis, 27 šeimos / 135 WebP, 0 approval / 0 public activation; jos įrodymas `output/dovanos123-integration/import-2026-10-04T20-45-58-295Z.json` nekeičiamas. Po redakcinio papildymo: 30 šeimų / 150 variantų, 11 local-editorial approval, 30 draft; shadow pakete tik 15 naujų variantų. Tikras domenas neaktyvuotas. [Dabartinė vykdymo eiga](../../docs/DOVANOS123-INTEGRACIJOS-VYKDYMAS-2026-10-04.md).

## Baseline findings and repairs

P0 pradinis radinys: nepatvirtintas asmens demo profilis šešiuose byline. Dabar visi šeši pataisyti į organizaciją per modelio API; capture nepakeistas. Actual trijų priimtų gidų byline/profile/schema parity patikrinta vietiniame R2; I2 PASS šiai projekcijai, ne visų draft tekstų priėmimas. Tikros istorinės pirmo publikavimo datos nežinomos.

P0: legacy privatumo placeholder; tikri retention/processor/transfer/deletion/production faktai nenustatyti. Naujos teisinės versijos lieka privatūs launch-blocked juodraščiai, ne viešai patvirtinta politika.

P1: trys demonstraciniai gidai (`lt-couple-ideas`, `lt-hand-casting`, `lt-anniversary`) neatitinka jų pažadėto naudingumo. Neapprove; skirti atskirą redakcinį perrašymą arba aiškų URL sprendimą.

P1 techniniai taisymai: lossless inline vietos antraštėse/sąrašuose, request-time shared projection, tikri dekoduoti matmenys vietoje šešių netikslių deklaracijų, responsive WebP šeimos, schemos iš faktinės editorial istorijos, neveikiančių footer/profile/commerce nuorodų nerodymas. Bounded SSR testai praeina, tačiau realios route/cache/SEO/LLM priėmimas dar nebaigtas.

## Measurements and visual verdict

44/44 core ir23 studio testai, scoped lint ir TypeScript patikra PASS. Nepriklausomas AI priėmimas apima3 pilnus gidus ir8 dependencies, ne visus29 straipsnius. Actual R2:11 HTML/15WebP/SEO/knowledge eksporto HTTP patikra,17 browser navigacijų, papildomi6 narrow recheck ir2 kategorijų kontrasto recheck; ribos [ACCESSIBILITY-VERIFICATION](./ACCESSIBILITY-VERIFICATION.md). Tikras200 % browser zoom dar UNVERIFIED. 320category overflow ir du kontrasto trūkumai pataisyti; min5,55:1. Actual3guides Lighthouse96/100/100/69 (noindex); homepage galutinis97/100/100/69. Root final verdictACCEPTED_FOR_LOCAL_PREVIEW_WITH_OPEN_GATES; tai nėra pilnas A–Z verdict. Produkcijos D1/SMTP/INBOX, privacy ir knowledge/runtime/case priėmimas neįrodytas. Kitos nišos PASS neperimami.

## A–Z checks

- [ ] **A1 · UNVERIFIED · local gate** — Phase 1 is explicit; inquiry is not an order, reservation or proven demand.

  Evidence: not yet inspected.

- [ ] **A2 · UNVERIFIED · local gate** — The primary action and visible offer are genuinely available and test the chosen concrete business outcome with a documented payer/revenue hypothesis; editorial interest does not substitute for product/service intent. No fake commerce, stock or supplier claim; prelaunch availability is disclosed.

  Evidence: not yet inspected.

- [ ] **A3 · UNVERIFIED · operations gate** — Expansion decision uses qualified real inquiries/value/capacity, not clicks or test records.

  Evidence: not yet inspected.

- [ ] **B1 · UNVERIFIED · local gate** — Operator/contact defaults and site exceptions agree across package, visible copy, schema and form recipient.

  Evidence: not yet inspected.

- [ ] **B2 · UNVERIFIED · local gate** — No borrowed phones, addresses, identities, credentials, reviews or certifications.

  Evidence: not yet inspected.

- [ ] **B3 · UNVERIFIED · launch gate** — Actual operator identity, applicable legal identifiers/address and domain control are established.

  Evidence: not yet inspected.

- [ ] **C1 · UNVERIFIED · local gate** — Bounded history evidence, retrieval limits and unavailable periods are recorded.

  Evidence: not yet inspected.

- [ ] **C2 · UNVERIFIED · local gate** — Reviewed URL decisions distinguish same-intent restore/redirect from defer/404; no mass homepage redirects.

  Evidence: not yet inspected.

- [ ] **C3 · UNVERIFIED · launch** — Any implemented legacy redirect has a current same-host approved 200 target, no loop and a tested status.

  Evidence: not yet inspected.

- [ ] **D1 · UNVERIFIED · local** — Local/international comparisons and real desktop/mobile evidence support the chosen journey; adopted design decisions identify the actual final URL and useful screenshot region, with blocked/blank/overlaid evidence limitations recorded.

  Evidence: not yet inspected.

- [ ] **D2 · UNVERIFIED · local gate** — Current facts and permissions support original copy/assets; old or competitor claims are not our facts.

  Evidence: not yet inspected.

- [ ] **D3 · UNVERIFIED · local** — Search intents and niche advantages are hypotheses where no search/conversion data exists.

  Evidence: not yet inspected.

- [ ] **E1 · UNVERIFIED · local** — Full homepage, index and guide have a coherent niche-specific identity, rhythm and meaningful imagery; for a new identity, actual nearest-network comparison demonstrates substantive differences beyond noun, palette, font or photo-subject substitutions.

  Evidence: not yet inspected.

- [ ] **E2 · UNVERIFIED · local** — DESIGN describes actual tokens, composition, brand/section/asset plan, useful-tool decision and compromises; technical scores are separate from visual judgment.

  Evidence: not yet inspected.

- [ ] **E3 · UNVERIFIED · local gate** — Image origin/rights are documented and presentation is truthful; no imaginary stock, client project, distorted teaching diagram or unwanted generator badge.

  Evidence: not yet inspected.

- [ ] **F1 · UNVERIFIED · local gate** — All public pages are reachable through useful navigation/context; no orphan initial guide.

  Evidence: not yet inspected.

- [ ] **F2 · UNVERIFIED · local gate** — Desktop/mobile header, index, footer and local inquiry actions work with actual destinations.

  Evidence: not yet inspected.

- [ ] **F3 · UNVERIFIED · local** — Each URL has a distinct job; no doorway city/synonym variants, duplicate intent or pointless index.

  Evidence: not yet inspected.

- [ ] **G1 · UNVERIFIED · local gate** — First screen identifies the topic, useful offer and honest next action.

  Evidence: not yet inspected.

- [ ] **G2 · UNVERIFIED · local** — Middle/end answer new questions rather than repeating promotions or decorative cards.

  Evidence: not yet inspected.

- [ ] **G3 · UNVERIFIED · local gate** — Primary/secondary actions, privacy route, empty/error/success states have real behavior.

  Evidence: not yet inspected.

- [x] **H1 · PASS · local gate** — At least three distinct prepared guides are individually read and useful for the site's intent; no word-count substitute.

  Evidence: scoped trijų pilnų gidų nepriklausomas exact redakcinis priėmimas, vykdymo žurnalas ir `actual-r2-final-qa.json`. Kitų 26 draft priėmimas iš to nekyla.

- [x] **H2 · PASS · local gate** — Claims, terminology, examples, limitations and sources are checked; unsafe universal technical advice is absent.

  Evidence: `content/gift-editorial-2026-10-05.mjs`, nepriklausomo AI radinių ir pataisų žurnalas. Tik priimtas 11 puslapių subset; primary retail pavyzdžiai, jokio saugos/kainų/atsargų/produktų bandymo išgalvojimo.

- [ ] **H3 · FAIL · local** — Each guide gives a usable explanation/example/checklist, readable structure and next step without filler.

  Evidence: pradinis capture radinys: trys demonstraciniai įrašai tebėra draft. Po papildymo 3 pilni gidai nepriklausomai priimti local-editorial-only; kiti 26 straipsniai lieka nepriimti. Visas pradinis inventorius neatitinka pilno priėmimo.

- [ ] **H4 · UNVERIFIED · local gate** — Long article, lists, figures and source sections are actually rendered and mobile-tested, not silently discarded.

  Evidence: not yet inspected.

- [ ] **H5 · UNVERIFIED · local gate** — Each initial guide has an inspected topic-specific image; homepage/index and other pages have purposeful visual coverage, actual files and responsive crops, or a documented text-focused reason where imagery adds no value.

  Evidence: not yet inspected.

- [x] **I1 · PASS · local gate** — Visible attribution identifies a real Person or Organization with a public profile or clear identity.

  Evidence: trijų actual gidų matoma organizacijos byline ir tos pačios viešos vietinės projekcijos redakcijos profilis200; `actual-r2-qa.json` ir `actual-r2-final-qa.json`. Tai ne produkcijos domeno valdymo priėmimas.

- [x] **I2 · PASS · local gate** — Author/profile/schema identity agrees; no fictional expert or unverified experience.

  Evidence: visi šeši byline pataisyti API; root exact actual HTML/schema ir profile200, matoma trijų gidų organizacijos byline atitinka Organization snapshot. Capture nekeistas. Kitų draft tekstų tai neapprove.

- [ ] **I3 · UNVERIFIED · local gate** — Visible publication/review dates and structured dates have the same meaning; dates are not refreshed per request.

  Evidence: not yet inspected.

- [ ] **I4 · UNVERIFIED · launch gate** — Initial production publication/deployment date is documented; planned dates are not evidence of past public availability.

  Evidence: not yet inspected.

- [ ] **J1 · UNVERIFIED · local gate** — About/editorial information explains purpose, AI role, source method, limitations and corrections contact.

  Evidence: not yet inspected.

- [ ] **J2 · UNVERIFIED · local** — Review is attributed honestly to the agent/process; no claim of human/qualified approval without it.

  Evidence: not yet inspected.

- [ ] **J3 · UNVERIFIED · local gate** — Factual corrections propagate through studio approval and public/LLM projections; review evidence is retained.

  Evidence: not yet inspected.

- [ ] **K1 · UNVERIFIED · local gate** — Every public URL has one useful H1, title, description, correct language and canonical.

  Evidence: not yet inspected.

- [ ] **K2 · UNVERIFIED · local** — Heading order, informative alt, sharing metadata and social image (when used) match actual content; new-site wordmark/mark and actual favicon belong to the active niche rather than an inherited unrelated brand.

  Evidence: not yet inspected.

- [ ] **K3 · UNVERIFIED · local gate** — Unknown/future/private URLs return proper 404/noindex and do not canonicalize to the homepage.

  Evidence: not yet inspected.

- [ ] **L1 · UNVERIFIED · local gate** — JSON-LD parses and uses truthful appropriate WebSite/WebPage/Organization/Article entities and stable IDs.

  Evidence: not yet inspected.

- [ ] **L2 · UNVERIFIED · local gate** — Visible breadcrumb and schema path/name/URL agree; profile and author relations point to eligible public pages.

  Evidence: not yet inspected.

- [ ] **L3 · UNVERIFIED · local gate** — No invented Offer/Product/Review/AggregateRating/LocalBusiness or unsupported rich-result promise.

  Evidence: not yet inspected.

- [ ] **L4 · UNVERIFIED · launch** — Official rich-result/URL Inspection findings are recorded after actual crawlable deployment; local checks are labelled local.

  Evidence: not yet inspected.

- [ ] **M1 · UNVERIFIED · local gate** — Contextual links use real same-site target IDs and informative anchors; fragments exist.

  Evidence: not yet inspected.

- [ ] **M2 · UNVERIFIED · local gate** — Future/unapproved/revoked targets disappear consistently from prose, related sections, indexes and schema.

  Evidence: `tests/gift-renderer.test.mjs` ir `tests/content-projection-v2.test.mjs` PASS izoliuotame SSR. Realūs host/build/SEO/LLM/cache endpointai dar nepriimti, todėl ne pilnas PASS.

- [ ] **M3 · UNVERIFIED · local** — Cluster/pillar/related routes help distinct questions; repetition/all-to-all links are not treated as authority.

  Evidence: not yet inspected.

- [ ] **N1 · UNVERIFIED · local gate** — Sources have relevant primary evidence, actual target checks and retrieval dates; no partner implication.

  Evidence: not yet inspected.

- [ ] **N2 · UNVERIFIED · local gate** — Owned editorial links obey target ID, host, approval/date/deployment eligibility and disclosed relevant reason.

  Evidence: not yet inspected.

- [ ] **N3 · UNVERIFIED · local gate** — Prose links and source/related panels render correctly; sponsored/UGC relation is applied only if applicable.

  Evidence: not yet inspected.

- [ ] **N4 · UNVERIFIED · launch** — Brand/attribution and other external destinations work on the live launch; pending network domains stay unpublished.

  Evidence: not yet inspected.

- [ ] **O1 · UNVERIFIED · local gate** — Canonical host/path, sitemap, robots, redirects and slash/query behavior are coherent and actually tested.

  Evidence: not yet inspected.

- [ ] **O2 · UNVERIFIED · local gate** — Sitemap contains only eligible URLs and meaningful lastmod; robots does not substitute for private access control.

  Evidence: not yet inspected.

- [ ] **O3 · UNVERIFIED · launch gate** — DNS, TLS, real host, indexing directives and domain isolation work on production.

  Evidence: not yet inspected.

- [ ] **P1 · UNVERIFIED · local gate** — Same authoritative projection controls HTML, links, media, schema, sitemap and LLM output.

  Evidence: not yet inspected.

- [ ] **P2 · UNVERIFIED · local gate** — Hash/date/revocation/cross-host negative tests pass; draft preview is private and not indexed.

  Evidence: not yet inspected.

- [ ] **P3 · UNVERIFIED · local gate** — Studio approval, import validation and compile preserve unrelated packages and reject changed approved content.

  Evidence: not yet inspected.

- [ ] **Q1 · UNVERIFIED · local gate** — Public LLM exports match the active niche's useful facts, URLs, contacts and visible publication scope.

  Evidence: not yet inspected.

- [ ] **Q2 · UNVERIFIED · local gate** — Definitions, qualified answers and primary citations are accessible in semantic HTML; no hidden model-only claims.

  Evidence: not yet inspected.

- [ ] **Q3 · UNVERIFIED · local** — llms.txt/AI visibility are supplementary; no special schema, traffic or ranking guarantee is asserted.

  Evidence: not yet inspected.

- [ ] **R1 · UNVERIFIED · local gate** — Keyboard, focus, skip link, labels, landmarks and details/menu interactions are exercised.

  Evidence: not yet inspected.

- [ ] **R2 · UNVERIFIED · local gate** — Contrast, zoom/reflow, readable utility text and touch targets are checked; score alone is not WCAG conformance.

  Evidence: not yet inspected.

- [ ] **R3 · UNVERIFIED · local gate** — Images, headings, disclosure state, form requirements/errors and reduced-motion behavior remain usable.

  Evidence: not yet inspected.

- [ ] **S1 · UNVERIFIED · local gate** — Desktop, narrow/mobile and tablet evidence shows no overflow or hidden defects.

  Evidence: not yet inspected.

- [ ] **S2 · UNVERIFIED · local gate** — Article contents, byline, source lists, breadcrumb, form and footer work at narrow widths and enlarged text.

  Evidence: not yet inspected.

- [ ] **S3 · UNVERIFIED · local** — Real viewport tests are distinguished from physical device and synthesized touch testing.

  Evidence: not yet inspected.

- [ ] **T1 · UNVERIFIED · local gate** — Production mobile lab is measured with real media and saved version/date/environment; performance target >=90 is met or remains failed.

  Evidence: not yet inspected.

- [ ] **T2 · UNVERIFIED · local** — Measured LCP/CLS/TBT, image sizes, fonts, CSS and JS budgets have justified fixes; no dummy content score.

  Evidence: not yet inspected.

- [ ] **T3 · UNVERIFIED · launch** — Production field CWV/traffic evidence is monitored separately; local Lighthouse is not field performance.

  Evidence: not yet inspected.

- [ ] **U1 · UNVERIFIED · local gate** — Native/server validation, origin, size limits and honest errors pass; durable D1 record survives mail/core failure.

  Evidence: not yet inspected.

- [ ] **U2 · UNVERIFIED · local gate** — Operator notification recipient and SMTP acceptance are tested without client messages or exposed secrets.

  Evidence: not yet inspected.

- [ ] **U3 · UNVERIFIED · local gate** — Matching marked Message-ID INBOX evidence is distinct from SMTP authentication/acceptance; tests do not inflate demand.

  Evidence: not yet inspected.

- [ ] **U4 · UNVERIFIED · launch gate** — Actual production D1/bindings, delivery, recovery/reconciliation and spam/rate controls are verified.

  Evidence: not yet inspected.

- [ ] **V1 · UNVERIFIED · local gate** — Per-site counters exclude bots/DNT/GPC/tests as supported; clicks are separate from received inquiries.

  Evidence: not yet inspected.

- [ ] **V2 · UNVERIFIED · local gate** — Measurement privacy statements match stored fields/cookies/identifiers and enabled providers.

  Evidence: not yet inspected.

- [ ] **V3 · UNVERIFIED · operations gate** — GSC/analytics/qualified inquiries and testing interval support the niche decision; voice is off unless separately authorized and gated.

  Evidence: not yet inspected.

- [ ] **W1 · FAIL · local gate** — Notice and usage terms match an information/inquiry pilot, actual data inventory and current authoritative requirements.

  Evidence: išsaugotas legacy privatumo placeholder ir `scripts/dovanos123-support-pages.mjs` launch-blocked privatūs draft. Tikras produkcijos duomenų inventorius bei teisinis atitikimas nenustatyti.

- [ ] **W2 · UNVERIFIED · local gate** — Purpose, contact, rights, processors/transfer scope and storage/deletion limits are stated truthfully; no invented policy or legal identity.

  Evidence: not yet inspected.

- [ ] **W3 · UNVERIFIED · launch gate** — Production legal basis, recipients/processors, transfers, retention and delete/recovery process are established and accurate in the public notice.

  Evidence: not yet inspected.

- [ ] **W4 · UNVERIFIED · local gate** — Nonessential cookie/marketing consent is implemented only when actually needed; inquiry is not blanket marketing consent.

  Evidence: not yet inspected.

- [ ] **X1 · UNVERIFIED · local gate** — No secrets/private leads/drafts in Git, public bundle, media paths, logs or LLM output; tenant and payload boundaries tested.

  Evidence: not yet inspected.

- [ ] **X2 · UNVERIFIED · local** — Error behavior, dependence on optional voice/core, headers, spam vectors and recovery gaps are assessed with evidence.

  Evidence: not yet inspected.

- [ ] **X3 · UNVERIFIED · launch gate** — Production access, abuse limits, backups/restore and incident controls are working; unresolved risk is not hidden by a score.

  Evidence: not yet inspected.

- [ ] **Y1 · UNVERIFIED · local gate** — Shared fixes live in core; site-specific identity/content remain isolated; schema change updates both validators and integration tests.

  Evidence: not yet inspected.

- [ ] **Y2 · UNVERIFIED · local gate** — Core/SEO regressions pass all current niches after relevant changes, with actual commands/results.

  Evidence: not yet inspected.

- [ ] **Y3 · UNVERIFIED · local gate** — START_HERE, AGENTS, builder/planner and site journal link the current acceptance workflow for a fresh session.

  Evidence: not yet inspected.

- [ ] **Z1 · UNVERIFIED · local gate** — Checklist, baseline findings, repairs, screenshots, versions, remaining blockers and score evidence are stored per site.

  Evidence: not yet inspected.

- [x] **Z2 · PASS · local gate** — 10/10/local-ready/domain-ready claims obey the score contract; failed/unverified checks are visible.

  Evidence: šis dalinis auditas ir įgyvendinimo žurnalas aiškiai atskiria vietinį įgyvendinimą, neatliktas patikras ir produkcijos paleidimą. Jokio „tobulo“ balo ar reitingų garantijos.

- [ ] **Z3 · UNVERIFIED · launch gate** — Final domain-ready handover has all applicable launch gates proved; no unmeasured guarantee of demand or ranking.

  Evidence: not yet inspected.

## Stage scores and launch/demand gates

Use the shared scorer after inspection. Never convert unknown checks to PASS/NA merely to reach 10.
