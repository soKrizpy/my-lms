-- Migration: 20250606_001_student_avatars_and_titles.sql
-- Adds avatar_id and title_id columns to public.students table
-- Applied via Supabase Dashboard SQL Editor or automated migration runner.

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS avatar_id TEXT NOT NULL DEFAULT 'pixel-bot',
  ADD COLUMN IF NOT EXISTS title_id TEXT NOT NULL DEFAULT 'novice-coder';

-- Optional comment explaining usage
COMMENT ON COLUMN public.students.avatar_id IS 'Current equipped avatar identifier from the gamification catalog';
COMMENT ON COLUMN public.students.title_id IS 'Current equipped rank title identifier from the gamification catalog';
