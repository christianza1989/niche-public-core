# Dovanos123 — perdavimas į bendrą GitHub core

2026-10-06. Savininko pavedimas: įkelti į bendrą core ir GitHub. Tai patvirtinto
turinio perdavimas, ne domeno paleidimas, production admission ar gyvų agentų
kanalų įjungimas. Audito priėmimo ribos išlaikytos.

## Perkelta apimtis

Naudotas esamas bendras `scripts/import-content-package.mjs --shadow` importas.
`content-staging/dovanos123/` turi tą patį immutable V2 paketą: 3 pilni gidai,
8 pagalbiniai puslapiai ir 3 responsive vaizdų šeimos / 15 WebP failų. Paketo SHA256:
`f9a14e3a5772781afe1233fbd3ccc6041ea2bf73aef2d7a12d40924ca6b4febd`.
Tekstai, URL, datos, autorystė, šaltiniai, inline pozicijos ir approvals neperrašyti.
`handoff.json` surašo tikslius failų SHA, bet nėra activation receipt.

41 puslapio studijos inventorius lieka privatus originaliame kompiuteryje; likę
30 juodraščių, 20 straipsnių grafiko darbo duomenys, originalūs PNG, pilni promptai,
review pastabos, DB ir raktai šiuo pakeitimu nepridedami prie Git. Jau anksčiau
įkelti legacy migracijos fixtures nėra dabartinių juodraščių ar jų approval įrodymas.
Trys šiame pakete esantys straipsniai
jau turi atėjusias `publishAt` datas; tai nėra 20 būsimų publikacijų paketas.

## Bendros sistemos ribos

- Renderer/schema/projection ir gift SEO kodas jau buvo GitHub main; jo nekopijuojame
  ir nekeičiame. Naudojami tie patys shared validatoriai ir publikavimo vartai.
- Devyni aktyvūs V1 paketai ir jų compiled registro baitai nekinta. Staging neįeina
  į viešo compiler įvestį, į `public/content-assets/` ar į gyvo host registrą.
- Forma, tracking, checkout, Shopify, SMTP, voice, FB ir learning nejungiami.
- V2 CLI plan/draft/autopilot lieka OFF. Vėlesnė CONTENT_CORE schema-neutral eiga yra
  atskiruose root PR; šis perdavimas jos nesujungia ir nefalsifikuoja naujų review.
- MemoryCasting information-only target turi expiry. Po jo shared resolver paslepia
  nuorodą, nekeisdamas patvirtinto teksto; tai nėra veikiančio checkout patvirtinimas.

## Patikros

`npm run test:core` apima papildomą `tests/dovanos123-staging.test.mjs`: exact paketo
ir 15 WebP bytes, 11 approvals/dependency closure, draft/original exclusion,
staging/production izoliacija, actual datų T−1/T/T+1 pure projection ir target expiry.
Šis laiko testas nėra actual HTTP/cache ar Google indeksavimo įrodymas.

`npm run content:compile` vis dar turi kompiliuoti tik ankstesnius 9 V1 paketus.
Prieš commit tikrinami exact-staged blob, saugos scan ir failų sritis. Nauji bandymų
rezultatai po vykdymo įrašomi žemiau; pradinio checkpoint rezultatai neperrašomi.

## Toliau

Užbaigti aktualius privatumo/sąlygų ir operatoriaus kontaktų/inbox faktus, production
hosting/DNS/HTTPS, duomenų cutover/rollback bei tikslų production acceptance receipt.
Tada naudoti bendrą importą į `content-packages`, compile ir tikro host patikrą.
Vietinis `local-preview` receipt galimas tik izoliuotame output checkout, loopback
ir noindex; ne šiame GitHub main bei ne kaip production vartų pakaitalas.

Pilnas agentų runtime admission ir likusių straipsnių AI peržiūra yra atskiri etapai.
Nekeisti approval hash rankomis ir neįjungti būsimo turinio vien dėl Git push.

## Šio perdavimo rezultatai

- Švarus GitHub clone iš `bb0a0e50e2a2e8f538371d2da003b2ba72eff46a`;
  atskira šaka `codex/dovanos123-core-handoff-20261006`, senas dirty checkout neliečiamas.
- Node22.18.0/npm10.9.3 `install:ci`: PASS, 687 paketai. Išsaugotos ribos:
  `machina` reikalauja Node22.22+, npm pranešė optional WASM cleanup EPERM.
  Install sėkmė nėra šių perspėjimų išsprendimas.
- `npm run test:core`: **49/49 PASS**, 1984.0598 ms; iš jų 5 nauji staging testai.
- `npm run content:compile`: PASS, tie patys 9 V1 paketai, gift neaktyvus.
  Registro SHA256 `afb2f23301dcac3556879ffc83f63712084ff5258a9fe709b88b8b2c9d2da40e`
  sutampa su originaliu baseline; `git diff HEAD` compiled/admission/V1/media scope tuščias.
- Papildomas portable `npm run build`: **FAIL** dar konfigūracijos įkėlime, nes
  esamas main `vite.config.ts` importuoja neįkeltus `./.openai/hosting.json` ir
  `./build/sites-vite-plugin`. Šis perdavimas tų source failų nekeičia. Spraga
  perduota core koordinatoriui; neįkelti privataus managed-host config ar apsimetamos
  production konfigūracijos vien tam, kad build praeitų.
- Actual HTTP/SEO smoke naujame clone: **UNVERIFIED** dėl šio build blocker.
  Ankstesni localhost8930 HTTP/Lighthouse rezultatai lieka istorinio checkpoint
  įrodymais, ne šio švaraus clone ar deployment priėmimu.
- Scoped ESLint naujam staging testui: PASS; `git diff --cached --check`: PASS.
- Exact-staged safety: PASS, 20 failų / 15 WebP / 5 tekstiniai, 0 radinių;
  papildomai patikrintos tikslios abiejų originalių repo žinomos vietinių raktų
  reikšmės jų neparodant. Tai nėra universalus visų PII ar sekretų detektorius.
- GitHub perdavimas vykdomas per šios šakos PR į main; merge nėra deployment.
