-- ══════════════════════════════════════════════════
--  BGS Teachers Portal — Add Subject to Registration
--  Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════

-- 1. Add 'subject' column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subject TEXT;

-- 2. Update the handle_new_user trigger to save the subject from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, phone, subject, role, status)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'subject',
        'teacher', 
        'approved'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
