-- ==============================================================================
-- Phase 2 Migration: Daily Timetable, Auto-Allotted Slots & Web Push Subscriptions
-- Plus Phase 3-5 backward-compatible columns
-- ==============================================================================

-- 1. TIMETABLE FIXED BLOCKS
CREATE TABLE IF NOT EXISTS public.timetable_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_time TEXT NOT NULL, -- 'HH:mm'
    end_time TEXT NOT NULL,   -- 'HH:mm'
    day_type TEXT NOT NULL DEFAULT 'All Days', -- 'All Days', 'Weekdays', 'Weekends'
    category TEXT NOT NULL DEFAULT 'Fixed',    -- 'Fixed', 'Rest', 'Commute', 'Personal'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. AUTO-ALLOTTED STUDY SLOTS
CREATE TABLE IF NOT EXISTS public.allotted_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    title TEXT NOT NULL,
    start_time TEXT NOT NULL, -- 'HH:mm'
    end_time TEXT NOT NULL,   -- 'HH:mm'
    slot_type TEXT NOT NULL DEFAULT 'Topic', -- 'Revision', 'Topic', 'PYQ', 'Vault'
    subject_id UUID REFERENCES public.gate_subjects(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.gate_topics(id) ON DELETE SET NULL,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. WEB PUSH SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    pre_alert_mins INT NOT NULL DEFAULT 5,
    evening_reminder_time TEXT NOT NULL DEFAULT '20:30',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backward-compatible extensions for Phases 3-5
ALTER TABLE public.gate_subjects ADD COLUMN IF NOT EXISTS weightage_marks NUMERIC(4, 1) DEFAULT 8.0;
ALTER TABLE public.gate_topics ADD COLUMN IF NOT EXISTS subtopic TEXT;
ALTER TABLE public.gate_topics ADD COLUMN IF NOT EXISTS last_revised_on DATE;
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS focus_quality TEXT DEFAULT 'Deep';
ALTER TABLE public.mistake_logs ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.mock_tests ADD COLUMN IF NOT EXISTS aptitude_marks NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE public.mock_tests ADD COLUMN IF NOT EXISTS core_marks NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS target_gate_score NUMERIC(5, 1) DEFAULT 65.0;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS secondary_exam_title TEXT;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS secondary_exam_date DATE;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS streak_freeze_dates TEXT[] DEFAULT '{}';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_timetable_user ON public.timetable_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_allotted_user_date ON public.allotted_slots(user_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_push_user ON public.push_subscriptions(user_id);

-- RLS Policies
ALTER TABLE public.timetable_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allotted_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own timetable blocks" ON public.timetable_blocks
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own allotted slots" ON public.allotted_slots
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own push subscriptions" ON public.push_subscriptions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
