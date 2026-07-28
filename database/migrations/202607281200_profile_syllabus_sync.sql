-- Migration: 202607281200_profile_syllabus_sync.sql
-- Description: Connect Profile settings with Syllabus Tracker and enable teacher self-management of assigned subjects & classes.

-- 1. Add curriculum selection columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stream TEXT DEFAULT 'Science';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '1st PUC';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS assigned_classes TEXT DEFAULT '';

-- 2. Update RLS policies on teacher_subject_assignments so teachers can save profile syllabus changes
ALTER TABLE public.teacher_subject_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage teacher subject assignments" ON public.teacher_subject_assignments;
DROP POLICY IF EXISTS "Users can insert own subject assignments" ON public.teacher_subject_assignments;
DROP POLICY IF EXISTS "Users can delete own subject assignments" ON public.teacher_subject_assignments;
DROP POLICY IF EXISTS "Users can update own subject assignments" ON public.teacher_subject_assignments;

CREATE POLICY "Users can insert own subject assignments" ON public.teacher_subject_assignments
    FOR INSERT WITH CHECK (
        auth.uid() = teacher_id OR public.is_admin()
    );

CREATE POLICY "Users can delete own subject assignments" ON public.teacher_subject_assignments
    FOR DELETE USING (
        auth.uid() = teacher_id OR public.is_admin()
    );

CREATE POLICY "Users can update own subject assignments" ON public.teacher_subject_assignments
    FOR UPDATE USING (
        auth.uid() = teacher_id OR public.is_admin()
    ) WITH CHECK (
        auth.uid() = teacher_id OR public.is_admin()
    );
