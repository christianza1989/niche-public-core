# Acceptance and repair

Read before judging a built page family or delivering a multipage result. Reuse the project's acceptance tools and exact scope; do not introduce a competing scoring system. Test a real rendered composition, not only asset hashes or source selectors.

## Separate the evidence

Assess visual craft from screenshots at actual display size before interpreting automated results. Record concrete observations about hierarchy, line breaks, alignment, density, image framing, light, edges and page rhythm. Compare the actual chosen concept and relevant references. A technically passing page may still have an incoherent composition.

Assess behavior separately through real routes, controls and outcomes. Choose meaningful tests for changed behavior and required project checks; do not write tests that simply mirror every CSS declaration. States with absent integration remain unverified, not passing because a fixture rendered.

Inspect the full homepage's middle/end and representative inner pages together. Check that each region adds useful information, transitions feel intentional, shared identity is stable and functional pages support sustained use. Compare nearest niche identities when required. Similar accessible controls are acceptable; a wholesale noun/palette swap is weak differentiation.

## Actual-browser checks

Choose widths around the composition's real breakpoints, including a narrow screen. Verify page/section order, no accidental horizontal overflow or concealed clipping, readable text, correct asset decoding/crop, appropriate keyboard/touch use, visible focus and functional routes. Check actual text enlargement/reflow where applicable; narrowing the viewport alone is not proof of browser zoom behavior.

Test relevant state transitions and recovery: option selection/summary, form invalid/pending/failure/success, keyboard menu/dialog close/return focus, auth recovery/redirect with the actual provider, and operational create/edit/save flows with authorized isolated test data. Preserve unrelated existing input engines and selected product geometry. Do not send real contact messages or enable live payments merely to perform a design check without the corresponding authorization.

Use available accessibility checks plus manual keyboard/state review. Respect reduced-motion preference; automatically moving reading content needs usable pause/control. An interaction is not accessible solely because its icon looks clear. References: [MDN reduced motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion), [W3C carousel guidance](https://www.w3.org/WAI/tutorials/carousels/).

Use the existing media pipeline, real CSS-derived sizes/srcsets, dimensions, appropriate loading priority and inspected final derivatives. Above-fold important imagery should not be delayed as below-fold decoration. Measure performance when the task/project requires it, using actual production assets; do not report an invented score. Reference: [web.dev responsive images](https://web.dev/learn/design/responsive-images).

## Fix and finish

Maintain a short observed-issue list with affected page/state, evidence and repair. Fix coherent batches, retest affected behavior and recheck the nearby composition. New failures or unresolved defects justify further iteration; an arbitrary demand for more novelty does not.

Capture enough evidence for the actual result: selected concept/actor, implementation routes, asset records, inspected views, observed tests, remaining dependencies and publication state. Keep private test fixtures, source prompts and customer data outside public exports according to the project contract.

Report states accurately: a mockup, asset kit, implemented frontend, integrated backend, local verification and deployment are different outcomes. Documentation validation proves readable/discoverable instructions; it does not prove future pages will be beautiful on the first attempt or that a system will convert customers. Follow the site's full acceptance contract for a complete build.
