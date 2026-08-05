-- Add legacy 'pro' plan to allowed plans for company creation
DROP POLICY IF EXISTS "Paid contractors can create company" ON companies;
CREATE POLICY "Paid contractors can create company" ON companies
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contractors
      WHERE id = auth.uid()
        AND plan IN ('bronze', 'silver', 'gold', 'platinum', 'pro')
    )
  );