# Progress Tracker — Unified Education Institution Management Platform

**How to use this file:** update the status column as modules move through the loop defined in
`ai-workflow.md`. This is the honest source of truth for "what's actually built" — if it disagrees with
what a codebase looks like, the codebase is right and this file needs fixing, not the reverse.

**Status key:** `Not Started` · `In Progress` · `Partial (needs migration)` · `Done`

---

## Currently Active

> Fill this in as work starts — keep it to 1–3 items so it stays meaningful.

- [ ] —

---

## Phase 1 — Foundation

| Item | Status | Notes |
|---|---|---|
| Authentication (Supabase Auth, JWT/SSO) | Done | Already live across all three current services |
| Central `Person` entity | Done | Data model established via schema_updates_v5_foundation.sql |
| Organizations / Institutions hierarchy | Done | Data model established via schema_updates_v5_foundation.sql |
| Full role set (Super Admin → Alumni) | Done | Data model established via schema_updates_v5_foundation.sql |
| Roles/Permissions/Scopes (RBAC tables) | Done | Data model established via schema_updates_v5_foundation.sql |

## Phase 2 — Student Management

| Item | Status | Notes |
|---|---|---|
| Admissions | Not Started | |
| Student profiles | Not Started | |
| Classes / Sections | Partial | Class/section structure exists implicitly in Mark Entry module (Science/Commerce streams, Class A/B, FTB-1/2) but not as a standalone module |
| Documents | Not Started | |

## Phase 3 — Staff Management

| Item | Status | Notes |
|---|---|---|
| Employee management | Not Started | |

## Phase 4 — Academic System

| Item | Status | Notes |
|---|---|---|
| Subjects / Departments / Courses | Partial | Exists implicitly per stream in Mark Entry module |
| Teachers module | Partial | Teacher Weekly Task Portal exists as a separate build (React/Node/MySQL, Google OAuth) — not yet unified into this platform |
| Timetable | Not Started | |
| Student attendance | Done (core) | Live in current Supabase-backed core |
| Marks / Results entry | Done | Mark Entry module: create test, enter marks per student, print results sorted by total, scoped by stream/year/class |
| Reports | Done | Multi-test PDF performance reports (JEE/NEET/PCMB CET/PCMCs CET), navy/gold styling, tier segmentation |
| Syllabus tracking | Done (core) | Live in current Supabase-backed core |
| Meetings | Done (core) | Live in current Supabase-backed core |

## Phase 5 — Finance

| Item | Status | Notes |
|---|---|---|
| Fee structures | Not Started | |
| Payments / Receipts | Not Started | |
| Pending fees tracking | Not Started | |
| Reports | Not Started | |

## Phase 6 — Transportation

| Item | Status | Notes |
|---|---|---|
| Vehicles / Routes / Stops (backend) | Done | Live Node/Express service, currently JSON-file storage |
| Driver assignments | Done | Part of the live transportation service |
| Fee tracking (transport) | Partial | Originally spec'd against Google Sheets — needs reconciling with the platform's unified Finance module |
| Driver mobile app (GPS, trip start/stop, emergency) | Not Started | |
| Real-time GPS tracking (parent-facing) | Not Started | |
| Migration to Postgres / monolith | Not Started | Trigger: start of driver-app work, per architecture.md §6 |

## Phase 7 — Communication

| Item | Status | Notes |
|---|---|---|
| Email / SMS / WhatsApp / Push orchestration | Not Started | |
| In-app notifications | Not Started | |
| Announcements | Not Started | |

## Phase 8 — Alumni

| Item | Status | Notes |
|---|---|---|
| Alumni registry (backend) | Done | Live Node/Express service, SQLite storage |
| Audit logs | Done | Structured audit prompt produced for this service |
| Alumni Data Management Dashboard | Partial | PRD created (RBAC, analytics, PDF export) — build status unconfirmed |
| Events / Donations / Job opportunities | Not Started | |
| Migration to Postgres / monolith | Not Started | Trigger: resumption of alumni work, per architecture.md §6 |

---

## Cross-Cutting (not phase-bound)

| Item | Status | Notes |
|---|---|---|
| Institutional design system (maroon/cream, unified UI) | Done | Established via Canva work and implemented globally across the platform. |
| Admin Dashboard Redesign | Done | Rebuilt with rich metrics, recharts, and the new institutional aesthetic. |
| School website (multi-page, School/PU College switcher) | Done | Existing HTML artifact — candidate for absorption into the public-facing side of the platform later |
| Decentralized campus administration design | Done (design only) | PDF formalized for management — not yet implemented as software |

---

## Legend for "Done" entries above

"Done" means the feature works in a currently deployed system — **not** that it already meets the target
architecture (multi-tenant, RBAC-driven, Postgres-backed). Anything marked `Partial` or `Done` on a
non-monolith service still has a migration step pending per `architecture.md` §6 before it's fully "done"
against the target state.