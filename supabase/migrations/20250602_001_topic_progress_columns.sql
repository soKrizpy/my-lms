-- Phase E: Add missing columns to topic_progress table
-- engine-sync route writes: engine_topic_id, xp_earned, best_quiz_score
-- Current table only has: id, student_id, topic_id, completed_at
-- Applied via: Supabase Dashboard → SQL Editor

ALTER TABLE public.topic_progress
  ADD COLUMN IF NOT EXISTS engine_topic_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS xp_earned INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_quiz_score INTEGER NOT NULL DEFAULT 0;

-- Add unique constraint for upsert (student_id, topic_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'topic_progress_student_topic_unique'
  ) THEN
    ALTER TABLE public.topic_progress
      ADD CONSTRAINT topic_progress_student_topic_unique UNIQUE (student_id, topic_id);
  END IF;
END$$;
