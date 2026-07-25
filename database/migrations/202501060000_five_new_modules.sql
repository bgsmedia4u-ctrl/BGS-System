-- ════════════════════════════════════════════════════════════
-- BGS Teachers Portal - 5 New Modules Schema Updates
-- Tables: leave_requests, syllabus_modules, syllabus_progress, timetable, teacher_tasks
-- ════════════════════════════════════════════════════════════

-- ─── 1. Leave Management ───
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    period TEXT NOT NULL,
    reason TEXT NOT NULL,
    status leave_status DEFAULT 'pending' NOT NULL,
    substitute_teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Teachers can select their own leaves, or leaves where they are the substitute
CREATE POLICY "Teachers can view own leaves" ON public.leave_requests
    FOR SELECT USING (
        auth.uid() = teacher_id 
        OR auth.uid() = substitute_teacher_id
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Teachers can insert their own leaves
CREATE POLICY "Teachers can insert own leaves" ON public.leave_requests
    FOR INSERT WITH CHECK (auth.uid() = teacher_id);

-- Admins can update leaves (approve/reject/assign substitute)
CREATE POLICY "Admins can update leaves" ON public.leave_requests
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ─── 2. Syllabus Tracker ───
CREATE TYPE syllabus_status AS ENUM ('not_started', 'in_progress', 'completed');

-- The modules/chapters definition (Admin controlled)
CREATE TABLE IF NOT EXISTS public.syllabus_modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream TEXT NOT NULL,
    year TEXT NOT NULL,
    class TEXT NOT NULL,
    subject TEXT NOT NULL,
    chapter_name TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.syllabus_modules ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view modules
CREATE POLICY "Anyone can view modules" ON public.syllabus_modules
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can insert/update modules
CREATE POLICY "Admins can insert modules" ON public.syllabus_modules
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "Admins can update modules" ON public.syllabus_modules
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Teacher progress on the modules
CREATE TABLE IF NOT EXISTS public.syllabus_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    module_id UUID REFERENCES public.syllabus_modules(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status syllabus_status DEFAULT 'not_started' NOT NULL,
    completion_date DATE,
    UNIQUE(module_id, teacher_id)
);

ALTER TABLE public.syllabus_progress ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view progress (Admins for global tracking, Teachers to see their own)
CREATE POLICY "Anyone can view progress" ON public.syllabus_progress
    FOR SELECT USING (auth.role() = 'authenticated');

-- Teachers can insert/update their own progress
CREATE POLICY "Teachers can insert own progress" ON public.syllabus_progress
    FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update own progress" ON public.syllabus_progress
    FOR UPDATE USING (auth.uid() = teacher_id);


-- ─── 3. Timetable ───
CREATE TABLE IF NOT EXISTS public.timetable (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream TEXT NOT NULL,
    year TEXT NOT NULL,
    class TEXT NOT NULL,
    day_of_week TEXT NOT NULL, -- e.g. 'Monday', 'Tuesday'
    period TEXT NOT NULL,
    subject TEXT NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(stream, year, class, day_of_week, period)
);

ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view the timetable
CREATE POLICY "Anyone can view timetable" ON public.timetable
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can modify timetable
CREATE POLICY "Admins can modify timetable" ON public.timetable
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );


-- ─── 4. Teacher Tasks ───
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');

CREATE TABLE IF NOT EXISTS public.teacher_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    deadline DATE,
    status task_status DEFAULT 'todo' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.teacher_tasks ENABLE ROW LEVEL SECURITY;

-- Tasks are entirely private to the teacher. Admins CANNOT see them.
CREATE POLICY "Teachers manage own tasks" ON public.teacher_tasks
    FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);


-- ─── ROLLBACK STATEMENTS (Commented) ───
/*
DROP TABLE IF EXISTS public.teacher_tasks;
DROP TYPE IF EXISTS task_status;

DROP TABLE IF EXISTS public.timetable;

DROP TABLE IF EXISTS public.syllabus_progress;
DROP TYPE IF EXISTS syllabus_status;
DROP TABLE IF EXISTS public.syllabus_modules;

DROP TABLE IF EXISTS public.leave_requests;
DROP TYPE IF EXISTS leave_status;
*/
