-- ════════════════════════════════════════════════════════════
-- BGS Teachers Portal - Schema Update v4
-- Adds staff_type to profiles and updates Timetable RLS
-- ════════════════════════════════════════════════════════════

-- 1. Add staff_type to profiles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='profiles' AND column_name='staff_type') THEN
        ALTER TABLE public.profiles ADD COLUMN staff_type TEXT DEFAULT 'teaching';
    END IF;
END $$;

-- 2. Update the handle_new_user trigger to include staff_type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, status, subject, staff_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown User'),
    NEW.email,
    -- If it's a specific admin email, make them admin. Otherwise teacher.
    CASE WHEN NEW.email = 'admin@bgs.edu' THEN 'admin' ELSE 'teacher' END,
    -- New accounts are now auto-approved by default
    'approved',
    NEW.raw_user_meta_data->>'subject',
    COALESCE(NEW.raw_user_meta_data->>'staff_type', 'teaching')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update Timetable RLS so teachers can insert/update their own classes
-- First, drop the old policies if they exist (they were likely admin-only before)
DROP POLICY IF EXISTS "Admins can insert timetable" ON public.timetable;
DROP POLICY IF EXISTS "Admins can update timetable" ON public.timetable;
DROP POLICY IF EXISTS "Admins can delete timetable" ON public.timetable;

-- Create new policies allowing both Admins AND the assigned Teacher to edit
CREATE POLICY "Admins and assigned teachers can insert timetable" ON public.timetable
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
        (auth.uid() = teacher_id AND EXISTS (
            SELECT 1 FROM public.timetable t 
            WHERE t.teacher_id = auth.uid() 
              AND t.stream = timetable.stream 
              AND t.year = timetable.year 
              AND t.class = timetable.class 
              AND t.subject = timetable.subject
        ))
    );

CREATE POLICY "Admins and assigned teachers can update timetable" ON public.timetable
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
        auth.uid() = teacher_id
    );

CREATE POLICY "Admins and assigned teachers can delete timetable" ON public.timetable
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
        auth.uid() = teacher_id
    );
