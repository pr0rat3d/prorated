-- NDA signatures table
CREATE TABLE IF NOT EXISTS nda_signatures (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email   TEXT NOT NULL,
  full_name    TEXT,
  nda_version  TEXT NOT NULL DEFAULT '1.0',
  agreed_at    TIMESTAMPTZ DEFAULT now(),
  platform     TEXT DEFAULT 'web',
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_nda_user_id ON nda_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_nda_version ON nda_signatures(nda_version);

-- RLS policies
ALTER TABLE nda_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own signature"
ON nda_signatures FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own signature"
ON nda_signatures FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all signatures"
ON nda_signatures FOR SELECT
TO authenticated
USING (true);

-- Verify
SELECT 'nda_signatures table created successfully' as status;
