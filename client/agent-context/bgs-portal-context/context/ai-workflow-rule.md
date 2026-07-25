# AI Workflow Rules — BGS Teachers & Administration Portal

These rules govern how any AI coding agent (Antigravity, Claude Code, or
otherwise) works in this repository. They apply in every session, regardless
of what the human asks for mid-task, unless the human explicitly overrides a
rule in writing for that one instance.

## 1. Read before you write
At the start of every session/task, read, in this order:
1. `context/project-overview.md`
2. `context/architecture-context.md`
3. `context/code-standards.md`
4. `context/progress-tracker.md` (to know what's already done and in-flight)
5. The one numbered spec file you were asked to implement

Do not start writing code before reading all five.

## 2. One scoped spec at a time
Implement exactly the spec you were given — nothing more, nothing less.
If you notice an unrelated bug or improvement while working, **do not fix it
inline.** Note it in `progress-tracker.md` under "Observed but out of scope"
and keep going. Scope creep is the #1 way this project turns back into a mess.

## 3. Data preservation is a hard stop, not a judgment call
Before any migration or script that touches an existing table:
- State explicitly, in your own output, which tables/rows are affected.
- Confirm there is a backup/export step in the same spec.
- If the spec doesn't include one, **stop and ask**, don't improvise a backup
  yourself and don't proceed without one.
This applies even if the change "should" be safe (e.g. adding a nullable
column). When in doubt, treat it as destructive.

## 4. Update the progress tracker every session
Before starting: add an entry to `context/progress-tracker.md` stating what
you're about to do and which spec it's from.
After finishing: update that entry with the outcome, any architectural
decisions made along the way (with a one-line rationale), and whether the
spec's verification checklist passed.
A brand-new agent session with no memory of this conversation must be able to
read `progress-tracker.md` alone and know exactly where things stand.

## 5. Don't touch files outside the current spec's stated scope
Each spec should list which files/folders it expects to touch. If a task
needs a file outside that list, either the spec is under-scoped (flag it and
ask) or you're drifting (stop).

## 6. Verification before "done"
Every spec ends with a checklist. Run it — literally, not "I believe this
would pass" — before marking anything complete in the progress tracker. For
database changes this includes a row-count / spot-check comparison against
the pre-migration backup.

## 7. Credentials and secrets
Never hardcode the MSG91 Auth Key, Supabase service-role key, or any other
secret in a committed file. These live in environment variables / Supabase
project secrets only. If a task seems to require a secret to be pasted into
code, stop and ask the human how it should be supplied instead.

## 9. DLT template constraint (India SMS compliance)
Any spec involving SMS (specs 03, 04, 06, and any future notification spec)
is bound by India's DLT regulation: only pre-approved, registered templates
can be sent, with named variables — never freeform text composed at
send-time. If a spec seems to imply freeform SMS, that's a sign the spec
needs a template-based redesign before implementation, not a workaround.
Registering a new template with MSG91/DLT is a manual human step the agent
cannot perform — flag it explicitly and wait rather than guessing a
`template_id`.

## 8. When a spec conflicts with these rules or with architecture-context.md
The context files win. Flag the conflict to the human rather than silently
picking one side.
