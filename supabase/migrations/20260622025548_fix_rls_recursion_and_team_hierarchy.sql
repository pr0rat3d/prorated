
-- ──────────────────────────────────────────────────────────────────────────────
-- FIX: Infinite RLS recursion + clean up team/company policies
--
-- Root cause of recursion:
--   companies SELECT "Members can read their company" → subqueries invites
--   invites ALL "Company owners can manage invites"   → subqueries companies
--   → infinite loop
--
-- Fix strategy:
--   1. SECURITY DEFINER helper to safely read own company_id without RLS
--   2. Replace invites policy to use contractors (not companies)
--   3. Consolidate companies SELECT policies (remove invite subquery)
--   4. Add teammate visibility on contractors
--   5. Add missing phone + license_number columns
-- ──────────────────────────────────────────────────────────────────────────────

-- ── 1. SECURITY DEFINER helper ────────────────────────────────────────────────
-- Bypasses RLS when called from within a policy, breaking any self/cross-table
-- recursion that would otherwise occur from same-table subqueries.
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT company_id FROM contractors WHERE id = auth.uid() LIMIT 1;
$$;

-- ── 2. Fix invites policies ───────────────────────────────────────────────────
-- OLD "Company owners can manage invites":
--   company_id IN (SELECT companies.id FROM companies WHERE owner_id = auth.uid())
--   ↑ queries companies → triggers companies policy → queries invites → LOOP
--
-- NEW: look up ownership via contractors (no companies reference = no loop)
DROP POLICY IF EXISTS "Company owners can manage invites" ON public.invites;

CREATE POLICY "owners_manage_invites" ON public.invites
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.contractors
      WHERE id = auth.uid()
        AND company_role = 'owner'
        AND company_id IS NOT NULL
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.contractors
      WHERE id = auth.uid()
        AND company_role = 'owner'
        AND company_id IS NOT NULL
    )
  );

-- ── 3. Consolidate companies SELECT policies ──────────────────────────────────
-- Drop the two overlapping SELECT policies (one had the invite subquery causing
-- the recursion entry point; the other was a near-duplicate).
DROP POLICY IF EXISTS "Members can read their company" ON public.companies;
DROP POLICY IF EXISTS "Owners can view their company"  ON public.companies;

-- Single clean policy: owner OR member can read their company.
-- Only references contractors, which has no companies reference in its policies.
CREATE POLICY "members_read_own_company" ON public.companies
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT company_id FROM public.contractors
      WHERE id = auth.uid() AND company_id IS NOT NULL
    )
  );

-- Anon invite-link read stays as-is ("Anyone can read company name for invite")
-- It queries invites which has qual=true policies, so no recursion there.

-- ── 4. Teammate visibility on contractors ─────────────────────────────────────
-- Without this, owners can only see their own contractor row and can't list
-- team members through the app's auth key.
-- Uses get_my_company_id() (SECURITY DEFINER) to avoid same-table recursion.
CREATE POLICY "teammates_read_each_other" ON public.contractors
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR (
      company_id IS NOT NULL
      AND company_id = public.get_my_company_id()
    )
  );

-- ── 5. Add missing columns ────────────────────────────────────────────────────
-- AdminPage.js and profile pages reference license_number and phone;
-- the table only had "license". Add both so frontend code works without
-- a schema change requiring a code deploy.
ALTER TABLE public.contractors
  ADD COLUMN IF NOT EXISTS license_number text,
  ADD COLUMN IF NOT EXISTS phone text;

-- Back-fill license_number from the existing license column so existing
-- data is not lost (license stays as legacy alias).
UPDATE public.contractors
  SET license_number = license
  WHERE license_number IS NULL AND license IS NOT NULL;
