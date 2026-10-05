# Dovanos123 — redakcinio priėmimo eilė

Šis dokumentas nėra approval. Techninis lossless importas ir naudingo turinio priėmimas yra atskiri darbai. Originalus 2026-10-04 capture nekeičiamas; kiekvienas tolesnis pataisymas vyksta kaip nauja privataus studijos puslapio revizija.

## Naujausia būsena

Pradiniai radiniai žemiau palikti kaip patikros istorija. 2026-10-05 visi šeši asmens byline pakeisti realia organizacijos redakcija. Po atskiro AI koordinatoriaus pilno skaitymo ir jo pataisų priimti tik trys pilni gidai `lt-hand-casting-guide`, `lt-christmas-couple`, `lt-christmas-man` ir 8 support puslapiai; tikslūs hash priėmimo įrodyme `EDITORIAL/ACCEPTANCE.json`, scope local-editorial-only. Normalia modelio API patvirtintas 11 puslapių shadow paketas. Tai nėra visos eilės ar teisinės/produkcijos būsenos patvirtinimas.

26 kiti straipsniai ir 4 kiti support puslapiai lieka draft. Trumpų demo turinio, kitų kainų/teisinių teiginių ir vaizdų priėmimas dar reikalingas. Nepriklausomas redaktorius yra kitas AI agentas, žmogaus redaktoriaus šiame procese nereikalaujama. Faktų spragos negali būti užpildomos approval vien dėl praėjusios schedule datos.

## Privalomi sprendimai prieš viešinimą

| Įrašai | Patikros radinys | Priėmimo veiksmas |
| --- | --- | --- |
| `lt-couple-ideas` | Trumpas bendras tekstas, nėra realios žadėtos dovanų atrankos | Parengti tikrai atskirą ne sezoninį klausimą ir naudingus pasirinkimo pavyzdžius arba pagrįsti to paties intent URL sprendimą. Nenaudoti masinio redirect į homepage. |
| `lt-hand-casting` | Trumpas mechanizmo paaiškinimas persidengia su pilnu rankų liejimo gidu | Nuspręsti, ar jam lieka atskiras „kaip veikia“ klausimas su tikra formavimo/liejimo demonstracija, ar taikomas pagrįstas to paties intent peradresavimas. |
| `lt-anniversary` | Pavadinimas žada 9 idėjas, tekste jų nėra | Parašyti ir palyginti tikras 9 idėjas su jų tinkamumu bei apribojimais; iki tol palikti draft. |
| Šie trys + `lt-hand-casting-guide`, `lt-christmas-couple`, `lt-christmas-man` | Nepatvirtinta demonstracinio asmens autorystė | Naujoje revizijoje naudoti tikrą organizacijos redakciją, korekciją užfiksuoti. Nepalikti fiktyvios Person biografijos ar citatos. |
| `lt-christmas-man` | Santykio skyriuje vyrui skirtame gide vartojama „Kolegei“ | Redakciškai pataisyti kontekstą; pirmojo asmens „įtraukiau“ nėra žmogaus bandymo įrodymas. |
| `lt-gifts-personalized` | Personalizavimo/grąžinimo sakinys liečia vartotojo teises | Prieš approval patikrinti aktualų pirminį teisinį šaltinį ir sąlygas; prekybininko bendro puslapio ar disclaimer nepakanka. |
| Visas 20 įrašų grafikas + kiti ilgesni gidai | Naudingi pasirinkimo kriterijai nėra produkto faktų, vaizdų teisių ar viso E-E-A-T patvirtinimas | Kiekvienam atskirai skaityti pažadėtą klausimą, pavyzdį, naudojimo ribas, kalbą, šaltinį, CTA ir iliustraciją. Vien teksto ilgis nelemia PASS. |

## Produktų šaltinių tikrinimo rezultatas

Peržiūrėta 2026-10-05 Europe/Vilnius (2026-10-04 UTC). Tai viešai nuskaitomo šaltinio patikra, ne sandėlio, checkout ar partnerystės patvirtinimas. Naršymo rezultatai gali remtis paieškos talpykla, todėl nekeisti jų į tariamą minutės tikslumo realaus likučio patikrą.

- IKEA RÖDALM nuoroda pasiekiama; produkto puslapis nurodo 13×18 cm ir 2,99 €. Naudojant pasportą nuotraukos matmuo skiriasi — 10×15 cm. Į dovanų biudžetą dar reikia įtraukti spaudą ir siuntimą. [Pirminis produkto puslapis](https://www.ikea.com/lt/lt/p/roedalm-remelis-berzo-rastas-30548866/).
- DINERA senoji `...puodelis-art-60350646/` nuoroda peradresuoja į `...puodelis-smeline-60350646/`; puslapis nurodo 30 cl ir 1,99 €. Naujoje peržiūrėtoje revizijoje naudoti tikrą paskirties URL, nenurodant išgalvoto likučio. [Pirminis produkto puslapis](https://www.ikea.com/lt/lt/p/dinera-puodelis-smeline-60350646/).
- „Skonis ir kvapas“ dovanų kategorija nuskaitoma, bet kategorijos egzistavimas nepatvirtina konkretaus rinkinio tilpimo į 20 € ribą ar sudėties. [Pirminė kategorija](https://www.skonis-kvapas.lt/dovanos).
- „Pegaso“ elektroninio kupono puslapis nuskaitomas; nominalą, galiojimą ir naudojimo ribas tikrinti tiesiogiai prieš rekomendaciją. [Pirminis produkto puslapis](https://www.pegasas.lt/dovanu-kuponai/el-dovanu-kuponas-21001319/).

`lt-gifts-under-20-2026` palikta originali 2026-09-23 patikros deklaracija. Šis naujas patikrinimas neįrodo, kas faktiškai tikrino puslapius tada. Rengiant naują reviziją arba pateikti tikrą naujos patikros datą ir aktualius faktus, arba kainas palikti tik aiškiais pavyzdžiais be tariamos istorijos. Visa nauja revizija iš naujo peržiūrima ir patvirtinama; originalus receipt neperrašomas.

## MemoryCasting, schema ir viešos nuorodos

MemoryCasting produkto landing gali būti informacinis komercinis tikslas; jo prieiga nėra veikiančio Shopify pirkimo įrodymas. Nekopijuoti nepatvirtintų reitingų, pirkėjų, saugos sertifikacijų, „100 % saugu kūdikiams“, atsargų ar pristatymo garantijų.

Originaliame importe target `memorycasting-hand-casting` yra nepatikrintas. Bendras registry naudoja atskirą `memorycasting-information` tikslą. Prieš approval jų atitikmenį pakeisti konkrečioje naujoje revizijoje, ne vien pervadinti registry ir slapta įjungti seno teksto CTA. Nuosavo domeno literal URL neturi apeiti commerce/publication vartų; source citatai reikia aiškiai patikrintos paskirties ir atitinkančio snapshot.

Nežinoma istorinė `datePublished` lieka nežinoma. Planuota data nereiškia, kad puslapis buvo viešas tada, kai dar buvo juodraštis. Naujai viešai versijai istoriją ir reikšmingo atnaujinimo datą fiksuoti pagal tikrą įvykį/sutartį, o ne pagal laikrodį kiekvienoje užklausoje.

## Automatizuota, bet nepriklausoma patikra

Rašantis agentas rengia reviziją ir jos šaltinius; atskiras AI redaktorius priima arba grąžina su konkrečiais radiniais. Tik jam priėmus tikslius turinio, site ir entity snapshot galima pašalinti išspręstas fact checks, pasirašyti approval, eksportuoti ir importuoti. Nei redaktorius, nei importerio automatika neturi išgalvoti nežinomų faktų ar naudoti žodžių skaičiaus kaip naudingumo pakaitalo. Nepriimtas įrašas lieka privatus nepriklausomai nuo to, ar jo grafiko laikas jau atėjo.

Teisiniai `privatumas` ir `slapukai` puslapiai turi atskirą production inventory ir faktinės konfigūracijos priėmimą. AI redakcinė patikra nepakeičia nežinomų operatoriaus ar duomenų tvarkymo faktų į žinomus.
