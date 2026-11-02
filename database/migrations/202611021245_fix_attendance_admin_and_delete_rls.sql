-- ══════════════════════════════════════════════════════════════════════════════
-- Migration: Admin Full Management and Delete RLS on Attendance Tables
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Ensure Admins have full access to attendance sessions and records
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'attendance_sessions' 
        AND policyname = 'Admins have full access to attendance sessions'
    ) THEN
        CREATE POLICY "Admins have full access to attendance sessions" ON public.attendance_sessions
            FOR ALL USING (public.is_admin());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'attendance_records' 
        AND policyname = 'Admins have full access to attendance records'
    ) THEN
        CREATE POLICY "Admins have full access to attendance records" ON public.attendance_records
            FOR ALL USING (public.is_admin());
    END IF;
END $$;

-- 2. Allow delete access to attendance records and sessions for authenticated users / admins
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'attendance_records' 
        AND policyname = 'Allow authenticated users to delete attendance records'
    ) THEN
        CREATE POLICY "Allow authenticated users to delete attendance records"
        ON public.attendance_records FOR DELETE USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'attendance_sessions' 
        AND policyname = 'Allow authenticated users to delete attendance sessions'
    ) THEN
        CREATE POLICY "Allow authenticated users to delete attendance sessions"
        ON public.attendance_sessions FOR DELETE USING (auth.role() = 'authenticated');
    END IF;
END $$;

