# Spec 08 — Student Analytics Dashboard (placeholder)

## Source
Principal's notes, 2026-07-25, under Students → Data Analysis:
- Irregular student list
- Toppers, stream-wise
- ~~Toppers in CET, NEET~~ (crossed out in the original notes — not in scope)
- PDF download report (already covered elsewhere)

## Status
Not detailed yet — placeholder so the requirement isn't lost. No notification
channel involved; this is a read-only reporting feature over existing
attendance and marks data, so it doesn't depend on the MSG91 specs.

## Before detailing this spec, confirm with the human
- "Irregular" attendance — what threshold defines it (e.g. below X%
  attendance over what window)?
- "Toppers, stream-wise" — ranked by which metric (aggregate marks, a
  specific exam, JEE/NEET/CET prep marks per `project-overview.md`)?
- Does this live in the existing Admin Portal analytics area, or is it a new
  screen?
