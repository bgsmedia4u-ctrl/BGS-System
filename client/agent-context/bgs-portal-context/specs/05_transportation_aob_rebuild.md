# Spec 05 — Transportation & AOB/Alumni Rebuild (Phase 6)

## Goal
Rebuild the Transportation and AOB/Alumni modules natively on Supabase,
replacing what was removed with the legacy Express/SQLite/JSON stack. This
spec is intentionally last — do not start it before specs 01–04 are done,
since it should be built on the consolidated schema and (ideally) the new
identity model.

## Status
Not scoped in detail yet. This file is a placeholder so the module isn't
built ad hoc "because it seemed needed" — per `ai-workflow-rule.md`, don't
build ahead of an approved spec.

## Before detailing this spec, confirm with the human
- What data actually needs to survive from the old Transportation/AOB
  screens, if anything (the legacy engines were already deleted — is there an
  export/backup somewhere, or is this a clean rebuild?).
- Whether Transportation needs real-time bus location (adds a real-time sync
  requirement not otherwise in this stack) or just route/schedule management.
- Scope of AOB/Alumni: is it alumni contact records only, or does it need its
  own portal/login for alumni users (a new user role)?

## Placeholder scope (revise once the above is answered)
- `public.routes`, `public.buses`, `public.route_stops` (or similar) with RLS
- `public.alumni` with RLS, decide if alumni get Supabase Auth accounts or if
  this is admin-only record-keeping
- New Admin Portal screens for both, following `ui-context.md` conventions
- New Teacher Portal screens only if teachers have a role in either module
  (e.g. reporting a bus issue) — confirm with human first

## Verification checklist (placeholder — finalize once scoped)
- [ ] RLS confirmed on all new tables before any UI ships
- [ ] No dependency on the deleted Express/SQLite code
- [ ] `progress-tracker.md` updated once this spec is actually detailed and started
