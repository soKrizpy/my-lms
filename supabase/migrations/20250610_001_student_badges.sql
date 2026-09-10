-- Migration: Student Badges table
-- Applied via: Supabase Dashboard > SQL Editor
-- Status: PENDING
--
-- Changes:
--   1. student_badges  — per-student badge records (one row per badge, ever)
--   2. UNIQUE constraint on (student_id, badge_id)
--   3. RLS enabled; service_role full-access policy (idempotent)
--
-- Satisfies: Requirements 2.1, 2.2, 2.3, 9.1, 9.2, 9.3, 9.4, 9.5

-- ── New table ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.student_badges (
  id          SERIAL       PRIMARY KEY,
  student_id  UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id    TEXT         NOT NULL,
  earned_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── Unique constraint ────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_badges_student_badge_unique'
  ) THEN
    ALTER TABLE public.student_badges
      ADD CONSTRAINT student_badges_student_badge_unique UNIQUE (student_id, badge_id);
  END IF;
END$$;

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'student_badges' AND policyname = 'lms_service_role_all'
  ) THEN
    CREATE POLICY "lms_service_role_all" ON public.student_badges
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END$$;
