-- Migration: Module Assessment (Tryout) tables
-- Applied via: Supabase Dashboard > SQL Editor
-- Status: PENDING
--
-- Changes:
--   1. module_assessments             -- one assessment per module (title only)
--   2. module_assessment_questions    -- multiple-choice questions per assessment
--   3. module_assessment_attempts     -- per-student attempt records (max 2)
--   4. UNIQUE constraint on module_id in module_assessments
--   5. UNIQUE constraint on (student_id, assessment_id, attempt_number) in module_assessment_attempts
--   6. RLS enabled on all three new tables
--   7. service_role policy: full access for all LMS API routes
--
-- Satisfies: Requirements 1.1, 9.1, 9.3

-- ── New tables ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.module_assessments (
  id         SERIAL PRIMARY KEY,
  module_id  INTEGER NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL CHECK (char_length(title) BETWEEN 1 AND 255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'module_assessments_module_id_unique'
  ) THEN
    ALTER TABLE public.module_assessments
      ADD CONSTRAINT module_assessments_module_id_unique UNIQUE (module_id);
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.module_assessment_questions (
  id             SERIAL PRIMARY KEY,
  assessment_id  INTEGER NOT NULL REFERENCES public.module_assessments(id) ON DELETE CASCADE,
  question_text  TEXT    NOT NULL CHECK (char_length(question_text) BETWEEN 1 AND 500),
  option_a       TEXT    NOT NULL CHECK (char_length(option_a)  BETWEEN 1 AND 200),
  option_b       TEXT    NOT NULL CHECK (char_length(option_b)  BETWEEN 1 AND 200),
  option_c       TEXT    NOT NULL CHECK (char_length(option_c)  BETWEEN 1 AND 200),
  option_d       TEXT    NOT NULL CHECK (char_length(option_d)  BETWEEN 1 AND 200),
  correct_option TEXT    NOT NULL CHECK (correct_option IN ('A','B','C','D')),
  order_index    INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.module_assessment_attempts (
  id              SERIAL PRIMARY KEY,
  student_id      UUID     NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id   INTEGER  NOT NULL REFERENCES public.module_assessments(id) ON DELETE CASCADE,
  attempt_number  SMALLINT NOT NULL CHECK (attempt_number BETWEEN 1 AND 2),
  score           SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  best_score      SMALLINT NOT NULL CHECK (best_score BETWEEN 0 AND 100),
  total_questions SMALLINT NOT NULL,
  correct_count   SMALLINT NOT NULL,
  -- JSONB map: { "<question_id>": "A" | "B" | "C" | "D" }
  answers         JSONB    NOT NULL DEFAULT '{}',
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'module_assessment_attempts_unique'
  ) THEN
    ALTER TABLE public.module_assessment_attempts
      ADD CONSTRAINT module_assessment_attempts_unique
        UNIQUE (student_id, assessment_id, attempt_number);
  END IF;
END$$;

-- ── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.module_assessments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_assessment_attempts  ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'module_assessments' AND policyname = 'lms_service_role_all'
  ) THEN
    CREATE POLICY "lms_service_role_all" ON public.module_assessments
      TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'module_assessment_questions' AND policyname = 'lms_service_role_all'
  ) THEN
    CREATE POLICY "lms_service_role_all" ON public.module_assessment_questions
      TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'module_assessment_attempts' AND policyname = 'lms_service_role_all'
  ) THEN
    CREATE POLICY "lms_service_role_all" ON public.module_assessment_attempts
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END$$;
