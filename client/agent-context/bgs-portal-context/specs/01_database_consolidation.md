# Spec 01 — SQL Sprawl Consolidation

## Goal
Turn 20+ scattered root-level `.sql` files into a single source of truth,
**without changing the live database at all in this spec.** This is a
documentation/organization pass, not a migration.

## Scope — files/folders this spec may touch
- Create `database/migrations/`, `database/seeds/`, `database/master_schema.sql`
- Move (not delete) existing root `.sql` files into `database/migrations/` or
  `database/seeds/` based on content (schema vs mock data)
- Read-only connection to the live Supabase project to introspect current
  actual schema (via `information_schema` / `pg_dump --schema-only` if
  available, or Supabase CLI `supabase db dump`)
- Do **not** touch application code, RLS policies, or any data in this spec.

## Implementation steps
1. Inventory every root `.sql` file. For each, note: what it creates/alters,
   whether it was superseded by a later file (e.g. `schema_updates_v3.sql`
   superseding `v2`), and whether it's a one-off patch (`fix_profiles.sql`) or
   a seed (`seed_commerce_1a.sql`).
2. Connect to the live database (read-only) and dump the **actual current
   schema** — this is ground truth, not the files. The files may be stale or
   contradictory; the live schema is not.
3. Generate `database/master_schema.sql`: the actual current schema, organized
   by domain (auth/profiles, attendance, marks, meetings, leave, announcements),
   with comments noting which legacy file(s) originally introduced each table.
4. Move all historical files into `database/migrations/` (schema-affecting)
   or `database/seeds/` (mock data), renamed with a timestamp prefix reflecting
   best-guess chronological order. Do not edit their contents — they're
   historical record, not live code.
5. Add a top-of-repo `database/README.md` explaining: `master_schema.sql` is
   the only file to trust for "what does the DB look like today," everything
   in `migrations/` is historical/applied, new changes get new timestamped
   files going forward.
6. Update `context/architecture-context.md` if the actual schema reveals
   anything that contradicts what's currently documented there — flag it in
   `progress-tracker.md` rather than silently editing architecture decisions.

## Verification checklist
- [ ] `database/master_schema.sql` exists and, when diffed conceptually
      against a fresh `supabase db dump`, matches the live schema exactly
      (same tables, columns, constraints, RLS policies).
- [ ] No root-level `.sql` files remain outside `database/`.
- [ ] No `DROP`, `DELETE`, `TRUNCATE`, or `ALTER` statement was executed
      against the live database as part of this spec — it's read-only.
- [ ] `database/README.md` exists and is accurate.
- [ ] `progress-tracker.md` updated with the file inventory and any schema
      surprises found during introspection.
