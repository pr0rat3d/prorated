-- H6: realtor_lookups had RLS enabled but zero policies — usage analytics never recorded
CREATE POLICY "Users can insert own lookups" ON realtor_lookups
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own lookups" ON realtor_lookups
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);