# Comprehensive Codebase Audit & Bug Report
### BGS Teachers & Administration Portal (React + Vite + Supabase)
**Auditor:** Jules, Lead Engineering Agent
**Date:** July 2026

---

## Executive Summary

An exhaustive analysis of the **BGS Teachers & Administration Portal** was conducted across the entire codebase, including the React/Vite client application, Supabase database schemas (`master_schema.sql` and migration histories), Row-Level Security (RLS) policies, and Supabase Edge Functions.

The audit has revealed **several potential bugs, security gaps, performance bottlenecks, and architectural non-conformances** categorized by severity. This report provides a detailed breakdown of each issue, its potential impact, concrete code references, and actionable mitigation/remediation strategies.

---

## 1. Vulnerability & Issue Severity Matrix

| ID | Title | Severity | Component | Type |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Missing RLS Policies on Target Academic & Transportation Schemas | **High** | Database (v5-v8) | Security |
| **SEC-02** | Administrative Role Bypass via Lack of RLS Enforcement on Edge Functions | **High** | Edge Functions | Security |
| **BUG-01** | Infinite Recursion Risk in RLS Policies via `is_user_approved()` Helper | **High** | Database (RLS) | Logic Bug / Crash |
| **BUG-02** | Potential SQL Trigger Sync Failures in Dual-Write Profiles Trigger | **Medium** | Database (Sync) | Data Integrity |
| **BUG-03** | LocalStorage Key Leak / Incomplete Clean Up on Logout | **Medium** | Frontend | Security / UX |
| **BUG-04** | Inconsistent Data Layer Abstraction (Direct `supabase.from` queries) | **Medium** | Frontend | Architecture |
| **BUG-05** | Fragile Type Conversions in Analytics Dashboard Average Score calculations | **Medium** | Frontend | Performance / Bug |
| **BUG-06** | Inefficient Attendance Records Saves (Double Roundtrip Upsert) | **Medium** | Database / Frontend | Performance |
| **DEP-01** | Missing Config for Production SPA Routing Rewrites | **Low** | Deployment | Config |

---

## 2. In-Depth Technical Breakdown

### SEC-01: Missing RLS Policies on Target Academic & Transportation Schemas
* **Severity:** **High**
* **Component:** Database (`master_schema.sql` Sections 14p & Appendix A)
* **Description:**
  While target tables under Appendix A (V5 Foundation, V6 Student Management, V8 Transportation) have Row-Level Security enabled using `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`, several of them **lack corresponding SELECT, INSERT, UPDATE, or DELETE policies**.
  In Supabase, enabling RLS on a table without defining any policies results in a **default-deny** posture for all non-owner roles (including anon/authenticated client requests). If the client application starts querying these target tables directly, queries will return empty arrays or permission errors.
  Worse, tables in `v7_academic_system.sql` have policies that may allow overly permissive access depending on how authorization is mapped.
* **Impact:**
  - Complete blockage of feature workflows once the application switches from the legacy flat tables to the new normalized tables.
  - Potential data leaks if overly permissive policies (e.g., `USING (auth.role() = 'authenticated')`) are applied without scoping to specific user IDs or organization tenants.
* **Code/SQL Reference:**
  ```sql
  -- Target tables from v5/v6/v8 have RLS enabled:
  ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
  -- But policies are often simplistic or missing:
  CREATE POLICY "Allow users to read own employee record and approved users to read all"
  ON public.employees FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.persons p WHERE p.id = employees.person_id AND (p.user_id = auth.uid() OR public.is_user_approved()))
  );
  ```
* **Mitigation:**
  Define granular, tenant-scoped, and role-scoped RLS policies for every new table in v5-v8. Ensure that `auth.uid()` or role verification is checked against authorized organizations/institutions.

---

### SEC-02: Administrative Role Bypass via Lack of RLS Enforcement on Edge Functions
* **Severity:** **High**
* **Component:** Supabase Edge Functions (`supabase/functions/notify-absent-student/index.ts`, `notify-teacher/index.ts`)
* **Description:**
  In Edge Functions, the client uses a `service-role` instance to interact with the database (`supabaseServiceKey`). Because the `service_role` key bypasses RLS, the database relies on the Edge Function to perform strict, bulletproof role verification.
  - In `notify-absent-student/index.ts`, the code attempts to parse the `Authorization` header and retrieve the user's profile. However, if the `Authorization` header is omitted (such as when invoked by a system scheduler or `pg_cron` trigger), the function **quietly skips authentication** and runs under the assumption that it's a legitimate system job:
    ```typescript
    // 1. Authenticate caller (for non-cron invocations)
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      // verifies JWT token and asserts admin role...
    }
    // If authHeader is missing, the code silently continues execution!
    ```
  - This design assumes that only the database scheduler can invoke the function without a token. However, Supabase Edge Functions are **publicly accessible HTTP endpoints**. If an external actor discovers the URL, they can send a request without an `Authorization` header, and the function will process it, invoking MSG91 SMS triggers and consuming billable API credits.
* **Impact:**
  - Unauthorized invocation of sensitive notification pipelines.
  - Severe financial and resource exhaustion risk due to MSG91 SMS API spamming.
  - SMS harassment of students' parents with falsified absence alerts.
* **Mitigation:**
  - Enforce a shared secret token (e.g., an `API_SECRET` environment variable) in the request body or headers for scheduled/internal invocations that do not possess a user JWT.
  - Validate that either a valid Admin user JWT *or* the correct system secret token is present before executing any SMS flows.

---

### BUG-01: Infinite Recursion Risk in RLS Policies via `is_user_approved()` Helper
* **Severity:** **High**
* **Component:** Database SQL (`master_schema.sql` Section 2b & 14a)
* **Description:**
  The helper function `is_user_approved()` is defined as follows:
  ```sql
  CREATE OR REPLACE FUNCTION public.is_user_approved()
  RETURNS BOOLEAN
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  BEGIN
    RETURN EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (status = 'approved' OR role = 'admin')
    );
  END;
  $$;
  ```
  And the select policy for `public.profiles` is:
  ```sql
  CREATE POLICY "Allow users to read own profile and approved users to read all"
  ON public.profiles FOR SELECT USING (
      auth.uid() = id OR public.is_user_approved()
  );
  ```
  Since `is_user_approved()` performs a SELECT query on `public.profiles`, and the SELECT query on `public.profiles` triggers the policy evaluation, which calls `public.is_user_approved()`, there is an **extremely high risk of infinite recursion** (resulting in a stack overflow / transaction crash) if PostgreSQL does not optimize the query plan or if a session variable is misaligned.
  To bypass RLS, `is_user_approved` uses `SECURITY DEFINER`, but it does not temporarily override the search path or disable RLS inside the query.
* **Impact:**
  - Query timeouts, database crashes, or locked sessions on login/profile fetch.
  - Complete platform denial-of-service for standard users.
* **Mitigation:**
  Avoid querying the table itself inside its own RLS policy helper. Instead, fetch metadata directly from `auth.users` metadata (since JWT contains claims), or fetch from a separate lookup table that does not have a recursive dependency on `profiles`.

---

### BUG-02: Potential SQL Trigger Sync Failures in Dual-Write Profiles Trigger
* **Severity:** **Medium**
* **Component:** Database Triggers (`202607251002_profiles_sync_trigger.sql`)
* **Description:**
  To support identity migration (Spec 02), a dual-write trigger is established to keep `profiles` synced with `persons` and `employees`.
  Triggers executing synchronous sub-writes are prone to failure if any sub-write constraint is violated (e.g., duplicate phone, email validation, or missing required fields). A crash in the trigger rollback aborts the main operation (e.g., auth signup or profile updates), leaving the user unable to register or update their phone number.
* **Impact:**
  - Flaky user registration / login experiences.
  - Blocked profile updates if a user attempts to input a phone number that violates underlying schema constraints in `persons` or `employees`.
* **Mitigation:**
  - Wrap trigger execution in exception blocks to log errors gracefully rather than completely crashing the target transaction:
    ```sql
    BEGIN
      -- sync logic
    EXCEPTION WHEN OTHERS THEN
      -- log error to a table or ignore gracefully
    END;
    ```

---

### BUG-03: LocalStorage Key Leak / Incomplete Clean Up on Logout
* **Severity:** **Medium**
* **Component:** Frontend (`LoginPage.jsx`, `DashboardPage.jsx`, `AuthContext.jsx`)
* **Description:**
  When a user logs out, `AuthContext.logout()` successfully signs the user out of Supabase Auth. However, several local states and LocalStorage keys remain persistent.
  Specifically, `phone_modal_dismissed` is stored in LocalStorage to block the phone number collection popup. Since this key is not cleared on logout, if another teacher logs in on the same browser (common in shared school computer rooms), the new teacher **will never be prompted to input their WhatsApp phone number** if the previous user dismissed it.
* **Impact:**
  - Shared device context leak.
  - Failure to collect critical contact phone numbers for teachers, resulting in broken weekly reminder SMS flows.
* **Mitigation:**
  - Explicitly clear application-specific LocalStorage keys during `logout()`:
    ```javascript
    async function logout() {
      localStorage.removeItem('phone_modal_dismissed');
      // rest of logout logic...
    }
    ```

---

### BUG-04: Inconsistent Data Layer Abstraction (Direct `supabase.from` queries)
* **Severity:** **Medium**
* **Component:** Frontend Architecture (`MarksPage.jsx`)
* **Description:**
  According to `client/agent-context/bgs-portal-context/context/code-standards.md`, **all database queries must be abstracted into the `src/data` or `src/api` directories**. Components must never query Supabase directly to ensure maintainability and single-file update paths for table renames.
  However, in `MarksPage.jsx`, there is a direct dynamic import and direct query on the `departments` table:
  ```javascript
  useEffect(() => {
    if (profile?.institution_id) {
      import('../api/supabase').then(({ supabase }) => {
        supabase.from('departments').select('name').eq('institution_id', profile.institution_id)
          .then(({ data }) => setDepartments(data || []));
      });
    }
  }, [profile]);
  ```
* **Impact:**
  - Violation of project architecture standard.
  - If the `departments` table schema changes, `MarksPage.jsx` will fail silently or crash without warning.
* **Mitigation:**
  Move this query into `src/api/marksService.js` or `src/data/profileService.js` as `getDepartments(institutionId)` and invoke it from there.

---

### BUG-05: Fragile Type Conversions in Analytics Dashboard Average Score Calculations
* **Severity:** **Medium**
* **Component:** Frontend Services (`analyticsService.js` & `AnalyticsDashboardPage.jsx`)
* **Description:**
  In `analyticsService.js`, the calculations of stream toppers and batch subject averages assume `m.marks` is a simple flat object where values are numerical. However, because marks can be entered as strings (e.g., from text input fields), they are cast via `Number(score)`.
  If a teacher inputs a non-numeric score or leaves a value empty/placeholder, `Number(score)` yields `NaN` or `0`.
  In `getStreamToppers`:
  ```javascript
  Object.values(m.marks).forEach(score => {
    const num = Number(score);
    if (!isNaN(num)) {
      s.totalScore += num;
      s.subjectCount++;
    }
  });
  ```
  If an empty string `""` is passed, `Number("")` evaluates to `0`. This is *not* `NaN`, so it successfully passes the `!isNaN(num)` check, skewing the subject count and pulling down the student's average score artificially.
* **Impact:**
  - Highly inaccurate student leaderboards and average reports.
  - Students getting unfairly penalized for un-entered or blank marks instead of skipping them.
* **Mitigation:**
  Explicitly check for empty strings and whitespace before casting:
  ```javascript
  if (score !== null && score !== undefined && score.toString().trim() !== '') {
    const num = Number(score);
    if (!isNaN(num)) { ... }
  }
  ```

---

### BUG-06: Inefficient Attendance Records Saves (Double Roundtrip Upsert)
* **Severity:** **Medium**
* **Component:** Frontend Services (`attendanceService.js`)
* **Description:**
  The `saveAttendance` function updates records by first running a delete query to remove existing records for a session and then running an insert query to add the new ones:
  ```javascript
  // Delete existing records for this session first
  const { error: delErr } = await supabase
    .from('attendance_records')
    .delete()
    .eq('session_id', session.id);

  if (delErr) throw delErr;

  // Insert new records
  if (recordsToInsert.length > 0) {
    const { error: insertErr } = await supabase
      .from('attendance_records')
      .insert(recordsToInsert);
  }
  ```
  This is executed inside a transaction-less sequential context. If the insert statement fails, **the previous attendance data is already deleted**, leaving the session with zero attendance records (data loss).
* **Impact:**
  - Potential complete data loss on attendance save errors (e.g., network timeout during the second fetch call).
  - High performance penalty due to double HTTP round-trips.
* **Mitigation:**
  Use Supabase's native `.upsert()` with `on_conflict: 'session_id, student_id'` to update and insert records in a single atomic SQL call:
  ```javascript
  const { error } = await supabase
    .from('attendance_records')
    .upsert(recordsToInsert, { onConflict: 'session_id,student_id' });
  ```

---

### DEP-01: Missing Config for Production SPA Routing Rewrites
* **Severity:** **Low / Advisory**
* **Component:** Environment Deployment (`client/vercel.json`, `vercel.json`)
* **Description:**
  The project is a Single Page Application (SPA) using client-side routing via `react-router-dom`. If a user manually refreshes on any route other than the homepage (e.g., `https://bgs-system.vercel.app/dashboard`), Vercel/CDN hosts will look for a static directory `/dashboard/index.html` and return a standard `404 NOT FOUND`.
  Vercel configuration requires a root rewrite rule to forward all traffic to `/index.html`.
* **Impact:**
  - Annoying 404 errors for teachers and admins when bookmarking or reloading pages in production.
* **Mitigation:**
  Confirm that `vercel.json` contains the following routing rewrite pattern:
  ```json
  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```

---

## 3. Recommended Remediation Roadmap

To ensure the high-quality evolution of the BGS Teachers & Administration Portal, we recommend addressing the identified issues in the following phases:

1. **Immediate (Security & Stability):**
   - Address the **SEC-02** Edge Function bypass. Lock down the endpoints with authentication verification.
   - Refactor the **BUG-01** RLS infinite recursion risk to avoid stack overflow issues under high load.
2. **Short Term (Data Integrity):**
   - Refactor **BUG-06** atomic upsert for attendance saves to prevent loss-of-data bugs.
   - Address **BUG-05** number casting safeguards to ensure pristine leaderboard tracking.
3. **Medium Term (Architectural Alignment):**
   - Enforce the absolute exclusion of direct `supabase.from()` calls in files outside `src/data` and `src/api` (**BUG-04**).
   - Clear user-specific variables in local storage upon sign-out (**BUG-03**).
