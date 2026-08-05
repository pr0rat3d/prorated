-- C2: Fix UPDATE policy — restrict to authenticated, no anonymous writes
DROP POLICY IF EXISTS "Anyone can update helpful count" ON reviews;
CREATE POLICY "Authenticated can update helpful count" ON reviews
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- H3: Drop duplicate open INSERT policies, replace with approved-contractors only
DROP POLICY IF EXISTS "Anyone can insert reviews" ON reviews;
DROP POLICY IF EXISTS "anyone_can_insert_reviews" ON reviews;
CREATE POLICY "Approved contractors can insert reviews" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contractors
      WHERE contractors.id = auth.uid()
        AND contractors.status = 'approved'
    )
  );