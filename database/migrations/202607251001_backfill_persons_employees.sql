-- ══════════════════════════════════════════════════════════════════════════════
-- Migration: Idempotent Backfill from profiles to persons & employees
-- ══════════════════════════════════════════════════════════════════════════════

-- 0. Ensure profiles table has all expected columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS staff_type TEXT DEFAULT 'teaching';

-- 1. Ensure persons table and all required columns exist
CREATE TABLE IF NOT EXISTS public.persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL DEFAULT ''
);

ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS first_name TEXT DEFAULT '';
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS last_name TEXT DEFAULT '';
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Ensure UNIQUE constraint on user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'persons_user_id_key') THEN
        ALTER TABLE public.persons ADD CONSTRAINT persons_user_id_key UNIQUE (user_id);
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 2. Populate public.persons from public.profiles
INSERT INTO public.persons (user_id, first_name, last_name, email, phone, created_at, updated_at)
SELECT 
    pr.id AS user_id,
    COALESCE(pr.name, 'Unknown') AS first_name,
    '' AS last_name,
    pr.email,
    pr.phone,
    COALESCE(pr.created_at, now()),
    now()
FROM public.profiles pr
ON CONFLICT (user_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    updated_at = EXCLUDED.updated_at;

-- 3. Ensure employees table and all required columns exist
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS person_id UUID;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'teacher';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS staff_type TEXT DEFAULT 'teaching';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Drop NOT NULL constraint on legacy institution_id if present
DO $$
BEGIN
    ALTER TABLE public.employees ALTER COLUMN institution_id DROP NOT NULL;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Ensure UNIQUE constraint on person_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_person_id_key') THEN
        ALTER TABLE public.employees ADD CONSTRAINT employees_person_id_key UNIQUE (person_id);
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 4. Populate public.employees from public.profiles + public.persons
INSERT INTO public.employees (person_id, role, status, subject, department, staff_type, created_at, updated_at)
SELECT 
    pe.id AS person_id,
    COALESCE(pr.role, 'teacher') AS role,
    COALESCE(pr.status, 'approved') AS status,
    pr.subject,
    pr.department,
    COALESCE(pr.staff_type, 'teaching') AS staff_type,
    COALESCE(pr.created_at, now()),
    now()
FROM public.profiles pr
JOIN public.persons pe ON pe.user_id = pr.id
ON CONFLICT (person_id) DO UPDATE SET
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    subject = EXCLUDED.subject,
    department = EXCLUDED.department,
    staff_type = EXCLUDED.staff_type,
    updated_at = EXCLUDED.updated_at;
