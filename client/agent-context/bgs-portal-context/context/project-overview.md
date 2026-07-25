# Project Overview — BGS Teachers & Administration Portal

## What this is
A web-based educational management platform for schools, PU colleges, and degree
colleges under the BGS group. It replaces separate departmental tools with one
unified system: institutional administration, academic management, teacher
workflows, and student records, all under one visual interface and one shared
database (Supabase/PostgreSQL).

## Non-negotiable constraint
**All existing data — teachers' reports, student records, marks, attendance,
meeting logs, leave applications — must be preserved exactly as-is.** No spec,
migration, or refactor in this project is allowed to delete, truncate, or
silently transform rows in a way that loses information. Every schema change
that touches existing tables must ship with:
1. A backup/export step performed first.
2. A migration that is additive or explicitly reversible.
3. A verification query proving row counts and key values match before/after.

If an agent is ever unsure whether a change is destructive, it must stop and
ask a human before running it — this rule overrides "just get it done."

## Core user flows

### Teacher Portal (faculty operations)
- Dashboard & personal task overview
- Attendance tracking (session-based, per assigned class)
- Marks entry & analytics (Science/Commerce streams; JEE, NEET, CET)
- Syllabus tracker & timetable viewing
- Weekly Report Builder (submits structured reports to administration)
- Teacher meeting logs & leave applications

### Admin Portal (institutional governance)
- Campus monitoring & analytics (tasks, report submissions, attendance)
- Personnel & student registry management
- Academic configuration & timetable control
- PDF export & institutional report generation
- Announcements engine (platform-wide notifications)

### New in this phase: MSG91 notifications (SMS)
Gmail was the original idea for this phase but has been dropped — every
notification below is sent as SMS via MSG91 instead (see
`architecture-context.md` for why, and the DLT compliance constraint that
comes with it).
- **Admin → Teacher notification:** an admin sends a pre-approved,
  template-based SMS to one or more teachers from the Admin Portal (not
  freeform text — see the DLT note in `architecture-context.md`).
- **Automated Saturday reminder:** every Saturday, teachers who have not yet
  submitted their Weekly Report receive an automatic SMS reminder.
- **Absent-student parent alert** (captured directly from the principal's
  written requirements, 2026-07-25): when a student is marked absent, an SMS
  is automatically sent to that student's parent contact number, e.g.
  *"[Student Name] is absent today. – BGS PU College, Sidlaghatta."*

## Requirements captured from principal/admin, 2026-07-25 (handwritten notes)
Transcribed here for traceability. Items already covered by an existing
feature above are marked so; new items get their own spec rather than being
folded silently into an existing one.

- Dashboard: total staff, PU section (Science/Commerce) breakdown, today's
  attendance, meetings, leave approval — **already covered**, Admin Portal
  "Campus Monitoring & Analytics" + "Personnel & Student Management."
- Teachers: all reports (app + database) — **already covered**, Weekly Report
  Builder. Schedule meeting (app + notification) — partially new, tracked as
  `specs/07_meeting_scheduling_notification.md`. Syllabus completion —
  **already covered**, Syllabus Tracker.
- Students: attendance today (stream & class wise), test/marks per student,
  PDF download report — **already covered**. Data analysis: irregular
  student list, stream-wise toppers — new, tracked as
  `specs/08_student_analytics_dashboard.md`. (Toppers in CET/NEET specifically
  was crossed out in the original notes — not in scope.) Parents' contact
  number — **already covered** as a registry field, and is what the new
  absence-SMS feature (below) sends to.
- **Absent-student parent SMS** (separate note, same date): "the system needs
  to send SMS to the student's parent number saying '[Name] is absent
  today'" — new, tracked as `specs/06_absent_student_sms_msg91.md`.

## Explicitly out of scope (for now)
- Transportation module (bus tracking, routes) — rebuild is Phase 6, tracked
  separately in `specs/05_transportation_aob_rebuild.md`. Do not build ahead of spec.
- AOB / Alumni module — same, Phase 6.
- Any new legacy Express/SQLite/JSON server. The stack is Supabase-only; do not
  reintroduce a separate backend server for any reason, including "just for email."
- Multi-tenant support for schools outside the BGS group.
- Mobile native app (the SPA must be responsive, but no native build in this phase).

## Users
- **Teacher** — faculty at a school/PU college/degree college.
- **Admin** — institutional administrator with organization-wide visibility.
- Roles are enforced by Supabase Row-Level Security (RLS), not by frontend
  checks alone. Frontend role checks are UX only, never the security boundary.
