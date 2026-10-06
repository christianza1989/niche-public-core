# Bendros sistemos GitHub kopija

Visos svetainės ir skirtingų puslapių šeimų dizaino eiga:
[WEBSITE_DESIGN_PIPELINE](docs/WEBSITE_DESIGN_PIPELINE.md),
vykdomas [website-design-system](skills/website-design-system/SKILL.md).
Pirma planuojamas autorizuotas puslapių kelias, savita dizaino sistema,
būsenos ir bendri asetai, tada kuriamos bei tikrinamos atskiros sekcijos.
Shop, kontaktai, login/register ir dashboard išlaiko prekės ženklo tapatybę,
bet jų kompozicija bei tankis parenkami pagal skirtingą vartotojo užduotį.

Sekcijų ImageGen maketų ir atskirų asset kits darbo taisyklė:
[WEBPAGE_SECTION_ASSET_KITS](docs/WEBPAGE_SECTION_ASSET_KITS.md),
vykdomas [skill](skills/webpage-section-asset-kit/SKILL.md). Tai papildo pagrindinio
projekto sutartis; visų nišų vizualo nesuvienodina ir publikavimo neįjungia.

Autorizuotam paleidimui, atnaujinimui ar perkėlimui naudoti
[website-deploy](skills/website-deploy/SKILL.md): pakartojamas build, tiksli
publikavimo versija, DNS/pašto išsaugojimas, rollback ir gyvo domeno patikros.
Atskirai pateiktos Cloudflare bei DNS/Hostinger pašto instrukcijos. Asmeninis
skill diegimas aprašytas dizaino pipeline Distribution dalyje.

Ši privati saugykla yra viešų svetainių variklio šaltinio kopija. Pavadinimas „public core“ reiškia jo aptarnaujamus viešus puslapius, ne viešą GitHub prieigą.

Pagrindinis projektas: https://github.com/christianza1989/nisiniai-puslapiai-monetizavimui . Jį klonuoti kaip `nisiniai_puslapiai_monetizavimui`, šią saugyklą kaip gretimą `dovanos-memorycasting` katalogą. Abiejų privačių saugyklų prieiga būtina.

Naujam AI pirmiausia skaityti pagrindinio projekto README, AGENTS, START_HERE, docs/MULTI_MACHINE ir docs/INTEGRATING_A_PROJECT. Naudoti bendras turinio, medijos, SEO/GEO ir kontaktų sutartis. Kiekviena niša turi savo dokumentuotą pasiūlymą, dizainą ir rašymo ribas. Madbeauty paskyrų ir registracijų modulis dar nėra priimta production integracija.

Šaltiniai eksportuoti 2026-10-05 be ankstesnės Git istorijos, vietinių DB, sekretų ir runtime cache. Ankstesnio kompiuterio checkout origin nebuvo pakeistas; tarp jo ir šios saugyklos automatinio sinchronizavimo nėra. Tolesnį bendrą darbą atlikti GitHub šakose ir susietuose PR. Snapshot nėra visų nišų darbų užbaigimo ar paleidimo įrodymas.

Portable diegimas: `npm run install:ci`. Patikros: `npm run test:core`, `npm run content:compile`; `npm run test:seo-smoke` pagal jo realaus vietinio serverio/build reikalavimus. Pagrindinis projektas pateikia kito kompiuterio konfigūravimo instrukcijas. DNS, deployment ir gyvi agentų kanalai po clone neįjungiami.
