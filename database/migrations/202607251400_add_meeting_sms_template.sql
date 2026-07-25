-- ══════════════════════════════════════════════════════════════════════════════
-- Migration: Spec 07 — Seed Meeting Scheduling DLT Template
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.notification_templates (template_id, name, channel, body_preview, variable_count, variable_names)
VALUES (
    'tmpl_meeting_notice_01', 
    'Meeting Schedule Notice', 
    'sms', 
    'Dear {#var#}, meeting "{#var#}" scheduled for {#var#} at {#var#}. - BGS PU College, Sidlaghatta.', 
    4, 
    '["Teacher Name", "Meeting Title", "Date", "Time"]'::jsonb
)
ON CONFLICT (template_id) DO NOTHING;
