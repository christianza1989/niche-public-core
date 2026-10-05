# Dovanos 123 × Memory Casting: įgyvendinimo įvestys ir prieigos vėliau

**Data:** 2026-09-26. **Būsena:** savininko peržiūros priedas prie [autonominės sistemos plano](AUTOMATIZAVIMO-ARCHITEKTURA-IR-ROADMAP-2026.md). Šiuo dokumentu jokia paskyra nejungiama ir prieiga dabar neprašoma.

Šis sąrašas rodo, kokių faktų ir sprendimų reikės vėliau. Dabar galima pažymėti vien „yra“, „nėra“, „nežinoma“ ar „netaikoma“. **Slaptažodžių, API raktų, klientų sąrašų ir mokėjimo duomenų čia nerašyti.**

## 1. Darbai, kuriuos galima suplanuoti be prieigų

| Darbas | Rezultatas |
| --- | --- |
| Kodo auditas | Statinių straipsnių, D1, importo, schedulerio, sitemap, autorių ir nuorodų inventorius; migracijos bei grįžimo scenarijus. |
| Publikavimo projektas | Vieno D1 šaltinio schema, nekintama straipsnio versija, atskiras AI redaktorius, hash susietas approval, vienas matomumo predikatas ir cache taisyklės. |
| Operacijų projektas | Užsakymų, atsargų, el. pašto, klientų aptarnavimo, refundų, socialinių įrašų ir video srautai su išimtimis bei išjungimo jungikliais. |
| Kalėdų paruošimas | Temų ir atskirų paieškos ketinimų žemėlapis, briefai, dizaino maketai ir juodraščiai. Be patvirtintų faktų jie nepublikuojami. |

Nežinomas faktas nebus spėjamas. Nuo jo priklausantis viešas arba finansinis veiksmas lieka išjungtas, o kiti darbai gali tęstis.

## 2. Verslo faktai, kuriuos savininkas galės pateikti be prisijungimų

| Sritis | Pakanka nurodyti | Jei dar nėra |
| --- | --- | --- |
| Domenai ir hostingas | Kam priklauso `dovanos123.lt` ir `memorycasting.lt`; ar jie vieši; kas talpina svetaines; kuris Git projektas diegiamas. | Diegimo kelias lieka hipotezė; viešas jungiklis nekeičiamas. |
| Parduotuvė | Shopify, kita platforma arba nežinoma; plano pavadinimas; kanoninis produkto ir checkout URL. | Shopify srautai lieka sąlyginiai. |
| Produktai | SKU/variantų ID, faktinė komplektacija, kaina/valiuta, atsargų šaltinis, aptarnaujamos šalys, produkto URL. | Tiksli kaina ir prieinamumas nežadami. |
| Pristatymas | Paruošimo ir vežimo terminų šaltinis, šalys, vežėjai, šventinių cutoff nustatymo būdas. | Pristatymo garantija nerodoma. |
| Grąžinimai | Esamos sąlygos ir savininko leidžiamos automatinio refundo ribos: atvejis, suma vienam užsakymui/klientui/per dieną, laikas, išimtys. | Automatinis pinigų grąžinimas lieka išjungtas. |
| Produkto įrodymai | Tikros nuotraukos/video, instrukcija, bandymo data, leidimai žmonių atvaizdams ir muzikai. | Neteigiama „išbandėme“; AI vaizdas nerodomas kaip tikras produktas. |
| Autorystė | Ar vardiniai `DEMO_AUTHORS` tikri; atsakingas asmuo arba redakcija; biografija ir pataisymų kontaktas. | Nepatvirtinti vardai ir `Person` schema blokuojami. |
| Teisiniai ir privatumo faktai | Juridinis valdytojas, kontaktas, esamos taisyklės, slapukų/analitikos tiekėjai, sutikimų mechanizmas. | Politikos šablonas nelaikomas galutiniu; analitika/marketingas nejungiami. |
| Prekės ženklas | Logotipas, kalbėjimo tonas, patvirtinti ir draudžiami produkto teiginiai. | Naudojami neutralūs juodraščiai be naujų pažadų. |
| Biudžetas | Mėnesio ir vienos užduoties ribos hostingui, AI tekstui, vaizdams/video, el. paštui ir reklamai. | Mokami jobai, naujos prenumeratos ir reklama nejungiami. |

Pirmiausia naudingi faktai: parduotuvės platforma, produktai, pristatymas, domenų/hostingo būsena, autorių ir medijos teisių tikrumas. Visa kita renkama pagal atitinkamą įgyvendinimo etapą.

## 3. Prieigos, kurių gali reikėti tik įgyvendinant

Tai **būsimas inventorius, ne prašymas jungti paskyras dabar**. Kiekviena teisė suteikiama tik konkrečiam darbui ir per tiekėjo autorizavimą. Slaptažodžiai ar raktai nesiunčiami pokalbyje ir nededami į dokumentus ar Git.

| Sistema | Pirma minimali teisė | Tikslas | Be prieigos |
| --- | --- | --- | --- |
| Hostingas / Sites / Cloudflare / Git | Projekto, diegimo, D1 binding ir cache konfigūracijos skaitymas; rašymas tik sutartam diegimui. | Nustatyti tikrą runtime ir vieno turinio šaltinio migraciją. | Tik lokali realizacija ir migracijos instrukcija; produkcija neliečiama. |
| Google Search Console | Skaitymas. | Tikri indeksavimo, užklausų ir klaidų duomenys. | Viešo SERP ir lokalaus turinio auditas be išgalvotų apimčių. |
| GA4 / žymų sistema | Skaitymas; konfigūracija tik matavimo įgyvendinimo metu. | Patikrinti sutikimus, outbound įvykius ir galimą dviejų domenų matavimą. | Tik agreguoti serverio/parduotuvės signalai; jokio pirkimo priskyrimo straipsniui pažado. |
| Shopify arba faktinė parduotuvė | Iš pradžių produktų ir atsargų skaitymas; vėliau atskiri minimalūs webhook/order leidimai. | Tikri pasiūlymai, užsakymų būsenos ir sutikrinimas. | Kainos/atsargos nežadamos; užsakymų automatika nejungiama. |
| Refund API | Ribota atskiro serviso teisė tik po savininko politikos patvirtinimo. | Standartiniai maži refundai su sumų ir dažnio limitais. | Visi refundai lieka išimtyse. |
| Shopify Messaging ar kitas el. pašto tiekėjas | Tik patvirtintiems šablonams, segmentams ir sutikimams reikalinga teisė. | Transakciniai ir leistini rinkodaros laiškai. | Paruošiami šablonai, siuntimas nejungiamas. |
| Meta / TikTok / planuoklis | Konkretaus puslapio, paskyros ir publikavimo leidimas pagal platformos taisykles. | Leistas patvirtintų įrašų planavimas. | Tik kanalų juodraščiai; negalima žadėti pilno TikTok autoposting. |
| Higgsfield ar kita video paslauga | Tik pasirinktinam eksperimentui su kredito limitu. | Patikrinti vieną kūrybinę hipotezę. | Naudojama autentiška medžiaga ir Blender/FFmpeg. |

## 4. Vienkartiniai savininko sprendimai

1. Kanoninis domenas, parduotuvė ir viešinimo kryptis. Esamų gyvų URL automatiškai nenuimti vien dėl migracijos.
2. Tikras atsakingas autorius/redakcija, AI turinio skaidrumas, draudžiami produkto pažadai ir komercinio ryšio atskleidimas.
3. Kokias alternatyvas leidžiama rekomenduoti, kokių išorinių produktų duomenų ir vaizdų teises turime.
4. Standartinių refundų, klientų atsakymų, siuntimo ir avarinio išjungimo taisyklės.
5. Maksimalios vienos užduoties ir mėnesio išlaidos; reklamos biudžetas nedidinamas automatiškai.
6. Kurie socialiniai kanalai gali būti automatizuoti pagal tikrus paskyrų leidimus; platformos reikalaujamas konkretus sutikimas išlieka išimtimi.

Šie sprendimai tampa versijuota politika. Agentai kasdien dirba pagal ją, savininkui perduodami tik neapibrėžti ar ribas viršijantys atvejai.

## 5. Įgyvendinimo vartai

| Vartai | Būtinas įrodymas | Tik tada galima |
| --- | --- | --- |
| A. Techninė bazė | Gyvas hostingas, D1 binding, migracija ir rollback arba pasirinktas alternatyvus runtime. | Įgyvendinti produkcinį Worker/Queue/DB kelią. |
| B. Faktų bazė | Produktų, siuntimo, autorių, šaltinių ir medijos teisės. | Baigti komercinius gidus bei jų AI QA. |
| C. Publikavimo bazė | Vienas D1 turinio šaltinis, nekintamos versijos, AI approval, deterministiniai testai, cache atšaukimas. | Įjungti naujų straipsnių grafiką; jei svetainė privati, svarstyti anoniminį viešumą. |
| D. Parduotuvės bazė | Oficialūs įvykiai/API, dublikatų kontrolė, atsargų sutikrinimas, išimčių ir išjungimo kelias. | Įjungti pakavimo, atsargų ir leistinų laiškų automatiką. |
| E. Refundų bazė | Savininko politika, tikri užsakymų duomenys, ribota teisė, sumų ir idempotencijos testas. | Įjungti tik standartinius mažos rizikos refundus. |
| F. Kanalų bazė | Paskyros tipas, platformos leidimai, medijos teisės, kiekvieno kanalo QA ir paskelbimo ID patikra. | Įjungti konkretaus kanalo leistiną autopostingą. |

Jeigu vartai nepraeiti, nuo jų priklausantis veiksmas lieka juodraščio ar išimties režime. Kiti nepriklausomi darbai gali tęstis.

## 6. Savininko būsimos peržiūros forma

Pakanka pažymėti būseną. Neįrašyti jokių slaptų duomenų.

| Tema | Būsena: yra / ruošiama / nėra / nežinoma / netaikoma | Pastaba be paslapčių |
| --- | --- | --- |
| Domenai, hostingas ir viešumo būsena |  |  |
| Parduotuvės platforma ir planas |  |  |
| SKU, produktų faktai ir atsargų šaltinis |  |  |
| Pristatymo ir šventinių terminų šaltinis |  |  |
| Tikri produkto vaizdai/video ir leidimai |  |  |
| Tikras autorius arba atsakinga redakcija |  |  |
| Juridiniai, privatumo ir sutikimų faktai |  |  |
| GSC ir GA4 paskyros egzistuoja |  |  |
| El. pašto tiekėjas ir sutikimų įrašai |  |  |
| Meta ir TikTok paskyrų tipai |  |  |
| Refundų ir išlaidų ribos |  |  |

Ši forma nėra prieigų suteikimo prašymas. Konkrečios teisės reikalingos tik tada, kai atitinkamas įgyvendinimo etapas jau paruoštas.
