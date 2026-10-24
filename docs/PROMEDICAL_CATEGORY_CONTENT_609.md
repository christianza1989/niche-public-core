# Promedical accepted category text

Owner decision 609 authorizes rendering the existing accepted body and source links after the category catalogue. The 2026-10-24 acceptance found that the former Catalog condition rendered body only for `/produktai`, hiding 434 accepted category texts.

`lib/promedical-category-content.mjs` lists the exact 434 authorized IDs. The predicate also requires the Promedical site, FAQ type and category path. Unknown IDs are not automatically enrolled. The two excluded historical categories (076/077) retain their previous output. `/produktai`, product detail, catalogue cards, filters and pagination keep their existing paths. No package, prose or URL changes are part of this patch.

The section reuses the existing `section`, `article`, `Blocks` and `Sources` roles. No independent typography or new content system is introduced. The regression exercises real SSR with ordered paragraphs/H2/list, an internal link and a visible external source, including filtered empty results and exclusions. Actual publication validation must additionally compare all accepted body blocks in built HTTP HTML, protected product/category output, catalogue interactions and desktop/mobile reading layouts. A valid package alone is not evidence that its body is visible.

Issue: https://github.com/christianza1989/niche-public-core/issues/61

The accepted category article also inherits `overflow-wrap:anywhere`. At320px, combining200% text enlargement with enlarged letter/word spacing made a long H2 overflow to371px; normal size and either setting alone passed. Wrapping is limited to this new category section, so catalogue controls and other page families keep their styling. Preserve the failed screenshot and verify the combined reading settings in the rebuilt page.
