-- Phase A: Authoring data foundation for LMS-managed Lesson Engine content
-- Applied via: Supabase Dashboard > SQL Editor
-- File created for version control history.
-- Status: APPLIED to production on 2025-06-01
--
-- Changes:
--   1. lesson_content JSONB       -- stores Lesson Engine JSON authored via LMS
--   2. status TEXT                -- draft/published lifecycle state (default: 'draft')
--   3. published_at TIMESTAMPTZ   -- timestamp when topic was last published
--   4. UNIQUE constraint on engine_topic_id -- prevents duplicate engine links
--   5. RLS enabled on topics, modules, quizzes, quiz_questions
--   6. service_role policy: full access for all LMS API routes
--   7. Removed pre-existing "Public read/insert" policies (overly permissive)
--
-- NOTE: ADD CONSTRAINT does not support IF NOT EXISTS in PostgreSQL.
-- The idempotent form uses DO $$ ... END$$ blocks (applied in Dashboard).

-- ============================================================
-- SCHEMA CHANGES
-- ============================================================

ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS lesson_content JSONB DEFAULT NULL;

ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
  CONSTRAINT topics_status_check CHECK (status IN ('draft', 'published'));

ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'topics_engine_topic_id_unique'
  ) THEN
    ALTER TABLE public.topics
      ADD CONSTRAINT topics_engine_topic_id_unique UNIQUE (engine_topic_id);
  END IF;
END$$;

-- ============================================================
-- RLS: ENABLE + POLICIES
-- ============================================================

ALTER TABLE public.topics         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Remove legacy permissive public policies
DROP POLICY IF EXISTS "Public read topics"            ON public.topics;
DROP POLICY IF EXISTS "Public insert topics"          ON public.topics;
DROP POLICY IF EXISTS "Public read modules"           ON public.modules;
DROP POLICY IF EXISTS "Public insert modules"         ON public.modules;
DROP POLICY IF EXISTS "Public read quizzes"           ON public.quizzes;
DROP POLICY IF EXISTS "Public insert quizzes"         ON public.quizzes;
DROP POLICY IF EXISTS "Public read quiz_questions"    ON public.quiz_questions;
DROP POLICY IF EXISTS "Public insert quiz_questions"  ON public.quiz_questions;

-- Grant full access to service_role (used by all LMS API routes via getSupabaseAdmin())
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='topics' AND policyname='lms_service_role_all') THEN
    CREATE POLICY "lms_service_role_all" ON public.topics         TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='modules' AND policyname='lms_service_role_all') THEN
    CREATE POLICY "lms_service_role_all" ON public.modules        TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quizzes' AND policyname='lms_service_role_all') THEN
    CREATE POLICY "lms_service_role_all" ON public.quizzes        TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quiz_questions' AND policyname='lms_service_role_all') THEN
    CREATE POLICY "lms_service_role_all" ON public.quiz_questions TO service_role USING (true) WITH CHECK (true);
  END IF;
END$$;