-- Harden the privileged assignment RPC used by the admin-only status route.
-- The function is invoked through the service-role client; it must not remain
-- executable by PUBLIC just because it is SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.activate_learning_path(
  p_student_id UUID,
  p_module_id INTEGER
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.student_modules
    SET status = 'paused'
  WHERE student_id = p_student_id
    AND module_id != p_module_id;

  UPDATE public.student_modules
    SET status = 'active'
  WHERE student_id = p_student_id
    AND module_id = p_module_id;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_learning_path(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_learning_path(UUID, INTEGER) TO service_role;
