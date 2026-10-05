# 2026-09-23 straipsnių paketas

Pagal `CONTENT-PLAN-2026-2027.md` pirmos savaitės temų grupę parengti trys nauji gidai. Data ir valanda yra Lietuvos laiku (`+03:00`); failuose saugomas tikslus publikavimo momentas, o svetainė tikrina jį kiekvieno puslapio prašymo metu.

| Publikavimas | Straipsnis | URL | Vaizdas |
| --- | --- | --- | --- |
| 2026-09-23 07:30 | Kalėdinių dovanų gidas 2026 | `/straipsniai/kalediniu-dovanu-gidas-2026` | `kalediniu-dovanu-gidas-2026.webp` |
| 2026-09-24 07:30 | Kaip suplanuoti kalėdines dovanas | `/straipsniai/kaip-suplanuoti-kaledines-dovanas` | `kaip-planuoti-dovanas.webp` |
| 2026-09-25 07:30 | Kalėdinės dovanos iki 20 € | `/straipsniai/kaledines-dovanos-iki-20-euru` | `dovanos-iki-20-euru.webp` |

Visi trys viršeliai sukurti per ImageGen kaip redakcinės iliustracijos be tekstų ir prekės ženklų. Originalai saugomi Codex sugeneruotų vaizdų kataloge; publikuojami 1536 × 1024 px WebP failai (`108–179 KB`) `public/images/articles/`. Vaizdai nėra vaizduojamų ar rekomenduojamų konkrečių prekių fotografijos, ir tai nurodyta straipsnių prierašuose.

Straipsnių autorius – „Dovanos 123 redakcija“ (organizacijos profilis), be išgalvoto žmogaus ar nepatvirtintų kvalifikacijų. Mažo biudžeto straipsnyje pateikti tiesioginiai parduotuvių pavyzdžiai; IKEA kainos patikrintos produkto puslapiuose, o kitiems pavyzdžiams nuolat kintančių kainų ir likučių nežadama. Memory Casting rekomendacija neįterpta ten, kur ji neatitiktų 20 € ribos arba planavimo straipsnio intencijos.

Prieš numatytą laiką būsimas straipsnis grąžina 404 ir nėra rodomas straipsnių sąraše, vidinėse nuorodose ar sitemap. Atėjus laikui straipsnis ir į jį vedančios susijusios nuorodos atsiranda be naujo deploy. Tai galioja šiems failuose aprašytiems straipsniams; DB straipsnių publikavimą toliau valdo publikavimo užduotis.

Patikros prieš diegiant: statybos komanda, `git diff --check`, trijų WebP dydžiai, viešų URL ir ankstyvų 404 patikra. Po diegimo patikrinti pagrindinį, gyvą straipsnį, jo vaizdą, autoriaus profilį, sitemap ir dviejų suplanuotų straipsnių 404. Po 09-24 ir 09-25 07:30 patikrinti automatinį atidengimą bei vidines nuorodas.
