# Spec 04 — Automated Saturday Weekly-Report Reminder (MSG91 SMS)

> Supersedes the earlier Gmail-based version of this spec. See
> `architecture-context.md` → "Notification architecture — MSG91."

## Goal
Every Saturday, automatically send an SMS reminder to every teacher who has
not yet submitted this week's Weekly Report.

## Prerequisite
Spec 03 complete (`_shared/msg91.ts` helper, `notification_templates`, and
`notification_log` all exist). A DLT-approved reminder template must exist
(distinct from the teacher-notification template in spec 03, since DLT
templates are fixed text — e.g. `Reminder: please submit your Weekly Report
for this week. - BGS PU College, Sidlaghatta.`). Register it with
MSG91/DLT as a human step before this spec can be verified end-to-end.

## Design decisions
- Trigger via PostgreSQL `pg_cron` (native Supabase scheduling), not an
  external cron service — per `architecture-context.md` rule 1.
- Must be idempotent: safe to re-run without double-sending. "Already
  reminded this ISO week" is checked against `notification_log` before
  sending.

## Scope — files/folders this spec may touch
- `supabase/functions/weekly-report-reminder/`
- `database/migrations/<timestamp>_schedule_weekly_reminder.sql` (adds the
  `pg_cron` job and seeds the reminder template row; additive only)
- `src/data/notifications.js` (extend, if needed, with a read-only "reminder
  history" query for the admin UI)
- Optional: a small "reminder log" panel in the Admin Portal showing last
  run's results — nice-to-have, not required for this spec to be "done."

## Implementation steps
1. **Determine "not submitted"**: query existing Weekly Report data for the
   current ISO week (Mon–Sun) and diff against the full active-teacher list
   (from `persons`/`employees` post-spec-02, or `profiles` if spec 02 hasn't
   landed yet — check `progress-tracker.md` for current state and use
   whichever is live).
2. **Idempotency guard**: before sending, check `notification_log` for an
   existing `status = 'sent'` row with the reminder `template_id` and
   `week_of = <this ISO week's Monday date>` for that recipient. Skip if found.
3. **Edge Function `weekly-report-reminder`**: runs the above, sends via the
   shared `_shared/msg91.ts` helper, logs each send to `notification_log`
   with `week_of` set (add this column if not already part of the shared
   log shape from spec 03).
4. **Schedule**: `pg_cron` job calling the Edge Function every Saturday at a
   fixed time (e.g. 9:00 AM IST — confirm timezone with the human before
   finalizing; Supabase cron runs in UTC by default).
5. **Failure handling**: if the Edge Function errors for one teacher, it must
   continue attempting the rest (don't let one bad number abort the whole
   run) and log each outcome individually.

## Verification checklist
- [ ] Manually invoking the Edge Function sends reminders only to teachers
      who genuinely haven't submitted this week's report.
- [ ] Running it twice in the same day does not send duplicate reminders
      (verify via `notification_log` row count staying the same on the
      second run).
- [ ] `pg_cron` job is registered and its schedule is confirmed in the
      correct timezone.
- [ ] A teacher who submits their report *after* already being reminded is
      not reminded again that same week.
- [ ] `progress-tracker.md` updated with the cron schedule, timezone
      decision, and the DLT-approved reminder template text.
