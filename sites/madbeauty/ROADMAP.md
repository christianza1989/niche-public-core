# Madbeauty darbų būsena

2026-10-19 perdavimo atskaitos taškas. Pažymėti tik konkrečioje apimtyje priimti rezultatai. Istoriniai atskirų modulių testai nepriima naujo visos platformos leidimo.

## Perduodamas pagrindas

- [x] Lietuvos miestų ir grožio kategorijų / procedūrų medis, paslaugų paieška.
- [x] Iliustruotos kategorijos, homepage, hero vaizdų kaita, poraštė ir favicon.
- [x] Meistro ir salono paslaugos, variantai, kainos, trukmės, komanda ir kalendorius.
- [x] Rezervavimas, laikų laikymai, perkėlimas, atšaukimas, replay / versijų apsauga.
- [x] Profiliai, darbų galerijos ir atsiliepimų infrastruktūra; demonstraciniai duomenys atskirti nuo tikrų teikėjų.
- [x] Vienas salono rezervavimo kanalas: Madbeauty arba išorinė Treatwell nuoroda. Tai nėra Treatwell API ar kalendorių sinchronizacija.
- [x] Patvirtinti 12 / 24 mėnesių ir 30 dienų saugojimo terminai, atskiri realizacijos ir pašto priėmimo kvitai.
- [x] C0–C2 bendruomenės srauto, sekimo, komentarų, draugystės, asmeninių žinučių, moderavimo ir privatumo įgyvendinimo kvitai.
- [x] Priimtas content135 leidimas ir abiejų aplinkų favicon leidimai.
- [x] Patvirtinta / eksportuota kita šešių gidų partija; neįdiegta.
- [x] Išsaugoti turimi originalai, optimizuoti vaizdai, 295 gidų planas ir 299 redakciniai įrašai.

## Pirmi tolesni veiksmai

- [ ] Prieš bet kokį naują diegimą iš naujo patikrinti tikrą Cloudflare versiją, visus nustatymus, duomenų binding ir savininko aktualų pavedimą.
- [ ] Perkelti istorinių build/deploy įrankių absoliučius PC kelius ir companion priklausomybes į aktualią darbo erdvę.
- [ ] Užbaigti galutinio `ee7a92ee…` paketo consumer: bendras manifestų tikrinimas, 6 T−1/T publikavimo poros, 702 turinio failai, 135 senų versijų ir 299 datų išsaugojimas.
- [ ] Atlikti būtent naujo kandidato platformos regresijas, šešių straipsnių desktop/mobile peržiūrą ir hosted prieš / po patikras.
- [ ] Tik po šių vartų saugomai įdiegti 141 paketą ir užfiksuoti tikrą consumer SHA, Worker versiją bei kvitą. Dabartinio `content-deploy6-20261015` katalogo nelaikyti užbaigtu leidimu.
- [ ] Patvirtinus įdiegtą partiją atnaujinti turinio žurnalą ir kalendoriaus faktinę būseną. Naujo rengimo grafiko savarankiškai neatnaujinti – jis sustabdytas savininko.

## SEO ir tikra pasiūla

- [ ] Parašyti savitus 25 puslapių meta aprašymus ir suderinti su jų matomu turiniu.
- [ ] Kategorijas papildyti konkrečiai sričiai naudinga informacija ir nuorodomis į jau viešus tinkamus gidus.
- [ ] Priimti tikrus meistrus / salonus su jų sutikimu, realiomis paslaugomis ir grafikais. Fiktyvių atsiliepimų nepateikti kaip tikrų.
- [ ] Iš naujo patikrinti GSC atradimą, kontaktų Google canonical pasirinkimą ir senų autorių puslapių architektūrą; po prasmingų pataisų pateikti svarbius URL nuskaitymui.
- [ ] Matuoti realius indeksuotus URL, užklausas ir srautą atskirai nuo `site:` rezultato ar sitemap įrašų skaičiaus.

## Facebook ir bendruomenės plėtra

- [ ] Užbaigti Meta verslo / telefono patvirtinimą ir iš naujo patikrinti programėlės būseną bei reikalingus leidimus.
- [ ] Užbaigti viešo Facebook prisijungimo peržiūrą ir tikrą leidimą; pagrindiniame leidime jis išjungtas.
- [ ] Priimti draugų kvietimo ir prisijungimo kelią su tikra vieša programėle. Nežadėti visų Facebook draugų sąrašo prieigos.
- [ ] C3: grupių kūrimas, narystė, vaidmenys, moderavimas ir diskusijos.
- [ ] C4: renginiai, procedūrų mokymai, konkursai, konferencijų programa ir dalyvių registracija.
- [ ] C5: tolesnė bendruomenės kokybė, sauga ir matavimas pagal realų naudojimą.

## Vėlesnė verslo plėtra

- [ ] Parašyti likusius 158 gidus tik gavus aktualų rengimo tęstinumo pavedimą.
- [ ] Atskirai priimti tikro salono veikimą ir operacinį atsarginių kopijų / atkūrimo procesą su tikrais duomenimis.
- [ ] Treatwell laikų skaitymas / vizito kūrimas tik su oficialiai prieinama integracija; dabar veikia tik nukreipimas pagal pasirinktą kanalą.
- [ ] Native programėlė ir NFC / Tap to Pay mokėjimai – atskiras tyrimo, tiekėjo bei mokėjimų atitikties etapas; neįgyvendinta.
