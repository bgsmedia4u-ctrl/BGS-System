-- ══════════════════════════════════════════════════════════════════════════════
-- Migration: Spec 06 — Absence Parent SMS Alert & Student Parent Phone
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Add parent_phone column to public.students table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='students' AND column_name='parent_phone') THEN
        ALTER TABLE public.students ADD COLUMN parent_phone TEXT;
    END IF;
END $$;

-- 2. Seed Absence Alert DLT Template
INSERT INTO public.notification_templates (template_id, name, channel, body_preview, variable_count, variable_names)
VALUES (
    'tmpl_absence_alert_01', 
    'Absent Student Parent SMS Alert', 
    'sms', 
    'Dear Parent, {#var#} is absent today. - BGS PU College, Sidlaghatta.', 
    1, 
    '["Student Name"]'::jsonb
)
ON CONFLICT (template_id) DO NOTHING;

-- 3. Schedule Daily Evening Cron Job via pg_cron (Everyday at 11:30 UTC / 17:00 IST)
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
    'daily-absence-sms-alert',
    '30 11 * * *', -- Everyday at 11:30 UTC / 17:00 IST
    $$
    SELECT net.http_post(
        url := (SELECT value FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/notify-absent-student',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT value FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
        ),
        body := '{}'::jsonb
    );
    $$
);
