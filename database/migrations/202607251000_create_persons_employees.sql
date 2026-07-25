-- ══════════════════════════════════════════════════════════════════════════════
-- Migration: Create Central Identity Tables (persons, employees)
-- ══════════════════════════════════════════════════════════════════════════════

-- 0. Ensure Helper Functions Exist
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

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

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Create public.persons
CREATE TABLE IF NOT EXISTS public.persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL DEFAULT '',
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure persons columns exist if table was created previously by v5
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS last_name TEXT DEFAULT '';
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Create public.employees
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL UNIQUE REFERENCES public.persons(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'teacher',
    status TEXT NOT NULL DEFAULT 'approved',
    subject TEXT,
    department TEXT,
    staff_type TEXT DEFAULT 'teaching',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure employees columns exist if table was created previously by v5
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES public.persons(id) ON DELETE CASCADE;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'teacher';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS staff_type TEXT DEFAULT 'teaching';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Enable RLS
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- 4. Policies for public.persons
DROP POLICY IF EXISTS "Allow users to read own person and approved users to read all" ON public.persons;
CREATE POLICY "Allow users to read own person and approved users to read all"
ON public.persons FOR SELECT USING (
    auth.uid() = user_id OR public.is_user_approved()
);

DROP POLICY IF EXISTS "Users can update own person or admins can update any" ON public.persons;
CREATE POLICY "Users can update own person or admins can update any"
ON public.persons FOR UPDATE USING (
    auth.uid() = user_id OR public.is_admin()
);

DROP POLICY IF EXISTS "Users can insert own person or admins can insert any" ON public.persons;
CREATE POLICY "Users can insert own person or admins can insert any"
ON public.persons FOR INSERT WITH CHECK (
    auth.uid() = user_id OR public.is_admin()
);

-- 5. Policies for public.employees
DROP POLICY IF EXISTS "Allow users to read own employee record and approved users to read all" ON public.employees;
CREATE POLICY "Allow users to read own employee record and approved users to read all"
ON public.employees FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.persons p WHERE p.id = employees.person_id AND (p.user_id = auth.uid() OR public.is_user_approved()))
);

DROP POLICY IF EXISTS "Users can update own employee record or admins can update any" ON public.employees;
CREATE POLICY "Users can update own employee record or admins can update any"
ON public.employees FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.persons p WHERE p.id = employees.person_id AND p.user_id = auth.uid()) OR public.is_admin()
);

DROP POLICY IF EXISTS "Users can insert own employee record or admins can insert any" ON public.employees;
CREATE POLICY "Users can insert own employee record or admins can insert any"
ON public.employees FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.persons p WHERE p.id = employees.person_id AND p.user_id = auth.uid()) OR public.is_admin()
);

-- 6. Updated_at triggers
DROP TRIGGER IF EXISTS update_persons_updated_at ON public.persons;
CREATE TRIGGER update_persons_updated_at
  BEFORE UPDATE ON public.persons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. Prevent non-admin privilege escalation on role and status
CREATE OR REPLACE FUNCTION public.protect_employee_privileges()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF TG_OP = 'UPDATE' THEN
      IF NEW.role IS DISTINCT FROM OLD.role OR NEW.status IS DISTINCT FROM OLD.status THEN
        RAISE EXCEPTION 'Only administrators can update employee role or status';
      END IF;
    ELSIF TG_OP = 'INSERT' THEN
      IF NEW.role <> 'teacher' OR NEW.status <> 'pending' THEN
        RAISE EXCEPTION 'Only administrators can create non-standard employee roles or statuses';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_employee_privileges ON public.employees;
CREATE TRIGGER trg_protect_employee_privileges
  BEFORE INSERT OR UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.protect_employee_privileges();
