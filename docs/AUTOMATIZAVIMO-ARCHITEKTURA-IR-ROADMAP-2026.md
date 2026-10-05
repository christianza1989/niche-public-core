# Dovanos 123 × Memory Casting: autonominės sistemos architektūra ir roadmap

**Data:** 2026-09-26 · **Būsena:** bendro projektavimo specifikacija savininko peržiūrai; ne įdiegta automatika.  
**Apimtis:** dovanos123.lt kaip naudingas dovanų informacijos centras; memorycasting.lt kaip rankų liejimo rinkinių verslas; vėliau atskiros rinkos tik įrodžius pirmosios naudą.  
**Principas:** žmogus nėra kasdienis redaktorius. AI agentai gali tirti, kurti, nepriklausomai tikrinti ir pagal iš anksto patvirtintas taisykles publikuoti. Nežinomų faktų, teisių ar platformų leidimų AI „nepatvirtina“ — tokius veiksmus sustabdo, kol atsiranda patikimas duomenų šaltinis. Tai leidžia mažinti savininko darbą, o ne paslėpti riziką.

**Portfelio plėtra:** fizinių, AI skaitmeninių ir vietinių paslaugų dovanų svetainių, vienos prekybos sistemos, bendro el. pašto/CRM ir kryžminio siūlymo konceptas aprašytas [atskirame tinklo plane](EKOSISTEMOS-PREKYBOS-CRM-IR-CROSSSELL-KONCEPTAS-2026.md). Jis išplečia šį SEO/Memory Casting pagrindą, bet nekeičia esamo kodo ar viešos svetainės be savininko plano peržiūros.

Savininkui skirtas būsimas faktų, sprendimų ir **tik vėliau reikalingų** prieigų sąrašas: [įgyvendinimo įvestys ir prieigos vėliau](IGYVENDINIMO-IVESTYS-IR-PRIEIGOS-VELIAU-2026.md). Dabar jokių paskyrų jungti nereikia.

## 1. Bendri sprendimai

| Klausimas | Sprendimas | Kodėl / ko nedarome |
| --- | --- | --- |
| Technologija | Tobulinti esamą Next.js/Vinext + D1 projektą. D1 tampa vieninteliu produkcinio turinio tiesos šaltiniu. | Dabar veikia dvi turinio linijos. Naujas Payload/Postgres/WordPress projektas prieš Kalėdas pridėtų migracijos riziką be įrodyto poreikio. |
| Planinis „reveal“ | Matomumą skaičiuoti užklausos metu: tik **AI patvirtinta nekintama versija** ir `publish_at <= now`. Sąrašas, straipsnis, sitemap, autoriaus puslapis, vidinės nuorodos, `llms.txt` naudoja tą patį predikatą. | Viešas atidengimas nepriklauso nuo vieno cron kvietimo. Darbiniai jobai skirti pranešimams, paieškos patikrai ir kitoms šalutinėms užduotims; cache turi pasibaigti prie publikavimo ribos. |
| Turinio kokybė | Atskiri „tyrėjas → rašytojas → AI redaktorius“ su papildomais deterministiniais validatoriais. Rašytojas negali sau suteikti approval. | Antras LLM nėra faktų šaltinis. Jis gali atmesti ar paprašyti taisyti; faktai tikrinami pagal išorinius ar verslo duomenų įrodymus. |
| Tempas | 20 straipsnių/mėn. yra **viršutinė partijos ambicija**, ne privalomas SEO signalas. Didiname tik praeinant kokybės ir rezultatų vartus. | Google draudžia masinį turinį be papildomos vertės; daug panašių domenų/puslapių gali būti doorway abuse. |
| Produktų rekomendacijos | Memory Casting svarbus tik ten, kur tikrai atitinka gavėją, biudžetą, progą ir pristatymą. Kitų parduotuvių pasiūlymai gali būti rodomi su leidžiamomis nuotraukomis ir patikrintais duomenimis. | „Visur mūsų produktas Nr. 1“ nėra patikima dovanų gido redakcinė politika. Savininko ryšys ir affiliate/mokamas ryšys aiškiai atskleidžiami. |
| Plėtra | Pirma LT rinka ir viena naudinga svetainė; platforma paruošta `site_id + locale`, bet naujas domenas/šalis tik su atskira pasiūla, realiu pristatymu, savitais vietiniais duomenimis ir rezultato įrodymu. | Nekuriame panašių domenų tinklo tik Google rezultatams užimti. DR ir pirktos nuorodos nėra tikslas. |
| Agentų vykdymas | Produkcinis valdymas = duomenų bazė + versijuotos taisyklės + queue/worker + oficialios API. Codex ir pluginai = projektavimas, tyrimas, priežiūra ir ad hoc operacijos, ne vienintelis 24/7 scheduler. | Pokalbio sesija ar pluginas negarantuoja autonominio vykdymo, atkartojamumo ar SLA. |

Šiuos sprendimus pagrindžia [Google AI turinio gairės](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content), [spam politika](https://developers.google.com/search/docs/essentials/spam-policies) ir [AI Search optimizavimo gairės](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide). Nė vienas techninis triukas negarantuoja reitingų ar citatų.

## 2. Patikrinta esama būsena ir neuždaryti klausimai

**Lokalaus kodo auditas (ne gyvos svetainės patikrinimas):**

- `lib/content-store.ts` sumaišo D1 publikuotus įrašus su `DEMO_ARTICLES`; DB klaidos atveju tyliai grąžina statinius. `lib/content.ts` statinius `scheduled` įrašus parodo vien pagal datą. Tai du publikavimo tiesos šaltiniai ir paslėptų incidentų galimybė.
- `app/api/ingest/articles/route.ts` leidžia `requestedState: scheduled` ir sukuria `publishJobs`, nors versijos `reviewMetadataJson.status` lieka `pending`. `lib/scheduler.ts` approval netikrina. Taigi dabartinis kodas **neatitinka** planuojamo AI redaktoriaus vartų.
- Importo ciklas dalį DB operacijų daro atskirais žingsniais; ankstyva klaida gali palikti dalį batch. Jobai gali likti `processing` po nutrūkimo; nėra aiškaus lease atsiėmimo / dead-letter proceso. Reikia transakcinių idempotencijos testų.
- Šaltinių atvaizdavimas `sourcesForArticleFromStore` skaito tik statinį `DEMO_SOURCES`, nors straipsniai gali ateiti iš D1. Iš to negalima daryti išvados, kad dinaminis straipsnis tikrai turi veikiančią šaltinių grandinę.
- `docs/OPERATIONS.md` aprašo privačios Sites aplinkos ir cron iškvietimo neaiškumą. Viešas domenas, dabartinis hostingas, indeksavimas, Shopify ir analitika **dar neįrodyti**. Vietinis Git projektas nėra produkcijos būklės įrodymas.
- `app/privatumas/page.tsx` turi šabloninį tekstą. Jis negali būti laikomas patikrinta privatumo politika.

**Pirmas techninis principas:** nekurti 50 naujų suplanuotų straipsnių iki duomenų migracijos, vieno matomumo predikato ir approval vartų testų. Senų statinių straipsnių migracija turi išsaugoti URL ir teisingas istorines publikavimo datas, bet **ne aklai perkelti** autorius, citatas ar vaizdų teises. `lib/content.ts` yra vardinių `DEMO_AUTHORS`; kol kiekvienas autorius nepatvirtintas kaip tikras, jį žymėti `verified_real | editorial_org | blocked` ir fiktyvaus `Person` byline/schema nerodyti. Neįrodytą citatą ar vaizdo licenciją blokuoti. Produkcijoje statinis fallback išjungiamas, o DB gedimas tampa matomu incidentu; tai reiškia galimą laikiną 503, todėl reikės availability SLO ir atkūrimo procedūros, ne tylaus melagingo turinio rodymo.

## 3. Etaloninė architektūra

```text
GSC + sezonas + tikri klientų klausimai       Shopify produktai / siuntimas / sutikimai
                  │                                      │
                  ▼                                      ▼
       temos / intent registras                    tikrinamas pasiūlymų katalogas
                  │                                      │
                  └───────────► tyrėjas / brief ◄───────┘
                                  │
                           AI rašytojas + media
                                  │
               nepriklausomas AI redaktorius + taisyklių validatoriai
                                  │ approved immutable snapshot
                                  ▼
                       D1 turinys + publikavimo data
                                  │
             vienodas matomumo predikatas viešam renderinimui
            ┌─────────────┬──────────────┬───────────────┐
       straipsnis       vidinės nuorodos  sitemap/feeds   CTA
            │                                             │
            └──── GSC/GA4 analizė ◄── Shopify konversijos ┘
                                  │
                          refresh / stop / scale
```

**Duomenų savininkai:** D1 laiko redakcinį turinį, įrodymų nuorodas, patvirtinimus ir agreguotą matavimą; Shopify (jei tai tikroji parduotuvė) laiko SKU, kainas, atsargas, užsakymus ir klientų duomenis; analitika laiko įvykius pagal galiojantį sutikimą. Kitos šalys neskaito klientų asmens duomenų per SEO CMS. Visos integracijos turi mažiausias būtinas teises, secrets saugyklą, auditą, išjungimo jungiklį ir išlaidų limitą. AI batch/event workeris kviečia versijuotus modelių/API promptus ir įrašo tikrinamus artefaktus; Codex pokalbis ar MCP pluginas nėra nuolatinis vykdytojas. Jei po tikro hostingo patikros tai Cloudflare Workers, galima naudoti jų [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/) ir [Queues](https://developers.cloudflare.com/changelog/post/2026-02-04-queues-free-plan/) šalutiniams bei AI gamybos darbams, bet ne pačiam viešo straipsnio atidengimui.

**Vykdytojo hipotezė, kurią reikia patikrinti 0 fazėje:** atskiras Cloudflare Worker toje pačioje paskyroje su D1 binding; Queue apdoroja AI tyrimą/rašymą/QA, produktų ETL, outbox ir kanalų siuntas; Cron tik periodiškai sutikrina Shopify/produktus, paima užstrigusius jobus ir patikrina kvotas. Svetainės read-time matomumas nenaudoja Cron. Jei dabartinė privati Sites aplinka nesuteikia šiam Workeriui reikalingo D1 binding ar viešo hostingo valdymo, architektūros nedengti išoriniu nesaugiu cron URL — pirmiau pasirinkti vieną prieinamą vykdymo vietą ir migracijos kelią. `outbox_events.idempotency_key` turi būti unikalus; Queue vartotojas toleruoja dublikatus, nuomą praradusį jobą, retry/backoff ir dead-letter, o klientų išsiuntimą sutikrina su tiekėjo įrašo ID.

### Turinio įrašai ir būsenos

`topic_intents` (kanoninis tikslinis ketinimas, page type, locale, priority), `briefs`, `article_versions` (nekintamas turinys/SEO/schema/CTA/media manifestas), `claims` ir `evidence` (teiginys ↔ patikrinamas šaltinis/fakto versija), `offers` (SKU arba trečios šalies pasiūlymas, kaina, atsarga, siuntimo šalis ir galiojimas), `media_assets` (kilmė, naudojimo teisė, sutikimas, alt, matmenys), `approval_attestations`, `publication_events`, `outbox_events`, `exceptions`, `metric_snapshots`. Produkto/šaltinio/medijos galiojimo laikas yra duomenų dalis, ne laisvas sakinys straipsnyje.

`idea → researching → draft → ai_review → approved → scheduled → visible → refresh_due/quarantined/retired`. `quarantined` ir `retired` URL sprendžiami sąmoningai: reikšmingai atnaujinti, 301 į artimą atitikmenį arba 410 tik kai nėra naudingo turinio; automatinio masinio trynimo nėra.

AI redaktoriaus patvirtinimas siejamas su viso **redakcinio** snapshot SHA-256, įrodymų manifestų versijomis, policy versija, agento ID ir **aktyvavimo iki** terminu. Pakeitus tekstą, ranka įrašytą kainą, CTA logiką, vaizdą, schema lauką ar teiginį, senas approval nebegalioja ir reikia naujos versijos. Patvirtinimas tikrinamas schedule ir pirmo aktyvavimo metu; jo vėlesnis termino pasibaigimas savaime nepaslepia jau gyvo evergreen straipsnio. Jį gali paslėpti atšaukimas, karantinas ar atskira turinio nebegaliojimo taisyklė. Tik patvirtintas snapshot gali būti `scheduled`; importo API neturi tiesioginio `scheduled` kelio rašytojui.

Dinaminė kainos/atsargų/siuntimo kortelė yra **atskiras tipizuotas `product_ref` komponentas**, kurio duomenys ateina iš patikrinto produktų katalogo ir nėra tyliai perrašomi į nekintamą straipsnio tekstą. Kortelei nustatomas trumpas TTL ir savas šviežumo vartas: pasenus → slėpti kortelę/konkretų CTA, o ne visą naudingą straipsnį. Jei konkreti kaina ar pažadas parašyti pačiame redakciniame tekste, jo pakeitimui reikia naujo snapshot ir AI QA; iki tol neteisingas teiginys išjungiamas per skubų karantiną. Siuntimo terminų validacija vyksta ir prieš publikavimą, ir gyvai kortelei. Patvirtintas media manifestas saugo asset **turinio digest** ir naudoja nekintamą, turinio adresu paremtą URL; keisti baitus tame pačiame viešame URL draudžiama. Naujas failas gauna naują URL ir peržiūrą prieš tapdamas matomas.

**Atidengimo be cron taisyklė:** `visible = immutable_version_was_approved_for_activation && !revoked && !quarantined && publish_at <= server_now && (unpublish_at == null || server_now < unpublish_at)`. Šis predikatas yra bendra serverio funkcija **visiems** paviršiams: straipsniui, homepage, kategorijai, autoriaus puslapiui, sitemap, vidinei nuorodai, `llms.txt`, `llms-full.txt` ir kitam turinio feed. `robots` laikomas stabilus, o jei kada nors priklausys nuo būsenos, jam galios ta pati taisyklė. Ne kopijuoti sąlygą keliuose route.

**Cache kontraktas:** tikslas — tinkamas URL ir visi jo įėjimai atsiranda ne vėliau kaip per 60 s nuo `publish_at`; visų šių paviršių edge/browser TTL ne ilgesnis nei 30 s ir niekada neperžengia artimiausio aktyvavimo / išjungimo laiko, jei framework/hostingas leidžia tokį valdymą. Išbandyti faktinį Sites/CDN cache elgesį; jei riba neįvykdoma, vietoj pažado rinktis dinaminį/no-cache renderinimą arba kitą hostingą. Publish/unpublish/offer/quarantine įvykis inicijuoja purge; avariniam atšaukimui yra cache bypass. Jautriems pasiūlymams ir karantinui **nenaudoti** `stale-while-revalidate`, nes [Cloudflare gali pateikti pasenusį atsakymą](https://developers.cloudflare.com/cache/concepts/revalidation/). Jei D1 read replication įjungiama, publikavimo ir revocation skaitymams reikia [nuoseklios skaitymo strategijos](https://developers.cloudflare.com/d1/best-practices/read-replication/) (pvz., primary/bookmark), kitaip replika gali atsilikti. Background jobas gali registruoti įvykį ir atnaujinti feed, bet jo vėlavimas neturi sukurti 404. Redakcinė zona `Europe/Vilnius`, DB laikas UTC; vienas autoritetingas serverio laikrodis.

## 4. AI turinio fabriko taisyklės

**Agentų rolės ir teisės:**

1. **Paklausos analitikas** skaito GSC, sezoniškumą, esamų URL ir vidinės paieškos klausimus; kuria temų eilę. Neturi publish teisės.
2. **Tyrėjas** gauna pirminius gamintojo/Shopify duomenis ir aktualius šaltinius; kiekvieną faktinį teiginį susieja su įrodymu, pažymi patikros laiką. Iš konkurentų kopijų nekuria „originalaus“ teksto.
3. **Rašytojas** pagal brief sukuria tikslų, aiškų juodraštį, realius pasirinkimo kriterijus, „kam netinka“, alternatyvas ir atsakymus į užklausos ketinimą. Neturi nei schedule, nei approval teisės.
4. **Nepriklausomas AI redaktorius** gauna tik juodraštį, įrodymų manifestą ir politiką; tikrina kiekvieną materialų claim, originalią vertę, šališkumą, Memory Casting tinkamumą, nuorodas, E-E-A-T autorystės teisingumą. Atmeta nepagrįstą „išbandėme“, fiktyvias citatas, fiktyvius atsiliepimus ir netikrą kainą.
5. **Deterministinis QA** tikrina schema ↔ matomas tekstas, canonical/hreflang, kainos/atsargų galiojimą, 404, ateities linkų slopinimą, dubliuotus intent/URL, media teises/formatą, alt, prieinamumą ir performance biudžetą. AI approval vienas pats jo neapeina.
6. **Publikavimo tarnyba** tik perskaito galiojantį patvirtinimą ir datą. Agentai negali tiesiogiai redaguoti produkcinių lentelių ar apeiti API būsenų automato.
7. **Atnaujinimų analitikas** iš GSC, realių paspaudimų, užsakymų ir klientų klausimų siūlo atnaujinti/sujungti/palikti/stabdyti. Nepakeičia datų vien dėl „freshness“.

**Naudingo straipsnio minimumas:** vienas aiškus poreikis ir kanoninis URL; konkretus pasirinkimo metodas, realūs ribojimai (amžius, laikas, biudžetas, pristatymas), palyginimo motyvas, tikros produkto savybės, alternatyvos, atnaujinimo priežastis, skaidrus komercinis ryšys, atskiri faktų ir redakcinių patarimų sluoksniai. Jeigu neturime unikalaus vertės elemento — produkto nuotraukų/demo, praktinės instrukcijos, skaičiuoklės, tikros palyginimo lentelės ar sukauptų klientų klausimų — tema lieka eilėje, net jei „reikia 20 straipsnių“.

**Autoriai / E-E-A-T:** AI nėra sugalvotas žmogus. Autoriaus puslapyje tik patvirtintas tikras asmuo ar aiškiai įvardyta redakcija, kas atsakingas už tikslumą, kaip turinys kuriamas ir tikrinamas, kaip pateikti pataisymą. Dabartiniai `DEMO_AUTHORS` vardai nėra automatiškai laikomi tikrais. Tikras produkto testas dokumentuojamas nuotrauka/video ir data; AI negali apsimesti rankomis išbandęs rinkinį. Šaltiniai padeda faktams, bet „šaltinių sąrašas“ nėra dekoracija ar reitingavimo schema.

**Išoriniai produktai:** leidžiami prekybininko feed, affiliate API arba autorizuotas rankinis katalogas; netikrinamas scraping nėra produktų duomenų pagrindas. Rodyti `last_checked`, pasibaigus galiojimui kainos nežadėti. Nuotraukos tik su leidimu/licencija; AI sugeneruotas vaizdas negali klaidinti, kad tai konkretaus produkto nuotrauka. Mokamos nuorodos turi `rel=sponsored` ir aiškų žymėjimą. [Google išorinių nuorodų gairės](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links).

### SEO ir GEO

- Semantinė architektūra: gavėjas × proga × biudžetas × dovanų tipas, bet tik atskiram ketinimui ir vertingam turiniui; kanibalizaciją spręsti prieš generavimą. Kategorijų puslapiai turi savo navigacinę/palyginimo vertę, ne tuščius straipsnių sąrašus.
- `Article`, `BreadcrumbList`, `Organization`, `Product` schema tik kai tiksliai atitinka matomą puslapį ir Google funkcijų taisykles. `llms.txt` laikyti papildomu skaitymo indeksu, o ne Google/ChatGPT citavimo garantija. Pagal [Google AI paieškos gaires](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) specialios schemos ar `llms.txt` Google AI rezultatams nereikia. ChatGPT paieškos botą vertinti atskirai pagal [OpenAI crawler dokumentaciją](https://developers.openai.com/api/docs/bots).
- Techniniai vartai: viešas 200, teisingas robots/canonical/sitemap, HTML turinys pasiekiamas be JS, 404/redirect kontrolė, mobile CWV, prieinamumas, atvaizdų optimizavimas. Lighthouse 100/100/100/100 yra aspiracija ir regresijos signalas, ne Google ranking pažadas; papildomai matuoti realių naudotojų CWV.
- Vidinės nuorodos į ateities įrašus saugomos kaip ID/intent ryšiai; atvaizduojamos tik kai tikslinis URL yra gyvas pagal tą patį predikatą. Kai naujas įrašas tampa gyvas, ankstesniuose puslapiuose nuoroda atsiranda be rankinio straipsnio perrašymo. Būtinas cache ribos ir 404 end-to-end testas.
- Tarptautinės svetainės: `site_id`, `locale`, šalies valiuta/siuntimas ir tikras lokalus turinys. `hreflang` tik tikriems, viešiems ekvivalentams; šalys netampa mechaniškais LT straipsnių vertimais.

**Pirmasis LT užklausų žemėlapis (tikslinamas pagal tikrą GSC ir SERP, ne tariamą search volume):** pagrindinis dovanų pasirinkimo puslapis; Kalėdų dovanos; dovanos porai, vyrui, moteriai, mamai, tėčiui, seneliams ir draugams; dovanos pagal progą (gimtadienis, metinės, Valentino diena, vestuvės); pagal biudžetą (su tikru kainos filtru); personalizuotos ir patyriminės dovanos; rankų liejimo rinkinio naudojimas, kam jis tinka/netinka, rezultatų pavyzdžiai ir praktinės klaidos; paskutinės minutės dovanos pagal realų pristatymo cutoff. Vienas intent turi vieną kanoninį URL; kiti straipsniai jį papildo, ne kopijuoja. Dabartinis [metinis turinio kalendorius](CONTENT-PLAN-2026-2027.md) yra temų hipotezių šaltinis — prieš automatinį publikavimą kiekviena tema perleidžiama per naujus intent, įrodymų ir produkto vartus.

**Kalėdos 2026, sąlyginis greitas kelias:** rugsėjo pabaigoje–spalio pradžioje patikrinti viešą domeną, faktų/siuntimo feed, autorystę, privatumą, kritinius esamus URL ir minimalų matavimą; tuo pat metu AI gali ruošti Kalėdų briefus ir tikros produkto demonstracijos scenarijus. Spalį leisti pirmą patvirtintų aukšto ketinimo gidų kohortą ir patikrinti indeksavimą bei vidines nuorodas; lapkritį plėsti tik unikalias gavėjų/progų/biudžetų temas, atnaujinti jau gyvus URL ir derinti CTA su atsargomis; gruodį automatiškai slopinti nebegaliojančius pristatymo pažadus ir rodyti tik realias paskutinės minutės alternatyvas. Jei platformos/duomenų vartai užtruks, datos slenka — šis grafikas nėra pažadas paskelbti nepatikrintą straipsnį iki konkrečios dienos.

## 5. Memory Casting operacijų automatika

| Srautas | Kas gali veikti be rutininio žmogaus | Sustabdymo / eskalacijos riba |
| --- | --- | --- |
| Produktų katalogas | Shopify produktų/variantų/kainų/atsargų/siuntimo faktų sinchronizacija su versija ir galiojimu; pasibaigusių faktų pašalinimas iš straipsnių CTA. | Shopify nėra tikroji platforma, feed nepatikimas arba pristatymo pažadas neapibrėžtas — joks agentas jo neišgalvoja. |
| Užsakymų operacijos | Webhook → dedupe → užsakymo statusas, pakavimo sąrašas, instrukcijos, siuntos įvykiai, užstrigimų alertai; periodinis sutikrinimas su Shopify. | Mokėjimų ginčai, įtariamas sukčiavimas, saugos ar teisinių pretenzijų atvejai užšaldomi / eskaluojami. |
| Grąžinimai / refundai | Galima automatizuoti **tik iš anksto savininko nustatytą** standartinį scenarijų (statusas, laikotarpis, suma vienam užsakymui/klientui ir per dieną, įrodymai, idempotencija). LLM klasifikuoja prašymą, bet pinigų judėjimą leidžia tik deterministinis policy engine, prieš API kvietimą dar kartą patikrinęs Shopify būseną/ankstesnius refundus. Klientui paliekamas lengvas žmogaus kontaktas. | Išimtis, ginčas, pasikartojantis piktnaudžiavimas, viršytas limitas ar neaiški teisė → stabdyti, ne spėti. |
| El. paštas | Užsakymo/instrukcijų transakciniai srautai, sutikimu pagrįsti welcome, edukacija, abandoned checkout ir aftercare; atsisakymo sinchronizacija. | Be teisingo sutikimo marketingo laiškai nesiunčiami. Pristatymo klaidos, skundai, jautrūs klausimai → išimtis. |
| Klientų aptarnavimas | AI atsako į dažnus klausimus tik iš patvirtintos žinių bazės ir konkretaus užsakymo duomenų su ribotomis teisėmis; įrašo atsakymo šaltinį ir confidence. | Neaiškus atvejis, alergija/saugumas, kompensacija, teisinis ginčas, žemas confidence → jokio improvizuoto pažado. |
| Atsargos ir terminas | Kasdienis atsargų/prognozės tikrinimas ir automatinis CTA/siuntimo tekstų galiojimo pervertinimas; šventinis cutoff pagal vežėjo duomenis. | Jei nėra patikimo termino, komunikacijoje terminas nežadamas; prireikus siūloma kita dovana. |

Webhookai turi HMAC verifikaciją, idempotenciją, retry/backoff, out-of-order tvarkymą ir periodinį sutikrinimą; vien webhookas nėra pilna apskaita. [Shopify webhookų dokumentacija](https://shopify.dev/docs/apps/build/webhooks), [pristatymo verifikacija](https://shopify.dev/docs/apps/build/webhooks/verify-deliveries).

**Kliento kelio automatika:** SEO gidas → kontekstinis CTA į aktualų produktą → Shopify produkto/checkout faktai → leidžiamas abandoned checkout priminimas → užsakymo instrukcija ir „kaip išvengti klaidų liejant“ → pristatymo būsena → naudingi po-pirkimo patarimai → pasirenkamas tikras atsiliepimas/referral. Kiekvienam etapui atskiras trigger, teisėtas komunikacijos pagrindas, siuntimo limitas, idempotencija ir matuojamas poveikis. Instagram/Facebook/TikTok turi nukreipti į tą patį faktinį pasiūlymą, bet kūrybinė forma skirtinga; edukacinis turinys turi vertę ir be pirkimo.

**Mokama reklama (ne pradinė būtinybė):** AI gali iš patvirtintų medijų/pasiūlymų kurti Meta/TikTok/Google reklamų variantus ir automatiškai stabdyti aiškiai nuostolingas kampanijas pagal iš anksto patvirtintus slenksčius. Negali savarankiškai didinti bendro biudžeto, keisti auditorijos jautrių požymių, kurti nepatikrintų produkto pažadų ar naudoti netikrų klientų istorijų. Pradėti tik kai yra patikimas konversijų matavimas, marža, atsargų ir siuntimo ribos; kitaip agentas optimizuotų paspaudimus, ne pelną.

**Klientų duomenų ir saugumo riba:** prieš atskleidžiant konkretaus užsakymo būseną patikrinti kliento tapatybę per parduotuvės leidžiamą mechanizmą; vien įrašytas užsakymo numeris nėra pakankama autentifikacija. Į LLM siųsti tik būtiną, pagal galimybes nuasmenintą klausimo ištrauką ir užsakymo būsenos faktus — ne adresą, mokėjimo duomenis ar visą laiškų istoriją. Patikrinti AI tiekėjo duomenų tvarkymo sąlygas, retention ir perdavimus; loguose redaguoti PII, nustatyti saugojimo/šalinimo ir prieigos teisių tvarką. Kliento laiškas, web puslapis ar produkto aprašas laikomi **nepatikima įvestimi**: jų instrukcijos negali keisti agento politikos ar iškviesti refund/admin įrankio. Vien modelio `confidence` nėra kontrolė; leistinus atsakymų tipus, sumas ir duomenų laukus apibrėžia deterministinė taisyklė. [EDPB smulkaus verslo duomenų tvarkymo gairės](https://www.edpb.europa.eu/sme/be-compliant/process-personal-data-lawfully_en), [asmens teisių gairės](https://www.edpb.europa.eu/sme/be-compliant/respect-individuals-rights_en).

**Teisinis turinys:** prieš viešą analitiką/marketingą būtina tikra valdytojo tapatybė, privatumo bei slapukų informacija, teisėtas sekimo/marketingo pagrindas, atsisakymo kelias ir įrodoma sutikimo būsena. Dabartinis privatumo puslapis yra šablonas. Sistema gali sugeneruoti dokumento juodraštį iš tikrų verslo faktų, bet negali išgalvoti juridinių duomenų ar paslėpti neįdiegtų sekiklių. ES/LT tiesioginės rinkodaros išimtys ir vartotojų grąžinimo teisės priklauso nuo konkretaus scenarijaus; prieš automatinio refundo taisykles įjungiant, jas reikia įvertinti pagal tikras prekybos sąlygas. [EDPB sutikimo kriterijai](https://www.edpb.europa.eu/sme/be-compliant/process-personal-data-lawfully_en), [ES e. prekybos vartotojų teisių apžvalga](https://digital-strategy.ec.europa.eu/en/policies/e-commerce-rules-eu).

### Socialiniai kanalai ir kūryba

Vienas patvirtintas produkto faktų/media rinkinys → atskiri Instagram, Facebook, TikTok scenarijai, kad neatsirastų identiškas spam. Kūrybinis agentas gali automatiškai parinkti įrodytas produkto demonstracijos atkarpas, kurti subtitrus, 9:16/1:1 variantus, UTM ir įrašų grafiką. Kiekvienam assetui saugoma kilmė, muzikos licencija, žmogaus atvaizdo leidimas, platformos paskirtis ir galiojimas. AI UGC nevaizduojamas kaip tikro kliento liudijimas; netikri atsiliepimai draudžiami.

Pirmas gamybos kelias — autentiškas produkto video/nuotraukos ir nemokamas Blender/FFmpeg šablonų renderinimas; AI vaizdai tik kontekstui, aiškiai ne kaip produkto įrodymas. Higgsfield naudoti tik jei konkrečios kūrybinės hipotezės rezultatas pateisina kreditus: [jų oficialios taisyklės](https://higgsfield.ai/creator-hub/help-center/credits/how-credits-work) nurodo, kad MCP/CLI automatika naudoja kreditus net kai web sąsajoje yra „free/unlimited“ generacijų. Higgsfield pluginas rastas, bet neįdiegtas. Socialinių kanalų viešas autopostingas įjungiamas tik patikrinus paskyros tipą ir oficialų leidimą. [TikTok Direct Post](https://developers.tiktok.com/docs/en/content-posting-api-get-started) viešam turiniui reikalauja programos leidimų/audito ir naudotojo sutikimo; pasirinktas API srautas gali prašyti aiškaus sutikimo kiekvienam įkėlimui, tad vienkartinė pradinė autorizacija ne visada pakanka. Tokį kanalą palikti atskirai leidžiamo platformos schedulerio ar konkretaus sutikimo režime; nežadėti „be žmogaus“ ten, kur platforma to neleidžia, ir neapeiti naršyklės robotu.

**Vienodi kanalo vartai:** straipsnis, Instagram/Facebook/TikTok postas, marketingo laiškas ir automatinis support atsakymas turi atskirą versijuotą policy, hash-bound AI QA, faktų ir medijos/teksto teisių validaciją, idempotentinį išsiuntimą bei exception kelią. Straipsnio approval automatiškai netampa socialinio klipo ar laiško approval. Transakciniai šablonai iš pradžių patvirtinami kaip šablonai; kiekvieno įvykio laukai tikrinami deterministiškai. Tai leidžia kasdien veikti be žmogaus ir neleidžia kitos terpės perrašyti su nepatikrintu pažadu.

## 6. Integracijos ir realūs kaštai

2026-09-26 pluginų katalogo patikrinimas; „rastas“ nereiškia prijungtas, o „nemokamas pluginas“ nereiškia nemokama susieta paslauga.

| Priemonė | Siūlomas vaidmuo | Dabartinė išvada / kaštų pastaba |
| --- | --- | --- |
| Shopify + Shopify Flow | SKU/užsakymų savininkas ir paprasti event workflow, **jei parduotuvė tikrai Shopify** | Shopify prenumerata mokama; [Flow yra nemokama app Basic+](https://help.shopify.com/en/manual/shopify-flow), tačiau `Send HTTP Request` tik Grow/Advanced/Plus. Jei Basic, integracijai reikės oficialaus app/webhook kelio. Shopify pluginas kataloge rastas, neįdiegtas. |
| Shopify Messaging | Baziniai marketingo/aftercare laiškai prieš atskirą ESP | [10 000 marketingo laiškų/mėn. įtraukta](https://help.shopify.com/en/manual/promoting-marketing/create-marketing/shopify-messaging/email/pricing) tinkamuose planuose; virš limito mokama. Klaviyo tik jei segmentavimo/LTV poreikis ir ROI pateisina. |
| Google Search Console + GA4 | SEO ir perėjimo į parduotuvę matavimas | Oficialios paskyros/API, GSC Wizard pluginas rastas, neįdiegtas. Pluginas patogus analizei, ne vienintelis ETL. |
| Metricool arba oficialios Meta/TikTok priemonės | Socialinių įrašų tvarkaraštis/analitika | Metricool pluginas rastas, neįdiegtas. Prieš pasirinkimą patikrinti konkretaus plano nemokamas ribas ir kanalų leidimus; nenaudoti kartu su kitu scheduleriu be priežasties. |
| Higgsfield | Pasirenkamas AI kūrybos eksperimentas | Pluginas rastas, neįdiegtas; automatizuotas MCP/CLI renderinimas kainuoja kreditus. Ne kritinis kelias. |
| Cloudflare Workers/D1/Queues, jei tai tikras hostingas | Viešo puslapio runtime ir patikimi fono jobai | [D1 Free dienos limitai](https://developers.cloudflare.com/d1/platform/pricing/) viršijus grąžina klaidas iki UTC limito atsinaujinimo; produkcijai reikia kvotų stebėjimo ir, jei kritinis srautas priklauso nuo D1, mokamo plano vertinimo. Workers Free turi [CPU ribas](https://developers.cloudflare.com/workers/platform/limits/), todėl LLM generavimas yra asinchroninės užduotys, ne ilgas web request. Kaina priklauso nuo užklausų/rašymo ir [Workers plano](https://developers.cloudflare.com/workers/platform/pricing/). |
| Blender/FFmpeg, esamas TS/Python | Šablonai, vaizdų/video transkodavimas, duomenų QA, auditas | Programinė įranga nemokama; vykdymo kompiuteris, saugykla, AI tokenai ir žmogaus sukauptas produkto medžiagos fondas vis tiek kainuoja. |

**Biudžeto taisyklė:** iš anksto nustatytas mėnesio ir vieno jobo limitas AI tekstui, vaizdams, video, el. paštui, reklamai. Jei tiekėjas negali priverstinai užtikrinti limito, mūsų orkestratorius sustabdo naujus jobus pagal savo apskaitą. Naujos mokamos prenumeratos, reklamos biudžetai ar viršyti limitai nėra automatiškai patvirtinami. Nemokamą alternatyvą renkamės tik jei ji patikimai atlieka tą patį darbą.

## 7. Matavimas, eksperimentai, autonomijos vartai

**North-star:** ne straipsnių skaičius, o kokybiškas nebrandinis srautas į naudingus puslapius ir kvalifikuotas perėjimas/pirkimas, nepabloginant klientų patirties. Kas savaitę saugoti šaltinį ir laikotarpį: GSC parodymai/paspaudimai/CTR pagal klasterį, indeksuotų kanoninių URL dalis, CTA paspaudimai, Shopify pirkimai/pajamos/grąžinimai (su atribucijos ribomis), pagalbos skundai, turinio QA atmetimų ir atšaukimų dalis, vaizdų/video savikaina, publikavimo vėlavimas, CWV. AI paieškos duomenis naudoti jei paskyroje prieinami; nelaikyti „ChatGPT citatų“ pažadėtu KPI.

**Atribucijos pasirinkimas:** pirmoje versijoje matuoti agreguotą `site/article/CTA` išėjimo paspaudimą dovanos123.lt ir Shopify kampanijos lygio UTM atvykimus/pardavimus; tai **nėra** įrodytas individualus „šis straipsnis sukūrė šį užsakymą“ join. Cross-domain GA4 matavimą įjungti tik patikrinus abiejų domenų vienodas žymas, sutikimus ir perduodamus linker parametrus per redirectus pagal [Google Analytics dokumentaciją](https://support.google.com/analytics/answer/10071811). Be tokių sąlygų ataskaita aiškiai rodo atribucijos nežinomybę, ne išgalvotą ROAS.

**Tempo didinimo taisyklė:** pirma 5–8 kritinių puslapių/straipsnių validavimo kohorta, po 7–14 dienų techninio stebėjimo 10–15, vėliau iki 20+/mėn., jei kiekvienas URL turi atskirą ketinimą ir originalią vertę. `Go` tik kai 100 % naujų URL praėjo deterministinius vartus, nėra nepagrįstų produkto/saugumo/siuntimo teiginių, suplanuoto turinio nuotėkio ar P0/P1 incidento per savaitę, faktai švieži ir išimčių eilė neužsikemša. `Stop` iš karto aptikus neteisingą kainą, nuorodą į dar nematomą URL, neatitinkantį approval turinį ar klaidingą canonical/sitemap; po 28–42 dienų GSC kohortomis vertinti indeksavimą, parodymus ir užklausų intenciją. Naujam domenui neužduodame išgalvoto ankstyvų paspaudimų slenksčio. Jei indeksuojama mažuma tinkamų URL, užklausos neatitinka puslapių arba auga dublių/atnaujinimų skola, stabdyti naujų temų plėtrą ir tirti. Šie vartai yra valdymo hipotezės, ne Google algoritmo taisyklės.

**Eksperimentų registras:** hipotezė, vienas kintamasis, tiksliniai URL/kanalai, pradžia/pabaiga, guardrail metrika, rezultatas ir sprendimas (scale/iterate/stop). Pirmi bandymai: gido pasirinkimo lentelė prieš paprastą sąrašą; CTA pagal kontekstą prieš banerį; realaus produkto video prieš lifestyle vaizdą. Negalima tvirtinti laimėjimo vien iš kelių paspaudimų.

## 8. Įgyvendinimo seka ir priėmimo testai

| Fazė | Rezultatas | Priėmimo sąlyga |
| --- | --- | --- |
| **0. Faktų žemėlapis** | Gyvo domeno/hostingo, Sites→D1 binding, Search Console, Shopify platformos/plano, produkto SKU, atsargų, siuntimo pažadų, nuotraukų teisių, paskyrų tipų ir privatumo informacijos read-only inventorius. | Nė vienas verslo faktas ar prieiga nevadinama „patikrinta“ be šaltinio. Patvirtintas fono workerio kelias; paskyros neprijungiamos vien dėl plano. |
| **1. Prekybos ir matavimo bazė** | Tikras produkto/siuntimo faktų feed, autentiškų medijų/licencijų inventorius, domenas ir privatumo/viešinimo sąlygos **paruošti**, minimalus outbound CTA + Shopify UTM matavimo dizainas. Paraleliai AI ruošia briefus ir produkto demonstracijos scenarijus. Jei aplinka dar privati, anoniminis viešas jungiklis lieka išjungtas iki 2 fazės priėmimo; jei svetainė jau vieša, naujas automatinis publikavimas lieka išjungtas, o esami URL audituojami nenuimant svetainės be atskiro sprendimo. | Prieš viešinant gidą galima patikrinti jo SKU/siuntimą/vaizdus ir kvalifikuoto perėjimo kelią; nėra išgalvoto produkto fakto. |
| **2. Vienas turinio šaltinis + AI vartai** | Statinių įrašų migracijos scenarijus į D1, produkcinio fallback panaikinimas, DEMO autorių patikra, vienodas matomumo predikatas, cache/UTC testai; atskiros agentų teisės, claims/evidence, nekintama versija ir media URL, hash-bound approval, deterministinis QA, atominis ingest ir audit log. **Tik po šios fazės priėmimo galima įjungti anoniminį viešumą.** | Tinkamas URL, homepage/kategorijos/sitemap/`llms` ir senesnės vidinės nuorodos suderinami per sutartą ≤60 s ribą; `pending` niekad nematomas; pasikeitęs turinio digest panaikina leidimą; in-place media pakeitimas neįmanomas; DB klaida matoma. |
| **3. Kalėdų naudingi puslapiai** | Esamų URL atnaujinimas, Kalėdų hub, svarbiausi gavėjų/progų/biudžetų gidai, reali rinkinio demonstracija, kitos tikros alternatyvos. | Kiekvienas URL turi atskirą ketinimą, naudą, patikrintus produktus ir leidžiamus vaizdus; kritinis kelias nuo Google iki pirkimo veikia. |
| **4. Parduotuvės operacijos** | Pilnesni GA4/Shopify įvykiai, Shopify Flow/webhook pipeline, el. pašto ir palaikymo žinių bazė, išimčių lenta. | Bandomasis užsakymas/atšaukimas nekuria dublikatų; marketingo laiškas neišeina be teisėto pagrindo; ataskaitoje kiekviena metrika turi šaltinį. |
| **5. Socialiniai/video** | Autentiškos medžiagos biblioteka, kanalų kūrybos šablonai, medijos teisių registras, leidžiamas scheduleris. | 3 skirtingi kanalų variantai atitinka faktus/teises; nėra netikrų liudijimų; autopost tik po platformos leidimų patikros. |
| **6. Skalė** | Tik po LT rezultatų — atskira kitos šalies pasiūla, lokalūs duomenys, gimtakalbis QA, vietinis pristatymas ir teisės. | Nauja svetainė naudinga savarankiškai, ne vien tarpinė duris į tą patį landing. |

**Testų rinkinys prieš „hands-off“ režimą:** penkių suplanuotų straipsnių testinis laikrodis ir lygiagretūs skaitymai ties laiko riba; approval pasibaigia iki aktyvavimo; approval terminas sueina po publikavimo; skubus revocation po publikavimo; media failas pakeičiamas tuo pačiu URL; du dubliuoti outbox vartotojai; nutrūkęs jobas; D1 gedimas, Free kvotos išnaudojimas, replika atsilieka ir clock skew; senstanti kaina, išparduotas SKU, ateities nuoroda, fiktyvi citata, neužregistruota vaizdo licencija, 404 trečios šalies produktas, neatsakantis Shopify, dubliuotas webhookas, neteisingas sutikimas ir kritęs CWV. Kiekvienas scenarijus turi numatytą automatinį saugų rezultatą ir alertą, ne tylų fallback. Vieno nepatikrinto scheduled įrašo nepublikavimas yra teisingas blokavimas; 100 % **tinkamų patvirtintų** įrašų turi būti matomi per sutartą ≤60 s ribą.

## 9. Savininko dalyvavimas: tik pradinis nustatymas ir tikros išimtys

Sistemos paleidimui vieną kartą reikės savininko suteiktų **faktų ir paskyrų autorizacijos**: tikroji e. parduotuvės platforma/planas, SKU ir produktų savybės, siuntimo bei grąžinimų taisyklės, naudojamų vaizdų/video teisės, juridiniai/privatumo duomenys, socialinių paskyrų leidimai, maksimalios išlaidos ir kokius standartinius refundus galima vykdyti automatiškai. Slaptažodžiai ir API raktai neįrašomi į Markdown ar promptus — tik į secrets saugyklą.

Kasdienis turinio rašymas, redagavimas, schedule, nuorodų atsiradimas, produkto faktų atnaujinimas, įprasti laiškai ir ataskaitos projektuojami be savininko klaviatūros. Jei faktas, teisė ar platformos sutikimas neegzistuoja, procesas pereina į `exception`; tai nėra „papildomas žmogaus redaktorius“, o sąžininga riba, kurios AI negali išgalvoti. Nereikėtų teigti, kad 100 darbuotojų pakeisti ar SEO pozicijos garantuotos.

## 10. Kaip naudoti vietinius `SEO SKILLS`

Vartotojo pateikti 48 šablonai yra `SEO SKILLS/` aplanke; jų `README.md` sako, kad failai surinkti peržiūrai, neįdiegti. Naudoti kaip **versijuojamus promptų/testų šablonus**, ne kaip privalomą Google ar platformų dokumentaciją:

| Darbo etapas | Naudingi šablonai | Būtina korekcija |
| --- | --- | --- |
| Temų atranka | `seo-audit`, `competitor-research`, `seo-cannibalization`, `weekly-content-plan`, `market-research-brief` | Pridėti realius GSC/produktų duomenis ir intent registrą; nekurti išgalvotos paieškos apimties. |
| Gamyba | `seo-content-brief`, `blog-post`, `brand-style-guide`, `brand-voice-check`, `internal-linking` | Kiekvienas claim su įrodymu; nuorodos tik į gyvus URL; neapsimesti realiu testavimu. |
| QA/GEO | `on-page-seo-checklist`, `seo-metadata`, `generative-engine-optimization`, `ux-review` | Atmesti šablonų teiginius apie garantuotas AI citatas, būtinas specialias schemas ar `llms.txt`; tikrinti pagal oficialias taisykles. |
| Optimizavimas ir operacijos | `seo-content-refresh`, `serp-ctr-optimizer`, `customer-feedback`, `customer-support-reply`, `weekly-business-brief-agent`, `monthly-business-review`, `sop-generator` | Naudoti tik tikrus matavimo/klientų duomenis, ribotas teises ir išimčių taisykles. |

**Ko šis dokumentas nedaro:** nekuria straipsnių, neprijungia pluginų ar parduotuvės, neįjungia schedulerio, neskelbia socialinių įrašų ir neleidžia reklamos biudžeto. Jis yra sprendimų bei priėmimo kriterijų kontraktas kitam įgyvendinimo etapui.
