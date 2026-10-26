# Memocasting heart favicon

Owner-supplied `heart-icon-valentine-2.png`, received 2026-10-23.
Original SHA-256: `bd69c561f8b7ae6c1b548222100f0c3b6402886347d3bcc87af741346ed36b7d`.

The original already contains an alpha channel. `heart-original.png` preserves its bytes; 32, 64 and 128 pixel PNGs are proportional size exports, without a replacement background or generated artwork. These are icon assets, separate from editorial responsive photography.

`lib/memocasting-favicon.mjs` embeds the 128 pixel PNG in a transparent SVG served through the existing host-bound brand-icon route. Only Memocasting uses the versioned heart URL; other brands retain their icons. To replace it, update the embedded PNG and URL version together.
