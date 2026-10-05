# Dovanos123 prijungimas prie bendro svetainių tinklo

Data: 2026-10-04, Europe/Vilnius. Statusas: M0–M5 etapai ir pagrindiniai techniniai sprendimai suderinti su tinklo koordinatoriumi. Šiame etape keičiama dokumentacija. Migracija, DNS ir viešas diegimas dar neatlikti.

Savininko pavedimas: ši Dovanos123 sesija ir `01a0ec4c-c381-7c53-ac6e-8fc4e2755dc5` („Brainstorm niche domain monetization“) turi suplanuoti vieną bendrą tinklą. Dovanos123 lieka savarankiškas dovanų pasirinkimo portalas; bendras pagrindas aptarnauja turinį, publikavimą, nuorodas, mediją, kontaktus, matavimą ir vėliau verslo agentus.

## 1. Kas iš tikrųjų perkeliama

Viešas kelių domenų kodas jau yra `C:/Users/lenovo/Documents/dovanos-memorycasting`. Nišinių svetainių turinio studija ir agentų koordinavimas yra `C:/Users/lenovo/Documents/nisiniai_puslapiai_monetizavimui`. Visų aplankų kopijavimas į vieną katalogą nereikalingas: reikia vieno turinio šaltinio ir aiškių abiejų projektų sąsajų.

Dabartinės šakos:

- Dovanos123: `lib/content.ts`, `lib/new-articles.ts`, `lib/scheduled-articles-2026.ts`, atskiras D1 `articles/article_versions` skaitymas, `app/page.tsx`, `app/straipsniai/`, autorių ir politikų puslapiai.
- Nišos: `content-studio` → peržiūrėta revizija → `content-package.json` → importas/compile → `publicNichePages` → pasirinktos svetainės rendereris.
- Bendras operatorius ir kontaktų išimtys: `config/niche-network.json`, `lib/niche-network.ts`.
- Nišų formos/matavimas: D1, SMTP, `app/niche/[siteId]/lead` ir `interest`; agentų runtime yra atskiras FastAPI/PostgreSQL sluoksnis.

Tikslas: Dovanos123 tampa vienu tinklo `siteId=dovanos123`, valdomu toje pačioje studijoje ir tais pačiais publikavimo vartais, su atskiru dovanų dizainu. MemoryCasting pardavimas lieka atskiras prekybos adapteris. Bendras tinklas nereiškia bendro visų svetainių teksto ar vienodo maketo.

## 2. Siūlomi sprendimai

| Sritis | Sprendimas | Priėmimo įrodymas |
|---|---|---|
| Svetainės identitetas | Stabilūs `dovanos123`, `lt-LT`, `Europe/Vilnius`, `dovanos123.lt`; atskira rendererio konfigūracija | Tas pats ID studijoje, pakete, užklausose, įvykiuose ir agentų profilyje |
| URL | Išsaugoti `/`, `/straipsniai`, `/straipsniai/<slug>`, autorių bei dabartinius informacinius adresus | Prieš/po URL lentelė, canonical ir realių nuorodų crawl |
| Turinio tiesos šaltinis | Studija valdo juodraščius ir patvirtinimus; viešas build naudoja vieną patvirtintą paketą | Vienas straipsnis matomas vieną kartą; legacy failai ir D1 nekuria dublių |
| Dizainas | Išsaugoti dovanų homepage ir straipsnių patirtį per gift rendererio adapterį | Desktop/mobile ekrano palyginimas; tinkamas gift CSS be kitų nišų stilių |
| Publikavimas | Viena patvirtintos revizijos ir UTC datos projekcija | Iki termino 404 ir jokių nuorodų; po termino 200 be cron |
| Medija | Esami originalai/teisės/alt išsaugomi, WebP šeimos importuojamos bendru media pipeline | Tikri variantų failai, teisingas srcset/sizes, nepakitusių vaizdų kontrolė |
| Kontaktai | Bendras numatytasis MB Pinet / info@pinet.lt, per-site faktai ir išimtys | Kontaktai, politika, formos gavėjas ir agento žinios neprieštarauja |
| Matavimas | Bendra įvykių infrastruktūra, atskiras siteId ir Dovanos123 CTA tikslai | Patikrintas perėjimo į MemoryCasting įvykis; nevadinamas pardavimu |
| Verslo agentai | Atkuriamas Dovanos123 profilis iš viešos patvirtintos projekcijos | Kitos nišos duomenų nėra; bendro runtime įtraukimo testas |

### Turinio paketo sutartis

Dabartinė v1 schema netalpina visų dovanų straipsnių savybių. Joje yra paprasti body blokai, media, links ir externalLinks, bet nėra kategorijų, pilno šaltinių registro, aiškios pirmos publikacijos/peržiūros datos ar produkto rekomendavimo metaduomenų. Schema riboja papildomus laukus, o hash tikrina apibrėžtą turinio snapshotą.

Suderintas įgyvendinimas: `schemaVersion=2` naujam redakciniam modeliui, kartu paliekant nepakitusį v1 skaitymą ir v1 hash. V1 paketo reikšmė bei patvirtinimai nekeičiami. V2 schema, normalizavimas ir hash kontraktas turi būti vienodi studijos ir viešo rendererio pusėse. Privaloma:

1. Tas pats modelis, schema ir hash abiejose repo pusėse. Joks viešai reikšmingas naujas laukas nelieka už patvirtinimo hash ribų.
2. Senų nišų paketų hash išlieka galiojantys; jų turinys ir auditai neperrašomi dėl naujos dovanų funkcijos.
3. Išsaugomi article ID, kategorija/klasteris, tikra redakcijos/autoriaus tapatybė, šaltinių URL ir `public` matomumas, pirmos publikacijos bei reikšmingo atnaujinimo datos, `productRecommendation` ir aiškus CTA tikslas.
4. `[[tekstas|article:ID]]` konvertuojamas į struktūrizuotą, poziciją išlaikančią nuorodą. Iki tikslinio puslapio publikacijos lieka tas pats paprastas tekstas.
5. Home, straipsnių indeksas, autoriai, privatumas ir kontaktai gauna tinkamą puslapio semantiką; nededama `Service` vien dėl studijos bendros `type` kategorijos.
6. `slug=straipsniai/<senas-slug>` išsaugo dabartinį adresą. Query filtrai `?tema=...` išlieka veikiančios indeksų funkcijos, bet nėra automatiškai atskiri canonical URL.

Author/source/CTA registrai nėra mutable approval apėjimas: eksportas užfiksuoja konkrečius viešų entity snapshotus arba jų dependency hash. Pakeitus autorystę, šaltinio faktus ar produkto tikslą reikia naujos revizijos. Privatūs šaltiniai ir jų turinys nepatenka į viešą paketą, HTML ar LLM išvestis. `publishAt`, tikra pirmos publikacijos data, reikšmingas `dateModified` ir `approvedAt` yra skirtingos reikšmės. Legacy `sites.key`, D1 vidinio ID ir agentų `business_id` atitikmenys dokumentuojami, ne suplakami į vieną ID.

## 3. Migracijos darbų eilė ir atsakomybės

### M0 — inventorius ir grįžimo taškas

**Dovanos sesija:** sudaro URL/article ID/site/locale/datos/būsenos/šaltinių/vaizdų/nuorodų inventorių ir dabartinio gift rendererio snapshotą. Jei egzistuoja tikras viešas diegimas, inventorius lyginamas ir su juo; vietinė kopija nelaikoma gyvo turinio įrodymu. Prieinami D1 duomenys eksportuojami tik iš patvirtintos aplinkos, ne iš tuščios QA bazės.

`lib/content.ts` naudoja `Date.now()` demo publikavimo datoms. Migracija fiksuoja vieną inventorių ir atskirai nustato tikras datas; pakartotinis importas negali perrašyti pirmos publikacijos šiandienos data. Dabartinės būsenos `published/scheduled` nėra naujo AI redaktoriaus patvirtinimo įrodymas.

**Tinklo koordinatorius:** patvirtina modelio, registrų ir shared failų savininkus bei darbų langus pagal savo `WORKSTREAMS.md`.

**Rezultatas:** `migration/dovanos123/<snapshot-id>/` inventorius, hash, URL žemėlapis, originalūs duomenys ir būsimas rollback manifestas. Dar niekas nepersijungia viešai.

### M1 — modelis ir importas į studiją

**Tinklo koordinatorius:** studijos modelis/schema, importo kontraktas, kalendorius ir tinklo katalogas.

**Dovanos sesija:** vienkartinis idempotentinis legacy→studio adapteris, dovanų lauko atitikmenys ir turinio praradimo ataskaita.

Importas atnaujina pagal stabilų site/article ID, praneša apie slug/ID kolizijas ir neperrašo naujesnės redaguotos revizijos. Juodraščiai ir nepatikrintos suplanuotos publikacijos lieka privačios. Esamos 20 datų iki 2026-10-23 išsaugomos kaip planas; pasibaigusios datos savaime nepublikuoja importo. Redaktoriaus agentas peržiūri konkrečią reviziją, faktus, šaltinius, produkto tinkamumą ir nuorodas, tada įrašo hash susietą approval. Kasdienė žmogaus redaktoriaus patikra nėra numatoma.

**Rezultatas:** Dovanos123 matomas bendroje GUI, kalendoriuje ir nuorodų plane; privačioje peržiūroje išsaugotas tekstas ir URL.

Importas vyksta shadow režimu, be viešo host aktyvavimo. Dabartinis `proxy.ts` tikrina `nicheSiteByHost` prieš legacy domenus: vien įjungtas Dovanos123 paketas perimtų domeno adresus į niche catchall, dar nesukūrus gift-aware routing. Privačios peržiūros/studijos registracija ir viešo domeno maršrutizavimo aktyvacija turi būti atskiri veiksmai. Legacy host aptarnavimas iki M5 lieka nepakeistas.

### M2 — dovanų rendereris ant bendros publikavimo projekcijos

**Dovanos sesija:** gift adapteris, homepage/kategorijų/straipsnių/autorių skaitymas iš paketo, metaduomenys ir speciali straipsnio išvaizda.

**Koordinuotas shared langas:** registry, host resolveris/proxy, route dispatch, paketo validatorius/compile, bendros SEO/media funkcijos. Savininkas vienas kiekvienam shared failui per pakeitimo langą; kitos sesijos tikrina rezultatą.

HTML, sąrašai, sitemap, LLM išvestys, schemos ir nuorodos gauna tą patį `publicPages(siteId, locale, now)` inventorių. Senas gift D1/failų turinio kelias nėra jungiamas kaip nematomas fallback. Atšauktas straipsnis negali grįžti iš demo failo. Senas workeris po perkėlimo nebevaldo Dovanos123 viešumo; foniniai darbai gali tvarkyti įvykius, bet nėra straipsnių atidengimo sąlyga.

Publikavimo laikas vertinamas užklausos metu. HTML, sitemap ir kitos live projekcijos negali likti build-time snapshotu ar neribotai užkešuotos po būsimos publikacijos ribos. Jei vėliau naudojamas cache, jo galiojimas ribojamas artimiausiu publikavimo terminu ir revizijos atšaukimo invalidacija; M5 bandymas tikrina ir anksčiau užkešuotą atsakymą. „Be cron“ reiškia, kad po termino turinys matomas naujoje užklausoje, o ne savaiminį jau atverto naršyklės lango atnaujinimą.

**Rezultatas:** atskiras vietinis production build su Dovanos123 kanoniniu Host, visais senais adresais ir laiko ribos integraciniu bandymu.

### M3 — tinklo nuorodos, produktai ir medija

**Dovanos sesija:** prasmingos dovanų/MemoryCasting/kitų dovanų produktų rekomendacijos, santykio atskleidimas ir medijos inventorius.

**Tinklo koordinatorius:** registry ir `projectPublicPages`/network catalog integracija.

Redakcinė tinklo nuoroda turi konkretų target site/page ID, tikrą auditorijos naudą ir tikslinės revizijos/datos/diegimo patikrą. Būsimas ar atšauktas target lieka tekstu. Network stage ir `networkLiveDomains` atnaujinami pagal faktinį diegimą, ne dėl to, kad yra planas. Komercinių tikslų registras netampa bendru nuosavų domenų išimties mechanizmu, kuris apeitų šiuos redakcinės publikacijos vartus.

MemoryCasting ar Shopify nėra priverstinai imituojami kaip nišinio straipsnio paketas. Jiems numatomas atskiras patikrintų komercinių tikslų registras: tikras URL, savininkas, tikslinis produktas/pasiūlymas, prieinamumas, komercinis ryšys ir patikros laikas. Nuorodos tikslas tikrinamas pagal normalizuotą canonical destination; leidžiami UTM parametrai nesukuria netikro kito tikslo. Dabartinis exact URL/package-only filtras turi būti pritaikytas prieš registruojant parduotuvės domeną kaip nuosavą taikinį.

Esamų gyvų vaizdų URL išsaugomi arba turi aiškų atitikmenį; failai nedalinami tarp nišų vien dėl bendro katalogo. Būsimų straipsnių medija naudoja bendrą publikavimo filtrą. Procesinės Google/SEO gairės lieka privačiais redakciniais šaltiniais, kaip savininkas jau nurodė.

### M4 — kontaktai, matavimas ir agentų profilis

**Tinklo koordinatorius:** bendri contact/form/events kontraktai. **Jo paskirtas voice/core savininkas:** savo runtime, Dovanos123 profilis, knowledge ir CaseSource integracija. **Dovanos sesija:** matomi gift kontaktai, CTA ir tikrų turinio faktų adapteris. Host→site resolveris yra serverio tikrinamas; paslėptas naršyklės `siteId` nėra tapatybės įrodymas.

1. Tikri Dovanos123 operatoriaus/kontaktų duomenys patenka į studiją, politikų tekstus, formą ir žinių projekciją. MB Pinet numatytasis profilis savaime nekeičia MemoryCasting parduotuvės juridinio pardavėjo. Nežinomi rekvizitai neįrašomi iš kitos nišos.
2. Dovanos123 klaidų/partnerystės/pagalbos forma naudoja patvarų D1 įrašymą ir bendrą gavėjo transportą. SMTP gedimas nepašalina įrašo. Pranešimas ir agento automatinis atsakymas turi atskirus kvitus bei būsenas.
3. Bendra matavimo schema praplečiama Dovanos123 reikalingais `product_outbound_click`, `network_outbound_click` ir `form_submitted`, su `siteId`, page ID ir target ID. Dabartinis nišų trackeris matuoja pageview/mailto/tel; produkto perėjimų jame dar nėra. Kliento vardas, email ar tekstas nekeliauja į analitikos įvykius.
4. Pardavimas patvirtinamas tik parduotuvės faktiniu užsakymo įvykiu. Kol prekybos integracija neprijungta, rodoma perėjimų/užklausų suvestinė, ne išgalvotos pajamos ar individuali atribucija.
5. Agentų runtime gauna `dovanos123` profilį, leidžiamą viešą žinių manifestą ir atskirus case/source IDs. Svetainės D1 įrašo importas turi idempotency/cursor bei site/aplinkos ribas; jis lieka atskiras nuo nepatvirtintos produkcinės D1 sinchronizacijos. Agentai neskaito juodraščių kaip žinių ir neskolina kitų nišų kainų, klientų ar instrukcijų. Naujos svetainės išorinės/mokamos capabilities pagal nutylėjimą išjungtos, kol priimtas konkretus adapteris ir jo politika.
6. Balso, Shopify užsakymų, automatinių išorinių laiškų ir socialinių kanalų įjungimas yra atskiri vėlesni rezultatai su realiais adapteriais. Vien registracija tinkle jų neįjungia.

#### M4 priklausomybės po voice/core peržiūros

2026-10-04 tinklo koordinatorius papildomai patikrino core savininko nurodytas ribas ir įrašė jas bendroje sutartyje. Ši sesija priima šiuos planavimo reikalavimus; runtime šiame etape nekeičiamas:

- Dabartinis knowledge kontraktas leidžia iki 30 puslapių, vieno puslapio tekstą iki 18000 ir atskirą revocation hash batch iki 30. Prieš Dovanos123 onboarding core savininkas suprojektuoja version-aware riboto dydžio manifestą, retrieval ir atšaukimo paketų strategiją. Tai skirtingi apribojimai: negalima tiesiog tyliai palikti pirmų 30 straipsnių ar nukirsti ilgą gidą. Visas viešas turinys turi likti pasiekiamas sutartu būdu.
- Dabartiniai v1 `network_manifest.mjs` ir `lib/niche-voice.ts` skaitytuvai neapdoroja v2 inline/editorial modelio. Reikalingas normalizuotas v2 žinių skaitytuvas iš tos pačios viešos projekcijos kaip gift HTML. Jokio `[object Object]`, žalių legacy tokenų, privataus šaltinio ar būsimo target nutekėjimo. Originalus revision hash, filtered projection hash ir manifest/deployment identity apima sutartus faktus bei target/URL versijas.
- Esamas D1 importas priima `website_d1`, UUID įrašo ID, `new/notified` būsenas, `consent_at=created_at`, tvarką `(created_at,id)` ir batch iki 30. Nauja gift forma gali kurti šį shared kontraktą, tačiau senų įrašų ar commerce įvykių negalima jam pritaikyti išgalvojant UUID, sutikimą ar laiką. Kitokiam šaltiniui reikia atskiro adapterio arba versioned importo evoliucijos su kilmės, deduplikavimo ir pranešimo savininko taisyklėmis. Replay nepakartoja jau išsiųsto operatoriaus SMTP.

Pilną runtime sutartį ir jos fixtures rengia voice/core savininkas; Dovanos sesija teikia viešo modelio ir senų duomenų atitikmenis. Šis papildymas nekeičia M0–M5 etapų ar jų savininkų.

### M5 — priėmimas ir persijungimas

**Abiejų sesijų patikra:** Dovanos sesija atsako už gift puslapių ir turinio išsaugojimą, tinklo koordinatorius už kitų nišų regresijas/studiją/agentų sutartį.

Privalomi įrodymai:

- Importo skaičiai ir turinio atitikimas: nė vienas straipsnis, šaltinis, alt tekstas ar vidinės nuorodos vieta nepradingo tyliai.
- Patvirtinto būsimo straipsnio T−1/T/T+1 bandymas be cron; tiesioginis URL, home/index, autoriai, sitemap, JSON-LD ir abu LLM failai suderinti.
- Pending/rejected/edited/revoked revizijos neviešos; senas ID/slug tombstone neleidžia jų atkurti legacy šaltiniu.
- Visi svarbūs adresai 200 su vienu kanoniniu origin; neteisingas host ir būsimas slug 404; www→apex; kitų site turinys nepatenka į gift atsakymą.
- Dovanos123 vizualus desktop/mobile, naršymas/kategorijos, klaviatūra, schemos, vaizdai, tikros vidinės/išorinės nuorodos ir formos kvitas. Atskirai išmatuotas production-build Lighthouse, o ne kitos nišos skaičiai.
- Nuo bendros pataisos paveiktų nišų core ir SEO smoke regresijos; studijos eksporto/importo e2e abiem schema versijoms, nepakitęs v1 hash ir naujų viešų v2 laukų hash/approval testai.
- Agentų žinių testai su 31+ puslapiu ir ilgu gidu: jokių tylių praradimų, v2 žinių ir gift HTML semantinis atitikimas, visų revocation batch replay bei site/aplinkos izoliacija. D1 importo testai tikrina senų ID/sutikimo kilmę, tvarką, deduplikavimą ir tai, kad replay pakartotinai nesiunčia SMTP; commerce įvykis nevirsta fiktyvia kliento užklausa ar pardavimu.
- Tikras DNS/HTTPS, operatoriaus/privatumo duomenys, produkto kelias ir realaus diegimo patikra užfiksuojami atskirai nuo vietinio PASS. Dovanos123 į gyvų domenų registrą patenka tik po šio bandymo.

Persijungimas atliekamas per aiškų per-site pasirinkimą ir vieną patikrintą release. Nekopijuoti esamų D1 schemų ant kito domeno tikros bazės ir nevykdyti seeding produkcijoje automatiškai. Esami URL nenuimami vien dėl techninio pertvarkymo; jei paaiškėtų būtinas pakeitimas, sudaromas tikslus atitinkamų adresų redirect žemėlapis.

## 4. Rollback ir likę nežinomi faktai

Rollback grąžina Dovanos123 į prieš migraciją užfiksuotą rendererio/turinio konfigūraciją, ne visą tinklą į seną versiją. Nauji užklausų įrašai ir patvirtintos redakcinės revizijos išsaugomi. Jei nauja projekcija klaidinga, sustabdomas tik Dovanos123 importo/publikavimo pakeitimas; kitų nišų paketai neperrašomi.

Grįžimo snapshot taip pat taiko nuo M0 atsiradusius revocation/tombstone: po migracijos atšauktas straipsnis negali grįžti iš seno snapshot. Jei šio išsaugojimo užtikrinti negalima, klaidingas turinys uždaromas, o ne atkuriamas nefiltruotas demo kelias. Per-site cutover inventorizuoja senus pending publikavimo darbus ir outbox/event IDs, bet vien planas neautorizuoja jų trinti.

Dar patvirtinti: faktinė Dovanos123 domeno nuosavybė/DNS/diegimas, tikras viešas turinio inventorius ir D1 aplinka, pilni operatoriaus rekvizitai, vaizdų kilmė/teisės ir galiojantis MemoryCasting pirkimo kelias. 2026-10-04 iš šios sesijos `curl` dovanos123.lt DNS neišsprendė; tai prieinamumo radinys šioje aplinkoje, ne įrodymas, kad domenas niekam nepriklauso. MemoryCasting Shopify anksčiau savininko išjungtas; gyvas landing savaime nepatvirtina checkout veikimo.

Metinis turinio planas lieka perkeliamas redakcinis planas, ne jau parašytų ir patvirtintų metų straipsnių paketas. Pirmas perkėlimo rezultatas yra esamas turinys ir bendras valdymas; tolimesnis generavimas vyksta toje pačioje studijoje po importo priėmimo.

## 5. Koordinavimo įrašas

2026-10-04: savininko autorizuota žinutė išsiųsta tinklo koordinatoriui; papildomai perduoti demo datų, schemos/hash bei MemoryCasting UTM/komercinių tikslų filtravimo radiniai. Koordinatorius perskaitė šį planą, pritarė M0–M5 etapams ir pasiūlė v2 su nepakitusiu v1 skaitymu/hash. Ši sesija priėmė sprendimą ir įtraukė jo pastebėtą shadow importo bei host aktyvavimo atskyrimą. Abu koordinatoriai sutaria dėl atskiro commerce registro, canonical destination ir leidžiamų attribution parametrų sąrašo. Keičiasi tik planavimo dokumentai; schema, paketai, DNS, build ir runtime pagal šį pavedimą dar neliečiami.

Tinklo koordinatorius parengė [bendro core migracijos sutartį](C:/Users/lenovo/Documents/nisiniai_puslapiai_monetizavimui/DOVANOS123_CORE_INTEGRATION.md) ir source fingerprint inventorių `research/dovanos123-integration-2026-10-04/SOURCE-FACTS.json`. Ši sesija perskaitė sutartį ir patvirtino savininkus bei priėmimo vartus. Į šį planą papildomai įtraukti entity snapshot/hash, ID atitikmenų, serverio host resolverio, voice/core atsakomybės ir saugaus rollback revocation reikalavimai. Abu dokumentai sutampa dėl etapų ir sprendimų; detalūs v2 laukai/fixtures užfiksuojami M1, ne išgalvojami šiame plane. Source fingerprint yra inventoriaus įrodymas, ne runtime testas.

Vėlesnis tos pačios dienos M4 papildymas: perskaitytos bendroje sutartyje įrašytos knowledge/manifest/revocation ir D1 importo ribos; į šio plano M4 bei M5 įtrauktos jų priklausomybės ir priėmimo testai. Tai papildomas planavimo suderinimas, ne įgyvendintos integracijos deklaracija.
