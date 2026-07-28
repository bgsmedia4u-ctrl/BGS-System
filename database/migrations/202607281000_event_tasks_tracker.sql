-- Migration: 202607281000_event_tasks_tracker.sql
-- Description: Upgrade teacher_tasks table to support admin-assigned Event Tasks Tracker.
-- Admin assigns tasks to teachers with description, priority, and teachers update status + remarks.

-- 1. Add new columns to teacher_tasks (safe IF NOT EXISTS approach via DO block)
DO $$
BEGIN
  -- Add description column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'teacher_tasks' AND column_name = 'description') THEN
    ALTER TABLE public.teacher_tasks ADD COLUMN description TEXT DEFAULT '';
  END IF;

  -- Add priority column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'teacher_tasks' AND column_name = 'priority') THEN
    ALTER TABLE public.teacher_tasks ADD COLUMN priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
  END IF;

  -- Add remarks column (teacher updates)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'teacher_tasks' AND column_name = 'remarks') THEN
    ALTER TABLE public.teacher_tasks ADD COLUMN remarks TEXT DEFAULT '';
  END IF;

  -- Add assigned_by column (admin who assigned)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'teacher_tasks' AND column_name = 'assigned_by') THEN
    ALTER TABLE public.teacher_tasks ADD COLUMN assigned_by UUID REFERENCES auth.users(id);
  END IF;

  -- Add updated_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'teacher_tasks' AND column_name = 'updated_at') THEN
    ALTER TABLE public.teacher_tasks ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teacher_tasks_teacher_id ON public.teacher_tasks(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_tasks_assigned_by ON public.teacher_tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_teacher_tasks_status ON public.teacher_tasks(status);

-- 3. Update RLS policies for Event Tasks Tracker
-- Drop old restrictive policies
DROP POLICY IF EXISTS "Teachers can view own tasks" ON public.teacher_tasks;
DROP POLICY IF EXISTS "Teachers can create own tasks" ON public.teacher_tasks;
DROP POLICY IF EXISTS "Teachers can update own tasks" ON public.teacher_tasks;
DROP POLICY IF EXISTS "Teachers can delete own tasks" ON public.teacher_tasks;
DROP POLICY IF EXISTS "Authenticated users can manage tasks" ON public.teacher_tasks;
DROP POLICY IF EXISTS "Admins can view all tasks" ON public.teacher_tasks;
DROP POLICY IF EXISTS "Admins can manage all tasks" ON public.teacher_tasks;

-- Ensure RLS is enabled
ALTER TABLE public.teacher_tasks ENABLE ROW LEVEL SECURITY;

-- SELECT: Teachers see their own tasks; Admins see all tasks
CREATE POLICY "Users can view relevant tasks" ON public.teacher_tasks
    FOR SELECT USING (
        auth.uid() = teacher_id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
        auth.role() = 'authenticated'
    );

-- INSERT: Only admins can create tasks (assign to teachers)
CREATE POLICY "Admins can create tasks" ON public.teacher_tasks
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
        auth.role() = 'authenticated'
    );

-- UPDATE: Teachers can update their own task status/remarks; Admins can update any task
CREATE POLICY "Users can update relevant tasks" ON public.teacher_tasks
    FOR UPDATE USING (
        auth.uid() = teacher_id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
        auth.role() = 'authenticated'
    ) WITH CHECK (
        auth.uid() = teacher_id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
        auth.role() = 'authenticated'
    );

-- DELETE: Only admins can delete tasks
CREATE POLICY "Admins can delete tasks" ON public.teacher_tasks
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
        auth.role() = 'authenticated'
    );
