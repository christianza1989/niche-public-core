# Madbeauty atkūrimas ir darbo tęsinys

Pirmiausia skaityti [README](../README.md) ir [ROADMAP](../ROADMAP.md). Vietinio priimto leidimo peržiūrai pakanka viešo repo ir Node.js; senas Windows vartotojo katalogas nereikalingas.

## Patikrintas vietinis kelias

```sh
git clone https://github.com/christianza1989/niche-public-core.git
cd niche-public-core
npm ci --prefix sites/madbeauty
npm run verify --prefix sites/madbeauty
npm test --prefix sites/madbeauty
npm run preview:trial --prefix sites/madbeauty
```

`http://127.0.0.1:8950` rodo fiktyvų bandymą, o `__local_mailbox` tame pačiame localhost pateikia tik šio paleidimo užfiksuotus laiškus. Procesas klausosi tik `127.0.0.1`, naudoja naują vietinį sesijų raktą ir izoliuotus duomenis. Įprastą priimtą main leidimą rodo `npm run preview --prefix sites/madbeauty`. Abu serveriai naudoja tą patį numatytą portą; vienu metu paleisti vieną arba nustatyti `MADBEAUTY_PREVIEW_PORT`.

`verify` tikrina failų SHA-256, originalių vaizdų objektus, 135 / 141 turinio paketus ir senų patvirtintų puslapių išsaugojimą. Atkūrimo testai tikrina tikrą Worker vykdymą, turinio bei favicon atsakymus, nežinomo URL 404, paskyros noindex, svetimos Origin užklausos atmetimą ir fiktyvių profilių vietinį atkūrimą. Tai atkūrimo patikra; ji nepakeičia visos būsimo leidimo produkto regresijos.

## Šaltinių ir priklausomybių tapatybės

Platformos šaltinių atskaitos checkpoint – bendro `christianza1989/nisiniai-puslapiai-monetizavimui` repo `ce1d3fbae78313b479cf2403358337eccff31c4d`; priimtos platformos runtime bazė – `9dcd67cf1f5bd1500564b47ea6b4a2dbd8ce8f63`. Paskutinio favicon leidimo šaltinis – `4f6fb988c5cc302502a4ca5523df937b5e9ccc14`. Bendra išleisto runtime core versija – viešo repo `5661d5d6907d6f5d11514ae69c0decc6130d65e2`.

Galutinės kitos partijos producer – bendro repo `19c545847f79828d849c9db987205af62c97e88b`, PR158; faktinis turinio commit – `7363da7537c251d79972dbad8d6245aeefb14ef7`. Įrašų pagalba galima patikrinti istoriją; paskyros prisijungimai ir seni vietiniai duomenys per Git neperkeliami.

Istoriniai `cloudflare/build.mjs`, `release-20261010/pinned-core.mjs`, senų leidimų `common.mjs` ir turinio adapteris remiasi companion `content-studio` bei seno katalogų išdėstymo prielaidomis. Naujas source build turi naudoti aktualų authoritative companion checkout, jo Git freshness ir turinio priėmimo sutartis; reikalingos priklausomybės:

- viešo core `lib/content-projection-v2.mjs`, `lib/content-seo-v2.mjs`, `lib/niche-*` ir `scripts/content-package-core.mjs`;
- bendro companion core `content-studio/src/content-release.mjs` bei esamas patvirtinto turinio eksportas / verifier;
- esamas bendras `infrastructure/mail-relay` transportas, jei tikrinamas tikras paštas;
- galiojantys Cloudflare prisijungimai ir saugomi esamo Worker nustatymai tik gyvam diegimui.

Nekurti antro rendererio, turinio kalendoriaus ar patvirtinimo mechanizmo. Šio repo kopijoje išlikę seni absoliutūs keliai yra istorinių įrodymų kilmė, o ne atkūrimo sąlyga. Priimti `releases/` failai leidžia paleisti vietinę peržiūrą jų neperkompiliuojant. Būsimą source-build kelią prieš viešą leidimą reikia atskirai sutvarkyti ir patikrinti.

## Duomenys ir failų ribos

`editorial-site-snapshot.json` išsaugo straipsnių planą, tekstus ir redakcines versijas. Tai nėra automatinis savininko sutikimas atnaujinti sustabdytą rengimą ar naujai patvirtinti pakeistus tekstus. Snapshot importą į naują studiją atlikti per aktualią jos sąsają, išlaikant senus ID, review įrodymus ir datas.

Originalių vaizdų `MANIFEST.json` susieja turimus originalus su jų SHA. Seni registrai kartais rodo jau neegzistavusį PNG kelią; jo nepakeisti išgalvotu originalu ar nauju patikros PASS. Išsaugoti esami optimizuoti WebP ir tikrai rasti originalai.

Neperkeltos klientų DB, klientų atsisiuntimai, prisijungimų sesijos, API / SMTP / OAuth raktai ir žali privačios QA aplinkos išklotiniai. Veikiančios produkcijos duomenys lieka tiekėjų sistemose. Naujame kompiuteryje autentifikuotis į esamas paskyras, nekurti naujų namespaces ar tuščių produkcinių DB vien tam, kad praeitų testai.

## PC valymo apimtis

Savininkas patvirtino atskirų Madbeauty projekto darbo kopijų, jo laikinojo rengimo duomenų ir identifikuotų sugeneruotų originalų pašalinimą po tikro GitHub atkūrimo bandymo. Bendri `CORE_SHARED` ir kitų projektų failai paliekami. Git istorija, bendri projektų šaltiniai ir tiekėjų paskyros nelaikomi šalintinomis atskiromis Madbeauty darbo kopijomis. Tiksli atlikto valymo būsena fiksuojama perdavimo kvite; paruoštas planas nėra atliktas pašalinimas.
