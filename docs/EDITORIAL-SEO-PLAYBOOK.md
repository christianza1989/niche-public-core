# Redakcinis, SEO ir GEO kokybės playbook

## Pagrindinė taisyklė

Kiekvienas straipsnis turi išspręsti konkretų skaitytojo klausimą geriau nei jau egzistuojantys rezultatai. AI gali pagreitinti tyrimą ir pirmą juodraštį, bet negali pakeisti faktų patikros, produkto realybės ar atsakomybės už publikaciją.

## Straipsnio brief prieš rašymą

Prieš generuojant turinį sukuriamas brief:

- pagrindinė užklausa ir vartotojo ketinimas;
- kam skirtas straipsnis ir kokį sprendimą padės priimti;
- 3–8 susiję klausimai, kuriuos reikia atsakyti;
- originali vertė: bandymas, palyginimo kriterijai, vietiniai duomenys, ekspertinis komentaras arba aiški metodika;
- patikimi šaltiniai ir kiekvienam šaltiniui priskirti teiginiai;
- produktas/CTA, jei jis natūraliai padeda išspręsti problemą;
- autorius ir reviewer prieš schedule;
- numatomas atnaujinimo signalas: sezonas, kaina, prieinamumas, teisės ar faktų pasikeitimas.

Jei brief neturi originalios vertės arba produkto CTA yra vienintelis tikslas, straipsnis nekeliauja į gamybą.

## Struktūra, kurią naudoja straipsnio šablonas

1. H1 tiksliai nusako pažadą.
2. Trumpas atsakymas/summary viršuje.
3. Turinys su anchor'iais, jei straipsnis ilgas.
4. H2/H3 pagal sprendimo žingsnius, ne pagal raktažodžių variacijas.
5. Konkretūs kriterijai, lentelės ar pavyzdžiai, kai tai padeda pasirinkti.
6. Šaltiniai ir kas buvo patikrinta.
7. Disclosure, jei yra affiliate ar sponsored nuorodų.
8. Aiškus next step ir vienas pagrindinis CTA.
9. Autorius, datos, pataisymo būdas.

Nenaudojame dirbtinio raktažodžių kartojimo, turinio perrašymo vien dėl žodžių skaičiaus, netikrų quotes, netikrų testų ir masinio panašių puslapių generavimo.

## Autorių ir citatų politika

- Autorius yra realus žmogus arba realiai atsakinga organizacija.
- Profilio biografija turi būti tiksli ir patikrinama.
- `sameAs` įrašomos tik veikiančios, su tuo autoriumi susijusios nuorodos.
- Citata turi būti arba tikra su šaltiniu, arba perrašyta savais žodžiais su nuoroda į šaltinį.
- Jei šaltinis nepatikimas, pasenęs ar nepasiekiamas, teiginys peržiūrimas arba pašalinamas.
- AI sugeneruota citata, tyrimas, klientų istorija ar produkto patirtis yra publikavimo blokatorius.

## Produkto ir affiliate taisyklės

- Pagrindinis rankų liejimo rinkinio CTA gali būti matomas visame portale, bet straipsnis turi išlikti naudingas ir be pirkimo.
- Kiti produktai įtraukiami tik tada, kai jie realiai padeda atsakyti į užklausą ir jų duomenys yra patikrinti.
- Kaina, availability, siuntimas ir affiliate URL turi `last_verified_at`.
- Jei esame gavę komisinį, tai aiškiai atskleidžiama šalia komercinės nuorodos ir paaiškinama atskleidimo puslapyje.
- Nerašome „geriausias“ ar „išbandyta“, jei neturime kriterijų ir realaus įrodymo.
- Produktų sąrašai turi paaiškinti atrankos metodiką; vien nuorodų katalogas nėra aukštos vertės turinys.

## Lokalizavimo workflow

1. Sukuriamas source brief ir terminų žodynas.
2. AI gali parengti lokalizacijos draftą.
3. Native arba kvalifikuotas reviewer tikrina prasmę, linksnius, kultūrinį kontekstą, kainas, teisines formuluotes ir CTA.
4. Tik patvirtintas locale variantas gauna `approved` ir vėliau `scheduled` būseną.
5. Neparuoštas variantas nerodomas `hreflang`, sitemap ar live related links.

Kiekvienai šaliai atskirai tikriname šventes, vardadienius, valiutą, pristatymo realybę ir vietinius šaltinius. Lietuviškas tekstas nėra automatiškai tinkamas Latvijai ar Lenkijai.

## E-E-A-T publikavimo checklist

Prieš publish:

- [ ] Skaitytojo ketinimas aiškus ir atsakymas pateiktas anksti.
- [ ] Autorius realus, profilis gyvas, `author.url` teisingas.
- [ ] Matomos publikavimo ir atnaujinimo datos.
- [ ] Šaltiniai susieti su konkrečiais faktiniais teiginiais.
- [ ] Originalus indėlis aiškus, ne tik agreguotos nuorodos.
- [ ] Review/testavimo teiginiai pagrįsti įrodymu.
- [ ] Affiliate/sponsored atskleidimas matomas.
- [ ] CTA nėra agresyvesnis už turinio naudą.
- [ ] Nėra nepublikuotų target nuorodų.
- [ ] Schema atitinka tai, ką mato žmogus.

## Techninis SEO checklist

Kiekvienam gyvam puslapiui:

- [ ] Statusas 200 ir tikras canonical.
- [ ] Title ir meta description unikalūs bei lokalizuoti.
- [ ] H1 vienas, hierarchija logiška.
- [ ] Open Graph/Twitter vaizdas su prasmingu alt/metadata.
- [ ] Breadcrumb matomas ir atitinka URL.
- [ ] Sitemap įrašas tik gyvam canonical URL.
- [ ] Robots taisyklės netyčia neblokuoja svarbaus turinio.
- [ ] `hreflang` tik tarp gyvų vertimo variantų.
- [ ] JSON-LD validus ir neturi neegzistuojančių faktų.
- [ ] 404/redirect taisyklė patikrinta po slug keitimo.
- [ ] Svarbus tekstas pasiekiamas be client-side click ar paslėpto accordion.

## Vaizdų ir WebP workflow

- Featured vaizdas turi paaiškinti straipsnio temą, o ne būti dekoratyvinis raktažodžių plakatas.
- Kiekvienam vaizdui saugome prasmingą lietuvišką `alt`, tikslų plotį ir aukštį; tekstas neperrašo to, ko vaizde nėra.
- Originalus PNG/JPEG laikomas gamybos įvestimi, o viešai naudojamas WebP sugeneruojamas `npm run images:webp` skriptu per `ffmpeg`.
- Straipsnio ingest priima `image` bloką; jei senoje DB eilutėje jo nėra, slug/kategorijos fallback leidžia palaipsniui įjungti jau paruoštus vaizdus be 404.
- Featured vaizdas naudojamas straipsnio HTML, Article JSON-LD, Open Graph ir kortelėse. Prieš publish tikriname, kad failas egzistuotų, būtų įkeltas greitai ir nebūtų perteklinio dydžio.

## GEO ir AI paieškos principai

GEO nėra atskiras „hack“. Turime daryti turinį, kurį patogu cituoti ir patikrinti:

- aiškūs subjektai, datos, vietos, apibrėžimai ir kriterijai;
- trumpas tiesioginis atsakymas, po kurio eina įrodymai ir ribos;
- nuorodos į pirminius arba autoritetingus šaltinius;
- aiškiai pažymėta, kas yra faktas, kas metodika, o kas rekomendacija;
- originalūs palyginimai, nuotraukos, testai ir vietiniai pavyzdžiai, kai jie tikri;
- atnaujinimo data tik tada, kai turinys tikrai peržiūrėtas.

`/llms.txt` laikome papildomu aiškiai suformatuotu indeksu. Jis nepakeičia HTML, sitemap, robots, Search Console ar žmonėms skirto turinio.

## Privatumas ir sutikimai

Politikos puslapis turi būti užpildytas pagal faktinį veikimą. Prieš paleidimą inventorizuojame:

- būtinus cookies ir sesijos mechanizmą;
- analytics, ads, affiliate ir A/B tiekėjus;
- IP/device duomenis ir retention;
- duomenų valdytoją, processor'ius, perdavimus ir kontaktą;
- consent logiką bei kaip vartotojas gali atmesti nebūtinus cookies;
- duomenų subjekto teisių įgyvendinimo procesą.

Nesame medicininis ar teisinis konsultantas; galutinę privatumo ir cookies versiją peržiūri savininkas arba teisininkas pagal realią veiklą. Nenaudojame fiktyvių rekvizitų.

## Lighthouse ir CI kokybės vartai

100/100/100/100 yra tikslas, ne garantija: Performance priklauso nuo įrenginio, tinklo ir runtime. CI naudoja deterministinį scenarijų ir saugo istoriją.

Privalomi checks:

- TypeScript, lint, production build;
- no console errors ir no failed network requests;
- accessibility: landmarks, contrast, labels, keyboard navigation, focus;
- performance: optimizuoti hero vaizdai, fontų strategija, minimalus JS, no layout shift;
- best practices: HTTPS, saugūs resource hint'ai, no mixed content;
- SEO: crawlable links, title, description, canonical, robots, structured data;
- mobile ir desktop homepage, article, author, policy route;
- budgetai LCP/CLS/INP ir HTML/JS dydžiui.

Rezultatas saugomas pagal commit ir route. Critical regressions blokuoja deploy net tada, kai bendras balas dar atrodo aukštas.

## Publikavimo scorecard

Kiekvienas article prieš schedule gauna 0–2 balus šiose kategorijose:

| Sritis | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Nauda | paviršutiniškas | atsako į dalį klausimų | išsprendžia užduotį su aiškiu pasirinkimu |
| Originalumas | perrašymas | keli papildomi pavyzdžiai | tikras originalus tyrimas/metodika |
| Šaltiniai | nėra | bendros nuorodos | teiginiai susieti su patikimais šaltiniais |
| Autorius | neaiškus | profilis nepilnas | tikras, kompetentingas, matomas |
| Komercija | katalogas | CTA dominuoja | CTA natūralus ir atskleistas |
| Lokalizacija | mašininis | dalinai peržiūrėta | native patikrinta |
| Technika | klaidos | pataisyta dalis | visi vartai praeiti |

Minimalus publish score: 12/14, o `Autorius`, `Šaltiniai`, `Lokalizacija` ir `Technika` negali gauti 0.

## Atnaujinimo ir pataisymų procesas

- kainos/availability puslapiai peržiūrimi pagal produkto feed arba nustatytą periodą;
- sezoniniai gidai gauna `review_due_at` prieš sezoną;
- pranešimas apie klaidą sukuria audit ticket;
- pataisyta versija saugo, kas pasikeitė ir kodėl;
- svarbus faktų pakeitimas atnaujina `dateModified`; kosmetinis pakeitimas datos neklastoja.

## Šaltiniai

- Google people-first content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google Article structured data: https://developers.google.com/search/docs/appearance/structured-data/article
- Google ProfilePage structured data: https://developers.google.com/search/docs/appearance/structured-data/profile-page
- Google structured-data policies: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- Chrome Lighthouse: https://developer.chrome.com/docs/lighthouse/overview
- llms.txt proposal: https://llmstxt.org/
