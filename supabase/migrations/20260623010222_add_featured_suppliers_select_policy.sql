-- C4: featured_suppliers had RLS enabled but zero policies — NearbyPlaces always returned []
CREATE POLICY "Anyone can read featured suppliers" ON featured_suppliers
  FOR SELECT USING (true);