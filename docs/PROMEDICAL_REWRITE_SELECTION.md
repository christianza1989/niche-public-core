# Juodraščio dalių taisymas ir bendros pastabos

Owner request, 2026-10-30. Narrow extension of the existing Promedical administration UI; retain its fonts, red primary controls, neutral surfaces, existing dialog and responsive two-column comparison. No new visual identity.

## Interaction

- In the new-text side of the comparison, select rendered text, or choose “Pažymėti visą tekstą”. A persistent action bar reports the selection and opens a note dialog. The old side cannot supply a replacement target.
- Selection uses the exact visible draft ETag and UTF-16 ranges. Selections spanning headings, paragraphs or list items become separate replacements, preserving block types and untouched bytes. Selecting all uses the structured whole-text contract.
- “Ši pastaba galioja visai svetainei” asks for a literal word, phrase or stem and a reusable instruction distinct from the page-specific note. The dialog explicitly states that all matching fields in this draft will be sent, then offers a separate list of other matching pages. Nothing is automatically queued on those other pages.
- Other-page checkboxes show latest draft excerpts and disable conflicts or existing queued work. At most 50 explicitly selected pages per request; mixed failures are reported individually. Each job retains its own revision and review requirements.
- Active site rules accompany subsequent writer jobs. Imports and owner publication reject a candidate containing the literal case-insensitive match. This is a project terminology check, not an automated factual or linguistic review. Old approvals are not rewritten.
- Rules can be inspected, searched and removed in the comparison. Removal affects subsequent checks; historical job snapshots stay immutable.
- On narrow screens the new draft is first; the original remains below it. The action bar stays with the selectable text. Search failures offer retry; mixed queue failures require refreshed page choices instead of silently resubmitting successful work.

## Boundaries and validation

The additive SQL tables remain in `content-admin-rewrites.sql`; no production migration is authorized. Machine capability remains list/status/draft only. Local demo resume preserves its existing SQLite file and synthetic account; accepts only an existing `.sites-runtime/inline-fixture-*` directory and a loopback listener. Owner local proxy continues to block publication.

Checks: editor and terminology API regression tests; actual workerd/D1 and actual file bridge; Codex/Claude review hash gates; UI selection, retry, mobile overflow, keyboard controls and screenshots. No real text approval, release or publication is part of these tests.
