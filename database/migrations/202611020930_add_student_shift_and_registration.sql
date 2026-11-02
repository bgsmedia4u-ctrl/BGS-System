-- ══════════════════════════════════════════════════════════════════════════════
-- Migration: Add Student Shift, Status, and Administrative Registration Fields
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Add shift, status, and extended contact columns to public.students table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='students' AND column_name='shift') THEN
        ALTER TABLE public.students ADD COLUMN shift TEXT DEFAULT 'Morning Shift';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='students' AND column_name='status') THEN
        ALTER TABLE public.students ADD COLUMN status TEXT DEFAULT 'Active';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='students' AND column_name='parent_name') THEN
        ALTER TABLE public.students ADD COLUMN parent_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='students' AND column_name='email') THEN
        ALTER TABLE public.students ADD COLUMN email TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='students' AND column_name='notes') THEN
        ALTER TABLE public.students ADD COLUMN notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='students' AND column_name='updated_at') THEN
        ALTER TABLE public.students ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- 2. Ensure unique constraint exists for (stream, year, class, roll_number)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_student_batch' 
        AND conrelid = 'public.students'::regclass
    ) THEN
        ALTER TABLE public.students 
        ADD CONSTRAINT unique_student_batch UNIQUE (stream, year, class, roll_number);
    END IF;
END $$;

-- 3. Create index for fast filtering by batch, class, and shift
CREATE INDEX IF NOT EXISTS idx_students_batch_lookup 
ON public.students (stream, year, class);

CREATE INDEX IF NOT EXISTS idx_students_shift_lookup 
ON public.students (shift);

CREATE INDEX IF NOT EXISTS idx_students_roll_number 
ON public.students (roll_number);

-- 4. Ensure RLS policies allow Admin full management (INSERT, UPDATE, DELETE)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'students' 
        AND policyname = 'Admins can manage students'
    ) THEN
        CREATE POLICY "Admins can manage students" ON public.students
            FOR ALL USING (public.is_admin());
    END IF;
END $$;

