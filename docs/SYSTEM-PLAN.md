# Atlas techninis sistemos planas

## 1. Architektūros principai

Platforma turi būti vienas produktas su daugeliu svetainių, o ne daug beveik vienodų kopijų.

- **Vienas kodas, daug tenantų.** Kiekviena svetainė identifikuojama `site_id`; hostas niekada nėra vienintelis saugumo raktas.
- **Locale yra duomenys.** Kalba, slug, tekstai, valiuta, data, CTA ir legaliniai tekstai turi būti lokalizuojami per modelį.
- **Vieša versija yra snapshot.** Straipsnio redagavimas negali iš dalies pakeisti jau publikuoto turinio.
- **Publikuota reiškia patvirtinta.** Viešas rendereris, sitemap, robots, JSON-LD, `llms.txt` ir nuorodų grafas skaito tą pačią patvirtintą versiją.
- **Automatika turi būti idempotentinė.** Job'ai, importai, webhook'ai ir analytics event'ai turi turėti idempotency key.
- **Kiekvienas automatinis veiksmas yra audituojamas.** Saugome kas, kada, kokį modelį ar importą naudojo ir kas patvirtino.

## 2. Loginiai komponentai

```text
Codex / AI ingest
        |
        v
Content API -> validation -> review queue -> scheduler/worker
        |                                      |
        v                                      v
  PostgreSQL / CMS                         outbox events
        |                                      |
        v                                      v
Next.js public renderer <- cache invalidation / published snapshot
        |
        +--> sitemap, robots, llms.txt, JSON-LD, analytics
```

Rekomenduojama gamybinė architektūra: Next.js App Router, Payload CMS, PostgreSQL, atskiras publish worker ir objektinė media saugykla. Dabartinis Site prototipas naudoja vietinį adapterį ir D1, kad būtų galima saugiai peržiūrėti UI; adapterio sąsaja turi likti stabili pereinant į PostgreSQL.

## 3. Tenant, domeno ir kalbos modelis

### `sites`

```text
id                 UUID primary key
key                stable internal key, e.g. dovanos123
display_name       localized brand name
default_locale     e.g. lt-LT
timezone           IANA name, e.g. Europe/Vilnius
currency           ISO 4217
status             active | paused | archived
analytics_config   encrypted/provider-specific reference
created_at
updated_at
```

### `domains`

```text
id                 UUID primary key
site_id            foreign key
hostname           normalized lowercase hostname
protocol           https
is_primary         boolean
redirect_target    optional canonical hostname
```

### `locales`

```text
site_id            foreign key
locale             BCP-47, e.g. lt-LT
hreflang           e.g. lt-LT
enabled            boolean
route_dictionary   JSON object for localized path segments
translation_status active | pilot | paused
```

Unikalūs raktai: `(site_id, hostname)`, `(site_id, locale)` ir `(site_id, locale, slug)`.

Host resolveris pirmiausia normalizuoja hostą, tada randa domeną, tada priskiria `site_id`. Nežinomas ar staging hostas turi būti `noindex` ir neturi rodyti production sitemap.

## 4. Turinio modelis

### Article

```text
id                   UUID
site_id              UUID
locale               BCP-47
translation_group_id UUID nullable
slug                 immutable-or-redirected slug
title                string
dek                  string
content_blocks       typed JSON blocks
excerpt              string
hero_image           media reference + alt text
author_ids           ordered list
category_ids         ordered list
source_ids           ordered list
publication_state    ai_draft | review | approved | scheduled | published | unpublished
publish_at           UTC timestamp
published_version_id UUID nullable
canonical_url        derived, never free text from AI
created_at / updated_at
```

### ArticleVersion

```text
id                   UUID
article_id           UUID
version_number       integer
content_snapshot     immutable JSON
seo_snapshot         title, description, canonical, robots
schema_snapshot      validated JSON-LD payload
ai_metadata          provider/model/prompt hash/source refs
review_metadata      reviewer, reviewed_at, decision, notes
created_at
```

### Supporting entities

- `authors`: real name, role, biography, experience, photo, verified `sameAs` links, profile status;
- `sources`: title, publisher, URL, accessed date, source type, supported claim and locale;
- `products`: product name, owner, official URL, image, availability source, last verified date;
- `offers`: affiliate URL, disclosure, tracking parameters, expiration and redirect status;
- `internal_link_refs`: source article, target article ID, anchor text, block ID, optional reason;
- `publish_jobs`: article/version, due time, status, lease, retries and failure reason;
- `outbox_events`: event type, aggregate ID, idempotency key and delivered timestamp;
- `audit_events`: actor, action, before/after hashes, IP/device metadata where lawful;
- `redirects`: site, locale, old slug, new URL/status and owner.

## 5. Block schema

Straipsnio body nėra laisvas HTML iš AI. Naudojame validuojamus blokus:

```text
heading       { level, text, anchor }
paragraph     { text }
list          { ordered, items[] }
quote         { text, attribution, source_id? }
image         { media_id, alt, caption, source }
product_cta   { product_id, offer_id?, label, placement }
related_links { target_article_ids[], heading }
table         { caption, columns[], rows[][] }
callout       { tone, title, text }
```

Rendereris pats escapina tekstą, leidžia tik whitelisted formatavimą ir nepriima išorinių HTML skriptų. Nuorodos į straipsnius turi `target_article_id`; laisvas `href` leidžiamas tik patvirtintiems išoriniams šaltiniams.

## 6. AI/Codex ingest API

### Importas

`POST /api/ingest/articles`

```json
{
  "idempotencyKey": "codex-2026-09-18-batch-001",
  "siteKey": "dovanos123",
  "articles": [
    {
      "externalId": "gift-guide-001",
      "title": "...",
      "slug": "...",
      "excerpt": "...",
      "category": "Dovanos porai",
      "locale": "lt-LT",
      "blocks": [],
      "authorIds": ["author-uuid"],
      "sourceIds": ["source-uuid"],
      "publishAt": "2026-10-01T07:00:00Z",
      "requestedState": "scheduled"
    }
  ]
}
```

API privalo:

1. patikrinti machine token scope (`site_id`, locale, action);
2. normalizuoti slug ir blokus;
3. atmesti neleistiną HTML, per didelius payload'us ir SSRF rizikos URL;
4. patikrinti autorių, šaltinius, produkto CTA ir target ID egzistavimą;
5. išsaugoti AI metadata ir idempotency rezultatą;
6. grąžinti `accepted`, `needs_review` arba `rejected` su konkrečiais error codes.

Kiti veiksmai: `validate`, `request-approval`, `schedule`, `publish`, `unpublish`. `publish` negali apeiti review, nebent aiškiai apibrėžta emergency role ir tai patenka į audit log.

MVP kode šis kontraktas realizuotas per `POST /api/ingest/articles`. Endpointas reikalauja `Authorization: Bearer <CONTENT_INGEST_TOKEN>`, priima iki 50 straipsnių, validuoja slug'us ir typed blocks, saugo `external_id`, article version, audit ir outbox įrašus. Pakartotas `idempotencyKey` grąžina ankstesnį rezultatą ir nekuria dublikatų. `POST /api/internal/publish-due` yra atskiras worker endpointas, apsaugotas `Authorization: Bearer <PUBLISH_WORKER_TOKEN>`.

## 7. Scheduler algoritmas

```text
kas minutę:
  due = approved/scheduled jobs where publish_at <= now
  kiekvienam job:
    paimti lease su DB sąlyginiu update
    pakartotinai patikrinti site, locale, article ir version
    patikrinti reviewer approval ir content validation
    atominiu veiksmu pakeisti published_version_id/state
    įrašyti outbox: ArticlePublished
    išvalyti tik susijusius route/cache raktus
    pažymėti job complete
  klaidos -> retry su backoff; po limito -> dead_letter + alert
```

Laikas DB saugomas UTC. UI rodo svetainės IANA timezone. Job'o vykdymas turi būti saugus po worker restarto ir dviejų worker'ų konkurencijos.

## 8. Publikuotų-only link resolveris

```ts
function resolveInternalLink(source: Article, targetId: string, now: Date) {
  const target = getArticle(targetId);
  if (!target) return { kind: "text" as const };
  if (target.siteId !== source.siteId) return { kind: "text" as const };
  if (target.locale !== source.locale) return { kind: "text" as const };
  if (target.state !== "published") return { kind: "text" as const };
  if (target.publishAt > now) return { kind: "text" as const };
  return { kind: "link" as const, href: canonicalUrl(target) };
}
```

Publikacijos event'as invaliduoja target puslapį, visus inbound source puslapius, sitemap ir `llms.txt`. Unpublish event'as pakartoja tą patį atgaline kryptimi.

## 9. Vieši puslapių šablonai

### Homepage

Hero su aiškiu pažadu, kategorijos, naujausi gyvi gidai, populiariausi gidai, produkto CTA, redakcinis paaiškinimas ir kontaktas. Neperkrauti baneriais: pirmiausia naudotojo užduotis, tada komercinis veiksmas.

### Article

Breadcrumb, H1, dek, realus byline, published/updated dates, hero alt, turinys, aiškūs atsakymai, šaltinių sąrašas, disclosure, gyvos related nuorodos, produkto CTA ir pataisymo kontaktas.

### Author

ProfilePage + Person, realus vardas, atsakomybė, patirtis, metodika, tikros nuorodos ir publikuotų straipsnių sąrašas.

### About / editorial / corrections

Paaiškinti savininką, publikavimo procesą, AI naudojimą, faktų tikrinimą, affiliate logiką ir kaip vartotojas gali pranešti apie klaidą.

### Privacy / cookies / terms

Šablonas pildomas tikrais duomenimis: valdytojas, kontaktas, tikslai, teisiniai pagrindai, tiekėjai, retention, perdavimai, teisės, cookie kategorijos ir consent mechanizmas. Nenaudoti išgalvotų įmonių ar adresų.

## 10. JSON-LD taisyklės

- `Article`/`BlogPosting`: matomas headline, realus author, publisher, image, `datePublished`, `dateModified`.
- `ProfilePage` + `Person`: tikro autoriaus puslapyje, su matoma biografija.
- `Organization`/`OnlineStore`: tik tikram savininkui ir realiems kontaktams.
- `BreadcrumbList`: tik matomam breadcrumb.
- `Product`/`Offer`: tik realiam produktui, su patikrinta kaina, valiuta, availability ir oficialiu URL.
- `Review`/`AggregateRating`: tik su įrodomu review procesu; niekada negeneruoti savęs įvertinimų.
- `FAQPage`: tik kai klausimai ir atsakymai matomi puslapyje ir tenkinamos paieškos gairės.

Schema nėra paslėpto turinio talpykla. Visas JSON-LD praeina parse ir required-field testus.

## 11. Daugiakalbystės taisyklės

- route segmentai ir kategorijų pavadinimai yra locale dictionary;
- vertimo grupė sieja tas pačias temas, bet kiekviena kalba turi atskirą tekstą, slug ir review;
- automatinis vertimas yra draft, ne automatinė publikacija;
- `hreflang` rodo tik gyvus tos pačios temos variantus;
- canonical visada yra tos kalbos puslapis, nebent aiškiai pasirinktas canonical override;
- jei kalba neturi turinio, jos meniu ir sitemap nerodomi;
- pluralai, linksniai, datos, kainos ir CTA tikrinami native reviewer arba patikimu lokalizacijos procesu.

## 12. Matavimo ir observability sluoksnis

Kiekvienas event'as turi `site_id`, `locale`, `article_id` ir consent būseną, kai tai leidžiama:

- `page_view`, `article_engaged`, `source_click`, `product_cta_click`, `affiliate_outbound`, `conversion`;
- build/deploy versija ir Lighthouse rezultatas;
- scheduler success/failure/retry;
- import accepted/rejected/needs_review;
- 404, redirect, broken-link ir schema validation klaidos.

Dashboard'e atskiriame svetaines ir kalbas. Joks cross-site agregavimas negali paslėpti, kad viena rinka turi prastesnį UX ar nekokybišką turinį.
