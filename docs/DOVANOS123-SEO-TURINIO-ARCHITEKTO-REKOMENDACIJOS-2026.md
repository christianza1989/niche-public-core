# Dovanos123.lt turinio ir SEO architektūros rekomendacijos, 2026 m. ruduo–žiema

**Parengta:** 2026-09-28. **Statusas:** redakcinis sprendimo dokumentas; nieko nepublikuota. **Ribos:** lokali kodo ir planų kopija, atrankinė viešų paieškos rezultatų peržiūra, oficiali Google Search Central dokumentacija. Neturiu Dovanos123.lt Search Console, analitikos, gyvos svetainės crawl ar patvirtinto produktų katalogo. Užklausos ir prioritetai yra patikrinamos hipotezės, ne paieškų apimties ar reitingų prognozės.

## Sprendimas trumpai

1. Iki Kalėdų pagrindinė užduotis yra padėti apsispręsti **kam, už kiek, iki kada ir kokio pobūdžio** dovaną pirkti. Pirmiausia stiprinti jau esančius Kalėdų, poros, tėvų, šeimos ir biudžeto URL. Naują URL kurti tik tada, kai jis sprendžia kitą užduotį ir turi savitą medžiagą.
2. Sustabdyti 5 naujų straipsnių per savaitę kalendorių kaip automatinį leidybos įsipareigojimą. Kol nematyti GSC ir nėra veikiančio produkto duomenų šaltinio, siūlau **iki 1–2 iš tiesų naujų puslapių per savaitę** ir 2–3 esamų puslapių patikras / patobulinimus. Tai redakcinė pajėgumo prielaida, ne Google nustatytas dažnis.
3. Memory Casting yra prasmingas pasirinkimas porai, šeimai ar artimam žmogui, kuris nori **kartu kurti apčiuopiamą prisiminimą** ir sutinka skirti laiko procesui. Jis netinka kiekvienam gavėjui, mažam biudžetui, santykiui be artumo ar paskutinės minutės pristatymo pažadui.
4. Pagal užduoties prielaidą `memocasting.lt` Shopify parduotuvė dabar išjungta. Vietinis `lib/site-config.ts` rodo `https://memorycasting.lt/`, o senas viešas puslapis mini `memocasting.lt`; tai nėra patvirtintas veikiantis pirkimo kelias. Kol savininkas vėl neįjungs parduotuvės ir nebus patikrinti konkretūs produktų URL, variantai, kaina, likutis bei pristatymas, redakcija neturi rašyti „pirkti dabar“, rodyti kainos/likučio schemos ar žadėti pristatymo Kalėdoms. Galima paaiškinti dovanų tipą ir jo ribas be prekybinio CTA.

## Ką iš tikrųjų radau vietinėje kopijoje

| Šaltinis | Faktas | Redakcinė išvada |
| --- | --- | --- |
| `lib/content.ts` | 6 LT `DEMO_ARTICLES` įrašai (vienas `draft`) ir 1 PL įrašas. Tarp LT: rankų liejimo išsamus gidas, „kaip veikia“, prasmingos dovanos porai, Kalėdos porai, vyrui Kalėdoms. | Tai kodas, ne patvirtintas gyvos svetainės inventorius. Du rankų liejimo gidai ir dvi poros temos reikalauja ketinimų ribų. |
| `lib/new-articles.ts` | 3 LT failiniai įrašai su 2026-09-23–25 datomis: Kalėdų hub, dovanų planavimas, dovanos iki 20 €. | Jie jau turi tapti klasterio atspirties taškais; biudžeto straipsnyje teisingai atsisakyta netinkančio Memory Casting intarpo. |
| `lib/scheduled-articles-2026.ts`, `docs/SCHEDULED-ARTICLES-2026-09-28.md` | 20 įrašų datuoti 2026-09-28–10-23: pirmi penki Kalėdų, po jų bendri gavėjų ir dovanų savybių gidai. | Apžvelgti kiekvieno savitumą **prieš** planuotą atidengimą; suplanuota data nereiškia kokybės ar gyvo URL patvirtinimo. |
| `docs/CONTENT-PLAN-2026-2027.md` | 14 savaičių Kalėdų grafikas su daugeliu panašių „dovanos X“ ir 10/20/30/50/100 € puslapių; minima ~240 naujų straipsnių per metus. | Tai temų rezervuaras. Skirtingi raktiniai žodžiai savaime nepateisina atskirų puslapių. |
| `docs/AUTOMATIZAVIMO-ARCHITEKTURA-IR-ROADMAP-2026.md` | Dabartinė projekto kryptis: AI tyrėjas, rašytojas ir nepriklausoma patikra, be kasdienio žmogaus redaktoriaus; vienas ketinimo registras ir faktų vartai. | Šios rekomendacijos dera su autonominiu modeliu, bet nepriima AI patvirtinimo kaip produkto faktų ar patirties įrodymo. |

**Pastaba dėl viešumo:** failinė `published` / `scheduled` būsena ir šiandienos data neįrodo nei realaus domeno HTTP būsenos, nei indeksavimo. DB turinys taip pat gali skirtis. Prieš keisdami gyvą URL, sutikrinkite domeno crawl, sitemap, kanoninį URL ir GSC puslapių ataskaitą.

## 2026 m. paieškos ketinimai ir puslapių tipai

Atrankinėje 2026-09-28 viešos paieškos peržiūroje plačios „Kalėdų dovanos“ užklausos rodė ir dovanų gidus, ir parduotuvių kategorijas; „iki 20 €“ bei „kolegai“ užklausos dažnai veda į kainos filtrą ar prekių atranką; „rankų liejimo rinkinys porai“ turi aiškų produkto pasirinkimo atspalvį. Tai **formatų signalas**, ne pilnas Lietuvos SERP tyrimas ir ne paieškos apimties skaičiavimas. Pavyzdžiai: [IKEA dovanų idėjos](https://www.ikea.com/lt/lt/ideas/gift-ideas/), [Dovanų sala: dovanos kolegai](https://www.dovanusala.lt/lt/187-dovana-kolegai), [LEGO 2026 Kalėdų rinkiniai](https://www.lego.com/lt-lt/holiday-gifts/best-christmas-gifts). Prieš naują URL patikrinkite tikslią lietuvišką užklausą, mobilią paiešką ir rezultatų tipą iš naujo.

| Prioritetas | Užklausų šeima (pavyzdžiai, ne apimtys) | Skaitytojo darbas | Rekomenduojamas puslapis / formatas | Memory Casting |
| --- | --- | --- | --- | --- |
| P0 | `kalėdinės dovanos`, `kalėdinių dovanų idėjos 2026` | Rasti kryptį pagal žmogų, biudžetą ir terminą | Esamo `/straipsniai/kalediniu-dovanu-gidas-2026` turiningas hub: pasirinkimo matrica, keliai į gyvus siauresnius gidus, aiškus 2026 m. kontekstas | Tik viena sąlyginė kūrybinės dovanos kryptis |
| P0 | `dovana porai`, `kalėdinės dovanos porai` | Nuspręsti dėl bendros dovanos dviem ir progos | Evergreen poros gidas + atskiras Kalėdų puslapis tik jei turi savitą šventinį terminų / įteikimo / abiejų gavėjų sprendimą | Dažnai tinka, jei abu nori dalyvauti |
| P0 | `kalėdinės dovanos tėvams`, `dovana šeimai Kalėdoms` | Bendra ar atskira dovana, amžius, dalyvių skaičius | Jau suplanuotų puslapių patobulinimas: palyginimo lentelė ir konkretūs apribojimai | Sąlyginai tinka; būtinas dalyvių ir amžiaus atitikimas |
| P0 | `kalėdinės dovanos iki 20 eurų`, `dovana iki 10 eurų` | Pamatyti tikrai į ribą telpančias idėjas su visomis išlaidomis | Esamas 20 € gidas; 10 € atskirai tik jei atsiras tikrų, patikrintų konkrečių variantų ir kitokia atranka | Nesiūlyti be patvirtintos kainos, telpančios į bendrą ribą |
| P1 | `Secret Santa dovanos`, `dovana kolegai Kalėdoms` | Išvengti per daug asmeniškos dovanos pagal sutartą sumą | Vienas Secret Santa / kolegų apsikeitimo gidas su biudžeto ir darbo santykių filtrais; atskirą „kolegai“ kurti tik jei skiriasi proga ir poreikis | Paprastai netinka |
| P1 | `originalios kalėdinės dovanos`, `personalizuotos dovanos` | Išrinkti asmenišką, bet naudotiną dovaną | Jau suplanuoti formatų gidai su kriterijais, tikrais pavyzdžiais ir „kam netinka“ | Tinka kaip vienas iš kelių formatų |
| P1 | `rankų liejimo rinkinys`, `kaip padaryti rankų liejinį`, `rankų liejimo rinkinys porai` | Suprasti komplektaciją, sudėtingumą, galutinį rezultatą ir tinkamumą | Vienas pagrindinis produkto kategorijos gidas + tikra vaizdinė demonstracija / instrukcija; atskiras poros sprendimo puslapis tik su SKU ir realia patirtimi | Pagrindinė tema, bet be nepatvirtintų specifikacijų |
| P1, vėliau | `dovana paskutinę minutę`, `dovanos su pristatymu iki Kalėdų` | Gauti įteikiamą dovaną iki konkrečios dienos | Gyvai atnaujinamas sprendimų puslapis su patikrintais datų langais, skaitmeninėmis ar vietoje gaunamomis alternatyvomis | Tik esant patvirtintam pristatymui; kitu atveju netinka |
| P2 | `dovanos mamai`, `dovanos tėčiui`, `dovanos seneliams`, `dovanos draugams` | Priderinti prie santykio ir pomėgių | Esami suplanuoti evergreen puslapiai, ne naujos šventinės kopijos pagal kiekvieną permutaciją | Pagal konkretų santykį ir polinkį, ne automatiškai |

**Puslapio tipų taisyklė:** komercinei frazei su prekėmis / kainų filtrais gali labiau tikti patikrinama atranka arba katalogo tipo puslapis, o ne vien ilgas tinklaraščio tekstas. Jei nėra aktualių produktų duomenų ir veikiančio pirkimo kelio, publikuoti sąžiningą pasirinkimo gidą; nekurti pseudo-katalogo iš nepatikrintų kortelių. Instrukciniam klausimui reikia tikrų veiksmų ir nuotraukų, ne „10 dovanų“ sąrašo.

## Ketinimų nuosavybė ir dublių prevencija

| Susikertančios temos | Sprendimas dabar | Kas lemtų kitokį sprendimą |
| --- | --- | --- |
| `/straipsniai/ranku-liejimo-rinkinys-issamus-gidas` ir `/straipsniai/ranku-liejimo-rinkinys-kaip-veikia` | Gidas valdo pasirinkimo / komplektacijos klausimą; „kaip veikia“ turi būti trumpa aiški proceso demonstracija su realiais etapais. Jei jo savito turinio nėra, siūlyti konsoliduoti po gyvo URL ir GSC patikros. | Tikras naudojimo video, žingsnių nuotraukos ir savarankiška instrukcinė paklausa pateisintų abu. |
| `/straipsniai/prasmingos-dovanos-porai`, `/straipsniai/dovanos-porai-idejos`, `/straipsniai/kaledines-dovanos-porai` | Pirmasis = prasmingumo kriterijai; antrasis = plati evergreen atranka; trečiasis = 2026 m. Kalėdų sprendimas. Prieš 10-09 leidybą peržiūrėti, ar `dovanos-porai-idejos` nėra tik pirmojo perpasakojimas. | GSC užklausų ir puslapių duomenys po viešumo parodys, ar frazės iš tiesų dalijasi parodymus / ar vartotojo užduotis skiriasi. |
| `/straipsniai/ka-dovanoti-vyrui-kaledoms` ir plano „kalėdinė dovana vyrui“ | Išlaikyti esamą URL kaip Kalėdų vyrui pagrindinį puslapį; jį atnaujinti, nekuriant sinoniminio URL. | Naujas puslapis tik kitam ketinimui, pvz., aiškiai apibrėžtam konkrečiam pomėgiui su savitais duomenimis. |
| `/straipsniai/kalediniu-dovanu-gidas-2026` ir „originalios / prasmingos / sentimentalios dovanos“ | Hub pateikia sprendimų kelią; savybių gidai turi atskirus kriterijus ir tikrus pavyzdžius. Jei 10-20 ir 10-21 tekstai iš esmės vienodi, sujungti vieną temą prieš viešumą. | Atskiros skaitytojų problemos ir unikalūs palyginimai. |
| `iki 10`, `iki 20`, `iki 30`, `iki 50`, `iki 100 €` | Neskelbti visų penkių iš anksto. Laikyti 20 € kaip pirmą patikrintą ribą; kitas pridėti tik su atnaujinamu kainų katalogu ir aiškiai kitokiu asortimentu. | Realus asortimentas, patikrintos visos išlaidos ir skirtingi SERP poreikiai. |

**Svarbu:** vien dviejų URL pasirodymas tai pačiai užklausai nėra savaiminė „kanibalizacijos“ diagnozė. GSC `Performance` ataskaitoje filtruoti užklausą, atsidaryti `Pages`, palyginti laiką, paspaudimus, parodymus, pozicijų pokyčius ir pačius puslapius. Jei abu aptarnauja skirtingą poreikį, palikti ir aiškiau diferencijuoti. Jei vienas tapatus ir silpnesnis, sujungti geriausią turinį, nukreipti seną URL nuolatiniu peradresavimu į **atitinkamą** puslapį ir pataisyti vidines nuorodas. `rel=canonical` yra signalas labai panašiems / dubliuotiems URL, ne priemonė paslėpti dvi skirtingas temas; Google galutinį canonical gali pasirinkti pati. [Google Search Console įvadas](https://developers.google.com/search/docs/monitor-debug/search-console-start), [Google canonical metodai](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).

## Konkreti leidybos ir atnaujinimų eilė

Ši seka pakeičia mechaninį dieninį kalendorių. „Naujas“ reiškia kandidatinį straipsnį, kurio URL ir publikavimo data dar netvirtinami; „atnaujinti“ reiškia jau esančio failinio įrašo / gyvo URL turinio peržiūrą, **ne datos pakeitimą dėl šviežumo**.

| Laikas | Darbas | Publikuotinas pavadinimas / klausimas | Puslapio vertė ir vartai |
| --- | --- | --- | --- |
| 09-28–10-04 | **Atnaujinti** | „Kalėdinių dovanų gidas 2026: kaip pasirinkti pagal žmogų, biudžetą ir laiką“ | Hub lentelė: gavėjas × artumas × biudžetas × paruošimo laikas; nuorodos tik į viešus URL; pašalinti neveikiantį komercinį pažadą. |
| 09-28–10-04 | **Patikrinti suplanuotus** | „Kalėdinės dovanos tėvams: bendra ar atskira dovana?“ ir „Kalėdinės dovanos šeimai: kaip įtraukti visus“ | Sąžiningos bendra / atskira ir amžiaus / erdvės / paruošimo ribos. 20 straipsnių grafikas nėra įrodymas, kad visi turi atsiverti. |
| 10-05–10-11 | **Atnaujinti / diferencijuoti** | „Dovanos porai: ką rinktis, kai dovana skirta abiem?“ | Viena evergreen sprendimų matrica; `prasmingos-dovanos-porai` peržiūra prieš suplanuoto `dovanos-porai-idejos` atidengimą. Memory Casting pavyzdys tik su sąlygomis. |
| 10-05–10-11 | **Naujas, jei yra demonstracija** | „Rankų liejimo rinkinys porai: ko reikia pirmajam bandymui?“ | Realios komplektacijos, darbo vietos ir rezultatų nuotraukos; palyginimas su kitomis bendromis veiklomis. Jei savų įrodymų nėra, stiprinti esamą gidą, o ne kurti URL. |
| 10-12–10-25 | **Atnaujinti** | „Personalizuotos dovanos: kada asmeniškumas išties tinka?“ | Jau suplanuotas 10-19 tekstas turi palyginti nuotrauką, laišką, bendrą kūrimą ir praktišką daiktą; nenaudoti „išbandėme“, jei nėra bandymo. |
| 10-19–11-01 | **Naujas, jei yra pavyzdžių** | „Secret Santa dovanos kolegai: ką rinktis pagal sutartą biudžetą?“ | 10/20 € sąlyginiai pavyzdžiai, darbo santykio ribos, anonimiškumas, pakavimas; kainos ir prieinamumas patikrinti prieš rodant. Memory Casting nerekomenduoti. |
| 10-26–11-08 | **Atnaujinti** | „Kalėdinės dovanos iki 20 €: kiek iš tiesų kainuos įteikimas?“ | Patikrinti esamo gido 2 konkrečius kainų teiginius ir nuorodas; į bendrą sumą įtraukti siuntimą, spaudą, pakuotę. Jei nepatvirtinta, kainą pašalinti. |
| 11-02–11-15 | **Naujas, jei yra šaltinių** | „Dovana žmogui, kuris nemėgsta daiktų: patirtis be papildomo įsipareigojimo“ | Skiriasi nuo suplanuoto „viską turi“: orientuotas į erdvės / daiktų atsisakymą, galiojimą ir datos planavimą. Jei savito skirtumo nėra, pridėti skyrių esamame puslapyje. |
| 11-16–11-29 | **Naujas, tik su duomenimis** | „Kalėdinės dovanos su pristatymu: kada jau per vėlu užsakyti?“ | Konkreti tikrinimo data, pardavėjo / vežėjo sąlygos, alternatyvos vietoje / skaitmeniniu būdu. Be patikimo feed geriau evergreen „kaip tikrinti terminą“ skyrius Kalėdų hub'e. |
| 11-30–12-20 | **Nuolatiniai atnaujinimai** | „Dovanos paskutinę minutę: ką galima įteikti laiku?“ | Keisti tik pagal tikrą pristatymą ir galimus atsiėmimo būdus; po cutoff slėpti nebegaliojantį CTA. Memory Casting nesiūlyti, kai fiziškai neįmanoma įteikti laiku. |
| 12-21–01 | **Po sezono auditas** | Jokių dirbtinių „metų geriausių“ ar padėkos straipsnių vien grafikui užpildyti | Užfiksuoti GSC užklausas / puslapius, pasenusias kainas, pirkimo kelio spragas; spręsti, ką atnaujinti 2027 m. |

**Prieš kiekvieną publikavimą:** tiesioginis atsakymas į skaitytojo klausimą; savitas pasirinkimo kriterijus ir bent vienas tikras pavyzdys; produktų faktų šaltiniai ir patikros data; aiškus „kam netinka“; tik realūs autorius / redakcija ir vizualų kilmė; nuorodos į viešus susijusius URL; skaidrus bendro savininko ryšys. Žmogaus kasdienis redagavimas nėra būtina prielaida, tačiau automatika turi atmesti įrašą, jei negali patikrinti materialaus teiginio.

## Vidinių nuorodų žemėlapis ir Memory Casting riba

Žemiau nurodyti **vietiniame kode esantys keliai**, bet jų gyvumas nepatikrintas. Aktyvuoti nuorodą tik kai tikslinis viešas URL grąžina tinkamą turinį; iki tol tema gali būti paprastas tekstas. Google rekomenduoja bent vieną aptinkamą nuorodą į svarbų puslapį ir natūralų, aiškų ankerį, bet nenurodo universalaus 3 paspaudimų arba 30–60 nuorodų normatyvo. [Google nuorodų gairės](https://developers.google.com/search/docs/crawling-indexing/links-crawlable).

| Iš kur | Į kur | Natūralus ankeris ir vieta |
| --- | --- | --- |
| `/straipsniai/kalediniu-dovanu-gidas-2026` | `/straipsniai/kaledines-dovanos-tevams` | „bendros ar atskiros Kalėdų dovanos tėvams“ skiltyje apie šeimą |
| `/straipsniai/kalediniu-dovanu-gidas-2026` | `/straipsniai/kaledines-dovanos-iki-20-euru` | „dovanos iki 20 € su įteikimo išlaidomis“ biudžeto skiltyje |
| `/straipsniai/kaledines-dovanos-seimai` | `/straipsniai/kalediniu-dovanu-gidas-2026` | „visas Kalėdų dovanų pasirinkimo gidas“ pabaigoje, kai reikia platesnio pasirinkimo |
| `/straipsniai/kaledines-dovanos-porai` | `/straipsniai/ranku-liejimo-rinkinys-issamus-gidas` | „kaip išsirinkti rankų liejimo rinkinį“ tik pastraipoje apie bendrą kūrybą |
| `/straipsniai/ranku-liejimo-rinkinys-issamus-gidas` | `/straipsniai/kaip-suplanuoti-kaledines-dovanas` | „kaip suplanuoti dovanos paruošimo laiką“ jei tikrai padeda prieš šventes |

**Produkto įterpimo matrica:**

| Situacija | Ar rinkinys tinka? | Ką pasakyti skaitytojui |
| --- | --- | --- |
| Artima pora ar šeima nori kartu kurti, turi vietos ir laiko | Taip, patikrinus rinkinio dydį / dalyvių skaičių | Parodyti procesą, netobulo rezultato galimybę, alternatyvią bendrą veiklą. |
| Tėvai ar seneliai mėgsta prisiminimus, bet nenori rankdarbių | Dažniausiai ne | Siūlyti jau paruoštą albumą, nuotrauką ar suplanuotą susitikimą. |
| Kolega, naujas draugas, Secret Santa | Paprastai ne | Dovana per daug intymi ir reikalaujanti laiko; rinktis neutralų mažą gestą. |
| Iki 10 € ar 20 € | Tik jei tikra bendra kaina telpa į ribą | Šiuo metu neteikti tokio pasiūlymo be patvirtintos kainos; esamas 20 € gidas jo atsisako. |
| Kūdikio ar mažų vaikų dalyvavimas | Tik su konkretaus SKU gamintojo amžiaus / saugos informacija | Be dokumentų neskelbti „saugus kūdikiui“ ir nekurti atskiro šios intencijos puslapio. |
| Paskutinė savaitė prieš Kalėdas | Tik jei parduotuvė veikia ir pristatymas patvirtintas | Jei Shopify išjungtas ar terminas neaiškus, jokio pirkimo CTA. |

## SKILL teiginių sutikrinimas su Google

Perskaityti visi penki užduotyje nurodyti vietiniai failai: `seo-content-brief`, `blog-post`, `internal-linking`, `seo-cannibalization`, `weekly-content-plan`. Jie naudingi kaip darbo kontroliniai sąrašai, bet jų skaičiai ir priežastiniai SEO teiginiai nėra Google taisyklės.

| Vietinio SKILL teiginys / metodas | Sprendimas |
| --- | --- |
| Tikrinti realų SERP, nesugalvoti paieškos apimčių, nekurti neegzistuojančių kainų ar testų | Pritaikyti. Oficialios [people-first gairės](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) pabrėžia originalią vertę ir tikrą patirtį; [apžvalgų gairės](https://developers.google.com/search/docs/specialty/ecommerce/write-high-quality-reviews) prašo savų įrodymų, kai teigiama išbandžius. |
| „Answer intent“ būtinai 40–60 žodžių, privalomas žodžių kiekio intervalas | Naudoti aiškų atsakymą, bet ne fiksuotą ilgį. Google aiškiai sako, kad nėra pageidaujamo žodžių skaičiaus; [Google people-first](https://developers.google.com/search/docs/fundamentals/creating-helpful-content). |
| Svarbūs URL „per kelis / ne daugiau kaip 3 paspaudimus“, 30–60 turinio nuorodų „sveika“, identiškas ankeris savaime kelia konkurenciją | Tai operacinės hipotezės, ne Google limitai. Dėti tiek aktualių, aptinkamų nuorodų, kiek padeda naudotojui; ankeris turi apibūdinti tikslinį puslapį. [Google link best practices](https://developers.google.com/search/docs/crawling-indexing/links-crawlable). |
| Kanibalizacijai būtini „pozicijų apsikeitimai“, AI atsakymas „dažnai necituos nė vieno“, susijungimas nusistovi per 6–10 savaičių | Tai nepatvirtintos universalios taisyklės. Naudoti GSC kaip diagnostikos signalą, vertinti skirtingą intenciją, neskelbti garantuoto susitvarkymo termino ar AI citavimo pasekmės. Canonical ir redirect parinkti pagal turinio atitikimą; [Google canonical metodai](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls). |
| Kasdienis / savaitinis publikavimo ritmas | Naudoti tik kaip komandos planavimo įrankį. Google perspėja apie didelį kiekį neoriginalaus, mažai vertės teikiančio turinio, net jei jis sukurtas AI; [spam politika](https://developers.google.com/search/docs/essentials/spam-policies). |
| Papildomos schemos, `llms.txt`, specialus „AI citavimo“ formatas | Google AI paieškai jų nereikalauja ir `llms.txt` nenaudoja kaip specialaus signalo. Schema turi atitikti matomą turinį; [Google AI Search gairės](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide). |
| `Product` / `Offer` schema redakciniame gide be prekybos galimybės | Nenaudoti merchant listing imitacijai. Google skiria redakcinį produkto aprašą ir puslapį, kuriame galima pirkti; duomenys turi būti tikslūs. [Google Product structured data](https://developers.google.com/search/docs/appearance/structured-data/product). |

## Patikros seka, kai atsiras duomenys

1. **Prieš kitą atidengimą:** gyvos svetainės crawl ir URL sąrašas, statusai, canonical, sitemap, publikuojami tekstai, vidinės nuorodos bei realus Memory Casting kelias. Ši rekomendacija nesiūlo jau publikuotų URL aklai trinti ar peradresuoti.
2. **GSC:** LT nebrandinių užklausų ir puslapių poros pagal Kalėdas, porą, gavėją ir biudžetą; indeksavimo būsena; kur dvi temos gauna tuos pačius parodymus; kur puslapis rodomas visai kitam ketinimui. Užklausų skaičių ir CTR žymėti su laikotarpiu, ne spėti.
3. **Produktas:** iš naujo įjungus `memocasting.lt` Shopify patikrinti galutinį produkto URL, variantus, kainą, atsargas, pristatymo šalis / ribas, grąžinimą, gamintojo saugos instrukciją ir tikras naudojimo nuotraukas. Tik tada įjungti kontekstinį pirkimo CTA, o užsakymo kelias turi būti išbandytas iki apmokėjimo žingsnio.
4. **Sezono metu:** kas savaitę patikrinti tik tuos puslapius, kuriuose yra dinamiškų kainų, terminų ar likučių; kitus atnaujinti tada, kai pagerėja atsakymas. 2027 m. sezonui palikti naudingus evergreen URL ir nepakeisti datos vien dėl naujų metų. [Google people-first gairės](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).

**Sėkmės matas:** ne straipsnių skaičius, o kiek skaitytojų randa tinkamą pasirinkimą ir, kai prekyba veikia, kiek kvalifikuotų perėjimų nuveda į tinkamą produktą. Iki patikimo GSC ir parduotuvės matavimo nerašyti tariamų paspaudimų, pozicijų ar pardavimų.
