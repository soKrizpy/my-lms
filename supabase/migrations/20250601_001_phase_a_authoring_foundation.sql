-- Phase A: Authoring data foundation for LMS-managed Lesson Engine content
-- Applied via: Supabase Dashboard → SQL Editor
-- File created for version control history.
--
-- Changes:
--   1. lesson_content JSONB  — stores Lesson Engine JSON authored via LMS
--   2. status TEXT           — draft/published lifecycle state
--   3. published_at TIMESTAMPTZ — timestamp when topic was last published
--   4. UNIQUE constraint on engine_topic_id — prevents duplicate engine links

BEGIN;

-- 1. Lesson content storage (nullable — existing topics have no content yet)
ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS lesson_content JSONB DEFAULT NULL;

-- 2. Authoring lifecycle status (NOT NULL, defaults to draft)
ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
  CONSTRAINT topics_status_check CHECK (status IN ('draft', 'published'));

-- 3. Publish timestamp (nullable — NULL means never published via authoring system)
ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NULL;

-- 4. Prevent two topics from pointing to the same engine topic JSON
--    PostgreSQL UNIQUE allows multiple NULLs — existing NULL rows unaffected
ALTER TABLE public.topics
  ADD CONSTRAINT topics_engine_topic_id_unique UNIQUE (engine_topic_id);

COMMIT;