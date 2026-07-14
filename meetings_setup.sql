-- 1. Add department to profiles if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='profiles' AND column_name='department') THEN
        ALTER TABLE public.profiles ADD COLUMN department TEXT;
    END IF;
END $$;

-- 2. Create meetings table
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    meeting_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location TEXT,
    audience_type TEXT NOT NULL CHECK (audience_type IN ('all_staff', 'department', 'individual')),
    department TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create meeting_attendees table
CREATE TABLE IF NOT EXISTS public.meeting_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    UNIQUE(meeting_id, teacher_id)
);

-- 4. Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Admins have full access to meetings" ON public.meetings;
DROP POLICY IF EXISTS "Teachers can view targeted meetings" ON public.meetings;
DROP POLICY IF EXISTS "Admins have full access to meeting_attendees" ON public.meeting_attendees;
DROP POLICY IF EXISTS "Teachers can view meeting attendees" ON public.meeting_attendees;

-- Admin policies
CREATE POLICY "Admins have full access to meetings" ON public.meetings
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins have full access to meeting_attendees" ON public.meeting_attendees
    FOR ALL USING (public.is_admin());

-- Teacher policies
CREATE POLICY "Teachers can view targeted meetings" ON public.meetings
    FOR SELECT USING (
        audience_type = 'all_staff' OR 
        (audience_type = 'department' AND department = (SELECT p.department FROM public.profiles p WHERE p.id = auth.uid())) OR
        (audience_type = 'individual' AND id IN (SELECT ma.meeting_id FROM public.meeting_attendees ma WHERE ma.teacher_id = auth.uid()))
    );

CREATE POLICY "Teachers can view meeting attendees" ON public.meeting_attendees
    FOR SELECT USING (
        meeting_id IN (
            SELECT m.id FROM public.meetings m WHERE 
            m.audience_type = 'all_staff' OR 
            (m.audience_type = 'department' AND m.department = (SELECT p.department FROM public.profiles p WHERE p.id = auth.uid())) OR
            (m.audience_type = 'individual' AND m.id IN (SELECT ma2.meeting_id FROM public.meeting_attendees ma2 WHERE ma2.teacher_id = auth.uid()))
        )
    );

-- 6. Trigger for updated_at
DROP TRIGGER IF EXISTS update_meetings_updated_at ON public.meetings;
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
