-- Add account_type to contractors table
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'contractor' 
CHECK (account_type IN ('contractor', 'realtor', 'admin'));

-- Realtor subscriptions table
CREATE TABLE IF NOT EXISTS realtor_subscriptions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  full_name    TEXT,
  agency       TEXT,
  license_num  TEXT,
  state        TEXT,
  plan         TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  status       TEXT DEFAULT 'active',
  lookups_used INT DEFAULT 0,
  lookups_reset TIMESTAMPTZ DEFAULT date_trunc('month', now()),
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_realtor_user_id ON realtor_subscriptions(user_id);

-- RLS
ALTER TABLE realtor_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Realtors can view own record"
ON realtor_subscriptions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Realtors can insert own record"
ON realtor_subscriptions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Realtor address lookups log
CREATE TABLE IF NOT EXISTS realtor_lookups (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  address    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_realtor_lookups_user ON realtor_lookups(user_id);

SELECT 'Realtor tables created successfully' as status;
