-- ══════════════════════════════════════════════════
--  BGS Teachers Portal — Teacher Approval Workflow
--  Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════

-- 1. Add status column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Update existing profiles (admins to approved, teachers to approved for backward compatibility)
UPDATE public.profiles SET status = 'approved';

-- 2. Create the trigger function to handle new signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract full_name and phone from raw_app_meta_data or raw_user_meta_data
    INSERT INTO public.profiles (id, email, name, phone, role, status)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'phone',
        'teacher', 
        'pending'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 3. RLS Policies
-- First drop existing policies on profiles if any
DROP POLICY IF EXISTS "Allow authenticated users to read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow admins to read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON public.profiles;

-- New Policies:
-- 3a. Everyone can read all profiles (useful for meetings, dropdowns, etc.) or at least their own and admins can read all.
-- We will allow authenticated users to read all profiles (assuming they need to see other teachers).
CREATE POLICY "Allow authenticated users to read profiles" 
ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

-- 3b. Users can update their own profile, but CANNOT change role or status
CREATE POLICY "Allow users to update own profile except role and status"
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id 
    -- These conditions technically prevent the UPDATE if role/status are modified,
    -- but a safer approach is column-level permissions, or just checking in a trigger.
    -- Since Supabase standard RLS doesn't easily do column-level deny without views,
    -- we check that the old row's role/status matches the new row's role/status.
    -- Note: RLS WITH CHECK doesn't easily have access to OLD without a trigger.
    -- However, we can enforce it strictly by ensuring the user is not an admin, 
    -- they just can't change it. Wait, the prompt said: 
    -- "only rows where the requester is an existing admin can update any profile's role/status"
);

-- Actually, to strictly prevent role/status updates from non-admins, we should use a trigger or 
-- simplify the policy by allowing update to ALL columns for admins, and ALL columns for users but restricting role/status.
-- Let's use a trigger for column protection as it's the most robust Postgres way.

CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- If the user making the change is NOT an admin
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        -- Force role and status to remain unchanged
        NEW.role = OLD.role;
        NEW.status = OLD.status;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_profile_columns_trigger ON public.profiles;
CREATE TRIGGER protect_profile_columns_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();

-- Now the Update policy can simply be:
-- Users can update their own row, Admins can update any row.
DROP POLICY IF EXISTS "Users can update own profile or admins can update any" ON public.profiles;
CREATE POLICY "Users can update own profile or admins can update any"
ON public.profiles FOR UPDATE
USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Ensure profiles is enabled for RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- ══════════════════════════════════════════════════
-- ROLLBACK / DOWN INSTRUCTIONS
-- ══════════════════════════════════════════════════
/*
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TRIGGER IF EXISTS protect_profile_columns_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.protect_profile_columns();

ALTER TABLE public.profiles DROP COLUMN status;
*/
