# Dovanos123 integracijos vykdymo žurnalas

Savininko įgyvendinimo pavedimas: 2026-10-04 „na tai padarykit viska tvarkingai“. Eiga pagal [suderintą M0–M5 planą](./DOVANOS123-BENDRO-TINKLO-INTEGRACIJOS-PLANAS-2026-10-04.md) ir tinklo koordinatoriaus `DOVANOS123_CORE_INTEGRATION.md`.

## M0 — vietinio šaltinio inventorius

Užfiksuota `2026-10-04T20:02:01Z` (23:02:01 Europe/Vilnius), vieną kartą pritaikant šį laiką legacy demonstracinėms datoms. Capture nekeičia pradinio kodo ar jo viešumo.

Snapshot: `migration/dovanos123/20261004T200201Z/`.

- 29 straipsniai: 20 fiksuoto grafiko, 3 kiti fiksuotų datų įrašai, 6 reliatyvių demonstracinių datų įrašai.
- 45 adresų inventorius, įskaitant autorių, politikų, sitemap/robots/LLM adresus; kategorijų query filtrai išsaugoti atskirai.
- 2 autoriai, 7 šaltiniai. Vieno asmens tapatybė/biografija nepatvirtinta; 6 susietiems įrašams reikalinga autorystės korekcija prieš approval.
- 27 vaizdai; trūkstamų failų ir netinkamų WebP antraščių nėra. Tai failų inventorius, ne jų matmenų, crop ar teisių galutinis patvirtinimas.
- 29 originalių source failų hash ir baitai išsaugoti. ID/slug kolizijų ir dingusių article target nėra.
- Legacy kriterijumi inventoriaus momentu tinkami 13 įrašų. Tai ne įrodymas, kad jie realiai buvo vieši ar peržiūrėti. Visi 29 migracijos įrašai lieka `pending`.

`legacy-data.json` saugo pradinį tekstą ir metaduomenis; `inventory.json` — atitikmenis, datų kilmę, kiekvienos inline nuorodos tikslią vietą bei pasikartojimus; `manifest.json` — kontrolines sumas ir rollback ribas. `source/` bei `media/` yra atskira privati kopija, ne naujas viešas šaltinis.

Įrankis `scripts/dovanos123-snapshot.mjs` atsisako perrašyti capture arba rašyti už `migration/dovanos123/` ribų. Skaito tik allowlist grynų TS duomenų modulių; neįkelia DB bindings, env failų ar klientų įrašų. `--verify <capture>` patikrina visus manifest failus. Snapshot nekeičiamas vėlesnių migracijos taisymų metu.

Testai: `node --test tests/dovanos123-migration.test.mjs` — deterministinė data, site izoliacija, pending approval, UTC momento išsaugojimas, inline pasikartojimai/vieta, perrašymo/kelio/dependency atmetimas, snapshot pakeitimo aptikimas.

### Tikro M0 ribos

Produkcijos D1 neeksportuota, faktinės pirmos publikacijos datos ir domeno valdymas dar nepatvirtinti. 2026-10-04 šios aplinkos DNS A užklausa `dovanos123.lt` neišsprendė domeno; tai aplinkos radinys, ne nuosavybės išvada. Shopify anksčiau išjungtas; jo įjungimo ar checkout veikimo šis darbas nepatvirtina.

Esami kontaktai ir privatumo puslapis yra placeholder tekstas. Reikia tikrų bendro operatoriaus faktų, veikiančio shared kontaktų kelio ir tiksliai faktinei konfigūracijai pritaikyto privatumo teksto. Neišgalvoti asmenų, rekvizitų, saugojimo terminų ar praeities publikavimo datų.

M0 LOCAL_SOURCE_CAPTURE — baigta. M0 PRODUCTION_INVENTORY — UNVERIFIED. Svetainės A–Z auditas inicijuotas `sites/dovanos123/` su visais 85 kriterijais UNVERIFIED, neperimant kitų nišų PASS.

## Atsakomybės ir kitas darbas

Tinklo koordinatorius rezervavo M1: v2 modelis/schema/hash/fixtures/studijos redaktorius, matching public validatorius, `--shadow` importas ir compiler aktyvavimo apsauga. Jis vienintelis šio lango shared failų rašytojas. Ši sesija valdo snapshot įrankį, gift importerį/rendererį, savus testus ir dokumentus. Bendras `dist`, proxy/registry/schema/compiler ir kitų nišų turinys savarankiškai neperrašomi.

M1 gift adapteris remiasi tikslia koordinatoriaus `research/dovanos123-integration-2026-10-04/M1/ADAPTER-CONTRACT.md` ir v2 fixture. M2–M5 priėmimas atskiriamas nuo vietinio rendererio ir importo testų; lokali patikra nevadinama produkciniu paleidimu.

## M1 — privatus importas į tikrą bendrą studiją

Faktinė paskirtis: `C:/Users/lenovo/Documents/nisiniai_puslapiai_monetizavimui/content-studio/data/sites/dovanos123.json`.

`scripts/dovanos123-legacy-import.mjs` perskaito patikrintą capture, sukuria tik šio site v2 record ir prideda 29 privačius straipsnių juodraščius. Išlieka ID, originalūs `/straipsniai/<slug>` adresai, antraštės, tekstas, blokų tvarka, kiekvienas inline nuorodos pasikartojimas ir UTC publikavimo momentas. Pastraipos, antraštės bei sąrašai neplokštinami. Netinkamas target palieka label ir turi loss report; šiame capture tokių korekcijų 0.

Google redakcinės/SEO instrukcijos pažymėtos `public:false` ir į viešą DTO neperkeliamos. Originalai išlieka privačiame capture. Neįrodomos pirmos publikacijos ir atnaujinimo datos lieka `null`; grafikas nevirsta išgalvota istorija. Produktų tikslai dar `verified:false` ir neįjungia CTA.

Per bendrą `saveResponsiveAsset` tikrais originalų baitais sukurta 25 straipsnių vaizdų šeimos / 125 variantai. Patikra aptiko neteisingus šešių senų įrašų deklaruotus matmenis: buvo 1536×1024, failai iš tikrųjų 1672×940/941. Naujos variantų šeimos naudoja dekoduotus matmenis, neupscale'ina, didžiausias viešas variantas 1600×900. Originalai ir jų hash išsaugomi privačiai; tai nėra vaizdų teisių ar vizualaus tinkamumo PASS.

`scripts/dovanos123-support-pages.mjs` prideda 12 kitų privačių puslapių: homepage, straipsnių indeksą, autorių indeksą, apie, kontaktus, redakcinę politiką, komercinius ryšius, privatumo/slapukų/naudojimo taisyklių juodraščius, realios organizacijos redakcijos profilį ir seną demonstracinio profilio adresą be išgalvoto Person. Išsaugotas `/taisykles`, ne sukurtas kitas jo pakaitalas. Homepage papildomai turi 2 originalių vaizdų šeimas / 10 variantų. Teisiniai puslapiai specialiai turi launch blockers ir neturi approval.

Galutinis privatus inventorius: **41 puslapis, 27 vaizdų šeimos, 135 WebP failai, 0 approval, 0 public activation**. Kontaktams naudojami bendro tinklo MB Pinet / info@pinet.lt, ne išgalvoti telefonai ar adresai. Privatumo juodraštis neapsimeta užbaigtu pranešimu.

Kiekvieno įrankio receipt saugomas `data/gift-migrations/`. Pakartotinis importas neskuba perrašyti naujesnių redakcinių revizijų: `unchanged` arba `preserved-edited-revision`. Izoliuotas realaus modelio edited-draft testas praėjo. Support įrankio pirmo bandymo trūkstamas `intent` ištaisytas per modelio API tik nepakitusiuose, nepatvirtintuose šio importo juodraščiuose; taisymas ir ankstesnis hash įrašyti receipt, ne tyliai sukurti approvals.

Faktinė patikra `scripts/verify-dovanos123-import.mjs`: 29/29 straipsniai ir 12/12 support puslapiai validuojami v2 draft sutartimi; originalus turinys, laikas ir medijos hash išliko. Įrodymas: `output/dovanos123-integration/import-2026-10-04T20-45-58-295Z.json` (privatus, Git ignoruojamas). Importas neeksportuoja į aktyvų paketą, nekeičia DNS, nepublikuoja turinio ir neliečia lead klientų duomenų.

## M2 — gift atvaizdavimas

Įgyvendinta `components/gift/gift-site.tsx`, `rich-content.tsx`, `lib/gift-content.ts`, `lib/gift-seo.ts`, `app/gift/[siteId]/[[...slug]]/page.tsx`. Išsaugotos dovanų portalo originalios CSS kompozicijos: hero, greitos pradžios kortelės, kategorijos, sezoniniai gidai, featured/latest, redakcinis blokas, indeksas ir article-card. Puslapiai gauna tik bendrą `ProjectedContentPageV2`, o ne legacy/D1 fallback arba raw būsimų puslapių sąrašą.

Shared `projectContentPagesV2` yra vienintelė nuorodų/turinio tinkamumo projekcija. Iki target publikavimo, po atšaukimo ar nesant tinkamo destination nuorodos label lieka tekstu; related ir indeksai jo nerodo. Footer ir byline nenurodo neegzistuojančių profilių/politikų. Produktų rekomendacijos tik iš eligible commerce registry. Vaizdai gauna tikrą responsive srcset/sizes, width/height, hero eager ir likusius lazy. JSON-LD escaping apsaugo nuo script uždarymo; datos tik iš editorial istorijos, Person/Offer/rating nepridedami dėl SEO kvotos.

Route tikrina Host/site ir public page, yra `force-dynamic` / `revalidate=0`. Koordinatorius valdo proxy/no-store, aktyvų registry, layout, bendrus SEO/LLM endpointus ir compiler vartus. Neaktyvus shadow paketas neturi paslėpto legacy fallback naujame gift kelyje. Šio etapo renderer unit/SSR priėmimas nepakeičia tikros route/build/browser/cache patikros.

Testai 2026-10-04:

- `node --test tests/*.test.mjs` — pradinis **36/36 PASS**, po shared admission/source/SEO ir footer regresijų **41/41 PASS** (11 gift adapter/snapshot/renderer regresijų, taip pat bendro branduolio testai). JUnit: `output/dovanos123-integration/core-tests.xml`.
- Renderer tikrina tikslią reveal ribą antraštėje, pastraipoje ir ordered list su trimis vienodais label; atšaukimas vėl paslepia target; būsimas pavadinimas neatsiranda home/index/profile/schema.
- Tikrina navigacijos gyvumą, filtrus, realų srcset/matmenis, Organization/profile, breadcrumb parity, canonical/noindex filtrus, null istorinių datų semantiką, JSON-LD escaping ir neaktyvių commerce CTA nebuvimą.
- `npx eslint components/gift lib/gift-content.ts lib/gift-seo.ts app/gift scripts/dovanos123-support-pages.mjs` — 0 klaidų/įspėjimų.
- `npx tsc --noEmit --pretty false --incremental false` — galutinis PASS po koordinatoriaus layout, ne tuščio commerce registry argumento `never[]` ir generated QA kopijų įtraukimo taisymų. Bendras dist šioje sesijoje neperrašytas.

Vėlesni rendererio papildymai: tikri header/main/footer landmark, fokusą gaunanti skip nuoroda, mobile navigation wrap, ilgiems URL overflow ir reduced-motion. Kontaktų forma naudoja bendro POST laukus; forma ir bendras anonimų aggregate `InterestTracking` mountinami tik esant projected viešai `privatumas` policy. Atšaukus privatumo puslapį abu dingsta, lieka realus email fallback. Tai ne marketing consent, ne užsakymas ir ne savaiminis Shopify/voice įjungimas. Server v2 privatumo vartus bei SEO/measurement endpointus priima koordinatorius.

Redakcinės peržiūros radiniai ir patikrintos pirminės parduotuvių nuorodos: [privati priėmimo eilė](./DOVANOS123-REDAKCINIO-PRIEMIMO-EILE-2026-10-05.md). Teksto šaltinio peržiūra nepašalina vaizdų, operatoriaus ar produkcijos faktų nežinomybės.

## Kas dar nėra priimta

Tai dalinis **vietinis įgyvendinimas**, ne visas „dovanos123 paruoštas“ verdict.

1. M0 production D1 ir realios publikacijos istorija, domeno valdymas neįrodyti.
2. Pradiniams 11 puslapių redakcinis priėmimas atliktas atskirai (žr. papildymą žemiau); visų 29 straipsnių priėmimas neatliktas. Trys demonstraciniai įrašai (`lt-couple-ideas`, `lt-hand-casting`, `lt-anniversary`) tebėra trumpi privatūs juodraščiai. Visų šešių asmens byline korekcijos atliktos per studijos API, bet tai nėra kitų jų tekstų approval.
3. MemoryCasting landing patikrintas tik kaip informacinis komercinis tikslas iki 2026-10-11T21:06:31Z. Priimtų revizijų CTA gali rodyti šią informaciją, ne checkout. Kainos, reitingai, kūdikių sauga ir klientų atsiliepimai nekopijuojami.
4. M4 profilio/knowledge/lead/case integracija, receipt ir privatumas dar nepriimti; capabilities default OFF. Esamos kitų nišų lead/core taisyklės nekeičiamos.
5. M5 sintetinio izoliuoto paketo build/HTTP/SEO/LLM, 9 esamų nišų regresijos ir pasirinktos browser/Lighthouse patikros atliktos. Tikro 11 puslapių R2 paketo build/HTTP priėmimas vyksta atskirai; viso A–Z, 200 % padidinimo, dry-run rollback ir produkcijos perjungimo neįrodo R1 testas.
6. Produkcijos DNS/HTTPS/hosting/D1/mail/privacy/monitoring ir tikras produkto pirkimo kelias netikrinti; jokių 100/100 ar reitingų garantijų.

Kita koordinuota seka: užbaigti shared M2–M5 infrastruktūros priėmimą izoliuotame testavimo pakete; atskirai peržiūrėti turinį ir teisinius faktus; tik tada importuoti patvirtintą site paketą, atlikti vieno host perjungimą su rollback ir produkcijos patikrą.

## 2026-10-05 papildymas — tikro turinio redakcinis priėmimas

Tai nauja būsena, nekeičia M0/M1 capture ir istorinio nulinio approval įrodymo.

Privačioje bendroje studijoje 41 puslapis. Per modelio API parengti 3 pilni gidai (rankų liejimo pasirinkimas, Kalėdų dovanos porai, Kalėdų dovanos vyrui) ir 8 jų priklausomybės: homepage, gidų/autorių indeksai, apie, kontaktai, redakcinė politika, komercinių ryšių atskleidimas ir organizacijos profilis. Atskiros pirminės IKEA ir Pegaso nuorodos padeda pasirinkti, bet tekstas nežada rinkos kainos, likučio, pristatymo ar partnerystės. Senų slug ir grafiko UTC momentai išlaikyti. Istorinės pirmos publikacijos datos tebėra nežinomos, ne grafiko išgalvota istorija.

Nepriklausomas tinklo koordinatorius perskaitė visus 11 puslapių, peržiūrėjo 3 originalias iliustracijas, patikrino 15 WebP ir pateikė pataisas. Pataisyta antraštės ir pažadėtos instrukcijos neatitiktis, tuščias išvados skyrius, nesuderintos patirties datos siūlymas, gramatika, komercinio atskleidimo kontekstas ir nepageidaujami generatoriaus ženkleliai. Pataisos išsaugotos kaip modelio revizijos ir metadata history. Pirminis turinys išlieka capture, 9 būsimos related/table kryptys neprarastos tyliai — atskiro candidate paketo dependency ribos užfiksuotos losses.

Priėmimo įrodymas kito koordinatoriaus projekte: `research/dovanos123-integration-2026-10-04/EDITORIAL/ACCEPTANCE.json`. Verdict **ACCEPTED_FOR_LOCAL_EDITORIAL**, tik local/editorial/shadow; candidate SHA `5a278fb160ee6e8abbd6cd43422cbd16a672a5631023d90ad803f27155f98ab5`. `scripts/approve-dovanos123-editorial.mjs` prieš keitimus tikrina šį priėmimą, tiksliai 11 hash ir 15 medijos failų SHA; tik tada per normalų API išvalo išspręstas privačias pastabas ir patvirtina revizijas. Kitų 30 draft hash ir approval būsena išlaikyti. Tiesiogiai perrašytų content hash ar atsitiktinio masinio approval nėra.

Eksportas: `output/dovanos123-editorial/2026-10-05/shadow-export/dovanos123/`, **11 puslapių / 15 WebP**, `content-package.json` SHA `f9a14e3a5772781afe1233fbd3ccc6041ea2bf73aef2d7a12d40924ca6b4febd`. Studijos receipt: `data/gift-editorial/dovanos123-20261005.json`. Tai ne main aktyvus paketas. Privatumas/slapukai/taisyklių juodraščiai nepatvirtinti, todėl formos, sekimas, SMTP ir voice šio actual paketo viešoje projekcijoje neįjungiami.

Sukurta 3 skirtingo stiliaus originalių iliustracijų šeimos, automatiškai konvertuotos bendru media API į 15 WebP. Privačiai iš viso 30 šeimų / 150 variantų; senos 27 šeimos nepakeistos. [Medijos, originalų ir pilnų promptų žurnalas](./DOVANOS123-MEDIJOS-ZURNALAS-2026-10-05.md).

2026-10-05 galutinė savų pakeitimų patikra šiame taške: **44/44 core PASS**, scoped ESLint be klaidų/įspėjimų, `tsc --noEmit` PASS. Pridėti tikro redakcinio candidate ir patvirtinto gidų indekso body atvaizdavimo regresiniai testai. JUnit: `output/dovanos123-integration/core-tests.xml`.

R1 sintetinio browser bandymo 320 px overflow ir kontrasto defektai pataisyti, 6 route patikros bei skirtumas nuo tikro 200 % browser zoom aprašyti [ACCESSIBILITY-VERIFICATION](../sites/dovanos123/ACCESSIBILITY-VERIFICATION.md). Lighthouse prieš ir po bandymo nevadinamas produkcijos rezultatu: po pataisų 88/100/100/69; SEO 69 kyla iš sąmoningo fixture noindex, performance skirtumas nuo pradinio 97 yra variacija, ne optimizavimo garantija. R2 tikro turinio galutiniai HTTP/browser/performance įrodymai pridedami po root izoliuoto build; main compile, DNS, gyvas domenas ir klientų duomenys nepakeisti.

### R2 — tikro priimto paketo vietinis patvirtinimas

Root bandomoji kopija `output/dovanos123-m5-root-r2`, [vietinė peržiūra](http://127.0.0.1:8930/). Canonical lieka `.lt`, bet exact `local-preview` admission veikia tik isolated output checkout ir loopback; realus Host/www/nežinomas preview Host atmetami. Tai ne production activation. Per root HTTP testą aptiktas nežinomo Vercel preview fallback į legacy 500, pataisytas scoped guard ir pridėta regresija. Atskiro legacy `dovaneles.lt` kelio naujame isolated D1 500 nefiksuotas kaip compatibility PASS — originali legacy DB neimportuota ir produkcijos duomenys neliesti.

Root `M5/ACTUAL-PREVIEW-HTTP.json`: **11/11 HTTP ir exact revision PASS, 15/15 WebP SHA bei realūs matmenys PASS**, pilni inline/body, Article/Breadcrumb ir kitų puslapių schemos, sitemap/robots/LLM ir privatūs 404, noindex/no-store. `ACTUAL-KNOWLEDGE-QA.json`: 11 viešos projekcijos fragmentų, exact text/hash ir HTML inventoriaus atitiktis; privatus transportas parengtas, runtime import/learning/voice OFF. `V1-SEO-SMOKE-ACTUAL-PREVIEW.json`: visų 9 esamų nišų SEO regresijos PASS. Visa M4 didelio kiekio/runtime/case sritis dar nepriimta vien iš šio 11 fragmentų eksporto.

Own browser: pradinis 17 realių navigacijų/captures inventorius, visų 11 puslapių 320 px, home390 ir home/index/3guides desktop. Radinys — 320 px kategorijų grid min-content overflow, nematomas per document overflow metriką. Taisyta gift-only CSS, root isolated build perstatytas. Galutinės **6/6 navigacijos 200, jokių išsikišančių elementų, visų 3 gidų tikri vaizdai įkelti**, sources1/3/3, indexbody pilnas, form0/trackerfalse. Skip Tab/Enter fokusas MAIN. Raw/screens `output/playwright/dovanos123-integration/actual-r2-final-*`. Greitų screenshot offscreen footer paint ribos aiškiai aprašytos per-site accessibility žurnale, ne užmaskuotos deklaruojant WCAG PASS.

Actual Lighthouse aptiko dar konkrečią kategorijų indekso ir aprašo kontrasto problemą (homepage97/95/100/69, pasirinktų tekstų santykiai3,66–3,69 ir4,39–4,42). Dvi gift-only spalvos patamsintos, root kopija perstatyta. 320/390 actual computed styles ir screenshot recheck: **14 elementų kiekviename ekrane, minimalus santykis5,55015:1**, dokumento ir ekrano plotis sutampa, jokių išsikišusių elementų. Įrodymas `output/playwright/dovanos123-integration/actual-r2-contrast-qa.json`. Galutinis CSS SHA `139da37d3e772d6b53b141ee96bfa8f53752e9989ca83661faaf7cb12d2c8cc1`. Pradiniai LH failai neperrašomi; root galutinį homepage matavimą saugo atskirai.

**Sekantis straipsnių paketas:** kai AI redaktorius priims papildomus 26 straipsnius, atnaujinti uždarą patvirtintų priklausomybių paketą ir peržiūrėti 9 šiame mažame candidate laikinai atidėtas related/link-table kryptis. Sugrąžinimas atliekamas kaip nauja priimta revizija, ne perrašant esamą approval. Iš anksto patvirtinti ir į bendrą paketą įtraukti būsimi target gali turėti ateities `publishAt`; tuomet nuorodas tiksliu laiku atidengia bendroji projekcija be cron. Vien tik privataus nepatvirtinto target buvimas studijoje nei target, nei nuorodos nepaviešina.

### Galutinis vietinis checkpoint

Root `FINAL-LOCAL-REVIEW.json`2026-10-04T22:50:01Z: **ACCEPTED_FOR_LOCAL_PREVIEW_WITH_OPEN_GATES**. Final homepage Lighthouse**97/100/100/69** (LCP2266ms/TBT16ms/CLS0, colorcontrastPASS); visi3 guides**96/100/100/69**. SEO69 dėl tyčinio noindex. `ACTUAL-PREVIEW-HTTP-AFTER-CONTRAST.json` iš naujo patvirtino11 exact revizijų,15 WebP, schemų ir SEO ribas. `FINAL-V1-BASELINE.json`: main9 paketų registry SHA nepakeistas, gift mainOFF. 44 core ir23 studio PASS, lint/tsc PASS.

Bendra santrauka ir tęstinumo vartai: [CHECKPOINT](./DOVANOS123-INTEGRACIJOS-CHECKPOINT-2026-10-05.md). Tai šio koordinuoto vietinio etapo pabaiga, ne visas pasaulinis M0–M5/production/D1/inbox/privacy/voice/demand priėmimas. Nebuvo commit/push/deploy/DNS/SMTP/klientų duomenų ar užsakymų keitimo. Koordinatoriaus8930runtime paliktas peržiūrai; originalus snapshot, approvals/export ir visos baseline/after žurnalų versijos išsaugotos.
