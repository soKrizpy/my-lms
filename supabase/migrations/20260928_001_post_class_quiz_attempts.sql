-- Migration: post_class_quiz_attempts
-- Stores attempt records for post-class quizzes sourced from lesson_content.post_class_quiz JSONB.
-- Separate from quiz_attempts (which is for relational quiz_questions / System A).

CREATE TABLE IF NOT EXISTS public.post_class_quiz_attempts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id          INTEGER NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  score             INTEGER NOT NULL DEFAULT 0,   -- last attempt score
  best_score        INTEGER NOT NULL DEFAULT 0,   -- highest score across attempts
  attempts_count    INTEGER NOT NULL DEFAULT 0,   -- 1 or 2 (max 2)
  last_submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT post_class_quiz_attempts_student_topic_unique UNIQUE (student_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_pcqa_student_id ON public.post_class_quiz_attempts (student_id);
CREATE INDEX IF NOT EXISTS idx_pcqa_topic_id   ON public.post_class_quiz_attempts (topic_id);

ALTER TABLE public.post_class_quiz_attempts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'post_class_quiz_attempts' AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY "service_role_all" ON public.post_class_quiz_attempts
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END$$;
