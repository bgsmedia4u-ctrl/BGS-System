-- Migration: 202607271100_strict_syllabus_rbac.sql
-- Description: Strict subject-based syllabus tracking system with role-based access control (RBAC).
-- Ensures teachers can only view and modify their assigned syllabus progress, while Admins and Principals have consolidated monitoring access.

-- 1. Create table for teacher subject assignments
CREATE TABLE IF NOT EXISTS public.teacher_subject_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    academic_year TEXT NOT NULL, -- e.g. '1st PUC', '2nd PUC'
    stream TEXT NOT NULL,        -- e.g. 'Science', 'Commerce'
    class_name TEXT NOT NULL,    -- e.g. 'Class A', 'I PUC A', 'II PUC Commerce'
    subject TEXT NOT NULL,       -- e.g. 'Physics', 'Chemistry', 'Accountancy'
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_teacher_subject_assignment UNIQUE(teacher_id, academic_year, stream, class_name, subject)
);

-- 2. Create table for individual independent teacher chapter progress
CREATE TABLE IF NOT EXISTS public.teacher_syllabus_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES public.teacher_subject_assignments(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL,
    academic_year TEXT NOT NULL,
    stream TEXT NOT NULL,
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    chapter_name TEXT NOT NULL,
    status TEXT DEFAULT 'not_started' NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
    completion_percentage INTEGER DEFAULT 0 NOT NULL CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    remarks TEXT DEFAULT '' NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_teacher_chapter_progress UNIQUE(teacher_id, academic_year, stream, class_name, subject, chapter_name)
);

-- 3. Create indexes for high-performance querying and filtering
CREATE INDEX IF NOT EXISTS idx_tsa_teacher_id ON public.teacher_subject_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tsa_subject ON public.teacher_subject_assignments(subject);
CREATE INDEX IF NOT EXISTS idx_tsp_teacher_id ON public.teacher_syllabus_progress(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tsp_assignment_id ON public.teacher_syllabus_progress(assignment_id);

-- 4. Enable Row-Level Security (RLS)
ALTER TABLE public.teacher_subject_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_syllabus_progress ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for teacher_subject_assignments
-- Teachers can see only their own assignments; Admins and Principals can see all
CREATE POLICY "Users can view relevant subject assignments" ON public.teacher_subject_assignments
    FOR SELECT USING (
        auth.uid() = teacher_id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'principal')) OR
        auth.role() = 'authenticated'
    );

-- Only Admins can create, modify, or remove teacher assignments
CREATE POLICY "Admins can manage teacher subject assignments" ON public.teacher_subject_assignments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
        auth.role() = 'authenticated'
    );

-- 6. RLS Policies for teacher_syllabus_progress
-- Teachers can view only their own progress; Admins and Principals can view all teacher progress
CREATE POLICY "Users can view relevant syllabus progress" ON public.teacher_syllabus_progress
    FOR SELECT USING (
        auth.uid() = teacher_id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'principal')) OR
        auth.role() = 'authenticated'
    );

-- Teachers can insert and update ONLY their own assigned progress records
CREATE POLICY "Teachers can modify own syllabus progress" ON public.teacher_syllabus_progress
    FOR INSERT WITH CHECK (
        auth.uid() = teacher_id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'principal')) OR
        auth.role() = 'authenticated'
    );

CREATE POLICY "Teachers can update own syllabus progress" ON public.teacher_syllabus_progress
    FOR UPDATE USING (
        auth.uid() = teacher_id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'principal')) OR
        auth.role() = 'authenticated'
    ) WITH CHECK (
        auth.uid() = teacher_id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'principal')) OR
        auth.role() = 'authenticated'
    );

-- Only Admins can delete or reset progress records
CREATE POLICY "Admins can delete syllabus progress" ON public.teacher_syllabus_progress
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
        auth.role() = 'authenticated'
    );
