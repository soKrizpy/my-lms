-- Migration: engine_progress table for Lesson Engine state persistence
-- Stores serialized StudentState JSON per (student_id, topic_id) pair.
-- Used by the HybridAdapter in the Engine when a studentId is available.

CREATE TABLE IF NOT EXISTS public.engine_progress (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL,
  topic_id    TEXT NOT NULL,
  state_json  JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT engine_progress_student_topic_unique UNIQUE (student_id, topic_id)
);

-- Index for fast lookups by student
CREATE INDEX IF NOT EXISTS engine_progress_student_idx
  ON public.engine_progress (student_id);

-- RLS
ALTER TABLE public.engine_progress ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'engine_progress'
      AND policyname = 'lms_service_role_all'
  ) THEN
    CREATE POLICY "lms_service_role_all"
      ON public.engine_progress
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END$$;
