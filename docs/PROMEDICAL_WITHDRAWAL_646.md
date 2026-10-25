# Four withdrawn sale categories

Rokas decision 646 on 2026-10-25 withdraws category IDs 076, 077, 264 and 265. Their canonical and historical paths return HTTP 301 to `/produktai`. This source change is separate from production acceptance.

`pageWithdrawalsBySite` in the network configuration names the canonical host, exact stable page IDs and original category paths. Compilation rejects unknown sites, mismatched hosts/paths, duplicate entries, product identities and unsupported destinations. The virtual catalogue destination is explicitly limited to the Promedical renderer.

The shared public projection removes these identities and incoming editorial links before HTML, schema, sitemap, media and LLM output. It preserves the immutable approved package and all other content. The existing guide publication cutoff is unchanged. Later hosted edits cannot revive withdrawn IDs; restoring an identity requires an explicit configuration change. Product classification is owned by the separate product workflow (issue72), and this patch does not edit it.

The proxy applies withdrawals only to GET/HEAD requests, before ordinary legacy redirects. Historical aliases are resolved by stable target ID. A withdrawn catalogue category filter is removed, along with its obsolete page offset; unrelated query values remain. No redirect is emitted when the site's homepage is unpublished. Unknown paths and other hosts/tenants retain existing behavior.

Validation: the full public suite passed 101 tests, including withdrawal scope, immutable source preservation, two retained guides, all other tenants, direct/legacy redirects, query cleanup, host/publication isolation and invalid configuration rejection. An initial configuration serialization converted an ISO timestamp; it was corrected before build/native changes. An initial test query fixture used an incorrect prefix length; the explicit prefix length corrected the fixture. Those initial failures remain in private execution receipts.

Private execution evidence: `D:/Core/output/promedical-withdrawal-646-20261025`. Native revocation preserves the four drafts/media/history and all other native records. Normal build, actual HTTP/visual acceptance and deployment status are recorded separately. A concurrent administration candidate must be reconciled before production deployment; a script GET can represent the newest 0% candidate rather than the version receiving traffic.
