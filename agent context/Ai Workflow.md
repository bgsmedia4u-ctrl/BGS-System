# AI Workflow — Unified Education Institution Management Platform

**Purpose:** define how AI coding agents (Antigravity, Claude Code, or any other agent brought in later)
get used to build this platform, so that different sessions and different tools stay consistent instead
of each one re-deriving the architecture from scratch — or worse, quietly drifting from it.

**Companion docs:** `architecture.md` (the contract every module has to fit), `progress-tracker.md`
(what's actually been built).

---

## 1. Guiding Doctrine

Carried over directly from the product spec, because it's correct and easy to lose under deadline
pressure:

1. **Architecture before code.** No module gets implemented until it's checked against `architecture.md`.
   If a module needs something the architecture doesn't cover, the architecture gets updated *first*
   (with a Decision Log entry), then the module gets built.
2. **One module at a time.** Resist the urge to have an agent scaffold three modules in one session — it
   produces plausible-looking code that's hard to review and easy to approve without really checking.
3. **No hardcoded permissions.** Every access check goes through the Role → Permission chain. If an agent
   proposes an `if (user.role === 'admin')` check inline in a component, that's a review rejection.
4. **Trade-offs get written down, not just decided.** If an agent's proposed approach has long-term
   consequences, it states them before implementing — and they land in `architecture.md`'s Decision Log.

---

## 2. Standard Loop, Per Module

```text
1. PROPOSE   — Agent reads architecture.md + progress-tracker.md, proposes an implementation plan for
               ONE module (schema, API surface, UI, and how it plugs into RBAC/events).
2. REVIEW    — You review the plan against architecture.md. Approve, or send back with corrections.
3. IMPLEMENT — Agent builds against the approved plan only. No silent scope expansion.
4. VERIFY    — Manual check: does it respect RLS/tenant scoping? Does it use the Role→Permission chain?
               Does it emit/consume events correctly rather than reaching into another module directly?
5. DOCUMENT  — Any architectural delta gets added to architecture.md's Decision Log.
6. TRACK     — progress-tracker.md status updated for that module (Not Started → In Progress → Done).
```

Skipping step 1 (jumping straight to code) is the single most common way this kind of project drifts from
its own architecture — it's worth the friction.

---

## 3. Tooling Split

Different tools are good at different parts of this loop; use them accordingly rather than defaulting to
whichever is open:

| Task | Preferred tool | Why |
|---|---|---|
| Module scaffolding, boilerplate CRUD, agentic multi-file generation | Antigravity | Already the working pattern for this project's other tools (transportation spec, alumni dashboard, mark entry module) |
| Architecture review, migration planning, cross-module reasoning, documentation | Claude (chat or Claude Code) | Better at holding the whole system in view and catching architecture violations before they're built |
| Spreadsheet/report-style outputs (analytics, mark sheets) | Claude | Already the established pattern for BGS PU College reporting |
| Design/UI generation | Claude Design / Antigravity, driven by `ui-ux-design-prompt.md` | Keeps visual language consistent across tools instead of re-deciding it each time |

---

## 4. Session Handoff

AI agents don't retain project state between sessions by default. Every new session, for any agent, should
start by pointing it at:

1. `architecture.md` — what the system is supposed to look like, and why.
2. `progress-tracker.md` — what's actually done, so the agent doesn't propose rebuilding something that
   already exists (e.g. the Transportation or AOB services).
3. The specific module's prior plan/PR, if resuming in-progress work.

A session that skips this and works from memory or assumption is exactly how the hybrid architecture in
§6 of `architecture.md` quietly turns into an untracked mess.

---

## 5. Prompt Templates

Reusable starting points — fill in the bracketed parts per module.

### 5.1 New module scaffold

```
Act as a software architect working within an existing modular monolith.

Context: read architecture.md and progress-tracker.md in this project before proposing anything.

Task: design and scaffold the [MODULE NAME] module.

Constraints:
- Must fit the module map and data architecture already defined in architecture.md.
- Must use the existing Role → Permission chain for all access control — no hardcoded role checks.
- Must be tenant-scoped (institution_id) per the multi-tenant model.
- If this module needs an architectural decision not already covered, STOP and state the trade-offs
  before writing code.

Deliverable: implementation plan first (schema, API surface, UI screens, events emitted/consumed).
Wait for approval before implementing.
```

### 5.2 Migration (Strangler Fig step)

```
Context: [SERVICE NAME] currently runs as a standalone service with [JSON file / SQLite] storage,
per the "Current State" section of architecture.md. It is being folded into the modular monolith
per the Migration Strategy table.

Task: propose a migration plan that moves its data model into PostgreSQL under the existing
multi-tenant schema, with zero downtime for the live service during the transition.

Deliverable: migration plan (schema mapping, cutover approach, rollback plan) before any code.
```

### 5.3 Architecture audit

```
Act as a reviewer. Read architecture.md, progress-tracker.md, and the code for [MODULE NAME].

Check specifically for:
- Hardcoded permission checks that bypass the Role → Permission chain
- Missing institution_id scoping (tenant leakage risk)
- Direct cross-module calls that should instead go through the event mechanism
- Any divergence from what architecture.md says this module should look like

Report findings; do not fix silently — flag each one with severity and a suggested fix.
```

---

## 6. Documentation Contract

These three files are treated as a set, not independent documents:

- A module isn't "done" until `progress-tracker.md` says so.
- An architectural decision isn't real until it's in `architecture.md`'s Decision Log.
- This file (`ai-workflow.md`) only changes when the *process* changes — not per module.

If any of the three drifts out of sync with the actual codebase, fixing that drift is itself the next
task, ahead of new feature work.