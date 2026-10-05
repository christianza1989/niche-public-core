# Atlas platformo įgyvendinimo roadmap

> **Istorinis roadmap (2026-09-26):** žmogaus redaktoriaus ir Payload/PostgreSQL prielaidos nebegalioja. Aktualus bendras sprendimas: [autonominės sistemos architektūra ir roadmap](AUTOMATIZAVIMO-ARCHITEKTURA-IR-ROADMAP-2026.md).

Šis dokumentas aprašo, kaip iš vieno patikimo pagrindo sukurti kelis dovanų portalus skirtingiems domenams ir kalboms. Pirmas tikslas nėra „pripumpuoti“ kuo daugiau straipsnių. Pirmas tikslas – sukurti sistemą, kurioje kiekvienas viešas puslapis yra naudingas, patikrinamas, techniškai tvarkingas ir išmatuojamas.

## Sėkmės kriterijai

Platforma laikoma paruošta pirmai rinkai, kai:

- vienas kodas aptarnauja bent LT, LV ir PL konfigūracijas;
- kiekvienas domenas turi atskirą `site_id`, Search Console, analitiką, sitemap ir robots taisykles;
- straipsniai gali būti importuojami partijomis su būsena, publikavimo data ir žmogaus patvirtinimu;
- suplanuotas straipsnis iki publikavimo datos nepatenka į sitemap, `llms.txt`, viešą paiešką ar vidinių nuorodų grafiką;
- publikavimo procesas yra idempotentinis: tas pats darbas negali sukurti dubliuotų publikacijų ar įvykių;
- kiekvienas straipsnis turi realų autorių, šaltinius, kanoninį URL, publikavimo/atnaujinimo datą ir redakcinį auditą;
- nėra viešų 404 vidinių nuorodų dėl ateityje suplanuoto turinio;
- pagrindiniai šablonai praeina automatinius build, schema, sitemap, accessibility ir Lighthouse vartus;
- po 90 dienų vertiname ne DR, o indeksaciją, organinį srautą, CTR, pajamų įvykius ir konversijas.

## 0 etapas – sprendimai ir ribos

**Rezultatas:** patvirtinta duomenų sutartis prieš kuriant daug turinio.

1. Pasirenkame pirmą eksperimentą: `dovanos123.lt` kaip istorinio domeno kandidatas ir vienas naujas švarus domenas. Domenų pirkimas bei redirect'ai atliekami tik po atskiro backlinkų, istorijos, indeksacijos ir trademark patikrinimo.
2. Užfiksuojame tikrus produkto domenus, juridinį savininką, kontaktą, affiliate partnerius, analitikos tiekėjus ir cookie sąrašą. Kol šių duomenų nėra, politikos puslapiai lieka šablonai, o ne išgalvotas teisinis tekstas.
3. Nustatome palaikomus locale kodus: `lt-LT`, `lv-LV`, `pl-PL`, `et-EE`, `en-GB`. Nauja kalba turi būti pridedama konfigūracija, vertimai ir testai, o ne nauja kodo šaka.
4. Patvirtiname terminų žodyną, URL transliteravimo taisykles, valiutą, laiko zoną ir redakcinį toną kiekvienai rinkai.

**Išėjimo vartai:** nėra neatsakytų klausimų apie domeno savininką, produktų URL, privatumo valdytoją, kalbas ir matavimo tikslus.

## 1 etapas – platformos branduolys

**Rezultatas:** viešas, server-side renderinamas portalas iš bendro Next.js pagrindo.

- host'o pagalba nustatomas `site_id`;
- visos užklausos filtruojamos pagal `site_id` ir `locale`;
- sukuriami homepage, straipsnio, autoriaus, kategorijos ir politikos šablonai;
- įdiegiami title, description, canonical, Open Graph, robots ir sitemap generatoriai;
- turinys gaunamas per adapterį, kad demo D1 galėtų vėliau būti pakeistas Payload/PostgreSQL be viešų komponentų perrašymo;
- sukuriami tikri 404 ir 410 scenarijai, ne „soft 404“ puslapiai.

**Išėjimo vartai:** du skirtingi domeno/locale kontekstai negali matyti vienas kito turinio; build ir TypeScript praeina.

## 2 etapas – turinio modelis ir planuotas publikavimas

**Rezultatas:** galima saugiai suplanuoti 50 ar daugiau straipsnių.

- straipsnis turi `draft`, `review`, `approved`, `scheduled`, `published`, `unpublished` būsenas;
- `publish_at` saugomas UTC, o redaktoriui rodomas svetainės laiku;
- atskiriamas straipsnio redagavimo turinys nuo patvirtintos publikavimo versijos;
- publish worker paima due jobs su lock/lease, tikrina tenant, locale, versiją ir laiką;
- po sėkmingos publikacijos generuojami cache invalidation, sitemap, `llms.txt` ir nuorodų grafiko įvykiai;
- klaidos turi retry su backoff, dead-letter būseną ir audit įrašą.

**Išėjimo vartai:** tas pats job ID pakartotas kelis kartus nesukuria dubliuoto straipsnio, cache invalidacijos ar analytics įvykio.

## 3 etapas – publikuotų nuorodų grafikas

**Rezultatas:** vidinės nuorodos niekada neveda į dar nepublikuotą puslapį.

- AI ar redaktorius saugo nuorodą kaip `target_article_id`, ne kaip laisvai parašytą URL;
- renderinimo metu resolveris leidžia `<a>` tik jei target būsena yra `published` ir `publish_at <= now`;
- jei target dar suplanuotas, tekstas lieka be nuorodos arba naudojamas alternatyvus gyvas straipsnis;
- publikavus target, atnaujinami tik jo inbound šaltiniai ir susiję sitemap/LLM dokumentai;
- unpublish metu nuorodos vėl tampa neaktyvios, o redirect/410 parenkamas pagal redakcinę taisyklę.

**Išėjimo vartai:** integracinis testas suplanuoja target rytoj, patikrina šiandien, publikuoja target ir patikrina nuorodą po įvykio.

## 4 etapas – daugiakalbystė ir rinkos

**Rezultatas:** nauja kalba pridedama duomenimis, o ne kopijuojant programą.

- `sites` lentelė laiko domeną, default locale, timezone, valiutą ir brand nustatymus;
- `locales` lentelė laiko kalbos pavadinimą, `hreflang` kodą, vertimo būseną ir route žodyną;
- kiekvienas article variantas turi `translation_group_id`, locale, slug ir canonical;
- `hreflang` generuojamas tik tarp realiai publikuotų tos pačios temos variantų;
- jei vertimas neparuoštas, puslapis nenaudoja netikro `hreflang` ir nekopijuoja automatinio teksto kaip galutinio;
- datos, kainos, matavimo vienetai, CTA ir teisiniai tekstai lokalizuojami atskirai.

**Išėjimo vartai:** pridėjus `lv-LV`, senos LT/PL nuorodos ir sitemap nesugenda; nepublikuotas vertimas neatsiranda `hreflang` poroje.

## 5 etapas – E-E-A-T ir redakcinis procesas

**Rezultatas:** turinys turi patikimą kilmę, o ne tik gražų šabloną.

- realūs autorių profiliai su patirtimi, atsakomybe ir tikromis `sameAs` nuorodomis;
- redakcinė politika, šaltinių metodika, pataisymų istorija ir kontaktas;
- kiekvienas faktinis teiginys gali turėti struktūrinį šaltinio įrašą su URL, leidėju, data ir palaikomu teiginiu;
- produkto review žymimas review tik tada, kai tikrai buvo testuotas; kitu atveju naudojamas guide/comparison formatas;
- AI generavimas registruoja prompt/modelį, šaltinius, reviewer ir patvirtinimo laiką;
- autorių, citatų ar testavimo faktų niekada neklastojame.

**Išėjimo vartai:** atsitiktinai atrinkti 10 straipsnių turi atsekamą autorių, šaltinius ir review sprendimą.

## 6 etapas – SEO, GEO, struktūriniai duomenys ir LLM išvestys

**Rezultatas:** paieškai ir AI sistemoms pateikiamas aiškus, viešai patikrinamas turinys.

- visos svarbios pastraipos yra server-rendered HTML;
- `Article`, `ProfilePage`, `Organization`, `BreadcrumbList` ir kitos schemos atitinka matomą turinį;
- `Product` ir `Review` schema naudojama tik su tikrais pasiūlymais, prieinamumu, kainomis ir review įrodymais;
- sitemap turi tik kanoninius gyvus URL;
- `/llms.txt` ir pasirinktinai `/llms-full.txt` generuojami tik iš gyvų kanoninių puslapių;
- turinys turi aiškius atsakymus, originalų indėlį, šaltinius, datas ir vartotojo ketinimą;
- eksperimentuojama su query grupėmis ir CTR, ne su puslapių kiekiu dėl paties kiekio.

**Išėjimo vartai:** schema validatorius, sitemap patikra, robots patikra, canonical/hreflang testai ir Lighthouse CI.

## 7 etapas – matavimas ir eksperimentai

**Rezultatas:** sprendimai priimami pagal pajamas ir vartotojo naudą, o ne vien DR.

Matavimo sluoksniai:

1. Technika: build, error rate, TTFB, LCP, CLS, INP, Lighthouse kategorijos.
2. Paieška: indeksuoti URL, impressions, clicks, CTR, query coverage, manual actions.
3. Turinys: scroll depth, engaged sessions, source clicks, returning users, corrections.
4. Komercija: CTA clicks, outbound clicks, affiliate conversion, revenue per article.
5. Eksperimentas: domenas A/B, publikavimo dažnis, CTA pozicija, originalaus tyrimo formatas.

DR yra tik trečiosios šalies backlinkų metrika. Ji nėra Google reitingo pažadas ir neturi būti pagrindinis sėkmės KPI.

## 8 etapas – naujos šalys ir saugus mastelio didinimas

Kiekvienai naujai šaliai atliekamas tas pats checklist:

- domeno istorija ir trademark patikra;
- kalbos redaktorius ir vertimo žodynas;
- produktų, kainų, valiutos ir siuntimo realybė;
- privatumo, cookies ir affiliate reikalavimai;
- vietiniai šaltiniai ir kontaktai;
- 20–30 kokybiškų pilotinių straipsnių prieš didinant tempą;
- atskira Search Console ir analitikos konfigūracija;
- 404, sitemap, schema ir `hreflang` testai.

## Rollback taisyklės

- jei publikavimas sukuria neteisingas nuorodas, išjungiame worker ir grįžtame į paskutinę patvirtintą versiją;
- jei pakeistas schema rendereris sugadina Rich Results, rollback atliekamas pagal commit, ne rankiniu būdu DB;
- jei vertimo importas klaidingas, stabdome tik tos kalbos job'us, ne visas platformas;
- kiekvienas rollback įrašomas su priežastimi, atsakingu asmeniu ir poveikiu.

## Pirmas realus milestone

Pirmas milestone nėra „50 straipsnių per dieną“. Jis yra: du domenai, viena kalba, 10 rankiniu būdu patikrintų straipsnių, veikiantis scheduler, publikuotų-only link resolveris, realus autorius, šaltiniai, legal placeholderiai su aiškiu owner input sąrašu ir matavimo įvykiai. Tik tada saugiai didiname kiekį ir kalbų skaičių.
