# Verslo agentų kalibravimas per bendrą core

Savininkas numatytai užsako visą svetainės skambutis → kontaktas → final transcript/analizė → profesionalus reviewed email → kliento reply kelią. Actual browser/audio/worker/inbox/thread patikros būtinos; trūkstama realizacija taisoma autonomiškai, neišjungiama vien NA statusu. Tiekėjai/quote/antkainis/PDF tik pagal nišos tikrą modelį ir mandatą.

**Sukurk = prijunk + iš karto kalibruok.** Savininko agento sukūrimo pavedimui taikyti companion [create-and-calibrate](https://github.com/christianza1989/nisiniai-puslapiai-monetizavimui/blob/main/SKILLS/business-agent-calibration/references/create-and-calibrate.md). Nišos profilis / žinios / tools, skirtingi klientų archetipai, actual baseline, priežasčių pataisos, regresijos ir apsaugoti nematyti atvejai, mokymosi sprendimas / adoption / rollback, užsakytų kanalų patikra ir report yra vieno pavedimo dalys. Naujo nepriklausomo core nekuriama.

Visų PC / Codex sesijų aktualumas: [CODEX_GIT_WORKFLOW](https://github.com/christianza1989/nisiniai-puslapiai-monetizavimui/blob/main/docs/CODEX_GIT_WORKFLOW.md). Core bootstrap diegiamas vieną kartą kiekviename PC; start / continue / handoff gate pats fetch ir atmeta pasenusią bazę. Iš gretimų clone šio repo kataloge: `node ../nisiniai_puslapiai_monetizavimui/scripts/git-freshness.mjs --repo . --companion ../nisiniai_puslapiai_monetizavimui --phase start`. Tai ne kito agento failų auto-pull ir ne aktyvios sesijos instrukcijų hot reload.

Vienas vykdymo startas yra companion repo [business-agent-calibration/SKILL.md](https://github.com/christianza1989/nisiniai-puslapiai-monetizavimui/blob/main/SKILLS/business-agent-calibration/SKILL.md), jo [runbook](https://github.com/christianza1989/nisiniai-puslapiai-monetizavimui/blob/main/SKILLS/business-agent-calibration/references/runbook.md) ir [priėmimo matrica](https://github.com/christianza1989/nisiniai-puslapiai-monetizavimui/blob/main/SKILLS/business-agent-calibration/references/acceptance.md). Kai clone gretimi, vietinis kelias iš šio repo yra `../nisiniai_puslapiai_monetizavimui/SKILLS/business-agent-calibration/SKILL.md`. Fresh clone / privataus runtime paruošimas: companion `docs/MULTI_MACHINE.md`.

## Sąsajų atsakomybė

Companion valdo profilius, packaged core + nišos procedūras, tikslines role instrukcijas, serverinę policy, knowledge admission, tekstinį eval ir protected adaptive mokymąsi. Šis repo valdo host-aware patvirtinto turinio projekciją, HMAC edge integraciją, browser mikrofono / kambario / valdiklio būsenas, popup ACK ir contact submission. Faktai nepridedami kuriant antrą prompto kopiją šiame renderer'yje; juos publikuoja esama approval / hash / publishAt eiga.

Naujai nišai naudoti tą patį siteId ir canonical host abiejuose registruose, tačiau profilio / svetainės buvimas automatiškai neįjungia voice, learning ar SMTP. Jev ON/OFF lieka serverio routing policy; UI negali suteikti daugiau įrankių. Slapukas sieja įrenginį / nišą / aplinką, ne patvirtintą žmogaus tapatybę.

Tekstinis Codex+ASGI runner naudoja serverinį kelią ir **imituoja** popup ACK. Tikras šio repo browser bandymas turi atskirai parodyti permission/start/readiness, actual `shown` ACK ir save receipt, įvykio eiliškumą, pabaigą, klaidą ir reconnect. Mikrofono / STT / Gemini audio, background HTTP, SMTP priėmimo bei matching inbox įrodymai vertinami atskirai. Klientui final produkto vaizdas nėra leidimas sintetinius įrašus laikyti tikrais užsakymais ar paklausa.

## Versijos ir Git perdavimas

2026-10-08 šis documentation pakeitimas remiasi public `37208b8`; canonical skill dokumentavimo bazė — core `8653b48`. [Core perdavimo būklė](https://github.com/christianza1989/nisiniai-puslapiai-monetizavimui/blob/main/docs/AGENT_CALIBRATION_HANDOFF_2026-10-08.md) aprašo jau esantį šešių nišų kodą ir private artefaktų ribas.

Ankstesnės realaus balso pataisos tada dar buvo atskiruose OPEN draft [core PR32](https://github.com/christianza1989/nisiniai-puslapiai-monetizavimui/pull/32) / [public PR9](https://github.com/christianza1989/niche-public-core/pull/9). Prieš naudojant jų worker readiness ar audio probe komandas patikrinti aktualų merge ir tikslius SHA. Šis docs-only pakeitimas jų neįdiegia ir nekeičia runtime.

Source kopija, vietinis preview, tikras domain deployment ir komercinė paklausa lieka atskiri priėmimai. Modelių raktai, `.env`, DB, dialogai, audio, `.eml` bei individualios išmoktos release nėra Git perdavimo dalis. Kitame kompiuteryje kalibravimas atkuriamas su savo konfigūracija ir naujais įrodymais.
