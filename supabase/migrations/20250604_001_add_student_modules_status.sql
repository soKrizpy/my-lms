-- Migration: add status column to student_modules and create activate_learning_path RPC
-- Requirements: 1.1, 1.2, 1.3, 2.1, 3.3

-- 1. Add status column with CHECK constraint and DEFAULT 'active'
ALTER TABLE student_modules
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'paused'));

-- 2. Back-fill any existing records that might have NULL status
--    (handles edge case where DEFAULT was not applied retroactively)
UPDATE student_modules SET status = 'active' WHERE status IS NULL;

-- 3. Create RPC function for atomic activate operation
--    Both UPDATEs run inside a single implicit Postgres transaction,
--    ensuring the single-active-per-student invariant is enforced atomically.
CREATE OR REPLACE FUNCTION activate_learning_path(
  p_student_id UUID,
  p_module_id  INTEGER
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Step 1: Pause all other modules for this student
  UPDATE student_modules
    SET status = 'paused'
  WHERE student_id = p_student_id
    AND module_id  != p_module_id;

  -- Step 2: Activate the requested module
  UPDATE student_modules
    SET status = 'active'
  WHERE student_id = p_student_id
    AND module_id  = p_module_id;
END;
$$;
