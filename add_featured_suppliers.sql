-- Featured suppliers table
CREATE TABLE IF NOT EXISTS featured_suppliers (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT NOT NULL,
  category     TEXT NOT NULL, -- 'supplies' or 'food'
  address      TEXT,
  phone        TEXT,
  website      TEXT,
  logo_url     TEXT,
  description  TEXT,
  states       TEXT[] DEFAULT ARRAY['AL'],
  cities       TEXT[],
  radius_miles INT DEFAULT 25,
  tier         TEXT DEFAULT 'local' CHECK (tier IN ('local','regional','national')),
  active       BOOLEAN DEFAULT true,
  monthly_fee  NUMERIC(10,2),
  started_at   TIMESTAMPTZ DEFAULT now(),
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Index for geo lookup
CREATE INDEX IF NOT EXISTS idx_featured_suppliers_states  ON featured_suppliers USING GIN(states);
CREATE INDEX IF NOT EXISTS idx_featured_suppliers_active  ON featured_suppliers(active);
CREATE INDEX IF NOT EXISTS idx_featured_suppliers_category ON featured_suppliers(category);

SELECT 'featured_suppliers table created' as status;
