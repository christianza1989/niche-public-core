# Prompt patterns

Use brief scaffolding, not mandatory boilerplate. Substitute active site facts, language, references and constraints. Prompt lines are not invented API arguments. Inspect referenced local images before editing.

## Section concept

```text
Use case: ui-mockup
Asset type: concept for [section purpose/location], [target proportions].
Audience / next action: [reader, question, truthful next step].
Brand: [documented art direction, palette/type/mood].
Inputs: Image 1 = approved product; Image 2 = composition/style reference.
Hierarchy: [headline, main visual, useful choices, primary action].
Composition: [layout, negative space, scale and alignment].
Copy, verbatim in [language]: [actual short headlines, labels and CTA].
Invariants: [shape, proportions, finish, approved mark, count].
Surfaces: [background, illumination, texture, borders and selected state].
Implementation: text/controls live; independently reusable artwork.
Avoid: [unsupported claims, unrelated objects, wrong language, unwanted styling].
```

Generated concept copy evaluates hierarchy; it is not production HTML or guaranteed typography. Correct spelling/layout in implementation. For alternatives change meaningful structure, such as editorial split, comparison, narrative or image-led composition where appropriate; do not impose one layout on every niche.

## Transparent cutout

```text
Use case: background-extraction
Asset type: independent product cutout for [role].
Input 1: original approved product, edit target, not a section screenshot.
Request: isolate one product with genuinely transparent background.
Keep: silhouette, geometry, camera, materials, mark and label positions.
Framing: entire object; [breathing room]; no clipped edges.
Lighting: retain source; no baked opaque floor/rectangle.
Alpha: antialiased edges, transparent open holes, [shadow policy].
Avoid: invented parts, reshaped logo, extra products, captions, fake checkerboard.
```

Set the tool's transparent-background option. Reuse an already clean alpha master. Label extra hardware geometry views explicitly. A conceptual rendering cannot prove manufactured dimensions.

## Integrated product photograph

```text
Use case: compositing / product-mockup
Asset type: cohesive photograph panel with opaque [target backdrop].
Input 1: composition reference; only [specific panel] for atmosphere/framing.
Input 2: approved product; preserve identity and geometry.
Request: exact product with [floor/light/reflections/backdrop].
Camera/scale: [angle, complete silhouette, product-to-frame relationship].
Lighting: consistent contact shadow, highlights and reflections.
Margins/crop: [focal region; quiet areas for live page labels].
Edges: [page color and falloff when relevant].
Keep: approved logo, printed text, product shape and finish.
Exclude: page copy/benefit icons/CTA, annotations, unrelated products.
```

Use when layered cutouts lose convincing light/reflections. Keep controls out of photography. Check intended edge blending; use an alternate mobile crop/composition if needed rather than stretching. Do not promise pixel-perfect preservation merely because the prompt requests it.

## Independent decorative art

```text
Use case: stylized-concept
Asset: [texture/ribbon/illustration] behind [foreground role].
Reference: chosen concept only for [shape/palette/motion language].
Composition: [orientation, focal area, continuity and safe margins].
Material/light: [specific surface/translucency].
Background: [soft alpha / deliberately opaque texture].
Avoid: products, text, UI, borders, hard clipping, fake checkerboard.
```

Simple gradients/geometric icons usually belong in CSS/SVG. Use raster when complexity benefits the design. Match foreground light; do not use glow to conceal poor cutout edges.

## Revision and provenance

Name the observed error, edit target and limited change; repeat invariants and approved reference. Avoid accumulating vague “perfect, better, ultra” directives. Save exact submitted prompt, input paths/hashes/roles, tool mode, actual date and returned artifact path at the call boundary. Record copied workspace file/hash and actual dimensions afterward. Do not reconstruct an alleged prompt or invent unused settings.
