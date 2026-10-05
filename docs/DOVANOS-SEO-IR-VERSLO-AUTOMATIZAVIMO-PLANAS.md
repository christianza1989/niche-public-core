# Dovanos 123 × Memory Casting: SEO ir verslo automatizavimo planas

> **Pakeistas planas.** Ši 2026-09-26 versija buvo pirminė darbinė hipotezė ir joje liko žmogaus redaktoriaus reikalavimas, kurio savininkas atsisakė. Dabartinis bendras architektūrinis sprendimas ir vykdymo seka: [AUTOMATIZAVIMO-ARCHITEKTURA-IR-ROADMAP-2026.md](AUTOMATIZAVIMO-ARCHITEKTURA-IR-ROADMAP-2026.md). Šį failą paliekame sprendimų istorijai, ne kaip įgyvendinimo specifikaciją.

Versija: 2026-09-26. Statusas: **projektavimo planas**, ne įgyvendinimo ar išorinių paskyrų prijungimo patvirtinimas.

## 1. Tikslas ir pagrindinė taisyklė

`dovanos123.lt` yra savarankiškai naudingas dovanų pasirinkimo centras. `memorycasting.lt` yra rankų liejimo rinkinių pardavimo ir aptarnavimo vieta. Portalo sėkmė matuojama ne straipsnių ar banerių kiekiu, o tuo, ar žmogus randa jam tinkamą dovaną ir ar jo kelias iki pirkimo yra aiškus.

Memory Casting pasiūlymas gali būti stipriausias ten, kur rankų liejimo rinkinys iš tiesų atitinka progą, biudžetą, gavėją ir pristatymo laiką. Kitais atvejais straipsnis turi galėti rekomenduoti kitą sprendimą arba pasakyti, kad rinkinys netinka. Skaidriai nurodome bendrą savininką, reklamą ir affiliate santykius. Nedeklaruojame „išbandėme“, jei nebandėme, ir nekuriame fiktyvių autorių ar citatų.

**Nedarysime:** daugybės beveik tapačių domenų/puslapių, kurie tik nukreipia į parduotuvę; 20 automatiškai paskelbiamų nepatikrintų tekstų per mėnesį; pirktų nuorodų „DR pakėlimui“ kaip pagrindinės strategijos; fiktyvių apžvalgų, kainų ar atsiliepimų. Tai yra paieškos kokybės ir pasitikėjimo rizika, ne „imperijos“ pagrindas. Žr. [Google spam politiką](https://developers.google.com/search/docs/essentials/spam-policies) ir [gaires dėl AI turinio](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content).

## 2. Ką jau turime ir ko dar neturime

### Patikrinta iš šios lokalios kodo kopijos

- Next.js/Vinext pagrindo projektas, `app/` puslapiai, `lib/` turinio ir konfigūracijos kodas, `db/` schema, `public/` vaizdai, `docs/` planai.
- Kelių svetainių ir kalbų konfigūracija (`lib/site-config.ts`), tačiau aktyvių rinkų ir teisingos lokalizacijos negalima laikyti įrodytomis vien iš konfigūracijos.
- Straipsnių importo ir planuoto publikavimo kodas (`app/api/ingest/articles/route.ts`, `lib/scheduler.ts`, `app/api/internal/publish-due/route.ts`). Dar reikia išbandyti jį nuo importo iki tikro viešo atvaizdavimo naujoje aplinkoje.
- `sitemap`, `robots`, `llms.txt`, `llms-full.txt`, autorių ir politikos puslapių šablonai.
- Esamas [turinio planas](CONTENT-PLAN-2026-2027.md), [redakcinis playbook](EDITORIAL-SEO-PLAYBOOK.md) ir [operacinis runbook](OPERATIONS.md).
- `README.md` vis dar yra bendrasis starterio dokumentas; reikia projekto specifinės įdiegimo ir atkūrimo instrukcijos.

### Neįrodyta / reikalinga prieiga arba patvirtinimas

- Ar ši nauja lokali kopija turi teisingus aplinkos kintamuosius ir gali saugiai publikuoti į numatytą hostingą.
- Ar `dovanos123.lt` šiuo metu viešas, tinkamai indeksuojamas ir ar planuoto publikavimo workeris realiai kviečiamas.
- `memorycasting.lt` parduotuvės platforma, produktų ID, kainos, variantai, atsargos, pristatymo ribos, grąžinimo tvarka ir esami el. pašto srautai.
- GA4, Search Console, Shopify, Meta, TikTok ir el. pašto paskyrų nuosavybė bei prieigos.
- Tikri juridiniai/privatumo duomenys, sutikimų mechanizmas ir rinkodaros leidimai.

Jokių išorinių paskyrų, automatinių įrašų, el. laiškų ar reklamos kampanijų šiuo plano parengimu neįjungėme.

## 3. Sistema: penki sluoksniai

```text
Paieškos paklausa + skaitytojų klausimai + sezoniškumas
  → redakcinis kalendorius ir straipsnio brief
  → AI tyrimo/juodraščio pagalba + faktų/produktų patikra + žmogaus patvirtinimas
  → Dovanos 123 planuotas publikavimas + tik gyvos vidinės nuorodos
  → matuojamas perėjimas į Memory Casting → Shopify pirkimas / aptarnavimas
  → GSC + GA4 + Shopify + socialinių kanalų duomenys grąžinami į planavimą
```

**Duomenų riba:** `dovanos123.lt` turinio DB nenaudojama užsakymų ar klientų asmens duomenims saugoti. Parduotuvės sistemoje lieka užsakymų ir klientų duomenys; analitikai perduodami tik būtini, pagal sutikimą leistini įvykiai ir agreguoti rezultatai. Visi raktai laikomi runtime secrets, ne Git ir ne promptuose.

## 4. SEO ir GEO gamybos linija

| Žingsnis | Įvestis → rezultatas | Naudojami vietiniai „SEO SKILLS“ | Automatikos riba |
| --- | --- | --- | --- |
| Paklausos tyrimas | GSC užklausos, sezonai, realūs SERP, konkurentų spragos → užklausų žemėlapis | `market-research-brief`, `competitor-research`, `seo-audit` | Skriptas renka/klasterizuoja; žmogus patvirtina temų prioritetus. Nepriskiriame išgalvotos paieškų apimties. |
| Turinio architektūra | viena pagrindinė užklausa/ketinimas vienam URL → klasteriai ir kalendorius | `seo-content-brief`, `seo-cannibalization`, `weekly-content-plan` | Prieš generavimą tikriname pasikartojančius ketinimus ir esamus URL. |
| Tyrimas ir juodraštis | brief + patikrinti šaltiniai + produkto faktai → straipsnio juodraštis | `blog-post`, `brand-style-guide`, `brand-voice-check` | AI gali parengti tekstą, bet ne savarankiškai tvirtinti kainas, testus, citatas ar saugumo teiginius. |
| Komercinės rekomendacijos | gavėjas, proga, biudžetas, terminas → tinkamų dovanų palyginimas | `customer-feedback`, `seo-content-brief` | Memory Casting rodomas tik ten, kur atitinka kriterijus; kitų prekybininkų kainos, nuotraukų teisės ir prieinamumas tikrinami. |
| Priešpublikacinė patikra | baigtas straipsnis → `approved` arba taisymo eilė | `on-page-seo-checklist`, `seo-metadata`, `internal-linking`, `generative-engine-optimization` | Blokuojame 404, neišleistų puslapių nuorodas, netikrą schemą, šaltinių spragas ir netikrą „atnaujinta“ datą. |
| Publikavimas | patvirtinta versija + UTC data → gyvas URL | esamas scheduler ir ingest API | Publikavimas idempotentinis; nuo datos priklausantys sąrašai, sitemap ir nuorodos testuojami prieš ir po atidengimo. |
| Optimizavimas | GSC, AI paieškos matomumas, GA4, išėjimo ir pirkimų duomenys → atnaujinimų eilė | `seo-content-refresh`, `serp-ctr-optimizer`, `monthly-business-review`, `spreadsheet-insights` | Keitimai pagal faktinius duomenis; ne masinis datų atnaujinimas. |

**GEO principas:** atsakymai turi būti aiškūs, savarankiški, su tikrais kriterijais ir patikrinamais šaltiniais. `Article`, `Organization`, `BreadcrumbList` ir kiti struktūriniai duomenys dedami tik kai atitinka matomą turinį. `llms.txt` yra papildomas indeksas, ne reitingavimo ar AI citavimo garantija. „Google“ nurodo, kad AI paieškai nereikia specialios schemos ar `llms.txt`; svarbu klasikinis SEO ir originali vertė. ChatGPT paieškai atskirai tikriname `OAI-SearchBot` prieigą. Šaltiniai: [Google AI paieškos gairės](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), [OpenAI robotų dokumentacija](https://developers.openai.com/api/docs/bots).

### 2026 m. Kalėdų prioritetai

1. **Rugsėjo pabaiga–spalis:** techninis auditas, kategorijų navigacija, esamų straipsnių inventorius, pagrindiniai kalėdiniai bei „kam dovanoti“ gidai. Pirmiau sutvarkyti jau turimus svarbius puslapius, o ne vien kurti naujus.
2. **Spalis–lapkritis:** biudžeto, gavėjo ir progos klasteriai; rankų liejimo rinkinio demonstracija su realiomis nuotraukomis; palyginimai „kam tinka / kam netinka“; vidinių nuorodų ir CTA bandymai.
3. **Lapkritis–gruodis:** aktualizuoti kainas, atsargas, pristatymo terminus ir paskutinės minutės alternatyvas. Publikuoti tik tai, kas dar gali realiai padėti šių metų pirkėjui.
4. **Po sezono:** peržiūrėti užklausas, perėjimus, pardavimus ir grąžinimus; tik tada nuspręsti dėl tempo ir kitos šalies.

`20 straipsnių per mėnesį` yra pajėgumo tikslas, ne kokybės pakaitalas. Jei nėra 20 gerų briefų ir patvirtintų produktų faktų, publikuojame mažiau.

## 5. Produktų ir pasiūlymų duomenų modelis

Turinio sistema turi turėti atskirą produktų katalogą (ne laisvai į straipsnį įrašytas kainas): `product_id`, prekybininkas, produkto URL, nuotraukos licencija/šaltinis, tipas, kam tinka, kam netinka, kainos intervalas, valiuta, pristatymo šalis, affiliate/own-brand ryšys, `last_verified_at`, galiojimo būklė. „Memory Casting“ SKU/variantai atkeliauja iš parduotuvės duomenų, o ne iš AI spėjimo.

Rekomendavimo logika turi išsaugoti **atrankos motyvą** ir alternatyvas. Pavyzdžiui, straipsnyje „dovana porai“ rankų liejimo rinkinys gali būti pagrindinė idėja, bet straipsnyje „dovana iki 10 €“ jo negalima įbrukti, jei reali kaina viršija ribą. Affiliate ryšiai ir mokami intarpai aiškiai pažymimi; mokamos nuorodos kvalifikuojamos `rel="sponsored"`. [Google nuorodų taisyklės](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links).

## 6. Memory Casting verslo automatizavimas

| Procesas | Pirmoji saugi automatika | Vėlesnė automatika | Privaloma kontrolė |
| --- | --- | --- | --- |
| Užsakymai | Shopify įvykis → užsakymo būsena, sandėlio/pakavimų sąrašas, išimčių perspėjimas | įvykiais paremta gamybos/siuntimo lenta | rankinis grąžinimų, klaidingų adresų ir nestandartinių išimčių sprendimas |
| Atsargos ir pristatymas | mažų atsargų, užstrigusio išsiuntimo ir artėjančio termino perspėjimai | prognozė pagal sezoną ir pardavimų istoriją | klientui nerodyti neišmatuoto ar nepatvirtinto termino |
| Klientų el. paštas | transakciniai laiškai: užsakymas, išsiuntimas, instrukcija, pagalba | segmentuotos, sutikimu pagrįstos kampanijos, priminimai, po pirkimo naudingi patarimai | rinkodaros sutikimas, atsisakymas, siuntimo ribos, žmogaus patikra jautriems atvejams |
| Aptarnavimas | AI klasifikuoja klausimus ir paruošia atsakymo juodraštį | dažnų klausimų savitarna su patikrintu instrukcijų turiniu | nesiųsti automatinio atsakymo dėl ginčo, pinigų grąžinimo ar saugumo be žmogaus |
| Instagram/Facebook/TikTok | bendras turinio kalendorius, AI paruošti skirtingi kanalų juodraščiai ir vizualai | patvirtinto turinio planavimas per pasirinktą platformą / oficialias API | platformos leidimai, turinio teisės, žmogaus peržiūra, jokio automatinio šlamšto ar apsimetimo |
| Analitika | straipsnis → CTA → parduotuvės apsilankymas → pirkimas, kai tai leidžia sutikimas ir technologija | kanalo, temos ir SKU pelningumo ataskaitos | neskelbti „konversijų“ vien iš paspaudimų; tikrinti atribucijos ribas |

Pradėtume nuo **Shopify Flow** ten, kur pakanka įvykių, sąlygų ir veiksmų. Sudėtingesnėms integracijoms naudotume oficialius Shopify webhookus, HMAC patikrą, dublikatų filtrą, pakartojimus ir periodinį sutikrinimą. Neplanuojame savarankiško „Python roboto“, kuris prisijungia prie parduotuvės naršykle ir keičia užsakymus. [Shopify Flow](https://help.shopify.com/en/manual/shopify-flow), [webhookų patikra](https://shopify.dev/docs/apps/build/webhooks/verify-deliveries).

TikTok tiesioginio publikavimo API turi atskirus leidimų, naudotojo sutikimo ir kliento audito reikalavimus; nelaikome automatinio publikavimo galimu, kol nepatvirtinta paskyra ir pasirinktas leidžiamas kelias. [TikTok Content Posting API](https://developers.tiktok.com/docs/en/content-posting-api-get-started).

## 7. Integracijų inventorius

2026-09-26 atlikta pluginų paieška; būsena nėra paskyrų autentifikavimo patvirtinimas.

| Integracija | Dabartinė padėtis | Kam naudotume |
| --- | --- | --- |
| Shopify pluginas | Rastas ir pasiūlytas prijungti; **neįdiegtas** | produktai, atsargos, užsakymų/analitikos peržiūra pagal suteiktas teises |
| GSC Wizard | Rastas ir pasiūlytas; **neįdiegtas** | Search Console užklausos, indeksavimas, CTR, kanibalizacija, galimai GA4 duomenys |
| Metricool | Rastas ir pasiūlytas; **neįdiegtas** | socialinių tinklų kalendorius, planavimas ir rezultatų peržiūra |
| Gmail | Kataloge rodomas kaip įdiegtas; **konkrečios pašto paskyros prisijungimas nepatikrintas** | pagalbos laiškų analizė ir atsakymų juodraščiai, jei tai tinkama verslo dėžutė |
| Klaviyo / kitas marketingo įrankis | Galimas kandidatas, **neįdiegtas ir nepasirinktas** | sutikimu pagrįsti el. pašto srautai; rinktis tik įvertinus esamą Shopify el. pašto sprendimą |

Pluginas nėra integracijos architektūra. Kiekvienam srautui nurodome vieną duomenų savininką, vieną įvykio šaltinį, leidimų apimtį, dublikatų valdymą, klaidų stebėjimą ir išjungimo jungiklį. Nereikia kelių pluginų tam pačiam veiksmui vien todėl, kad jie egzistuoja.

## 8. Python/Node darbo vieta ir kodavimo taisyklės

Esamas portalas parašytas TypeScript; publikavimo, turinio modelio ir SEO renderinimo logika lieka jame. Python tinka **atskiriems pagalbiniams darbams**: GSC/produktų CSV analizė, užklausų klasterizavimas, kainų/nuorodų auditas, straipsnių kokybės ataskaita, vaizdų metaduomenų patikra. Šie skriptai išveda patikrinamą JSON/CSV arba pull request; jie tiesiogiai nekeičia produkcinės DB ir savarankiškai nepublikuoja.

Pirmi reikalingi testuojami įrankiai:

1. `content-inventory`: gyvi / suplanuoti / dubliuojantys straipsniai, kategorijos, autoriai, datos.
2. `query-cluster`: GSC užklausų grupavimas pagal ketinimą, siūlomas vienas kanoninis URL kiekvienam klasteriui.
3. `product-freshness`: kainos, prieinamumo ir nuotraukų teisių galiojimo vartai.
4. `publish-preview`: kaip atrodys straipsnis, schemos, sitemap ir vidinės nuorodos jo publikavimo dieną.
5. `link-check`: tik gyvi target URL, jokio 404 ir pasenusio redirect vidinėse nuorodose.
6. `measurement-report`: GSC/GA4/Shopify/social skaičiai su šaltiniu ir laikotarpiu; jokios sugeneruotos metrikos.

Visur: mažiausios būtinos API teisės, aplinkos kintamieji/secrets, idempotency keys, test režimas, rate limit, audit log, retry/backoff ir galimybė sustabdyti procesą. Pirkimų/refundų, reklamos biudžeto ir viešų įrašų pokyčiai tik su žmogaus patvirtinimu bent iki brandžios kontrolės sistemos.

## 9. Matavimas ir eksperimentai

**SEO/GEO:** indeksuoti kanoniniai URL, nebrandiniai parodymai/paspaudimai/CTR, tikslinių klasterių aprėptis, AI paieškos parodymai (jei yra), organinio srauto kokybė. „Google“ nuo 2026 m. turi atskirą generatyvinės paieškos matomumo ataskaitą Search Console; ją naudoti kartu su standartine ataskaita, o ne vietoje jos. [Google pranešimas](https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports).

**Komercija:** `dovanos123` → `memorycasting` išėjimo paspaudimas pagal straipsnį ir CTA, tinkami parduotuvės apsilankymai, pirkimai, pajamos ir grąžinimai. UTM parametrai ir, jei tinkama bei leidžiama, tarp-domenis matavimas turi būti suderinti; atribucijos spragos aiškiai pažymimos.

**Operacijos:** publikavimo klaidos, neveikiančios nuorodos, nepatikrintos kainos, neišsiųsti užsakymai, el. pašto pristatymo klaidos, klientų skundai, nepavykę webhookai.

Kas mėnesį priimamas vienas iš sprendimų: **stiprinti**, **atnaujinti**, **sujungti**, **palikti**, arba **stabdyti** turinio klasterį. Eksperimentus darome po vieną reikšmingą kintamąjį — pvz., CTA vieta ar palyginimo formatas — ir vertiname pakankamą laikotarpį, o ne vieną dieną.

## 10. Įgyvendinimo etapai ir išėjimo vartai

| Etapas | Konkretus rezultatas | Išėjimo vartai |
| --- | --- | --- |
| 0. Paskyrų ir faktų inventorius | domenai, hostingas, Shopify būsena, savininkas, produktai, atsargos, siuntimas, politikos, API prieigos | nėra išgalvotų verslo faktų; aišku, kuri sistema valdo kiekvieną duomenį |
| 1. Naujos kopijos atkūrimas | naujas aplankas kaip kanoninis development checkout, priklausomybės, build/test, projekto README | švarus build; nustatyta, ar gyva svetainė susieta su šiuo Git remote ir kokia aplinka ją publikuoja |
| 2. SEO/UX bazė | pilnas crawl, GSC/GA4 bazinė būsena, Lighthouse, schemos, canonical, sitemap, autorių ir kategorijų peržiūra | jokių kritinių indeksavimo/404 klaidų; pagrindinis skaitytojo kelias aiškus |
| 3. Turinio gamybos vartai | užklausų žemėlapis, produktų katalogas, faktų patikra, AI juodraštis, redaktoriaus approval, schedule | 10 bandomųjų straipsnių pereina visą grandinę be nepatikrintų teiginių |
| 4. Publikavimo patikimumas | realus scheduler kvietėjas, idempotency/retry/audit, gyvų nuorodų resolveris | suplanuotas straipsnis viešas tik nustatytu laiku; prieš tai nėra sitemap/LLM/vidinės nuorodos; po to nėra 404 |
| 5. Parduotuvės srautai | Shopify Flow, produkto/atsargų sinchronizacija, el. pašto juodraščiai/srautai, išimčių lenta | bandomasis užsakymas praeina be dublikatų ir be klaidingo laiško |
| 6. Socialiniai ir ataskaitos | kanalams pritaikyti kūrybiniai juodraščiai, patvirtinimo eilė, planavimas, KPI sujungimas | publikuojama tik patvirtinta medžiaga; kiekvienas rodiklis turi duomenų šaltinį |
| 7. Skalė | kitų rinkų arba domenų pilotai tik po LT įrodymo | atskira vietinė vertė, teisinga kalba, realus siuntimas, jokio kopijuoto doorway tinklo |

## 11. Artimiausias darbų sąrašas

1. Padaryti iš naujo aplanko build/test ir nurodyti, kuris checkout bus tolesnių pakeitimų šaltinis. Senos kopijos nenaikinti, kol nepatvirtintas perėjimas.
2. Patikrinti gyvą `dovanos123.lt` ir `memorycasting.lt`: prieinamumas, techninis SEO, faktinis pardavimo kelias. Lokalus kodas nėra gyvos svetainės įrodymas.
3. Užfiksuoti pirmus verslo duomenis: Shopify naudojamas ar dar ne, produktų variantai/kainos/atsargos, siuntimo šalys, grąžinimai, esamas el. pašto tiekėjas, socialinių paskyrų tipai.
4. Prijungti arba suteikti prieigą prie Search Console/GA4 ir pasirinkti Shopify bei socialinių kanalų integracijas. Prijungimus daryti tik savininko paskyrose ir su minimaliomis teisėmis.
5. Atlikti prieškalėdinį temų ir esamų URL auditą; pirmą turinio partiją pradėti tik po 1–4 punktų bazinio patvirtinimo.

Šis planas sąmoningai atskiria **automatizuojamą mechaniką** nuo **redakcinės ir verslo atsakomybės**. Kuo patikimesni faktai, duomenys ir peržiūros vartai, tuo daugiau rutinos vėliau galime automatizuoti saugiai.
