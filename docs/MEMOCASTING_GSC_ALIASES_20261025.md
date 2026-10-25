# Memocasting historical URL recovery

The read-only Search Console export inspected on 25 October 2026 identified
additional exact historical paths missing from the 23 October alias list.
The source report was last updated on 16 October; its robots warnings are
historical, while direct public HTTP requests confirmed the remaining 404s.
Raw account exports remain private and are not part of this source change.

This patch covers 17 immediate URL forms, representing 15 distinct pathnames
after trailing-slash and pagination-query normalization. Twelve are content
aliases; three are retired Shopify child sitemap resources. The latter require
an eligible homepage and redirect to the existing `/sitemap.xml` XML handler,
discarding obsolete `from`/`to` ranges. A sitemap is never fabricated as a page.

The 11 scheduled URL forms represent 10 distinct pathnames. Five path aliases
already existed and five exact English-prefix aliases are added. They use the
existing eligible-page projection and each successor's actual `publishAt`.
Before that boundary, or after revocation/revision mismatch, the old address
does not redirect. This patch changes no article date or content.

Only individually reviewed English-prefix aliases are added. Unknown `/en/*`,
other language prefixes, customer-registration/action URLs, expired coupons,
pixel/CDN roots and broken interpolation paths remain untouched. The senior-gift
category and hand-casting blog require separate semantic evidence and are not
mapped. Existing native routes retain priority. Only GET and HEAD redirect;
the English password alias also removes credential and return query data.

Validation uses the actual committed content package and the existing public
projection: all 17 immediate forms resolve to current targets, all 11 scheduled
forms are tested one millisecond before and exactly at their real publication
boundary, and stale/revoked targets stay closed. A local HTTP contract fixture
checks 301-to-200 versus pre-publication 404. This fixture is not a framework
build or production deployment; the parent release owner still verifies actual
proxy ordering, trailing-slash behavior, XML responses and hosted acceptance.

Source coordination: [public issue 70](https://github.com/christianza1989/niche-public-core/issues/70).
Base: PUBLIC `c66ad5ae0f50f8d039040bf196ca4567d8437385` with fetched main
`8e47c34e497b2210c8cfff7d0e36c7f8b329e213` already an ancestor; clean CORE
companion `d3fe34b1ca94f3a551e1f787ae344ad9cc682fd7`.
