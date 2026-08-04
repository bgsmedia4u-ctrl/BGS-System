-- Allow teacher_id to be null for unmatched staff records
ALTER TABLE biometric_attendance_records
ADD COLUMN IF NOT EXISTS staff_name TEXT;

ALTER TABLE biometric_attendance_records
ALTER COLUMN teacher_id DROP NOT NULL;

-- Remove old unique constraint
ALTER TABLE biometric_attendance_records
DROP CONSTRAINT IF EXISTS biometric_attendance_records_teacher_id_date_key;

-- Add a unique_key for upserts (populated by the application)
ALTER TABLE biometric_attendance_records
ADD COLUMN IF NOT EXISTS unique_key TEXT UNIQUE;
