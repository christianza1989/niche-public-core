# Dovanos123 — atvaizdavimo ir prieinamumo įrodymai

Tai ribota vietinė patikra, ne WCAG sertifikacija ir ne `dovanos123.lt` produkcijos priėmimas. Įrankis: Playwright CLI; agentui priklausantis `gift-qa` browser session. Nekeistos naudotojo globalios naršyklės nuostatos.

## R1 sintetinis bandymas

`http://127.0.0.1:8928`, canonical `gift-core-fixture.example`, paketo SHA `5966f4fc1ba8f6e03f0dc50fabffcd299a846e4261282d30f4812e8c2dc2a7c2`. Root izoliuota kopija `output/dovanos123-m5-root-r1`. Tikrinto `gift-site.tsx` SHA `6229867101b0a4e315b98a0702eb205badc1404a131e750e5c1aa09c14f0f4e4`, `gift-styles.tsx` SHA `da20dba479b0427f02ec84975942ec2beda6d2b3e762b317d925a29bf35d207d`. Ši versija nėra vėliau priimtas tikro turinio paketas.

Pradžioje 320 CSS px pločio vaizduose nustatytas 352 px dokumento plotis dėl brand `nowrap`; homepage `overflow-x:hidden` tik slėpė dalį problemos. Pataisyta tikra header/brand/footer elementų wrap ir min-width. Hero užrašo, greitos pradžios skaitmenų bei footer spalvos pakoreguotos po faktinio kontrasto matavimo.

Po pataisų 2026-10-04T22:01:13–15Z patikrinta: homepage 390×844 ir 320×900, straipsnių indeksas 320×900, sintetinis straipsnis 1440×1000 ir 320×900, kontaktai 320×900. Visos šešios navigacijos HTTP 200; document/body width atitiko viewport, per viewport išsikišančių header/main/footer elementų nerasta, fonts `loaded`, navigacija matoma. Ekranai: `output/playwright/dovanos123-integration/*-after.png`. Kontakto bandomoji forma tik stebėta, nesiųsta.

Faktiškai apskaičiuoti pataisytų mažų tekstų santykiai: hero note 5,74697:1, quick index 6,40677:1, homepage footer 5,52187:1, kitų puslapių footer 5,99764:1. Tai šių pasirinktų elementų, ne visos svetainės kontrasto auditas. Tab pasiekė skip nuorodą, Enter perkėlė fokusą į `MAIN#main-content` su `tabIndex=-1`.

Atidarius mobilų straipsnį atskirai patikrinti matomi vaizdo pikseliai: `article-mobile-observed.png`, SHA `cee473d0c871ab9ae4fd286b5c6a6328f616583d37c011f4ace8f1bd8f7901a6`. Kai kurie batch ekrano kadrai buvo nufotografuoti prieš pilną paint ir nėra vaizdo matomumo įrodymas. `article-mobile-second.png` užfiksavo connection-refused root rebuild metu ir **nėra priėmimo įrodymas**. Testai nerodė būsimo 2099 straipsnio; atsakymai turėjo noindex/no-store ir bandomojo domeno canonical.

## Tikras 200 % padidinimas

**UNVERIFIED.** Headless CLI viewport pakeitimas, DPR ir CSS zoom nėra tikro browser zoom priėmimo įrodymas. Palaikomas native/browser procento valdiklis šiame seanse nenustatytas; globalios nuostatos nebuvo keistos, todėl nereikėjo jų atkurti. A–Z R2/S2 negali tapti PASS vien dėl 320 px ar Lighthouse a11y 100.

## Tikro 11 puslapių R2 paketo patikra

Izoliuotas `http://127.0.0.1:8930`, canonical `dovanos123.lt`; `local-preview`, ne realaus Host paleidimas. Paketo SHA `f9a14e3a5772781afe1233fbd3ccc6041ea2bf73aef2d7a12d40924ca6b4febd`. Gift rendererio SHA `e779682e6805c9a6eb382309edb5f3bfb7df9af54b67d84cd25403ad5886537d`, galutinio gift-styles SHA `f93983f077ec8632a9eaf0bce01da695d4d9ab0f08b80a68451562afa1dacb71`. Root valdo isolated build/runtime; main compiled registry nekeistas.

Pradinis actual R2: visi 11 puslapių 320×900, homepage 390×844, home/index/trys gidai 1440×1000 — 17 captures, `output/playwright/dovanos123-integration/actual-r2-qa.json`. Visos navigacijos 200, po vieną H1, įkelti teminiai vaizdai, canonical `.lt`, noindex/no-store. Gidų tekstai apie 7,2–7,7 tūkst. matomų simbolių (ne naudingumo kriterijus); šaltinių 1/3/3. Indeksas iš tikrųjų rodo abi priimtas orientavimo pastraipas. Formų 0, tracker nėra, jokių POST. About/policies/profile tekstiniai — papildoma iliustracija nieko nepaaiškintų.

Šis actual turinys aptiko dar vieną defektą, kurio retas sintetinis R1 inventorius neparodė: trys dešinės homepage kategorijų kortelės išsikišo 320 px ekrane, nors document `overflow-x:hidden` slėpė plotį. Taisyta gift-only CSS: card min-width/wrap, iki 380 px viena `minmax(0,1fr)` kolona. 390 ir desktop kompozicija išlaikyta. Iki pataisos screenshot ir JSON palikti kaip baseline, ne galutinio PASS įrodymas.

Po root perstatymo 2026-10-04T22:41:11–21Z: home 320/390, indeksas ir visi trys gidai 320. **6/6 HTTP200, dokumento plotis atitinka ekraną, overflowingElements visur tuščias**, visi vaizdai įkelti, šaltiniai išlaikyti, footer MB Pinet tekstas yra DOM. 320 kategorijų kolona 284 px, 390 — 172+172 px. Tab pasiekia `#main-content`; Enter aktyvus `MAIN#main-content`. Formos/sekimas išjungti, siuntimų 0. Raw įrodymas `actual-r2-final-qa.json`; atskiri `actual-r2-final-*-top.png`, `*-bottom.png`, `*-full.png`. Homepage, indeksas, kontaktai ir trijų gidų atidarymai peržiūrėti kaip pikseliai, ne vien tekstinės metrikos.

Footer naudoja legacy `content-visibility:auto`; greitos pilno puslapio ir bottom nuotraukos kartais fiksuoja dar nenupieštą offscreen footer. Šie balti kadrai neįrodo footer pikselių pilno priėmimo; footer tekstas/nuorodos tikrinti DOM ir atskirame kontakto screenshot. Tai nėra dingusių URL ar paslėpto turinio PASS pagal screenshot. Ankstyvas final script connection-refused sutapo su root rebuild ir neįtrauktas į sėkmingas 6 navigacijas.

Root `M5/ACTUAL-PREVIEW-HTTP.json` atskirai tikrina 11 accepted hash, visus 15 WebP SHA/dekoduotų matmenų, pilną HTML/body/inline/schema, SEO ir neviešus adresus. Realūs `dovanos123.lt`, www bei nežinomas preview Host vietiniame bandomajame listener atmetami 404. R2 rezultatai nepanaikina nežinomo 200 % padidinimo, produkcijos DNS/inbox/privacy ir pilno A–Z ribų.

### R2 kategorijų kontrasto papildymas

Actual homepage Lighthouse97/95/100/69 rado dar du kategorijų selector kontrasto trūkumus. Pataisos `home-category-index #8a4b38`, `home-category-desc #64584f`, root perstatyta kopija, naujas CSS SHA `139da37d3e772d6b53b141ee96bfa8f53752e9989ca83661faaf7cb12d2c8cc1`. 2026-10-04T22:47:36–37Z abu320/390 ekranai200, jokių išsikišančių elementų; po14 tikrų computed elementų, **minimalus santykis5,55015:1**. Raw `actual-r2-contrast-qa.json`, peržiūrėti `actual-r2-category-contrast-320.png` ir `390.png`. Ankstesnių raw/screens ir CSS versijų įrodymai nėra tyliai pakeisti. Tai šių dviejų selector patikra, ne visos WCAG atitikties deklaracija.
