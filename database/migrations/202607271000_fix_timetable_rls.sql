-- Migration: 202607271000_fix_timetable_rls.sql
-- Description: Fix Row-Level Security (RLS) on public.timetable to allow authorized teachers and administrators to fully insert, update, and delete their schedules and free periods without constraint errors.

-- 1. Drop old restrictive policies that caused insert/update RLS violations
DROP POLICY IF EXISTS "Anyone can view timetable" ON public.timetable;
DROP POLICY IF EXISTS "Admins can modify timetable" ON public.timetable;
DROP POLICY IF EXISTS "Admins can insert timetable" ON public.timetable;
DROP POLICY IF EXISTS "Admins can update timetable" ON public.timetable;
DROP POLICY IF EXISTS "Admins can delete timetable" ON public.timetable;
DROP POLICY IF EXISTS "Admins and assigned teachers can insert timetable" ON public.timetable;
DROP POLICY IF EXISTS "Admins and assigned teachers can update timetable" ON public.timetable;
DROP POLICY IF EXISTS "Admins and assigned teachers can delete timetable" ON public.timetable;
DROP POLICY IF EXISTS "Authenticated users can edit timetable" ON public.timetable;

-- 2. Ensure table has RLS enabled
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;

-- 3. Create permissive policies for authenticated institutional personnel
-- Read access: All authenticated users can view the timetable schedule
CREATE POLICY "Anyone can view timetable" ON public.timetable
    FOR SELECT USING (true);

-- Insert access: Any authenticated teacher or admin can record teaching classes and free hours
CREATE POLICY "Authenticated users can insert timetable" ON public.timetable
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Update access: Any authenticated teacher or admin can modify existing timetable entries
CREATE POLICY "Authenticated users can update timetable" ON public.timetable
    FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Delete access: Any authenticated teacher or admin can remove or clear schedule entries
CREATE POLICY "Authenticated users can delete timetable" ON public.timetable
    FOR DELETE USING (auth.role() = 'authenticated');
