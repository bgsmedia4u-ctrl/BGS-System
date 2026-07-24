-- ==============================================================================
-- schema_updates_v7_academic.sql
-- Phase 4 Academic System
-- Implements Departments, Courses, Subjects, and Teacher Assignments
-- ==============================================================================

-- 1. Departments (e.g., Science, Commerce, Arts)
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(institution_id, name)
);

-- 2. Courses (e.g., PCMB, CEBA)
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(department_id, name)
);

-- 3. Subjects (e.g., Physics, Economics)
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject_code TEXT,
    type TEXT DEFAULT 'Core' CHECK (type IN ('Core', 'Elective', 'Language', 'Lab')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(course_id, name)
);

-- 4. Teacher Assignments
-- Maps a teacher to a specific subject in a specific class for an academic year.
CREATE TABLE IF NOT EXISTS public.teacher_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(teacher_id, subject_id, class_id, academic_year_id)
);

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins can manage departments" ON public.departments FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage subjects" ON public.subjects FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage teacher_assignments" ON public.teacher_assignments FOR ALL USING (public.is_admin());

-- Authenticated users (Teachers/Students) can read
CREATE POLICY "Auth users can view departments" ON public.departments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can view courses" ON public.courses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can view subjects" ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can view teacher_assignments" ON public.teacher_assignments FOR SELECT USING (auth.role() = 'authenticated');
