-- ══════════════════════════════════════════════════════════════════════════════
-- Migration: Create notification_templates and notification_log tables
-- ══════════════════════════════════════════════════════════════════════════════

-- 0. Ensure Helper Function Exist
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 1. Create notification_templates
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'sms',
    body_preview TEXT NOT NULL,
    variable_count INTEGER NOT NULL DEFAULT 0,
    variable_names JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create notification_log
CREATE TABLE IF NOT EXISTS public.notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT NOT NULL DEFAULT 'sms',
    template_id TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    variables JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
    provider_message_id TEXT,
    error_message TEXT,
    sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    week_of DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Authenticated users can view notification templates" ON public.notification_templates;
CREATE POLICY "Authenticated users can view notification templates"
ON public.notification_templates FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage notification templates" ON public.notification_templates;
CREATE POLICY "Admins can manage notification templates"
ON public.notification_templates FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view notification log" ON public.notification_log;
CREATE POLICY "Admins can view notification log"
ON public.notification_log FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert notification log" ON public.notification_log;
CREATE POLICY "Admins can insert notification log"
ON public.notification_log FOR INSERT WITH CHECK (public.is_admin());

-- 5. Seed default DLT templates
INSERT INTO public.notification_templates (template_id, name, channel, body_preview, variable_count, variable_names)
VALUES
  (
    'tmpl_admin_notice_01', 
    'Admin General Notice', 
    'sms', 
    'Dear {#var#}, {#var#}. - BGS PU College, Sidlaghatta.', 
    2, 
    '["Teacher Name", "Notice Content"]'::jsonb
  ),
  (
    'tmpl_weekly_reminder_01', 
    'Saturday Weekly Report Reminder', 
    'sms', 
    'Reminder: Dear {#var#}, please submit your Weekly Report for this week. - BGS PU College, Sidlaghatta.', 
    1, 
    '["Teacher Name"]'::jsonb
  )
ON CONFLICT (template_id) DO NOTHING;

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_notification_log_week_of ON public.notification_log(week_of);
CREATE INDEX IF NOT EXISTS idx_notification_log_template_id ON public.notification_log(template_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_created_at ON public.notification_log(created_at DESC);
