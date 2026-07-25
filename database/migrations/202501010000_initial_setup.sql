-- ⚠️ WARNING: DO NOT RUN THIS SCRIPT ON A LIVE DATABASE ⚠️
-- This script contains destructive DROP TABLE ... CASCADE statements.
-- It is maintained for HISTORICAL REFERENCE ONLY and requires explicit human sign-off
-- and a verified database backup before execution on any existing environment.
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── 0. CLEANUP (ALLOWS RE-RUNNING SCRIPT) ───
DROP TABLE IF EXISTS public.class_metrics CASCADE;
DROP TABLE IF EXISTS public.exam_sections CASCADE;
DROP TABLE IF EXISTS public.syllabus_entries CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.weekly_reports CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- ─── 1. SECURE ADMIN CHECK FUNCTION ───
-- This function runs with SECURITY DEFINER to bypass RLS and prevent infinite recursion.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─── 2. CREATE TABLES ───

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('teacher', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create weekly_reports table (JSONB architecture for dynamic forms)
CREATE TABLE public.weekly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Report Metadata
    report_date DATE NOT NULL,
    subject TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_at TIMESTAMPTZ,
    
    -- 1. Last Week Section
    topics_covered TEXT,
    is_on_schedule BOOLEAN DEFAULT true,
    challenges TEXT,
    
    -- 2. CET Section
    skip_cet BOOLEAN DEFAULT false,
    cet_book TEXT,
    cet_questions JSONB DEFAULT '[]'::jsonb,
    cet_tests JSONB DEFAULT '[]'::jsonb,
    cet_doubt JSONB DEFAULT '[]'::jsonb,
    
    -- 3. NEET Section
    skip_neet BOOLEAN DEFAULT false,
    neet_book TEXT,
    neet_questions JSONB DEFAULT '[]'::jsonb,
    neet_tests JSONB DEFAULT '[]'::jsonb,
    neet_doubt JSONB DEFAULT '[]'::jsonb,
    
    -- 4. JEE Section
    skip_jee BOOLEAN DEFAULT false,
    jee_book TEXT,
    jee_questions JSONB DEFAULT '[]'::jsonb,
    jee_tests JSONB DEFAULT '[]'::jsonb,
    jee_doubt JSONB DEFAULT '[]'::jsonb,

    -- A user can only have one report per date
    UNIQUE(user_id, report_date)
);

-- Create announcements table (admin broadcasts to teachers)
CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT,
    posted_by TEXT NOT NULL DEFAULT 'Admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;


-- ─── 3. AUTOMATIC PROFILE CREATION TRIGGER ───
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
    new.email,
    -- Auto-promote matching email to admin (replace this email with your admin's email if desired)
    CASE WHEN new.email = 'admin@example.com' THEN 'admin' ELSE 'teacher' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─── 4. UPDATED DATE TRIGGER ───
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.weekly_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ─── 5. ROW LEVEL SECURITY (RLS) POLICIES ───

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_admin());

-- Weekly Reports policies
CREATE POLICY "Users can view their own reports" ON public.weekly_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports" ON public.weekly_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" ON public.weekly_reports
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reports" ON public.weekly_reports
    FOR SELECT USING (public.is_admin());

-- Announcements policies
CREATE POLICY "Anyone can view announcements" ON public.announcements
    FOR SELECT USING (true);

CREATE POLICY "Admins can insert announcements" ON public.announcements
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete announcements" ON public.announcements
    FOR DELETE USING (public.is_admin());
