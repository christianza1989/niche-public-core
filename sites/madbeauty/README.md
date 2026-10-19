# Madbeauty projekto perdavimas

Atnaujinta 2026 m. spalio 19 d. Šiame kataloge yra platformos šaltiniai, dizaino ir produkto planai, turinys, turimi vaizdų originalai, optimizuoti vaizdai ir du paskutiniai priimti sukompiliuoti leidimai. Darbą tęsti nuo šio dokumento ir [nebaigtų darbų sąrašo](ROADMAP.md). Senesni `IMPLEMENTATION_STATUS`, `CURRENT_READINESS` ir leidimų kvitai palikti kaip datuota istorija; jų tarpinės būsenos nėra naujas visos platformos priėmimas.

## Kur sustota

| Sritis | Perdavimo būsena |
| --- | --- |
| `madbeauty.lt` | Veikia. Spalio 19 d. HTTP patikroje grąžino paketą `86c75950…`: įdiegti 135 turinio puslapiai, iš jų 131 gidas; tuo metu vieši 14 gidų, sitemap turi 45 URL. Viešų meistrų profilių API sąraše – 0. |
| Paskutinis priimtas platformos leidimas | Spalio 13 d. kvitas: main `f68008dd-5ceb-446b-8113-d68bd1631919`, artefaktas `38482593…`, 923 failai. Tai priimtas ankstesnis leidimas; spalio 19 d. naujai tikrinti HTTP atsakymai, ne Cloudflare versijų API. |
| `bandymas.madbeauty.lt` | Galiojimas baigėsi `2026-10-16T21:10:47.982Z`. Spalio 19 d. tikrinti keliai grąžina 410. Archyve yra priimtas bandymo artefaktas su 40 fiktyvių meistrų ir 5 salonais; jį galima paleisti vietoje. |
| Kita šešių straipsnių partija | Patvirtinta ir eksportuota, **neįdiegta**. Galutinis paketas `ee7a92ee…`, 141 puslapis, 137 gidai, 702 turinio WebP. Ankstesni 135 puslapiai ir 299 publikavimo datos išsaugoti. |
| Viso turinio planas | 295 gidai iki 2027-04-06. 131 gidas įdiegtas, 6 paruošti neįdiegtame pakete, 158 dar neparašyti. Naujo turinio rengimo automatika sustabdyta savininko nurodymu. Jau įdiegti straipsniai toliau atsiveria pagal esamas publikavimo datas. |
| Facebook ir bendruomenė | Facebook programėlė sukurta; pagrindinio leidimo Facebook prisijungimas išjungtas. Meta įmonės / telefono patvirtinimas ir viešas leidimas nebaigti. C0–C2 bendruomenės funkcijų įgyvendinimas turi atskirus istorinius kvitus; grupės, renginiai, mokymai ir konferencijos lieka plane. |
| SEO | Spalio 15 d. auditas nustatė 25 vienodus meta aprašymus, silpną kategorijų savitumą, dar neatrastus URL ir seną kontaktų puslapio canonical grupavimą. Šios pataisos **neįdiegtos**. Spalio 19 d. naujas GSC auditas nedarytas. |

Tikslūs datuoti HTTP rezultatai: [PUBLIC-STATUS-20261019.json](handoff/PUBLIC-STATUS-20261019.json). Pilnas spalio 15 d. indeksavimo auditas: [AUDIT.json](seo-indexing-20261015/AUDIT.json).

## Paleidimas kitame kompiuteryje

Reikia Git ir Node.js 22.22 arba naujesnio. Iš repo šaknies:

```sh
npm ci --prefix sites/madbeauty
npm run verify --prefix sites/madbeauty
npm test --prefix sites/madbeauty
npm run preview --prefix sites/madbeauty
```

Atidaryti `http://127.0.0.1:8950`. Fiktyviam bandymui sustabdyti pirmą serverį ir paleisti:

```sh
npm run preview:trial --prefix sites/madbeauty
```

Tai izoliuotas vietinis SQLite. Laiškai kaupiami tik `http://127.0.0.1:8950/__local_mailbox`, Facebook išjungtas, į gyvą sistemą nerašoma. Bandymo galiojimas vietoje pakeičiamas tik aplinkos kintamuoju; saugomo Worker failo baitai ir gyvo domeno galiojimas nekinta. Sustabdžius procesą vietiniai šio paleidimo duomenys neišsaugomi.

## Katalogų paskirtis

- `backend/`, `prototype/`, `cloudflare/` – platformos šaltiniai, schema, UI ir testai.
- `releases/production-20261013/`, `releases/trial-20261013/` – tikslūs priimti Worker failai ir jų statiniai failai. Paleidimo įrankiai tikrina jų SHA-256.
- `content-next6-20261015/release-final/` – vienintelis galutinis neįdiegtos partijos įvesties paketas. Ten pridėtas ir originalus bendro eksporto `release-manifest.json`. Senasis `4377fd5f…` eksportas pakeistas galutiniu ir nebuvo įdiegtas.
- `content-deploy6-20261015/` – **nebaigtas** consumer bandymas. Jo buvimas nereiškia atlikto diegimo ar testų PASS.
- `handoff/editorial-site-snapshot.json` – redakcinės svetainės 299 įrašų kopija su planu ir patvirtintomis versijomis; tai ne klientų ar prisijungimų duomenų bazė.
- `media-originals/` – 191 rastas originalus failas, laikomas pagal SHA-256, su kelių atitikmenų žurnalu. Senų profilių PNG keliai žurnaluose nebuvo pasiekiami dar prieš valymą; esami optimizuoti profilių WebP išsaugoti.
- Kiti datuoti katalogai – ankstesnės užduotys, priėmimo kvitai, dizainai ir jų istorija.

## Tolesnio kūrimo ir diegimo ribos

Nauji vietiniai `tools/` įrankiai leidžia patikrinti ir paleisti perduotą leidimą be seno PC. Istoriniai build/deploy įrankiai turi seno katalogų išdėstymo ir companion repo priklausomybių. Prieš naują source build jas reikia perkelti į aktualią darbo erdvę pagal [RESTORE.md](handoff/RESTORE.md); šių istorinių scenarijų nepaleisti kaip naujo automatinio diegimo.

Priimto runtime bazė – `9dcd67cf1f5bd1500564b47ea6b4a2dbd8ce8f63`, bendro viešo core šaltinis – `5661d5d6907d6f5d11514ae69c0decc6130d65e2`. Naujesnio core šaltinio buvimas Git nesuteikia jau įvykusios runtime migracijos statuso. Pagrindinio paketo šešių straipsnių papildymui buvo numatyta išsaugoti 923 senus failus ir pridėti 38 naujus, iš viso 961; jo native, naršyklės ir saugomo diegimo vartai lieka nebaigti.

Slaptažodžiai, API raktai, OAuth prisijungimai, klientų eksportai, tikros runtime DB ir privačios sesijos į šį repo neperkeltos. Gyvų paskyrų ir duomenų savininkai lieka esamose Cloudflare, Hostinger ir Meta paskyrose. Šis perdavimas nekeičia gyvos svetainės, jos duomenų ar DNS.
