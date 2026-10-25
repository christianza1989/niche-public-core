# Memory Casting metadata

This adapter applies only to the `memocasting` package on `memocasting.lt`.
Publication eligibility and canonical URLs remain owned by the existing native
projection and canonical helper. It does not change another tenant's metadata.

| Field | Maintained source |
| --- | --- |
| WebSite name, OG site name, title suffix, Product/feed brand | Owner-confirmed brand **Memory Casting**; alternative site name **Memocasting** |
| Organization legal name; article author | Existing operator identity **MB Memocasting**, retained separately from the brand |
| Registration number | Explicit `įmonės kodas` in the current eligible about-page paragraph or list; no guessed number |
| Page title/description, OG and Twitter text | Current admitted page and published catalog `seoTitle`/`seoDescription` overrides |
| Homepage title | `Rankų liejimo rinkiniai porai ir šeimai` plus the brand suffix |
| Homepage description prices | Both eligible kits' actual admitted LIVE EUR offers; otherwise an honest description without prices |
| Product OG price and rich Offer | The same published catalog projection as the storefront; no editorial or hardcoded prices |
| Page primary image and social image | That page's admitted image family; exact visible hero asset for the admitted homepage; relevant eligible kit image only on the instruction hub |
| Price/availability in Merchant XML | Existing live catalog loader, exact white/no-base configurations, persistent manufacturer MPN registry |
| Index directives | Eligible public pages may use large image previews and unlimited text snippets; functional/missing pages remain `noindex, nofollow` |

The adapter does not add reviews, ratings, FAQ, HowTo, invented ProductGroups or a
homepage Product entity for the two separate kits. Structured data and preview
permission support eligibility; Google chooses the displayed site name, snippet,
images and enhancements after crawling. Source changes do not prove deployment,
indexing or a particular search appearance.

Primary references:

- [Google Search site names](https://developers.google.com/search/docs/appearance/site-names)
- [Product snippet structured data](https://developers.google.com/search/docs/appearance/structured-data/product-snippet)
- [Robots meta rules, including max-image-preview and max-snippet](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)
- [Manufacturer/store-brand product identifiers](https://support.google.com/merchants/answer/160161?hl=en)
