-- ══════════════════════════════════════════════════════════════════════════════
-- Migration: Schedule Saturday Weekly Report Reminder Cron Job
-- ══════════════════════════════════════════════════════════════════════════════

-- Enable pg_cron extension if available
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule job to run every Saturday at 03:30 UTC (09:00 AM IST)
-- Note: Replace project URL / Edge Function endpoint as configured in your Supabase project.
SELECT cron.schedule(
    'saturday-weekly-report-reminder',
    '30 3 * * 6', -- Every Saturday at 03:30 UTC / 09:00 IST
    $$
    SELECT net.http_post(
        url := (SELECT value FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/weekly-report-reminder',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT value FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
        ),
        body := '{}'::jsonb
    );
    $$
);
