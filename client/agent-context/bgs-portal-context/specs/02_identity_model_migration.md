# Spec 02 — Identity Model Migration (`profiles` → `persons`/`employees`/`students`)

## Goal
Move from the legacy `public.profiles` table to the target Central Person
Model (`public.persons`, `public.employees`, `public.students`) **without
losing or corrupting a single existing record.** This spec is additive and
reversible until a final, explicitly human-approved cutover step.

## Prerequisites
- Spec 01 complete (`master_schema.sql` reflects live reality).
- A full backup/export of `public.profiles` and every table with a foreign
  key into it, taken immediately before step 1 below.

## Scope
- New tables: `public.persons`, `public.employees`, `public.students`, plus
  any join/reference tables the target blueprint in `agent context/` specifies.
- New RLS policies for all new tables.
- A **dual-write compatibility view or function** so existing application
  code keeps working during the transition (see step 3).
- Do **not** drop `public.profiles` or any existing table in this spec — that
  is a separate, later, explicitly human-approved cutover spec.

## Implementation steps
1. **Backup.** Export `profiles` and all FK-dependent tables to a timestamped
   snapshot (e.g. `pg_dump` of just those tables, or a Supabase point-in-time
   restore checkpoint). Record the row counts in `progress-tracker.md`.
2. **Create new tables** per the target blueprint in `agent context/`, with
   RLS policies in the same migration file (per `code-standards.md`).
3. **Backfill.** Write a one-time, idempotent migration that populates
   `persons`/`employees`/`students` from existing `profiles` data. Idempotent
   means: running it twice does not create duplicates (use `ON CONFLICT` /
   `WHERE NOT EXISTS` keyed on a stable identifier like `auth.users.id`).
4. **Verification query.** For every row in `profiles`, confirm exactly one
   corresponding row exists in `persons` (and in `employees` or `students` as
   appropriate) with matching key fields. Log the comparison in
   `progress-tracker.md` — counts must match exactly.
5. **Compatibility layer.** Update the `src/data/` access layer (per
   `architecture-context.md` rule 6) to read from the new tables, while
   `profiles` remains untouched and in sync (via trigger or dual-write) so
   nothing breaks if a rollback is needed.
6. **Do not delete `profiles` in this spec.** Mark it "deprecated, read-only
   fallback" in `master_schema.sql` comments. Deletion is a future, separately
   approved spec, only after a full production soak period.

## Verification checklist
- [ ] Backup taken and row counts recorded before any write.
- [ ] New tables + RLS policies created, matching the target blueprint.
- [ ] Backfill is idempotent (re-running it produces zero new/changed rows).
- [ ] Row-count and spot-check comparison between `profiles` and new tables
      passes exactly — no missing or duplicated people.
- [ ] All existing Teacher Portal and Admin Portal flows tested against the
      new data-access layer with no regressions (attendance, marks, weekly
      reports, leave applications, personnel/student registries).
- [ ] `profiles` table still exists, untouched, as fallback.
- [ ] `progress-tracker.md` updated with backfill counts and any anomalies
      found (e.g. orphaned profiles with no matching auth user).
