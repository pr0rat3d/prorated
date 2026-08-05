-- C3: review_edit_requests had RLS enabled but zero policies — feature was fully broken
CREATE POLICY "Authenticated can read edit requests" ON review_edit_requests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own edit requests" ON review_edit_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own edit requests" ON review_edit_requests
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);