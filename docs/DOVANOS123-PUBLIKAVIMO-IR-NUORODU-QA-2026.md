# Dovanos123.lt publikavimo ir vidinių nuorodų QA

**Data:** 2026-09-28. **Apimtis:** statinis repo auditas; kodas, DB ir vieša aplinka nekeisti. Tai įgyvendinimo specifikacija, o ne patvirtinimas, kad produkcijoje nurodyti scenarijai jau veikia. `memocasting.lt` Shopify išjungtas sąmoningai; checkout bandymas atidėtas ir nėra šio QA dalis.

## Sprendimo taisyklė

Vienintelė viešo matomumo funkcija turi atsakyti į klausimą `isPublic(article, version, now, site, locale)`. Ji grąžina `true` tik kai **ta pati nekintama versija** turi įrašytą teigiamą redakcinį patvirtinimą, priklauso aktyviai svetainei ir teisingai lokalei, nėra atšaukta, jos `publishAt <= now` (UTC momentas), o URL ir turinio vientisumas galioja. Publikavimo darbas ir DB `publicationState` yra šios taisyklės aptarnavimo/projekcijos mechanizmai, o ne savarankiškas leidimas rodyti turinį. `pending`, atmestas, nepatikrintas ar vien `requestedState: scheduled` straipsnis negali tapti viešas vien dėl praėjusio laiko.

Patvirtintas `scheduled` straipsnis turi atsiverti nuo pirmos užklausos po `publishAt` **be cron**: serverio skaitymas vertina dabartinį laiką ir patvirtintą versiją. Workeris gali siųsti įvykius, atnaujinti indeksus ir invalituoti cache, bet jo neveikimas negali užlaikyti patvirtinto straipsnio. Visos viešos projekcijos turi naudoti tą pačią funkciją ir tą patį versijos snapshotą: straipsnio URL, sąrašai, pagrindinis puslapis, autoriaus puslapis, vidinės nuorodos, sitemap, canonical, `hreflang`, `llms.txt`, `llms-full.txt` ir JSON-LD.

## Faktinis repo kelias ir radiniai

| Lygis | Įrodymas kode | QA išvada |
|---|---|---|
| Statiniai gidai | `lib/content.ts` sujungia `NEW_ARTICLES` ir `SCHEDULED_ARTICLES_2026`; `isLive` leidžia `published` **arba** `scheduled`, kai `publishAt <= now`. `lib/scheduled-articles-2026.ts` įrašo `publicationState: "scheduled"` ir 07:30 `+03:00`; `docs/SCHEDULED-ARTICLES-2026-09-28.md` numato 20 datų. | Laiko atskleidimas be cron jau yra, bet `scheduled` eilutė pati nereiškia patvirtinimo. Reikalingas atskiras versijos patvirtinimo įrodymas / build vartas. Dabartinės nurodytos datos baigiasi 10-23, prieš Vilniaus vasaros laiko pabaigą; ateities kalendoriui fiksuoto `+03:00` neužteks. |
| DB ingest | `app/api/ingest/articles/route.ts` priima `requestedState: "scheduled"`, sukuria `article_versions.reviewMetadataJson: {status:"pending"}` ir iškart `publish_jobs` su būsena `pending`. `lib/ingest.ts` validuoja formatą, bet ne redakcinį patvirtinimą. | **P0:** nepatikrintas turinys suplanuojamas automatiškai. API atsakymo `state: scheduled` negalima interpretuoti kaip leidimo skelbti. |
| Workeris | `lib/scheduler.ts` pagal due job pakeičia `articles.publicationState` į `published`; neįkelia ir netikrina `articleVersions.reviewMetadataJson`. Pirmo publikavimo šakoje tikrinama `publicationState: scheduled`, ne `publishedVersionId IS NULL`; atnaujinimas ir outbox nėra vienoje transakcijoje. `app/api/internal/publish-due/route.ts` priklauso nuo išorinio POST su tokenu. | **P0:** workeris gali paskelbti `pending` versiją. **P1:** nutrūkus tarp DB atnaujinimo ir įvykio lieka iš dalies atlikta publikacija; konkuruojantys/stale jobai reikalauja griežtesnio version CAS ir idempotencijos. Cron nebuvimas DB straipsnį dabar užlaiko. |
| Skaitymas ir demo | `lib/content-store.ts` DB atrenka tik `publicationState="published"` ir `publishAt<=at`, tada prijungia `demoPublishedArticles`; kai nėra aktyvaus DB site ID arba užklausa meta klaidą, grąžina demo sąrašą. DB `publishedVersionId` bei review būsena netikrinami; `toArticleRecord` ima `articles.blocksJson`, ne patvirtintą `articleVersions.contentSnapshotJson`. | **P0:** viešas turinys nepririštas prie patvirtinto snapshot. Tas pats slug/id su nepublikuotu DB įrašu neužgožia demo straipsnio; DB gedimas gali grąžinti seną, atšauktą ar nebetinkamą demo turinį. |
| Nuorodos | `app/straipsniai/[slug]/page.tsx` `[[tekstas|article:ID]]` paverčia `<Link>` tik jei ID yra `publishedArticlesFromStore` žemėlapyje; kitaip palieka tekstą. Related blokas taip pat filtruoja pagal tą žemėlapį. `app/page.tsx` ir `app/straipsniai/page.tsx` nuorodas sudaro iš sąrašo. | Kryptis gera: būsimo URL nuoroda neturi būti sukurta per anksti. Tačiau visų paviršių saugumas priklauso nuo klaidingos bendros matomumo funkcijos, o nepriklausomai kešuoti šaltinis ir paskirties URL gali trumpam sukurti 404. |
| Paieškos paviršiai | `app/sitemap.ts`, `app/llms.txt/route.ts`, `app/llms-full.txt/route.ts` ima tą patį sąrašą. Pastarieji grąžina `Cache-Control: public, max-age=300`. `app/robots.ts` leidžia viešą svetainę, blokuoja `/admin/`, `/api/`, `/preview/`. | Visi gali paveldėti per ankstyvą publikavimą ar demo fallback. 5 min. cache gali užlaikyti nuorodų atsiradimą/atšaukimą. Robots neužtikrina, kad jau indeksuotas nepatvirtintas URL išnyks; jo apsauga turi būti HTTP/HTML sluoksnyje. |
| Canonical ir host | `lib/site-config.ts` parenka site pagal host, bet `siteOrigin(site, host)` grąžina **užklausos** host. Straipsnio metadata, JSON-LD, sitemap ir llms generuoja URL iš jo. `www` yra atskiras leidžiamas host. | **P1:** `www`/apex ar nepažįstamas host gali sukurti skirtingus self-canonical ir sitemap URL. Reikia vieno konfigūruoto kanoninio host kiekvienai svetainei ir redirect iš alternatyvių hostų. |
| Sitemap datos | `app/sitemap.ts` statiniams ir autorių URL `lastModified: new Date()` kiekvienoje užklausoje, straipsniui naudoja `publishAt`. Straipsnio JSON-LD `dateModified` irgi lygus `publishAt`. | **P1:** `lastmod`/`dateModified` turi reikšti tikrą turinio pakeitimą, ne užklausos laiką ar planavimo datą po vėlesnio redagavimo. |

`vercel.json` turi build/install nustatymus, bet neturi cron deklaracijos. `.openai/hosting.json` nurodo D1 `DB` bindingą; vien to nepakanka patvirtinti, kad produkcijoje prieinamas DB, darbo kvietėjas ar viešas domenas. `docs/OPERATIONS.md` pats pažymi privačios Sites edge prieigos kliūtį cron kvietimui. Live HTTP/DB nebandyta, todėl tai yra kodo kelio, ne produkcijos būsenos, išvados.

## Autoritetingas publikavimo modelis

**Duomenys.** Kiekvienas straipsnis turi stabilų `(siteId, locale, slug, articleId)`. Kiekviena versija yra nekintamas `content + SEO + schema + links + media` snapshotas su hash. Patvirtinimo įrašas nurodo būtent `versionId`, patvirtinimo laiką, aktorių / redakcinę atsakomybę, privalomų QA vartų rezultatą ir nepakeičiamą hash. `publishAt` saugomas UTC; redaktoriui rodoma `Europe/Vilnius` laiko juosta ir užrašomas pasirinktas vietinis laikas, kad DST nebūtų interpretuojamas iš ranka kartojamo offset. Atskirai laikomas `revokedAt` arba išpublikavimo įvykis. Kintantis `articles.blocksJson` neturi būti viešo turinio šaltinis po patvirtinimo.

**Būsenos.** `draft/review` → `approved` → `scheduled` (jei laikas ateityje) → **viešai matomas pagal predikatą** (nuo termino) → `unpublished/revoked`. `scheduled` yra tik patvirtintos versijos planas; ingest `requestedState` gali išreikšti norą, bet negali pats pervesti į šią būseną. Redagavimas po patvirtinimo sukuria naują `versionId` ir grąžina naują versiją į `review`; ankstesnė patvirtinta versija lieka vieša iki aiškaus saugaus pakeitimo arba atšaukimo. Pirmoji publikacija ir pakeitimas turi vienodą versijos patikrinimą. Tik aiškus atšaukimas nuima gyvą versiją.

**Vienas predikatas.** Konceptualiai:

```text
isPublic(v, a, site, locale, now) =
  site.active && a.siteId == site.id && a.locale == locale
  && a.selectedVersionId == v.id && v.articleId == a.id
  && v.review.status == "approved" && v.approvedHash == hash(v.snapshot)
  && !a.revokedAt && a.publishAt != null && a.publishAt <= now
  && validCanonicalSlug(a) && requiredPublicQA(v).passed
```

Tiksli išraiška gali skirtis, bet visi vieši skaitymai turi kviesti vieną realizaciją. `publishedVersionId` gali žymėti pasirinktą versiją, tačiau dėl cron neveikimo neturi būti nustatomas tik workeryje: patvirtinto plano versija atrenkama prieš terminą ir matoma po termino. Neįvykęs jobas nekeičia `isPublic`; jobas gali tik koordinuoti cache invalidavimą, išorinį indeksą ir pranešimus. Jei DB neprieinamas, DB turiniui atsakoma uždaru režimu (ne 200 su demo pakaitalu); kuratorių failų turinys gali būti viešas tik pagal atskirą, versijuotą ir patvirtintą manifestą. Repo failo `publicationState: "scheduled"` vienas pats nėra toks įrodymas.

**Vienas URL inventorius.** Iš `publicArticles(site, locale, now)` formuojami visi kortelių, susijusių, teksto `article:ID`, autoriaus, sitemap ir llms URL. Nuoroda kuriama tik jei paskirties straipsnio URL tame pačiame inventoriuje atiduoda 200 su tiksliniu snapshotu. Būsimas ar atmestas `article:ID` tampa paprastu tekstu; išorines HTTPS nuorodas tikrinti atskirai. Automatinis related parinkimas negali įtraukti kitos svetainės ar lokalės. Slug/id kolizija tarp D1 ir curated failų turi būti sprendžiama pagal aiškų šaltinio prioritetą: aktyvioje DB aplinkoje DB tombstone užgožia tą patį curated identitetą; demo neturi tyliai „prikelti“ atšaukto URL.

**Laikas ir cache.** Nuo `publishAt` pirmoji nauja užklausa turi vertinti `now` serveryje. 200 puslapio cache negali išsilaikyti per būsenos ribą be suplanuoto pergaliojimo; 404 prieš terminą, sąrašai ir nuorodų šaltiniai taip pat negali būti užkešuoti taip, kad po termino rodytų nesuderintą būseną. Saugi pirma realizacija: `no-store` visiems laikui jautriems HTML, sitemap ir llms atsakymams, tada įdiegti ribotą TTL / atominį invalidavimą ir išmatuoti blogiausią vėlavimą. Skirtingų užklausų to paties sekundės momento atominės momentinės nuotraukos garantuoti nereikia, bet niekada negalima pateikti HTML nuorodos į 404 dėl pasenusios paskirties cache. Atšaukimas turi turėti aukščiausią invalidavimo prioritetą.

**Nesėkmė ir auditas.** Patvirtinimas, planas ir versijos pointeris turi būti rašomi transakcijoje su tiksliu compare-and-swap; outbox įvykis dedamas toje pačioje transakcijoje. Jobų perėmimas, retries ir expired lease reikalingi foniniam darbui, bet viešumas nepriklauso nuo jų. Jokio tylaus `catch { return demoPublishedArticles(...) }` realioje aplinkoje. Stebėti `pending review` + due kombinacijas, neatitinkančius hash, DB klaidas, būsimo URL patekimą į sitemap/nuorodas, 404 iš gyvos nuorodos, cache vėlavimą ir duplicate canonical.

## QA testų matrica

| Scenarijus | Tikėtinas rezultatas | Tikrinami paviršiai |
|---|---|---|
| Naujas `review/pending`, `publishAt` praeityje ir ateityje; su `requestedState: scheduled` | Niekada negauna viešo 200, nuorodos, sitemap/llms įrašo ar JSON-LD. Workeris negali pakeisti išvados. | Ingest → DB → workeris → visi vieši paviršiai |
| Patvirtintas būsimas snapshot, laikas `T−1 ms` | Straipsnis 404 / neviešas; nėra jo URL sitemap, kortelėse, related, teksto nuorodose, llms; tekstas apie būsimą gidą lieka nenuorodinis. | Tiesioginis URL, namai, sąrašai, autoriai, sitemap, llms |
| Tas pats snapshot `T` ir `T+1 ms`, workeris niekada nekviestas | Tiesioginis URL 200; matomas vieną kartą visuose sąrašuose; tik tada atsiranda inbound nuorodos ir sitemap/llms; canonical rodo į tą patį 200 URL. | Užklausų laiko injekcija, D1 ir failų adapteriai |
| Darbo eilė vėluoja, du workeriai konkuruoja, lease baigiasi, POST kartojamas | Viešas rezultatas nesikeičia; vienas pasirinktasis version snapshot ir vienas loginis įvykis, be senesnės versijos perrašymo. | CAS, outbox, idempotencija, retries |
| Patvirtintas v1 gyvas, v2 `pending` arba atmestas; v2 due job pasenęs | Viešai lieka v1; v2 nepasirodo nei body, nei SEO, nei schema, nei llms; v2 jobas praleidžiamas / žymimas klaida. | Versijų pointeris ir snapshot atitikimas |
| Redaguota v2 patvirtinama po v1; nutraukimas tarp update ir outbox | Atominiu būdu matoma tik v1 arba tik v2, niekada v2 su v1 metadata; outbox įvykį galima atkurti. | Transakcija, atkūrimas |
| Atšaukimas / `unpublished`; DB klaida ar neaktyvus site | URL dingsta iš visų paviršių; DB klaida neatkuria demo dublerio; nėra 200 su svetimu/stenu turiniu. | Fallback, tombstone, sitemap, cache |
| Curated ir DB turi vienodą ID arba slug; skirtingi site/locale turi panašius ID | Tik vienas teisingas URL ir tik tos pačios svetainės/lokalės nuorodos; DB atšaukimas neleidžia curated pakaitalo. | Dedup ir vidinis grafas |
| Ties `T` kešas turi ankstesnį 404 arba kortelę; atšaukimo metu seną kortelę | Nėra gyvos nuorodos į 404; nustatytas maksimalus aptarnavimo vėlavimas ir jis išmatuotas. | CDN/edge/Next cache, HTTP antraštės |
| `www`, apex, nežinomas host, query filtras | Vienas konfigūruotas HTTPS canonical host; alternatyvos redirect arba grąžina kanoninį URL; sitemap turi tik kanoninius 200 URL. | Metadata, JSON-LD, sitemap, robots, redirects |
| Tikras turinio atnaujinimas ir tuščia pakartotinė užklausa | `lastmod`/`dateModified` keičiasi tik po turinio pakeitimo; teisinga publikavimo data. | Sitemap ir Article JSON-LD |
| Vilniaus laikas aplink DST, negaliojantis/nevienareikšmis vietinis laikas | UTC momentas aiškiai apskaičiuotas; numatyta vietinė 07:30 reiškia tą laiką nurodytą dieną. | Planavimo įvestis, UI, testinis laikrodis |

Automatinis integracinis testas turi rinkti HTML `<a href>`, sitemap `<loc>` ir llms URL, kiekvieną vidinį straipsnio URL atidaryti tame pačiame site/locale ir tikrinti 200 bei canonical atitikimą. Prieš `T` 404 turi būti tikras HTTP 404, o ne 200 klaidos tekstas. Tikrinti, kad nė vienas `pending` `versionId` nepatenka į atsakymo body, metadata ar JSON-LD. Vykdyti matricą be cron ir atskirai su vėluojančiu/konkuruojančiu workeriu. Tai yra siūlomi testai; šiame read-only audite jie nebuvo paleisti.

## Remonto seka

### P0 — prieš DB turinio viešinimą

1. Uždaryti `requestedState: scheduled` kelią ties ingest: įkelti tik į `review`, nekurti vykdomo publish job, kol nėra konkretaus `versionId` teigiamo review/QA įrašo. Atskirą patvirtinimo operaciją padaryti audituojamą ir idempotentinę. Jei norima automatizuoto AI redaktoriaus, jis turi užrašyti realų patikros rezultatą konkrečiam snapshotui; vien modelio sugeneruota būsena nėra patikra.
2. Įdiegti vieną `isPublic` / `publicArticles` skaitymo sluoksnį. DB skaityti patvirtintą nekintamą snapshotą ir terminą; workerio `published` vėliava negali apeiti review. Curated suplanuotiems failams sukurti patvirtinimo manifestą / build patikrą, kad jų dabartinis cron-free atskleidimas būtų pagrįstas. Neįrodyto failo nepublikuoti automatiškai.
3. Panaikinti tylią DB→demo degradaciją produkcijoje ir įvesti tombstone/aiškų šaltinio prioritetą. Patikrinti visus galimus DB + curated ID/slug susidūrimus ir atšaukimą.
4. Visus URL ir nuorodų generuotojus perjungti į tą pačią viešų snapshotų projekciją; iki cache sutvarkymo naudoti `no-store` laiko ribą kertantiems atsakymams. Priėmimo vartas: pirmoji užklausa po `T` rodo tik patvirtintą straipsnį be cron, iki `T` nėra nė vienos nuorodos į jo 404.

### P1 — po P0 saugos vartų

1. Workerio DB pakeitimą ir outbox rašyti vienoje transakcijoje; tikrinti `articleId`, `versionId`, patvirtinimo hash, norimą pointerį, `publishAt`, revoke ir seną pointerį per CAS. Numatyti lease atkūrimą bei pasenusių jobų užbaigimą.
2. Įvesti kanoninio host registrą kiekvienai svetainei, `www`→apex (arba atvirkščiai) redirect ir atmesti nepažįstamą `Host`; sitemap, metadata, JSON-LD ir llms naudoti tą patį origin.
3. `lastModified` ir `dateModified` grįsti tikrais versijos pakeitimais; peržiūrėti `llms*` 300 s cache ir indeksų invalidavimą. Stebėti laiko SLA, paskirties 404, DB klaidas, pending due jobus ir canonical dublius.
4. Atlikti automatinę URL grafiko patikrą prieš kiekvieną viešinimą ir po laiko ribos; tikrinti atsitiktinius viešus URL rankiniu Google URL Inspection / Search Console, kai vieša prieiga bus įjungta.

## SEO taisyklių šaltinių patikra

Perskaityti pateikti `SEO SKILLS/internal-linking/SKILL.md`, `seo-audit/SKILL.md`, `on-page-seo-checklist/SKILL.md` ir `generative-engine-optimization/SKILL.md`. Jie naudingi kaip redakciniai kontroliniai sąrašai (tikros, kontekstinės nuorodos; nemeluoti apie metrikas; tikrinti matomą turinį), bet nėra Google indeksavimo taisyklių šaltinis. Ypač `on-page-seo-checklist` teiginys „be schema nėra AI Overview eligibility“ yra neteisingas. `generative-engine-optimization` reikalavimas pridėti `Article + FAQPage + Organization + Person`, tariamos garantuotos AI citatos ar konkretus 40–60 žodžių formatas nėra Google sąlyga. Schema turi atitikti matomą turinį; `FAQPage` nedėti vien dėl „AI“ tikslo. `internal-linking` 3 paspaudimų ir 30–60 nuorodų skaičiai yra heuristikos, ne Google ribos. `llms.txt` čia yra papildomas projekto išvesties formatas, ne Google AI funkcijų reikalavimas.

Oficiali Google Search Central dokumentacija:

- [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features): AI Overviews/AI Mode neturi specialios schema ar `llms.txt` sąlygos; reikia įprasto indeksuojamo puslapio su snippet galimybe, o matomumas negarantuotas.
- [Make links crawlable](https://developers.google.com/search/docs/crawling-indexing/links-crawlable): tikri `<a href>` ir prasmingas anchor padeda rasti puslapius; svarbūs puslapiai turėtų turėti bent vieną vidinę nuorodą.
- [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap): teikti pageidaujamus kanoninius URL; `<lastmod>` naudoti tik jei jis nuosekliai ir patikrinamai tikslus. Sitemap yra signalas, ne greito indeksavimo garantija.
- [Canonical URL methods](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls): redirect, `rel=canonical` ir sitemap signalai turi neprieštarauti vienas kitam.
- [Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article) ir [structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies): Article schema padeda suprasti turinį ir galimą išvaizdą, bet nėra garantijos; duomenys turi atitikti puslapį.
- [HTTP status codes](https://developers.google.com/crawling/docs/troubleshooting/http-status-codes) ir [robots meta rules](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag): neegzistuojančiam straipsniui grąžinti tikrą 404; `robots.txt` disallow nepakeičia `noindex` ir negali būti publikavimo saugos vartas.

**Priėmimo kriterijus:** nė vienas `pending` ar nepatikrintas snapshot nepasiekia viešo atsakymo; patvirtintas numatytas straipsnis pasirodo nuo pirmos užklausos po termino be cron; prieš terminą ir po atšaukimo nė vienas vidinis, sitemap ar llms URL į jį neveda; kiekvienas viešas URL, canonical ir nuorodos paskirtis yra suderinti 200 atsakymai.
