# Code Standards — BGS Teachers & Administration Portal

## General
- React function components with hooks only. No class components.
- Vanilla CSS, following the existing Navy & Gold design tokens (see
  `ui-context.md` if present) — no introducing Tailwind, styled-components, or
  another CSS system into an existing codebase without an explicit spec.
- File naming: `PascalCase` for components (`WeeklyReportBuilder.jsx`),
  `camelCase` for functions/hooks/utilities, `kebab-case` for non-component
  files (`notify-teacher` Edge Function).

## Folder structure (target)
```text
src/
  components/        # shared, dumb/presentational components
  features/
    teacher-portal/
    admin-portal/
  data/               # ALL Supabase queries live here — see architecture rule 6
  hooks/
  routes/
  styles/
supabase/
  functions/
    _shared/msg91.ts  # shared MSG91 API wrapper, used by every notification function
    notify-teacher/           # spec 03
    weekly-report-reminder/   # spec 04
    notify-absent-student/    # spec 06
database/
  migrations/         # timestamped, one change per file, never edited after merge
  seeds/
  master_schema.sql    # single source of truth, regenerated after each migration
context/               # the six files this system depends on
specs/                 # numbered, scoped feature specs
```

## Data access layer
- Every Supabase query (select/insert/update/rpc) is a named function in
  `src/data/`, e.g. `getWeeklyReportsForTeacher(teacherId)`,
  `submitLeaveApplication(payload)`. Components never call `supabase.from(...)`
  directly.
- Data-layer functions return typed shapes (JSDoc or TypeScript types), not
  raw Supabase response objects, so a table rename (e.g. `profiles` →
  `persons`) is a one-file change.

## Error handling
- Every data-layer function must catch and normalize Supabase errors into
  `{ data, error }` — never let a raw PostgREST error reach a component.
- User-facing errors are plain language ("Couldn't submit your report — try
  again"), not raw error codes. Raw errors go to `console.error` /
  logging only.
- Edge Functions return structured JSON errors with an HTTP status and a
  `code` field (e.g. `403 { code: "not_admin" }`), never a bare stack trace.

## Database / SQL conventions
- One migration file per logical change, name format:
  `YYYYMMDDHHmm_short_description.sql` (e.g. `202601251030_add_email_log_table.sql`).
- Every migration that touches an existing table with data starts with a
  commented verification block showing the row count before the change.
- RLS policies live in the same migration file as the table they protect —
  never ship a table without its policies in the same commit.
- No destructive statement (`DROP TABLE`, `DROP COLUMN`, `TRUNCATE`) is
  allowed in an agent-authored migration without a human-reviewed backup step
  immediately before it in the same file, clearly commented.

## Commits / PR scope
- One feature spec = one PR = one topic. Don't bundle an unrelated fix into a
  feature PR — file it as its own tiny spec or a documented fast-follow in
  `progress-tracker.md` instead.
