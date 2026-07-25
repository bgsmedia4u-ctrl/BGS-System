# Architecture Context — BGS Teachers & Administration Portal

## Stack (do not deviate without updating this file first)
- **Frontend:** React + Vite SPA, Vanilla CSS, institutional Navy & Gold design
  system. Single "Unified Shell" — one app, role-based navigation, not separate
  sites per role.
- **Backend & Auth:** Supabase only (managed PostgreSQL + Supabase Auth). No
  separate Express/Node backend. No SQLite, no local JSON stores.
- **Security model:** PostgreSQL Row-Level Security (RLS) is the actual
  authorization boundary. Every table holding teacher, student, or personnel
  data must have RLS policies before it ships — "add RLS later" is not
  acceptable for anything touching real people's data.
- **Auth flow:** Google OAuth or email sign-up via Supabase Auth. New staff
  transition immediately to an "approved" state — there is intentionally no
  admin approval gate. Do not reintroduce one without an explicit spec.

## Hard rules the codebase must never break
1. **No parallel backend.** Every server-side need (emailing, scheduled jobs,
   PDF generation) goes through a Supabase Edge Function or a PostgreSQL
   scheduled job (`pg_cron`), never a standalone Node/Express service.
2. **RLS is mandatory, not optional**, on every table containing personal,
   academic, or attendance data.
3. **One schema source of truth.** After the SQL consolidation (spec 01),
   `database/master_schema.sql` is the only file an agent may treat as "what
   the database looks like." Individual migration files are historical, not
   authoritative.
4. **Migrations are additive by default.** Dropping or renaming a column/table
   that already holds data requires an explicit human sign-off step in the
   spec, plus a backup step beforehand (see project-overview.md).
5. **Identity model transition is managed, not incremental drift.** The app
   is mid-migration between `public.profiles` (legacy) and the target
   `public.persons` / `public.employees` / `public.students` model. No new
   feature may read/write `profiles` directly once spec 02 lands; new features
   built before spec 02 lands must go through a single data-access function
   (see below) so the underlying table can be swapped without touching every
   feature's code.
6. **No feature reads or writes tables directly from component code.** All
   data access goes through a thin `src/data/` (or `src/services/`) layer.
   This is what makes the profiles → persons migration a one-file change
   instead of a find-and-replace across the whole frontend.

## Notification architecture — MSG91 (all channels, decided 2026-07-25)
**Decision: Gmail/Gmail API is no longer used anywhere in this project.**
Every server-side notification — admin → teacher messages, the Saturday
weekly-report reminder, and the absent-student parent alert — goes through a
single MSG91 integration. This replaces the earlier Gmail-based design in
specs 03 and 04 (see `progress-tracker.md` for the decision record).

**Why one integration for everything:** one provider, one credential to
secure, one `notification_log` table, one Edge Function pattern to maintain,
instead of parallel Gmail + SMS systems. If a future spec needs a channel
MSG91 doesn't cover well, add it as a new channel behind the same internal
service rather than reintroducing a second provider ad hoc.

### Default channel: SMS
MSG91's SMS API is the default channel for all three notification use cases
(teacher notifications, weekly reminders, parent absence alerts) — SMS is
more reliably read by parents/teachers in this context than email, and it's
what the principal explicitly asked for on the absence alert.

### Hard compliance constraint: DLT (India TRAI regulation)
**This is not optional and cannot be worked around with clever engineering.**
Under Indian telecom regulation, every SMS template sent to a real phone
number must be a pre-approved, DLT-registered template tied to a registered
Principal Entity ID and Sender ID in MSG91. Consequences for this codebase:
- **There is no free-text "admin types anything and it sends" SMS feature.**
  Spec 03 must be built around a small set of pre-approved templates with
  named variables (e.g. `Dear {#var#}, {#var#} is absent today. - BGS PU
  College, Sidlaghatta.`), not an open compose box. The admin UI picks a
  template and fills in the variables.
- New templates require the human to register them with MSG91/the telecom
  DLT platform *before* the corresponding spec can be verified end-to-end —
  this is a manual step the agent cannot automate. Flag it clearly in the
  spec's implementation steps and in `progress-tracker.md`.
- Store each approved `template_id` (as issued by MSG91 after DLT approval)
  in a small `public.notification_templates` table, never hardcoded inline,
  so new templates can be added without a code change.

### Shared building blocks
- **Credentials**: MSG91 Auth Key stored in Supabase project secrets only,
  never in committed code or the client bundle. All sends happen from Edge
  Functions, never the browser.
- **`public.notification_log`** (replaces the earlier `email_log` concept):
  `id, channel ('sms'), template_id, recipient_phone, variables, status,
  provider_message_id, error_message, sent_by, created_at`. Every send —
  admin-triggered or automated — is logged here for audit, and it's what
  makes the weekly-reminder idempotency check possible (spec 04).
- **One shared Edge Function helper** (e.g. `supabase/functions/_shared/msg91.ts`)
  that wraps the MSG91 API call, used by every notification-sending Edge
  Function (spec 03, spec 04, spec 06) instead of each spec reimplementing
  the HTTP call.

Do not introduce Gmail, a transactional email provider (Resend, SendGrid), or
any second SMS/notification provider unless a future spec explicitly revises
this decision.

## Known technical debt (context for agents, not permission to "fix silently")
- 20+ scattered root-level `.sql` files with no single source of truth —
  addressed in spec 01.
- Legacy `public.profiles` table with RLS workarounds bolted on over time —
  addressed in spec 02.
- Transportation and AOB/Alumni modules were removed with the legacy
  Express/SQLite stack and have no Supabase-native replacement yet —
  addressed in spec 05 (Phase 6), not before.
