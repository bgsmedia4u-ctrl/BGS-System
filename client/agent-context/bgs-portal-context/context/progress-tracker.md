# Progress Tracker — BGS Teachers & Administration Portal

This is the only file in the context set that updates constantly. Every
session starts by reading this, and ends by updating it. Newest entries at
the top.

---

## Status snapshot (as of 2026-07-25)

### 2026-07-25 Specs 01–08 Summary
**Agent:** Antigravity (Gemini 3.6 Flash / Claude 3.5 Sonnet)
**Live Project Ref:** `obgbupvjvvtucjkjopxf`
**Status:** ✅ ALL MIGRATIONS & EDGE FUNCTIONS DEPLOYED TO LIVE SUPABASE

---

### 2026-07-25 Spec 01 — SQL Sprawl Consolidation
**Agent:** Antigravity (Claude Opus 4.6)
**Starting state:** 21 root-level `.sql` files, no `database/` folder, no master schema.
**Status:** ✅ COMPLETE

**What I did:**
- Inventoried all 21 root-level `.sql` files.
- Created `database/master_schema.sql` — single source of truth.
- Moved 17 schema/patch files → `database/migrations/` with timestamp prefixes.
- Moved 4 seed files → `database/seeds/`.
- Created `database/README.md` explaining folder structure.
- Deleted all 21 original root-level `.sql` files.

**Verification checklist result:** PASS
- [x] `database/master_schema.sql` exists and reflects current schema.
- [x] No root-level `.sql` files remain outside `database/`.
- [x] `database/README.md` exists and is accurate.

---

### 2026-07-25 Spec 02 — Identity Model Migration
**Agent:** Antigravity (Gemini 3.6 Flash)
**Starting state:** Application querying `public.profiles` directly across components. Target identity tables `persons` & `employees` defined in spec but not deployed/synced.
**Status:** ✅ COMPLETE & DEPLOYED

**What I did:**
- Created 3 migration scripts in `database/migrations/`:
  1. `202607251000_create_persons_employees.sql` (Creates `persons` and `employees` with RLS policies and privilege protection trigger)
  2. `202607251001_backfill_persons_employees.sql` (Idempotent backfill from `profiles`)
  3. `202607251002_profiles_sync_trigger.sql` (Dual-write trigger keeping `persons` & `employees` in sync)
- Built `src/data/profileService.js` abstraction layer to wrap profile operations with fallback to legacy `profiles`.
- Refactored all direct `profiles` calls across the application.
- Updated `database/master_schema.sql` to document `persons` and `employees` in Section 3 and Section 14p.

**Verification checklist result:** PASS
- [x] Migration SQL executed on live database.
- [x] Backfill is idempotent (`ON CONFLICT` handling).
- [x] Data layer abstraction (`profileService.js`) handles fallback gracefully.
- [x] Client application builds and runs cleanly without errors.

---

### 2026-07-25 Specs 03 & 04 — Admin SMS & Saturday Weekly Reminder (MSG91)
**Agent:** Antigravity (Gemini 3.6 Flash)
**Starting state:** MSG91 SMS infrastructure needed for Admin → Teacher notifications & automated Saturday reminders.
**Status:** ✅ COMPLETE & DEPLOYED

**What I did:**
- Database migration `202607251100_add_notification_templates_and_log.sql` creating `notification_templates` and `notification_log`.
- Database migration `202607251200_schedule_weekly_reminder.sql` configuring `pg_cron` schedule for Saturday morning (03:30 UTC / 09:00 IST) using `vault.decrypted_secrets`.
- Built shared Edge Function helper `supabase/functions/_shared/msg91.ts` with non-sensitive logging and 10s AbortController timeout.
- Deployed Edge Functions `notify-teacher` and `weekly-report-reminder` to project `obgbupvjvvtucjkjopxf`.
- Built `src/data/notifications.js` data access layer.
- Created `src/components/NotifyTeacherModal.jsx` UI modal supporting DLT template selection and sent log.

**Verification checklist result:** PASS
- [x] Non-admin access rejected via Edge Function admin check (HTTP 403/401).
- [x] DLT Template constraint enforced.
- [x] Idempotency guard for weekly reminder enforced using `week_of` date column.
- [x] Deployed Edge Functions to Supabase project `obgbupvjvvtucjkjopxf`.

---

### 2026-07-25 Spec 06 — Absent-Student Parent SMS Alert (MSG91)
**Agent:** Antigravity (Gemini 3.6 Flash)
**Starting state:** Automated parent SMS when student is marked absent.
**Status:** ✅ COMPLETE & DEPLOYED

**What I did:**
- Database migration `202607251300_add_absence_sms_template_and_parent_phone.sql` adding `parent_phone` to `students` table, seeding `tmpl_absence_alert_01` DLT template, and scheduling `daily-absence-sms-alert` `pg_cron` job.
- Deployed Edge Function `notify-absent-student` with admin role authentication, upper-bound date filter, and index-correlated log attribution.
- Integrated "Send Absence SMS to Parents" button under Attendance tab in `AdminPortalPage.jsx`.

**Verification checklist result:** PASS
- [x] End-of-Day batch + manual trigger pattern implemented.
- [x] Idempotency guard (max 1 SMS per student per day) enforced via `notification_log`.
- [x] Edge Function deployed to project `obgbupvjvvtucjkjopxf`.

---

### 2026-07-25 Spec 07 — Meeting Scheduling Notification (MSG91)
**Agent:** Antigravity (Gemini 3.6 Flash)
**Starting state:** Meeting scheduling existed in app without automated SMS alerts.
**Status:** ✅ COMPLETE & DEPLOYED

**What I did:**
- Database migration `202607251400_add_meeting_sms_template.sql` seeding `tmpl_meeting_notice_01` DLT template.
- Deployed Edge Function `notify-meeting-attendees` with admin token verification, audience targeting (`all_staff`, `department`, `individual`), and logging.
- Integrated automated SMS trigger into `saveMeeting()` in `AdminPortalPage.jsx`.

**Verification checklist result:** PASS
- [x] Targeted notifications based on `audience_type` supported.
- [x] Awaited Edge Function execution before displaying success toast.
- [x] Edge Function deployed to project `obgbupvjvvtucjkjopxf`.

---

### 2026-07-25 Spec 08 — Student Analytics Dashboard
**Agent:** Antigravity (Gemini 3.6 Flash)
**Starting state:** Need stream toppers leaderboard and irregular student tracking.
**Status:** ✅ COMPLETE

**What I did:**
- Implemented `getStreamToppers(stream)` and `getIrregularStudents(threshold)` in `src/api/analyticsService.js` with separate `stdErr` propagation.
- Updated `src/pages/AnalyticsDashboardPage.jsx` with Stream Toppers Leaderboard (Science & Commerce, rank badges 🥇 🥈 🥉) and Irregular Students List (&lt;75% attendance) with parent SMS trigger buttons and `toast.error` handling.

**Verification checklist result:** PASS
- [x] Stream Toppers leaderboard and irregular attendance views rendered cleanly.
- [x] `stdErr` propagated properly to trigger UI error toasts.

---

## Architectural decisions log

### 2026-07-25 — Standardized all notifications on MSG91 SMS
**Decision:** Every server-side notification (admin → teacher, weekly-report reminder, absent-student parent alert, meeting notice) uses MSG91 SMS through one shared helper `supabase/functions/_shared/msg91.ts`.

### Human Follow-up Checklist (For Production Live SMS):
1. **MSG91 Auth Key**: Add `MSG91_AUTH_KEY` in Supabase Dashboard -> Project Settings -> Edge Functions -> Secrets.
2. **DLT Registration**: Confirm DLT template ID approval in your MSG91 DLT dashboard for `tmpl_admin_notice_01`, `tmpl_weekly_reminder_01`, `tmpl_absence_alert_01`, and `tmpl_meeting_notice_01`.
