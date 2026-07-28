-- Migration: 202607281400_fix_tsa_foreign_key.sql
-- Description: Fix foreign key constraint violations on teacher_subject_assignments by ensuring all auth users have an existing record in public.profiles.

-- 1. Insert missing profiles from auth.users into public.profiles
INSERT INTO public.profiles (id, email, name, role, department)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', email, 'Faculty Member'),
    COALESCE(raw_user_meta_data->>'role', 'teacher'),
    COALESCE(raw_user_meta_data->>'department', 'Science')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email;

-- 2. Grant table access permissions to ensure seamless RLS operations
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.teacher_subject_assignments TO authenticated;
GRANT ALL ON TABLE public.teacher_syllabus_progress TO authenticated;
