# Spec 07 — Meeting Scheduling with Notification (placeholder)

## Source
Principal's notes, 2026-07-25: "schedule meeting {app and email}" under
Teachers. Read literally as "app and email," but per the 2026-07-25 decision
to standardize all notifications on MSG91 SMS (see `architecture-context.md`
and `progress-tracker.md`), this should very likely become "app and SMS"
unless the human specifically wants email preserved for this one case —
confirm before implementing.

## Status
Not detailed yet — do not build ahead of an approved spec, per
`ai-workflow-rule.md`. Placeholder so the requirement isn't lost.

## Before detailing this spec, confirm with the human
- Is meeting scheduling itself already covered by "Teacher Meetings" in the
  existing feature list, and this is purely about adding a notification when
  a meeting is scheduled? Or is scheduling itself also new?
- SMS (consistent with the rest of this phase) or does this specific flow
  need to stay email?
- Who gets notified — all teachers, or only invited ones?

## Placeholder scope (revise once scoped)
- Likely reuses the `notification_templates` / `notification_log` /
  `_shared/msg91.ts` infrastructure from spec 03 rather than introducing
  anything new.
