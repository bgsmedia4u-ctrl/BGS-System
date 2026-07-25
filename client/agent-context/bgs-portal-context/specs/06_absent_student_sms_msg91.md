# Spec 06 — Absent-Student Parent SMS Alert (MSG91)

## Source
Captured directly from the principal's handwritten requirements, 2026-07-25:
*"This system needs to send SMS to the student's parent number saying
'[Name] is absent today.' — Wai Sri Guruder II, BGS PU College, Sidlaghatta."*

## Goal
The instant (or same-day, batched — see decision point below) a teacher marks
a student absent in attendance, the student's parent contact number
automatically receives an SMS: *"[Student Name] is absent today. – BGS PU
College, Sidlaghatta."*

## Prerequisite
Spec 03 complete (`_shared/msg91.ts` helper, `notification_templates`,
`notification_log` exist). A DLT-approved template for this exact message
must be registered with MSG91 before this spec can be verified end-to-end —
this is a manual human step; the wording above is a starting point for what
to submit for DLT approval, but the final approved text (with `{#var#}`
placeholders) is what the code must actually use.

## Decision point to confirm with the human before implementing
**Real-time-per-mark vs. end-of-day batch.** The note says "is absent today,"
which both approaches satisfy. Two options:
- **Real-time**: fire immediately when a teacher marks a student absent in
  the Attendance Tracking flow (a Postgres trigger or an API call right after
  the insert). Simple, but if a teacher corrects a mis-mark five minutes
  later, a wrong SMS has already gone out.
- **End-of-day batch** (recommended default, mirrors the idempotent pattern
  used in spec 04): a `pg_cron` job runs once in the evening, sends one SMS
  per student who is still marked absent at that time, after corrections have
  had a chance to happen. Safer against accidental double-sends from
  attendance edits.
Default to end-of-day batch unless the human specifies otherwise; note the
decision in `progress-tracker.md` either way.

## Scope — files/folders this spec may touch
- `supabase/functions/notify-absent-student/`
- `database/migrations/<timestamp>_add_absence_sms_template_and_trigger_or_cron.sql`
  (additive: seeds the template row, adds either a trigger or a `pg_cron`
  schedule depending on the decision above)
- `src/data/notifications.js` (extend only if the Admin Portal needs a view
  into absence-SMS history — optional, not required for "done")
- Do not touch attendance-marking logic itself beyond adding the
  trigger/cron hook — this spec observes attendance data, it doesn't change
  how attendance is recorded.

## Implementation steps
1. Confirm real-time vs. batch with the human (see decision point above) if
   not already specified.
2. **Resolve parent phone number**: use `public.students(parent_phone)` as the single authoritative source tracked in student registry data — do not duplicate or re-collect this field.
3. **Template**: seed `notification_templates` with the DLT-approved absence
   template and its exact variable order (e.g. student name, plus institution
   name if it's a variable rather than fixed text).
4. **Trigger or cron** (per the decision):
   - *Real-time*: a Postgres trigger (or an Edge Function called right after
     the attendance-insert from the frontend) that fires
     `notify-absent-student` for that one student.
   - *Batch*: a `pg_cron` job + Edge Function that queries "students marked
     absent today, not yet SMS'd today" each evening.
5. **Idempotency**: regardless of approach, guard against duplicate sends
   using `notification_log` (same pattern as spec 04) — one absence SMS per
   student per calendar day, even if attendance is marked/edited multiple times.
6. **Edge Function `notify-absent-student`**: resolves the parent number,
   calls the shared MSG91 helper with the approved template + student name
   variable, logs to `notification_log` with `channel = 'sms'`,
   `template_id`, `recipient_phone`, `status`.
7. **Failure handling**: a missing/invalid parent phone number must not crash
   the whole run (batch mode) — log that student's row as `status = 'failed'`,
   `error_message = 'no parent contact on file'`, and continue with the rest.

## Verification checklist
- [ ] Marking a student absent (and, if batch mode, waiting for the
      scheduled run) results in a real SMS to that student's registered
      parent number.
- [ ] A student who is absent but has no parent phone number on file does
      not crash the job — it's logged as failed and the rest of the run
      completes.
- [ ] Marking the same student absent twice in one day (or correcting and
      re-marking) does not send two SMS messages that day.
- [ ] A student who is marked absent then corrected to present *before* the
      SMS fires (batch mode) does not receive an SMS.
- [ ] `notification_log` has one row per attempted send, with accurate status.
- [ ] `progress-tracker.md` updated with: the real-time-vs-batch decision and
      why, the DLT-approved template text actually used, and confirmation the
      parent-phone field being read is the same one already in the student
      registry (no duplicate data model introduced).
