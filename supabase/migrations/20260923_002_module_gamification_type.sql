-- Add gamification_type column to public.modules table
-- Default: 'mimo'
-- Supported gamification engine types: 'mimo', 'duolingo', 'boardgame', 'quest', 'flashcard'

ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS gamification_type TEXT NOT NULL DEFAULT 'mimo';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'modules_gamification_type_check'
  ) THEN
    ALTER TABLE public.modules
      ADD CONSTRAINT modules_gamification_type_check
      CHECK (gamification_type IN ('mimo', 'duolingo', 'boardgame', 'quest', 'flashcard'));
  END IF;
END$$;
