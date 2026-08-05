-- M3: Revoke EXECUTE on all security-definer functions from anon
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure::text AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    BEGIN
      EXECUTE 'REVOKE EXECUTE ON FUNCTION ' || r.sig || ' FROM anon';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

-- M6: Drop overly-broad admin policies (public role = anon can write/read all contractors)
-- Service role bypasses RLS by default; admin proxy already uses service key for writes
DROP POLICY IF EXISTS "admin_write_contractors" ON contractors;
DROP POLICY IF EXISTS "admin_read_contractors"  ON contractors;

-- M10: Fix companies INSERT — require paid plan, not just any authenticated user
DROP POLICY IF EXISTS "Owners can insert company" ON companies;
CREATE POLICY "Paid contractors can create company" ON companies
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contractors
      WHERE id = auth.uid()
        AND plan IN ('bronze', 'silver', 'gold', 'platinum')
    )
  );