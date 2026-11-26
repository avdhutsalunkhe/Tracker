-- ==============================================================================
-- SUPABASE STORAGE & STUDY DOCUMENTS MIGRATION
-- Stores .pdf, .ppt, .pptx, .md files in Supabase Storage ("study-files")
-- and metadata in public.study_documents (Notes, DPP, Practice, Test Questions).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.study_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    paper TEXT NOT NULL DEFAULT 'DA', -- 'DA' | 'CS'
    subject_id UUID REFERENCES public.gate_subjects(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.gate_topics(id) ON DELETE SET NULL,
    category TEXT NOT NULL DEFAULT 'Notes', -- 'Notes' | 'DPP' | 'Practice Questions' | 'Test Questions'
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    storage_path TEXT NOT NULL,
    solved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_documents_user_cat
    ON public.study_documents(user_id, category, created_at DESC);

ALTER TABLE public.study_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own study_documents" ON public.study_documents;
CREATE POLICY "Users can manage own study_documents"
    ON public.study_documents
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create private Storage bucket for PDF, PPT, PPTX, MD documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('study-files', 'study-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies: users can only read/write/delete inside their own <uid>/ folder
DROP POLICY IF EXISTS "Users can upload own study files" ON storage.objects;
CREATE POLICY "Users can upload own study files"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'study-files'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can view own study files" ON storage.objects;
CREATE POLICY "Users can view own study files"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'study-files'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can delete own study files" ON storage.objects;
CREATE POLICY "Users can delete own study files"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'study-files'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
