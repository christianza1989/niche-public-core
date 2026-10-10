# Verslo įrankiai ir autonominės core pataisos

Patirties ciklas privalomas kiekvienam core agentui, įskaitant integration/runtime/UI/infrastructure/content vykdytojus. Perskaityti companion CORE_IMPROVEMENT: atkuriamas bendras radinys → owned scope → canonical code/rule/skill pataisa → prasminga regresija / catalog SHA → savo journal → scoped PR → reviewed main → kito agento fetch / instrukcijų skaitymas → actual adoption. Vien pasiūlymas nepakeičia įvykdomos pataisos; neaiški ar svetimo savininko sritis tampa tikslia perduota priklausomybe. Verslo faktų ir vietinės konfigūracijos problemų nepadaryti fiktyviais bendrais defektais.

Private core `scripts/core-upgrade-check.mjs` ir CI tikrina private committed shared diff / journal / naujus PASS įvykius. Tai neįrodo public repo pakeitimo coverage ar visų PC instrukcijų įkėlimo. Public source turi savo issue/PR/checks; jo companion record nurodo public issue ir exact public paths, kad toks pats failo vardas nesuteiktų klaidingo private coverage. Canonical žurnalas lieka private companion; jo įrašų ar taisyklių kopijų čia nekuriame. Jei reviewed main dar neturi naujo checker, jį laikyti konkrečia nepriimta priklausomybe, ne apsimesti įvykdyta patikra.

Kanoninis companion: [nisiniai-puslapiai-monetizavimui](https://github.com/christianza1989/nisiniai-puslapiai-monetizavimui).

Po sėkmingo abiejų repo freshness gate perskaityti to checkout AGENTS, BUSINESS_TOOLS_CORE ir SKILLS/niche-business-tools/SKILL.md. Kuriant naują verslą / reikšmingą plėtrą jo TOOLS.md saugoti privačiame companion site namespace: konkretus mokamas rezultatas, Treg catalog discovery, dabartiniai / ateities tools, coverage / cost / limits / fallback / trigger / test / rights. Planas neįjungia operational modules.

Praktines sistemos spragas, nereikalingą kodą ir skill konfliktus agentas gali savarankiškai taisyti pagal companion CORE_IMPROVEMENT.md. Įrašai ir exact-file quarantine helperis viename canonical core-improvements žurnale; runtime / customer data / archives nekarantinuojami. Viešo rendererio pataisai reikia own public branch/scope/PR ir jo test:core / test:seo-smoke; companion žurnale nurodyti public PR, faktinius checks ir source. WORKSTREAMS nėra distributed lock; issue/PR scope coord būtinas.

Aktualios taisyklės pasiekia kitą PC po reviewed main merge ir jo fetch / perskaitymo. Anksčiau pradėtas job išlaiko snapshot. Naujo PC bandymas aprašytas companion docs/CORE_UPGRADE_COLD_START.md; naujos instrukcijos nėra senų nišų migracija, realių agentų learning ar deployment priėmimas.
