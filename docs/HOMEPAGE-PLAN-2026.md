# Dovanos 123 homepage planas (2026-09)

## Tikslas

Padėti lankytojui per kelias sekundes pasirinkti kelią pagal progą arba žmogų, nuvesti į jau publikuotus naudingus gidus ir aiškiai parodyti, kada rankų liejimo rinkinys tinka. Kalėdiniai gidai nuo rugsėjo yra svarbi, bet ne vienintelė kryptis. Komercinė rekomendacija atskirta nuo redakcinės atrankos.

## Vizualinė kryptis

Šiuolaikinio lietuviško dovanų žurnalo įspūdis: tamsus rašalas, šiltas popierius, sodrus terakotos akcentas, aiški tipografija ir autentiškai atrodantys artumo momentai. Nuotraukos rodo dovanos kontekstą, o ne imituoja parduotuvės produkto pakuotę. Mobiliajame ekrane pirmiau matomas pažadas ir du naudingi keliai, tada fotografija.

## Puslapio eiga

1. **Viršutinė navigacija.** Gidai, kategorijos, Kalėdos, apie projektą; produkto nuoroda aiškiai atpažįstama kaip rekomendacija.
2. **Hero.** Vienas konkretus pažadas apie dovanos pasirinkimą, greitas kelias į Kalėdų gidus ir į visas temas. Dešinėje nauja artimo momento fotografija.
3. **Greitas pasirinkimas.** Trys veikiantys maršrutai į gyvus, pilnesnius gidus: porai, vyrui Kalėdoms, rankų liejimo rinkiniui. Neeksponuojame dar nepublikuotų straipsnių kaip gyvų.
4. **Kategorijos.** Dabartinės 12 kategorijų lieka, bet filtras gauna aiškią slug ir turinio sąsają. Kategorijos be gyvo turinio rodo sąžiningą tuščią būseną; puslapis nežada neegzistuojančio gido.
5. **Sezoninis akcentas.** Kalėdų atranka su jau sukurtu WebP vaizdu ir dviem susijusiais straipsniais. Šis modulis gali būti perjungiamas pagal sezoną vėliau, nekeičiat likusio puslapio.
6. **Redakcijos rekomenduojamas gidas ir naujausi straipsniai.** Viena ryškesnė istorija, po ja ne daugiau kaip trys skirtingi gyvi straipsniai. Pasikartojantys vaizdai ribojami.
7. **Kaip renkami gidai.** Trumpi konkretūs kriterijai ir nuoroda į redakcinę politiką. Vengiame teiginių apie patikrintą realaus autoriaus tapatybę, kol ji nėra patvirtinta.
8. **Memory Casting rekomendacija.** Jau turima rankų liejinio fotografija, trumpas tinkamumo paaiškinimas, aiški išorinė nuoroda ir komercinio ryšio atskleidimas.
9. **Footer.** Redakcinės, kontaktų ir teisinių puslapių nuorodos; techniniai `llms.txt` failai lieka pasiekiami, bet nėra akcentuojami skaitytojams.

## Vaizdų sąrašas ir gamyba

| Vieta | Šaltinis | Formatas ir paskirtis |
| --- | --- | --- |
| Hero | Nauja generuota gyvenimo būdo fotografija: pora prie rankų liejinio kūrimo stalo | `webp`, 3:2, optimizuotas didžiausiam matomam vaizdui |
| Kalėdų akcentas | Jau sukurtas `christmas-gift-guide.webp` | `webp`, prasmingas alt |
| Rekomendacija | Jau sukurtas `hand-casting-memory.webp` | `webp`, pažymėta kaip redakcinė iliustracija |
| Straipsnių kortelės | Esami straipsnių WebP; nauja redakcinė dovanų pasirinkimo fotografija, jei reikia išvengti kartojimosi | `webp`, lazy loading žemiau pirmo ekrano |

Vieši failai yra tik `public/images/.../*.webp`; originalai lieka naudotojo „ChatGPT Images“ atsisiuntimuose, o laikinos kopijos iš projekto pašalinamos po konvertavimo. Gamybai naudojamas esamas `scripts/convert-images-to-webp.mjs`. Failams nurodomi tikri matmenys ir alt, vaizdas neturi teksto, logotipų ar išgalvotos produkto pakuotės.

## Priėmimo kriterijai

- Visi matomi homepage CTA ir kategorijų keliai veikia; gyvo straipsnio nuoroda negrąžina 404.
- Hero ir sezoninis modulis gerai atrodo 1440 px bei 390 px plotyje, be horizontalaus slinkimo.
- Homepage vaizdai įkeliami iš WebP, didžiausias vaizdas turi matmenis ir aukštą prioritetą, žemiau esantys vaizdai kraunami tingiai.
- H1 vienas; kategorijos, straipsniai ir komercinė nuoroda suprantami iš semantinio HTML.
- Nėra fiktyvių atsiliepimų, netikrų bandymų ar nepatikrintų pasitikėjimo pažadų.
- Baigtas build ir patikrintos pagrindinės gyvos nuorodos prieš publikavimą.
