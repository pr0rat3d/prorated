-- Both "Remove member" and "Delete team workspace" have been silently
-- broken since they were built: the only UPDATE policy on contractors is
-- auth.uid() = id (self-only), so an owner's PATCH on a teammate's row was
-- always rejected by RLS (0 rows affected, no error surfaced to the app).
-- companies also has no DELETE policy at all, so the final step of
-- "Delete team workspace" silently failed too. Verified both live via
-- rolled-back transactions before writing this fix.
--
-- Fixed via SECURITY DEFINER functions rather than a broader RLS policy —
-- a policy permissive enough to allow nulling company_id/company_role would
-- need WITH CHECK(true), which (RLS being row- not column-scoped) would let
-- an owner PATCH ANY column on a teammate's row via a crafted request, not
-- just the two this actually needs.

CREATE OR REPLACE FUNCTION public.remove_team_member(p_member_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  my_company_id UUID;
  my_role TEXT;
  target_company_id UUID;
BEGIN
  SELECT company_id, company_role INTO my_company_id, my_role
  FROM public.contractors WHERE id = auth.uid();

  IF my_role IS DISTINCT FROM 'owner' OR my_company_id IS NULL THEN
    RAISE EXCEPTION 'Only a company owner can remove team members';
  END IF;

  IF p_member_id = auth.uid() THEN
    RAISE EXCEPTION 'Use delete_company_workspace to remove yourself as owner';
  END IF;

  SELECT company_id INTO target_company_id
  FROM public.contractors WHERE id = p_member_id;

  IF target_company_id IS DISTINCT FROM my_company_id THEN
    RAISE EXCEPTION 'That contractor is not a member of your company';
  END IF;

  UPDATE public.contractors
  SET company_id = NULL, company_role = NULL
  WHERE id = p_member_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_team_member(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_company_workspace(p_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = p_company_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the company owner can delete this workspace';
  END IF;

  -- company_id would self-heal via the FK's ON DELETE SET NULL once the
  -- companies row is gone, but company_role has no such cascade and must
  -- be cleared explicitly, so do both together here.
  UPDATE public.contractors
  SET company_id = NULL, company_role = NULL
  WHERE company_id = p_company_id;

  DELETE FROM public.companies WHERE id = p_company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_company_workspace(UUID) TO authenticated;