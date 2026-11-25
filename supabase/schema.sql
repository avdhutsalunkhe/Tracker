-- ==============================================================================
-- TRACKER: Daily Habit & GATE Study PWA - Supabase Database Schema
-- Run this script in your Supabase Project SQL Editor (Dashboard -> SQL Editor)
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. USER SETTINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    gate_exam_date DATE NOT NULL DEFAULT '2028-02-01',
    daily_study_goal_hours NUMERIC(4, 1) NOT NULL DEFAULT 6.0,
    pomodoro_focus_mins INT NOT NULL DEFAULT 50,
    pomodoro_break_mins INT NOT NULL DEFAULT 10,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. DAILY HABITS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    time_slot TEXT NOT NULL DEFAULT 'Anytime', -- 'Morning', 'Afternoon', 'Evening', 'Anytime'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. HABIT LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_id UUID NOT NULL REFERENCES public.daily_habits(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT TRUE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT habit_logs_habit_date_unique UNIQUE (habit_id, log_date)
);

-- ------------------------------------------------------------------------------
-- 4. DAILY TASKS TABLE (One-off tasks per date)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    task_date DATE NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Medium', -- 'Low', 'Medium', 'High'
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. GATE SUBJECTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gate_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366F1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. GATE TOPICS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gate_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.gate_subjects(id) ON DELETE CASCADE,
    topic_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Not Started', -- 'Not Started', 'In Progress', 'Completed'
    covered_date DATE,
    confidence INT NOT NULL DEFAULT 3, -- 1 to 5
    pyqs_solved INT NOT NULL DEFAULT 0,
    study_hours NUMERIC(5, 1) NOT NULL DEFAULT 0.0,
    notes TEXT,
    revision_count INT NOT NULL DEFAULT 0,
    next_revision_date DATE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. GATE REVISIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gate_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.gate_topics(id) ON DELETE CASCADE,
    revision_number INT NOT NULL,
    revised_on DATE NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. STUDY SESSIONS TABLE (Pomodoro & Stopwatch logs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.gate_subjects(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.gate_topics(id) ON DELETE SET NULL,
    session_date DATE NOT NULL,
    duration_minutes INT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'Pomodoro', -- 'Pomodoro', 'Stopwatch'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. MOCK TESTS & PYQ SCOREBOARD TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mock_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    test_type TEXT NOT NULL DEFAULT 'Full Length', -- 'Full Length', 'Subject Test', 'PYQ Paper', 'Topic Test'
    subject_id UUID REFERENCES public.gate_subjects(id) ON DELETE SET NULL,
    test_date DATE NOT NULL,
    marks_scored NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    total_marks NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    correct_count INT NOT NULL DEFAULT 0,
    wrong_count INT NOT NULL DEFAULT 0,
    unattempted_count INT NOT NULL DEFAULT 0,
    negative_marks NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. MISTAKE NOTEBOOK TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mistake_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.gate_subjects(id) ON DELETE SET NULL,
    mock_test_id UUID REFERENCES public.mock_tests(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Conceptual Gap', -- 'Conceptual Gap', 'Silly / Calculation', 'Formula Forgotten', 'Time Pressure'
    fix_note TEXT,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 11. FORMULA VAULT & FLASHCARDS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.gate_subjects(id) ON DELETE SET NULL,
    front_prompt TEXT NOT NULL,
    back_answer TEXT NOT NULL,
    needs_review BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_habits_user_sort ON public.daily_habits(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON public.habit_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON public.daily_tasks(user_id, task_date);
CREATE INDEX IF NOT EXISTS idx_subjects_user ON public.gate_subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_user_sub ON public.gate_topics(user_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_revision ON public.gate_topics(user_id, next_revision_date);
CREATE INDEX IF NOT EXISTS idx_revisions_user_topic ON public.gate_revisions(user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON public.study_sessions(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_mock_tests_user_date ON public.mock_tests(user_id, test_date);
CREATE INDEX IF NOT EXISTS idx_mistakes_user_resolved ON public.mistake_logs(user_id, is_resolved);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_review ON public.flashcards(user_id, needs_review);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict data isolation: Users can only select, insert, update, delete their own rows
-- ==============================================================================
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistake_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- user_settings policies
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON public.user_settings FOR DELETE USING (auth.uid() = user_id);

-- daily_habits policies
CREATE POLICY "Users can view own habits" ON public.daily_habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habits" ON public.daily_habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON public.daily_habits FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON public.daily_habits FOR DELETE USING (auth.uid() = user_id);

-- habit_logs policies
CREATE POLICY "Users can view own habit logs" ON public.habit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habit logs" ON public.habit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habit logs" ON public.habit_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own habit logs" ON public.habit_logs FOR DELETE USING (auth.uid() = user_id);

-- daily_tasks policies
CREATE POLICY "Users can view own tasks" ON public.daily_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.daily_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.daily_tasks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.daily_tasks FOR DELETE USING (auth.uid() = user_id);

-- gate_subjects policies
CREATE POLICY "Users can view own subjects" ON public.gate_subjects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subjects" ON public.gate_subjects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subjects" ON public.gate_subjects FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own subjects" ON public.gate_subjects FOR DELETE USING (auth.uid() = user_id);

-- gate_topics policies
CREATE POLICY "Users can view own topics" ON public.gate_topics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own topics" ON public.gate_topics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own topics" ON public.gate_topics FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own topics" ON public.gate_topics FOR DELETE USING (auth.uid() = user_id);

-- gate_revisions policies
CREATE POLICY "Users can view own revisions" ON public.gate_revisions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own revisions" ON public.gate_revisions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own revisions" ON public.gate_revisions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own revisions" ON public.gate_revisions FOR DELETE USING (auth.uid() = user_id);

-- study_sessions policies
CREATE POLICY "Users can view own sessions" ON public.study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.study_sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.study_sessions FOR DELETE USING (auth.uid() = user_id);

-- mock_tests policies
CREATE POLICY "Users can view own mock tests" ON public.mock_tests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mock tests" ON public.mock_tests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mock tests" ON public.mock_tests FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own mock tests" ON public.mock_tests FOR DELETE USING (auth.uid() = user_id);

-- mistake_logs policies
CREATE POLICY "Users can view own mistakes" ON public.mistake_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mistakes" ON public.mistake_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mistakes" ON public.mistake_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own mistakes" ON public.mistake_logs FOR DELETE USING (auth.uid() = user_id);

-- flashcards policies
CREATE POLICY "Users can view own flashcards" ON public.flashcards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own flashcards" ON public.flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flashcards" ON public.flashcards FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own flashcards" ON public.flashcards FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- TRIGGER TO AUTOMATICALLY INITIALIZE USER SETTINGS ON SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_settings (user_id, gate_exam_date, daily_study_goal_hours, pomodoro_focus_mins, pomodoro_break_mins)
    VALUES (NEW.id, '2027-02-06', 6.0, 50, 10)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
