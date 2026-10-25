# Promedical product catalogue: sale-category removal

Scope: [issue 72](https://github.com/christianza1989/niche-public-core/issues/72).

Remove these merchandising categories from every product assignment:

- `3ebd53df-6425-4459-89c7-efc80aa90517`
- `8ebc04dd-bcf8-43c7-8023-7493b622ee32`
- `95b1fd35-0785-49f8-bd91-4f173ec64497`
- `dad92f0f-0632-495d-a799-9e6eb85be5f2`

Seventeen catalogue records change. Every product ID, URL and manufacturer model
code remains unchanged. The original `sourceSha256` identifies the catalogue
import; this owner-requested classification amendment does not rewrite that
historical source fingerprint.

Product `95948fc8-9f47-4f74-bcd0-b8fecb7c58b3` (ZV3205NPZ-2-VYPR) belongs to
BASIC MINI (`f184baae-7b30-48e1-9478-07734f3c2c82`), rather than the generic
information category. Its [manufacturer model page](https://www.klaro.cz/zv3205npz-2-vypr)
names BASIC MINI; the [MINI group](https://www.klaro.cz/basic-mini) shows the
corresponding ZV3205N family. This classification makes no claim that the
separate variants have identical specifications.

The catalogue sidecar supplies the breadcrumb, related-product selection and
LLM navigation. Product editorial links and sale wording are removed separately
through an approved content overlay. This catalogue amendment does not withdraw
category pages; that belongs to the category publishing workflow.

Validation: existing product navigation and catalogue pagination tests, plus an
inventory of all 1,407 product assignments against the deployed package. Actual
HTML and live rollout acceptance are separate from these source tests.
