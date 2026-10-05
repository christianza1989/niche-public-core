# Patvirtinti svetainių turinio paketai

Kiekvienas katalogas `content-packages/<siteId>/` turi `content-package.json` ir, jei naudojami vaizdai, `assets/*.webp` arba `assets/*.avif`. Paketo `media.src` rodo į `/content-assets/<siteId>/<failas>`, o fizinis failas laikomas paketo `assets/` kataloge. Pradinis puslapis turi `type: "home"` ir tuščią `slug`.

Cloudflare vykdymo aplinkoje `/content-assets/*` užklausos turi pirmiausia pereiti Worker ir `proxy.ts` domeno bei publikavimo patikrą. `vite.config.ts` nustato `assets.binding: "ASSETS"` ir `run_worker_first: ["/content-assets/*"]`; nepašalinkite šios taisyklės perkeldami diegimą. Ji patikrinta su vietiniu tikro paketo testu: savo domene WebP grąžino 200, kitoje svetainėje ir nežinomame domene – 404. Bandomasis paketas po patikros pašalintas.

`npm run content:compile` patikrina visų puslapių `revisionHash`, konkretų patvirtinimą, domenų/ID unikalumą ir vaizdų buvimą. Tik tada sugeneruoja `lib/generated/content-packages.json` ir nukopijuoja vaizdus į `public/content-assets/`. Patvirtintas, bet būsimas puslapis į paketą gali patekti dabar; viešas rendereris jį atskleidžia tik nuo `publishAt` pagal serverio laiką. Nepatikrintas puslapis neįkeliamas: kompiliacija nutrūksta.

Turinio studijos eksportą importuoti komanda `npm run content:import -- <kelias-iki-output/siteId>`. Esamą paketą pakeisti galima tik pridėjus `--replace`; ankstesnė JSON versija išsaugoma tame pačiame kataloge, o vaizdo failo turinio neleidžiama pakeisti tuo pačiu keliu. Niekada nekopijuoti `.env`, klientų duomenų ar studijos darbo juodraščių. Turinys čia versijuojamas; slaptažodžių ir API raktų neturi būti.

Nišinio puslapio kontaktų skiltyje kol kas yra tik `mailto:` ir `tel:` nuorodos. Tikrų užklausų patvarus išsaugojimas, pristatymas ir konversijų matavimas dar nesukonfigūruoti; prieš pirmą realų domeną reikia prijungti ir patikrinti formos bei analitikos paslaugą. Paspaudimų negalima laikyti gautomis užklausomis.
