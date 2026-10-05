# Atlas content platform: blueprint

> **Historical design, not the current implementation contract (2026-09-26).** Its Payload/PostgreSQL and human-review choices conflict with the current D1 codebase and the owner's AI-editor requirement. Use [the new architecture and roadmap](AUTOMATIZAVIMO-ARCHITEKTURA-IR-ROADMAP-2026.md) for future implementation; keep this file only for design history.

This document is the implementation contract for the reusable multi-market gift publishing platform.

## Product boundary

Atlas is a content control plane for five or more gift sites. It is not a promise of rankings. It makes each site technically crawlable, editorially trustworthy, locale-aware, measurable, and safe to publish on a schedule.

The public site must only expose content whose approved version is live. Drafts and scheduled content remain visible only in authenticated preview mode.

## Chosen architecture

- Next.js App Router for the public experience and route-aware metadata.
- Payload CMS as the editorial control plane, backed by PostgreSQL.
- A separate publish worker / cron process for due jobs, idempotency, retries, and cache invalidation.
- A shared codebase with strict `site_id` and `locale` scoping on every content query.
- An immutable article-version snapshot as the source for publication, sitemap, JSON-LD, and `llms.txt` output.
- R2/S3-compatible media storage for images; relational metadata remains in PostgreSQL.
- Separate Search Console, GA4, and UTM configuration per site.

The current Site preview uses a small local content adapter so the UI can be reviewed before production CMS credentials exist. It must be replaced by the Payload/PostgreSQL adapter before real publishing.

## Publication states

`ai_draft -> review -> approved -> scheduled -> published -> unpublished`

The publish worker stores all timestamps in UTC. Editors see the configured timezone for the site. A job is published only when the approved version, tenant, locale, and `publish_at` are still valid. Repeated worker calls are idempotent.

## Internal link invariant

Internal links are typed references to article IDs, never arbitrary URLs typed by an LLM.

At render time a link resolves only when:

```text
target.site_id === current.site_id
target.locale === current.locale
target.publication_state === published
target.publish_at <= now
```

If a target is scheduled or unpublished, the UI renders plain text or omits the link. When a target goes live, the publish event invalidates the target page and every inbound source page. This is the guarantee that prevents future-article 404 links.

## Public page inventory

Every market gets the same route contract, localized per site:

- `/` homepage: purpose, site identity, latest guides, categories, editorial trust, primary product CTA.
- `/straipsniai/[slug]` or the locale equivalent: article, author, published/updated dates, sources, disclosure, related live links, CTA.
- `/autoriai/[slug]`: real author biography, areas of experience, verified social/organization links, authored articles.
- `/apie`: who owns the project, what the editorial team does, how products are selected, how corrections work.
- `/kontaktai`: real contact method and response expectations.
- `/redakcine-politika`: review, fact-checking, AI assistance disclosure, corrections, update policy.
- `/partneriu-nuorodu-atskleidimas`: affiliate/sponsored-link disclosure.
- `/privatumas`: accurate controller, purposes, lawful bases, recipients, transfers, retention, rights, and complaint route.
- `/slapukai`: actual cookie inventory and consent controls.
- `/taisykles`: terms for the editorial site.
- `/llms.txt` and `/llms-full.txt`: generated from live pages only. The full variant includes visible article text, authors and source links; review and scheduled content is excluded.

Policy pages are templates until the owner supplies real legal entity, contact, analytics, affiliate, hosting, and retention details. They must not contain invented company data.

## E-E-A-T rules

- Every article has a visible byline and links to a real profile page.
- A profile must contain accurate name, role, relevant experience, and only real `sameAs` links.
- Use `Person` for a real person. Use an editorial `Organization` only when the organization actually exists and is responsible for the article.
- Do not invent degrees, jobs, tests, quotes, product use, customer stories, or citations.
- AI may assist with research and drafting, but a human reviewer approves facts and the published version records the review event.
- Product reviews must state what was tested, by whom, when, and how. If the product was not tested, call the page a guide or comparison, not a personal review.
- Sources are stored as structured citation records with title, publisher, URL, accessed date, and the claim they support.

## Schema contract

Emit JSON-LD only when it represents visible page content:

- site-wide `Organization` / `OnlineStore`, `WebSite`, and `SearchAction` where applicable;
- `Article` or `BlogPosting` with headline, image, `datePublished`, `dateModified`, publisher, and every visible author;
- `ProfilePage` + `Person` on author pages;
- `BreadcrumbList` on article/category pages;
- `Product` only on a real product page with truthful offers/availability/reviews;
- `ItemList` on genuine lists, not as a way to mark up every site page;
- `FAQPage` only where questions and answers are visible and the feature is eligible.

Every schema payload is validated in CI and sampled with the Rich Results Test and URL Inspection after deployment. Structured data is eligibility, not a guarantee of a rich result.

## SEO/GEO/LLM output

- Server-rendered, crawlable HTML; no important article text hidden behind client-only rendering.
- Self-canonical per locale, live-only sitemap entries, live-only `hreflang`, and host-aware robots.
- `llms.txt` is generated as a concise Markdown index of the site's live canonical pages; `llms-full.txt` is optional and generated only for content that is safe to expose.
- The content itself does the GEO work: direct answers, original evidence, clear entities, source links, accurate dates, first-hand experience where claimed, and concise section headings.
- Do not add low-value pages just for AI fan-out queries. Google explicitly says unique, useful content matters more than AI-specific hacks.

## Quality gates

Each pull request and deploy checks:

- TypeScript/build success.
- No scheduled article in public sitemap or public internal-link graph.
- No live article missing a real author, canonical, date, or title.
- No link resolver output pointing at a non-live article.
- JSON-LD parse and required-field validation.
- sitemap and `llms.txt` contain only live canonical URLs.
- Lighthouse mobile and desktop for homepage, article, author, and policy templates.
- Target: 100 accessibility, 100 best practices, 100 SEO, and as close to 100 performance as deterministic hosting allows. A failed critical audit blocks release; scores are stored over time because Lighthouse performance varies with environment.

## References

- Google people-first content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google Article markup and author best practices: https://developers.google.com/search/docs/appearance/structured-data/article
- Google ProfilePage: https://developers.google.com/search/docs/appearance/structured-data/profile-page
- Google Organization: https://developers.google.com/search/docs/appearance/structured-data/organization
- Google Breadcrumb: https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
- Google structured-data policies: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- Chrome Lighthouse: https://developer.chrome.com/docs/lighthouse/overview
- llms.txt proposal: https://llmstxt.org/
