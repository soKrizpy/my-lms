-- Migration: Add `source` column to quizzes and quiz_questions tables
-- File: 20260923_001_quiz_engine_source.sql
-- Applied via: Supabase Dashboard > SQL Editor
-- Status: PENDING
--
-- Changes:
--   1. quizzes.source TEXT DEFAULT 'manual'
--      — traces where the quiz was created: 'manual' | 'csv' | 'engine'
--   2. quiz_questions.source TEXT DEFAULT 'manual'
--      — traces where each question came from: 'manual' | 'csv' | 'engine'
--   3. Backfills existing rows to 'manual' (safe default)
--
-- Replaces the fragile string-matching heuristic in student/page.tsx
-- (searching for 'csv' in engine_topic_id or lesson_content JSON strings).
--
-- Safety: ADD COLUMN IF NOT EXISTS is idempotent. Safe on production.

ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
  CONSTRAINT quizzes_source_check CHECK (source IN ('manual', 'csv', 'engine'));

ALTER TABLE public.quiz_questions
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
  CONSTRAINT quiz_questions_source_check CHECK (source IN ('manual', 'csv', 'engine'));

-- Backfill existing rows (no-op if columns were just added with DEFAULT)
UPDATE public.quizzes         SET source = 'manual' WHERE source IS NULL;
UPDATE public.quiz_questions  SET source = 'manual' WHERE source IS NULL;

-- RLS policies: source column inherits existing lms_service_role_all policies.
-- No additional policy changes required.
