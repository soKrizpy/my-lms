-- Migration: 20260927_001_town_square_pet_and_shop.sql
-- Adds:
--   1. student_pets table   — CyPeCo Cyber Pet Companion incubator
--   2. students columns     — coins, equipped_hat_id, inventory (Roblox-style avatar shop)
-- Run this in your Supabase SQL Editor (Project → SQL Editor → New Query)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CyPeCo student_pets table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_pets (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Pet identity
  pet_name        TEXT NOT NULL DEFAULT 'Telur CyPeCo',
  stage           TEXT NOT NULL DEFAULT 'EGG',          -- 'EGG' | 'READY_TO_HATCH' | 'BABY_PET'
  species_id      TEXT DEFAULT NULL,                     -- matches BabyPetSpecies.id in cypecoCatalog.ts

  -- Hatch progress (0–100)
  hatch_progress  INT NOT NULL DEFAULT 0,

  -- Data Fragment accumulators
  logic_data      INT NOT NULL DEFAULT 0,
  creative_data   INT NOT NULL DEFAULT 0,
  spatial_data    INT NOT NULL DEFAULT 0,

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT student_pets_student_id_unique UNIQUE (student_id)
);

-- Row Level Security: each student can only access their own pet
ALTER TABLE public.student_pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_pets_select_own"
  ON public.student_pets FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "student_pets_insert_own"
  ON public.student_pets FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "student_pets_update_own"
  ON public.student_pets FOR UPDATE
  USING (auth.uid() = student_id);

-- Service-role (admin) can bypass RLS for all pet operations
-- (already bypassed when using supabaseAdmin with service key)


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Avatar Shop columns on public.students
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS coins          INT     NOT NULL DEFAULT 150,
  ADD COLUMN IF NOT EXISTS equipped_hat_id TEXT            DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS inventory      JSONB   NOT NULL DEFAULT '[]'::JSONB;

-- Index on student_pets for fast single-row lookups
CREATE INDEX IF NOT EXISTS idx_student_pets_student_id
  ON public.student_pets (student_id);

-- Helpful comment
COMMENT ON TABLE public.student_pets IS
  'One CyPeCo pet egg per student; tracks incubation progress and hatched species.';
COMMENT ON COLUMN public.students.coins IS
  'In-game Cyber Coins earned by completing lessons, quizzes, and classes. Used to buy avatar accessories.';
COMMENT ON COLUMN public.students.equipped_hat_id IS
  'ID of the currently equipped headgear accessory from avatarShopCatalog.ts, or NULL if none.';
COMMENT ON COLUMN public.students.inventory IS
  'JSON array of purchased accessory IDs (strings) from avatarShopCatalog.ts.';
