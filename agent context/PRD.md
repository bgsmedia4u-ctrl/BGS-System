# Product Requirements Document (PRD)
**Product Name:** Unified Education Institution Management Platform (BGS Portal)
**Status:** Draft / Living Document
**Companion Docs:** `architecture.md`, `progress-tracker.md`, `Ai Workflow.md`

---

## 1. Executive Summary
The Unified Education Institution Management Platform is a centralized, multi-tenant SaaS application designed to manage the end-to-end operations of educational institutions (Schools, PU Colleges, Degree Colleges). The platform consolidates fragmented systems—including attendance, academics, transportation, fees, and alumni registries—into a single modular monolith. It provides role-based access control (RBAC) and a unified "Person" identity model to ensure data integrity and security across all organizational levels.

## 2. Objectives & Goals
* **Unification:** Eliminate duplicate data entries by adopting a single source of truth for all users (Central Person Model).
* **Multi-Tenancy:** Support multiple institutional tiers (Primary, High School, PU College, Degree College) within a shared PostgreSQL schema using Row-Level Security (RLS).
* **Scalability:** Utilize a modular monolith architecture that integrates specialized microservices (e.g., Transportation, Alumni) transparently into a unified frontend.
* **Modern UX:** Provide a rich, responsive, and intuitive interface with a unified institutional design system (Navy/Gold aesthetic).
* **Role-Based Access:** Enforce strict permission chains where access to data (own, class, institution, organization) is dynamically controlled by a user's role.

## 3. Target Audience & User Personas
The system caters to a diverse set of roles, each requiring customized access scopes:
1. **Super Admin / Org Admin:** Full control over the entire organization or specific institutions; oversees all configurations, users, and audits.
2. **Institution Admin / Principal:** Full read/write access scoped to their specific institution (e.g., PU College).
3. **Office / Accounts Staff:** Manages admissions, document processing, and fee collections.
4. **Teacher:** Manages own classes, enters marks/attendance, tracks syllabus, and schedules meetings.
5. **Driver:** Operates transportation routes via a dedicated mobile app and manages real-time GPS tracking.
6. **Student/Parent:** Views own academic progress, attendance, fee status, and real-time transport routes.
7. **Alumni:** Engages with the institution post-graduation, updates profiles, and accesses job/event opportunities.

## 4. Product Features by Module

### Phase 1: Foundation & Identity (Core)
* **Unified Authentication:** Single Sign-On (SSO) via Supabase JWT across all modules.
* **Central Person Model:** A single `persons` record that can hold multiple profiles (Student/Parent, Employee, Management).
* **RBAC & Multi-Tenancy:** Permissions defined by Role → Scope (Own, Class, Institution, Organization).

### Phase 2: Student Management
* **Admissions & Profiles:** Digital onboarding, document management, and rich student profiles.
* **Class & Section Mapping:** Association of students to specific streams (e.g., Science/Commerce) and class divisions.

### Phase 3: Staff Management
* **Employee Management:** Centralized directory for teaching and non-teaching staff.
* *Note: Biometrics and staff attendance are explicitly excluded from this system.*

### Phase 4: Academic System
* **Mark Entry & Analytics:** Ability to create tests, enter marks per student, and generate multi-test PDF reports (JEE, NEET, PCMB/PCMCs CET) with tier segmentation.
* **Student Attendance:** Daily attendance logging and absentee tracking.
* **Syllabus Tracking & Meetings:** Teacher-facing tools to log syllabus progress and schedule academic meetings.
* **Timetable:** Class schedules and teacher assignments.

### Phase 5: Finance
* **Fee Structures:** Configurable fee models across different streams and grades.
* **Payments & Receipts:** Digital payment tracking and receipt generation.
* **Pending Fees Tracking:** Analytics and outstanding balance reports.

### Phase 6: Transportation
* **Fleet Management:** Backend management of vehicles, routes, and route stops.
* **Driver Assignments & Sheets:** Allocation of routes to drivers with printable route sheets.
* **Live Tracking:** Dedicated React Native Driver App (GPS broadcasting) and Student/Parent tracking interface.

### Phase 7: Communication
* **Omnichannel Notifications:** Event-driven messaging (Email, SMS, WhatsApp, Push).
* **Announcements:** Institution-wide or class-specific digital noticeboards.

### Phase 8: Alumni
* **Registry & Audits:** Secure directory of past students with structured audit logs.
* **Engagement Dashboard:** RBAC-enabled analytics, PDF exports, and management of events, donations, and job opportunities.

## 5. Technical Architecture
* **Frontend Shell:** Unified React SPA built with Vite and React Router. Contains role-based views and nested micro-frontends.
* **Mobile Apps:** React Native + Expo for Student/Parent and Driver apps.
* **API Gateway & Routing:** Vite dev proxy (and Nginx in prod) handling prefix-based routing (`/api/transportation`, `/api/aob`).
* **Databases:** 
  * Core: PostgreSQL (Supabase) with Row-Level Security.
  * Migrating Legacy: SQLite (Alumni) and JSON files (Transportation) currently running in node microservices, to be migrated to Postgres.
* **Event Bus:** Cross-module communication is strictly handled via an internal event bus (e.g., `student.absent` triggers a notification) rather than direct imports.

## 6. Non-Functional Requirements
* **Security:** No hardcoded permissions. All authorization passes through the Role → Permission chain and Postgres RLS.
* **Performance:** Real-time components (e.g., GPS tracking) must utilize WebSockets/Supabase Realtime to broadcast efficiently.
* **UX/UI Guidelines:** Must follow the Canva-established Institutional Design System (Navy/Gold). Modern, responsive, and accessible.
* **Zero Downtime Migration:** The "Strangler Fig" pattern must be used to migrate legacy data stores (JSON/SQLite/MySQL) to Postgres without interrupting active services.

---
*Generated based on current architecture and project tracker states.*
