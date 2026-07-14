-- ══════════════════════════════════════════════════
--  BGS Teachers Portal — Marks Module Setup
--  Run this in Supabase SQL Editor after the main setup
-- ══════════════════════════════════════════════════

-- 1. Students table (one row per student per class batch)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    stream TEXT NOT NULL CHECK (stream IN ('Science', 'Commerce')),
    year TEXT NOT NULL CHECK (year IN ('1st Year', '2nd Year')),
    class TEXT NOT NULL,
    roll_number INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tests table (test definitions with subjects stored as JSONB)
CREATE TABLE IF NOT EXISTS public.tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    stream TEXT NOT NULL CHECK (stream IN ('Science', 'Commerce')),
    year TEXT NOT NULL CHECK (year IN ('1st Year', '2nd Year')),
    class TEXT NOT NULL,
    subjects JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(name, stream, year, class)
);

-- 3. Mark entries table (one row per student per test)
CREATE TABLE IF NOT EXISTS public.mark_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    marks JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_absent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(test_id, student_id)
);

-- 4. Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mark_entries ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Students: all authenticated users can read; admins can write
DROP POLICY IF EXISTS "Authenticated users can view students" ON public.students;
CREATE POLICY "Authenticated users can view students" ON public.students
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage students" ON public.students;
CREATE POLICY "Admins can manage students" ON public.students
    FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers can insert students" ON public.students;
CREATE POLICY "Teachers can insert students" ON public.students
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Tests: all authenticated users can CRUD
DROP POLICY IF EXISTS "Authenticated users can view tests" ON public.tests;
CREATE POLICY "Authenticated users can view tests" ON public.tests
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can create tests" ON public.tests;
CREATE POLICY "Authenticated users can create tests" ON public.tests
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update tests" ON public.tests;
CREATE POLICY "Authenticated users can update tests" ON public.tests
    FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete tests" ON public.tests;
CREATE POLICY "Authenticated users can delete tests" ON public.tests
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Mark entries: all authenticated users can CRUD
DROP POLICY IF EXISTS "Authenticated users can view mark_entries" ON public.mark_entries;
CREATE POLICY "Authenticated users can view mark_entries" ON public.mark_entries
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert mark_entries" ON public.mark_entries;
CREATE POLICY "Authenticated users can insert mark_entries" ON public.mark_entries
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update mark_entries" ON public.mark_entries;
CREATE POLICY "Authenticated users can update mark_entries" ON public.mark_entries
    FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete mark_entries" ON public.mark_entries;
CREATE POLICY "Authenticated users can delete mark_entries" ON public.mark_entries
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- 6. Updated_at trigger for mark_entries
DROP TRIGGER IF EXISTS update_mark_entries_updated_at ON public.mark_entries;
CREATE TRIGGER update_mark_entries_updated_at
  BEFORE UPDATE ON public.mark_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
