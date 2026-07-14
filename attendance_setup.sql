-- Setup script for Attendance Module

-- 1. Create attendance_sessions table
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream TEXT NOT NULL CHECK (stream IN ('Science', 'Commerce')),
    year TEXT NOT NULL CHECK (year IN ('1st Year', '2nd Year')),
    class TEXT NOT NULL,
    date DATE NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(stream, year, class, date)
);

-- 2. Create attendance_records table
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    is_absent BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(session_id, student_id)
);

-- 3. Enable RLS
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Sessions
CREATE POLICY "Allow authenticated users to select attendance sessions" 
ON public.attendance_sessions FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert attendance sessions" 
ON public.attendance_sessions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update attendance sessions" 
ON public.attendance_sessions FOR UPDATE USING (auth.role() = 'authenticated');

-- Records
CREATE POLICY "Allow authenticated users to select attendance records" 
ON public.attendance_records FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert attendance records" 
ON public.attendance_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update attendance records" 
ON public.attendance_records FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_attendance_sessions_updated_at ON public.attendance_sessions;
CREATE TRIGGER update_attendance_sessions_updated_at
    BEFORE UPDATE ON public.attendance_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_records_updated_at ON public.attendance_records;
CREATE TRIGGER update_attendance_records_updated_at
    BEFORE UPDATE ON public.attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_batch_date ON public.attendance_sessions(stream, year, class, date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON public.attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON public.attendance_records(student_id);
