# Bendros sistemos GitHub kopija

Ši privati saugykla yra viešų svetainių variklio šaltinio kopija. Pavadinimas „public core“ reiškia jo aptarnaujamus viešus puslapius, ne viešą GitHub prieigą.

Pagrindinis projektas: https://github.com/christianza1989/nisiniai-puslapiai-monetizavimui . Jį klonuoti kaip `nisiniai_puslapiai_monetizavimui`, šią saugyklą kaip gretimą `dovanos-memorycasting` katalogą. Abiejų privačių saugyklų prieiga būtina.

Naujam AI pirmiausia skaityti pagrindinio projekto README, AGENTS, START_HERE, docs/MULTI_MACHINE ir docs/INTEGRATING_A_PROJECT. Naudoti bendras turinio, medijos, SEO/GEO ir kontaktų sutartis. Kiekviena niša turi savo dokumentuotą pasiūlymą, dizainą ir rašymo ribas. Madbeauty paskyrų ir registracijų modulis dar nėra priimta production integracija.

Šaltiniai eksportuoti 2026-10-05 be ankstesnės Git istorijos, vietinių DB, sekretų ir runtime cache. Ankstesnio kompiuterio checkout origin nebuvo pakeistas; tarp jo ir šios saugyklos automatinio sinchronizavimo nėra. Tolesnį bendrą darbą atlikti GitHub šakose ir susietuose PR. Snapshot nėra visų nišų darbų užbaigimo ar paleidimo įrodymas.

Portable diegimas: `npm run install:ci`. Patikros: `npm run test:core`, `npm run content:compile`; `npm run test:seo-smoke` pagal jo realaus vietinio serverio/build reikalavimus. Pagrindinis projektas pateikia kito kompiuterio konfigūravimo instrukcijas. DNS, deployment ir gyvi agentų kanalai po clone neįjungiami.
