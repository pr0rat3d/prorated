-- Bid Intelligence feature flag system
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  early_access_plans TEXT[] DEFAULT NULL,
  threshold_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO feature_flags (name, enabled, early_access_plans, threshold_description)
VALUES (
  'bid_intelligence',
  false,
  NULL,
  'Early access Gold/Platinum at 50+ reviews. Full launch at 200+ reviews.'
)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read feature flags" ON feature_flags;
CREATE POLICY "Anyone can read feature flags"
ON feature_flags FOR SELECT USING (true);

-- Admin notes on contractor records
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Dispute flag on reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS disputed BOOLEAN DEFAULT false;