# Spec 03 — Admin → Teacher Notification (MSG91 SMS)

> Supersedes the earlier Gmail-based version of this spec. See
> `architecture-context.md` → "Notification architecture — MSG91" and
> `progress-tracker.md` for the 2026-07-25 decision to drop Gmail.

## Goal
Let an admin send a pre-approved, template-based SMS notification to one or
more teachers from the Admin Portal.

## Design decisions (reference `architecture-context.md`, don't restate)
- MSG91 SMS API, called server-side only, via the shared
  `supabase/functions/_shared/msg91.ts` helper.
- **No freeform text box.** Admin picks a DLT-approved template from
  `public.notification_templates` and fills in its variables. This is a
  compliance requirement, not a design preference — see the DLT note in
  `architecture-context.md`.
- Every send logged to `public.notification_log`.

## Scope — files/folders this spec may touch
- `supabase/functions/notify-teacher/`
- `supabase/functions/_shared/msg91.ts` (create if it doesn't exist yet —
  shared with specs 04 and 06)
- `database/migrations/<timestamp>_add_notification_templates_and_log.sql`
  (new tables, RLS, additive only)
- `src/data/notifications.js` (new data-access functions only)
- `src/features/admin-portal/NotifyTeacher/` (new component, reuses form
  pattern per `ui-context.md`)
- Do not touch teacher-side code, attendance, marks, or any existing table.

## Implementation steps
1. **MSG91 + DLT setup (human step — do not attempt to automate):** MSG91
   account, registered Sender ID, Principal Entity ID, and at least one
   DLT-approved template for teacher notifications (e.g. `Dear {#var#},
   {#var#}. - BGS PU College, Sidlaghatta.`). Store the resulting Auth Key in
   Supabase project secrets. Record the approved `template_id` and its exact
   variable order in `progress-tracker.md` — the agent cannot invent this,
   it comes from the DLT approval.
2. **`notification_templates` table**: `id, template_id (MSG91's), name,
   channel, body_preview, variable_count, created_at`. Seed it with the one
   approved template from step 1 (via a migration, not hardcoded in app code).
3. **`notification_log` table + RLS** (shared shape, see
   `architecture-context.md`): admins can insert/select their own org's rows;
   teachers have no access.
4. **`supabase/functions/_shared/msg91.ts`**: thin wrapper around MSG91's
   send API — `sendSms({ templateId, recipients, variables })` — used by this
   spec and by specs 04/06.
5. **Edge Function `notify-teacher`**: validates caller is an authenticated
   admin, validates recipients against known teacher phone numbers (from the
   personnel registry — don't allow arbitrary numbers), calls the shared
   MSG91 helper, writes a `notification_log` row per recipient with the
   result, returns `{ success, results[] }`.
6. **Frontend UI**: template picker (reads `notification_templates`),
   recipient picker (multi-select from teacher registry), variable fill-in
   fields generated from the chosen template, send button, success/error
   feedback, and a simple sent-history view reading from `notification_log`.
7. **Data-access functions** in `src/data/notifications.js`:
   `getNotificationTemplates()`, `notifyTeachers({ templateId, recipients,
   variables })`, `getNotificationLog()`. Components call these, never the
   Edge Function URL directly.

## Verification checklist
- [ ] Non-admin users cannot call the Edge Function successfully (test with a
      teacher session — expect 403).
- [ ] Sending to a valid teacher phone number results in a real SMS delivery
      (verify during testing) and a matching `notification_log` row with
      `status = 'sent'` and the correct `provider_message_id`.
- [ ] An MSG91 API failure (e.g. bad number) results in `status = 'failed'`
      with an `error_message`, and the UI shows a clear error — no silent
      failure.
- [ ] Attempting to send with a `template_id` not present in
      `notification_templates` is rejected before calling MSG91.
- [ ] No MSG91 credentials appear anywhere in committed code or the client
      bundle.
- [ ] `progress-tracker.md` updated, including the manual MSG91/DLT setup
      steps performed and the exact approved template text + variable order.
