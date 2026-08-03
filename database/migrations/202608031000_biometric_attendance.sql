-- Create biometric upload history table
CREATE TABLE IF NOT EXISTS biometric_upload_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
    upload_time TIME NOT NULL DEFAULT CURRENT_TIME,
    filename TEXT NOT NULL,
    imported_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create biometric attendance records table
CREATE TABLE IF NOT EXISTS biometric_attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status TEXT NOT NULL,
    working_hours NUMERIC,
    late_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE (teacher_id, date)
);

-- Enable RLS
ALTER TABLE biometric_upload_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_attendance_records ENABLE ROW LEVEL SECURITY;

-- Create policies for biometric_upload_history
-- For simplicity, assuming office and admin roles can read/write
CREATE POLICY "Allow read access to biometric_upload_history for authenticated users" 
ON biometric_upload_history FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow insert access to biometric_upload_history for authenticated users" 
ON biometric_upload_history FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Create policies for biometric_attendance_records
CREATE POLICY "Allow read access to biometric_attendance_records for authenticated users" 
ON biometric_attendance_records FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow insert access to biometric_attendance_records for authenticated users" 
ON biometric_attendance_records FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow update access to biometric_attendance_records for authenticated users" 
ON biometric_attendance_records FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Allow delete access to biometric_attendance_records for authenticated users" 
ON biometric_attendance_records FOR DELETE 
TO authenticated 
USING (true);
