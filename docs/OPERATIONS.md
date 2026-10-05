# Atlas operacinis runbook

> **Esamos lokalios versijos pastabos, ne būsimos architektūros specifikacija (2026-09-26).** Čia aprašytas privačios Sites aplinkos, cron ir žmogaus review statusas turi būti iš naujo patikrintas prieš bet kokį viešą įdiegimą. Naujas planas: [autonominės sistemos architektūra](AUTOMATIZAVIMO-ARCHITEKTURA-IR-ROADMAP-2026.md).

## Aplinkos

- Produkcija šiuo metu yra privati Sites aplinka; Google ir anoniminiai lankytojai jos nemato.
- D1 migracijos leidžiamos eilės tvarka: `0000`, `0001`, `0002`, `0003`.
- `CONTENT_INGEST_TOKEN` ir `PUBLISH_WORKER_TOKEN` saugomi tik Sites runtime secrets. Jų nedėti į Git, Markdown, URL ar logus.
- Tikras produkto URL, juridinio savininko duomenys, kontaktas, analitika ir cookie tiekėjai turi būti įrašyti prieš viešinimą.

## Straipsnio įkėlimas iš Codex

Codex sugeneruoja vieną JSON batchą su `idempotencyKey`, `siteKey` ir iki 50 straipsnių. Straipsniai privalo turėti `externalId`, unikalų slug, lokalę, autorių, excerpt ir typed `blocks`.

- `requestedState: "review"` — įrašas patenka į redakcinę eilę.
- `requestedState: "scheduled"` — būtinas ISO 8601 `publishAt` su timezone/UTC offset.
- Tas pats `idempotencyKey` yra saugus pakartoti: API grąžins ankstesnį rezultatą.
- AI tekstas nėra automatiškai laikomas žmogaus patvirtintu; prieš viešą paleidimą būtina review procedūra.

## Publikavimo workeris

`POST /api/internal/publish-due` reikia kviesti kas 1–5 minutes su `PUBLISH_WORKER_TOKEN`. Workeris paima due `publish_jobs` su lease, publikuoja tik suplanuotą versiją, sukuria `ArticlePublished` outbox įvykį ir gali būti kartojamas idempotentiškai.

Privatus Sites edge sluoksnis papildomai reikalauja savininko autentifikacijos, todėl išorinis cron negali būti laikomas veikiančiu vien todėl, kad endpointas yra kode. Prieš viešą paleidimą reikia pasirinkti vieną iš dviejų saugių variantų:

1. vykdyti workerį per autentifikuotą vidinį runtime/worker kanalą;
2. leisti viešą svetainės edge prieigą, bet palikti endpointą apsaugotą ilgu `PUBLISH_WORKER_TOKEN` ir tinklo/kvietėjo ribojimu.

Po kiekvieno workerio kvietimo stebėti `publish_jobs.status`, `attempts`, `last_error` ir `outbox_events`.

## Viešinimo vartai

Prieš domeno prijungimą:

1. pakeisti demo produktų URL tikru landing page URL;
2. pakeisti demo/autoriaus placeholderius tikrais asmenimis ar atsakinga redakcija;
3. įrašyti tikrus šaltinius ir patikrinti, kokį teiginį kiekvienas šaltinis palaiko;
4. užpildyti privatumo, cookies, taisyklių, kontaktų ir disclosure tekstus pagal faktinę veiklą;
5. prijungti Search Console, analitiką ir atskirą UTM matavimą kiekvienam domenui;
6. paleisti build, lint, schema/sitemap patikras ir Lighthouse mobile/desktop.

## Saugus rollback

- Sustabdyti schedulerį, jei jis kuria klaidingas publikacijas.
- Grįžti į paskutinę patikrintą Sites versiją pagal commit, o ne rankiniu būdu perrašyti šaltinius.
- `unpublished` straipsnis turi dingti iš homepage, sitemap, `llms.txt`, `llms-full.txt` ir related nuorodų grafiko.
- Kiekvieną rollback ir turinio pataisą įrašyti redakcinėje/audit sistemoje.
