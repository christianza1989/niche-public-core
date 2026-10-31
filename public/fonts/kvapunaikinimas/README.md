# Kvapunaikinimas font assets

Open Sans is self-hosted under the accompanying SIL Open Font License in
[OFL.txt](OFL.txt). Normal faces were imported with the initial migration.

On 2026-10-31 the original site's actual inline font-face rules were checked
again: its italic face uses these Google Fonts Open Sans v44 files. Keep the
real italic glyphs; synthetic slant has different advances and changed a
mobile paragraph's line breaks. These are local static assets with no Google
Fonts runtime request. Both subsets are hinted only on pages with italic runs.

| Local file | Original URL |
| --- | --- |
| open-sans-italic-latin.woff2 | https://fonts.gstatic.com/s/opensans/v44/memtYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWqWuU6FxZCJgg.woff2 |
| open-sans-italic-latin-ext.woff2 | https://fonts.gstatic.com/s/opensans/v44/memtYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWqWt06FxZCJgvAQ.woff2 |

Observed source stylesheet:
https://cdn-ljhal.nitrocdn.com/iVMnZlvajadwMOOzIxApZodmYcZOlchd/assets/static/optimized/rev-72be88f/kvapunaikinimas.lt/externalFontFace/nitro-min-noimport-27955e8b3ccda128ea6680b998c48144-stylesheet.css

Acquisition and exact SHA-256 provenance are recorded in the companion site's
`ALL-PAGES-2026-10-31` acceptance report. The browser asset bundler returned
fetch failures for the fonts; the same observed public URLs were downloaded
directly into the task evidence directory without modifying their bytes.
