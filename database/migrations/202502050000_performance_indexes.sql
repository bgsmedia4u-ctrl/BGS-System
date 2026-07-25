-- System Design Corrections: Performance Indexes

-- 1. weekly_reports
CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_id ON public.weekly_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_report_date ON public.weekly_reports(report_date);

-- 2. tests
-- Composite index for batch filtering
CREATE INDEX IF NOT EXISTS idx_tests_batch ON public.tests(stream, year, class);

-- 3. mark_entries
CREATE INDEX IF NOT EXISTS idx_mark_entries_test_id ON public.mark_entries(test_id);
CREATE INDEX IF NOT EXISTS idx_mark_entries_student_id ON public.mark_entries(student_id);

-- 4. meeting_attendees
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_teacher_id ON public.meeting_attendees(teacher_id);

-- 5. announcements
-- Usually ordered by created_at desc
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);
