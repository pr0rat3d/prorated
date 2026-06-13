-- ─────────────────────────────────────────────────────────────
-- ProRated — Run All New SQL
-- Run this entire file in Supabase → SQL Editor
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ─────────────────────────────────────────────────────────────

-- ── 1. Work Category on Reviews ──────────────────────────────
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS work_category TEXT,
ADD COLUMN IF NOT EXISTS work_item     TEXT,
ADD COLUMN IF NOT EXISTS work_label    TEXT;

CREATE INDEX IF NOT EXISTS idx_reviews_work_category ON reviews(work_category);

-- ── 2. NDA Signatures ────────────────────────────────────────
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

CREATE INDEX IF NOT EXISTS idx_nda_user_id ON nda_signatures(user_id);
ALTER TABLE nda_signatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own signature" ON nda_signatures;
CREATE POLICY "Users can insert their own signature"
ON nda_signatures FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own signature" ON nda_signatures;
CREATE POLICY "Users can view their own signature"
ON nda_signatures FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- ── 3. Realtor Accounts ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS realtor_subscriptions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  agency        TEXT,
  license_num   TEXT,
  state         TEXT,
  plan          TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  status        TEXT DEFAULT 'active',
  lookups_used  INT DEFAULT 0,
  lookups_reset TIMESTAMPTZ DEFAULT date_trunc('month', now()),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_realtor_user_id ON realtor_subscriptions(user_id);
ALTER TABLE realtor_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Realtors can view own record" ON realtor_subscriptions;
CREATE POLICY "Realtors can view own record"
ON realtor_subscriptions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Realtors can insert own record" ON realtor_subscriptions;
CREATE POLICY "Realtors can insert own record"
ON realtor_subscriptions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS realtor_lookups (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  address    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_realtor_lookups_user ON realtor_lookups(user_id);

-- ── 4. Featured Suppliers ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS featured_suppliers (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT NOT NULL,
  category     TEXT NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_featured_suppliers_active   ON featured_suppliers(active);
CREATE INDEX IF NOT EXISTS idx_featured_suppliers_category ON featured_suppliers(category);

-- ── 5. Verification Tiers ─────────────────────────────────────
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS verification_tier    TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS business_license_num TEXT,
ADD COLUMN IF NOT EXISTS insurance_cert_num   TEXT,
ADD COLUMN IF NOT EXISTS license_type         TEXT,
ADD COLUMN IF NOT EXISTS license_required     BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_contractors_verification_tier ON contractors(verification_tier);

UPDATE contractors
SET verification_tier = 'license_verified'
WHERE status = 'approved' AND verification_tier = 'pending';

-- ── 6. Review Editing ─────────────────────────────────────────
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
CREATE POLICY "Users can update own reviews"
ON reviews FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ── 7. Account Deletion ───────────────────────────────────────
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS deletion_requested    BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted               BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at            TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_contractors_deletion ON contractors(deletion_requested, deleted);

-- ── 8. Verified Pro Directory ─────────────────────────────────
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS verified_pro     BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_pro_bio TEXT,
ADD COLUMN IF NOT EXISTS trust_score      INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count     INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS helpful_count    INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS share_phone      BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS share_email      BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_contractors_verified_pro ON contractors(verified_pro);
CREATE INDEX IF NOT EXISTS idx_contractors_trust_score  ON contractors(trust_score DESC);

-- ── 9. Beta Feedback Table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS beta_feedback (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category    TEXT DEFAULT 'general',
  text        TEXT,
  page        TEXT,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email  TEXT,
  resolved    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert feedback" ON beta_feedback;
CREATE POLICY "Anyone can insert feedback"
ON beta_feedback FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- ── Verify ────────────────────────────────────────────────────
SELECT
  (SELECT count(*) FROM information_schema.columns WHERE table_name = 'reviews'      AND column_name = 'work_label')     as work_label_added,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = 'contractors'  AND column_name = 'verified_pro')   as verified_pro_added,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = 'contractors'  AND column_name = 'deletion_requested') as deletion_added,
  (SELECT count(*) FROM information_schema.tables  WHERE table_name = 'nda_signatures')    as nda_table,
  (SELECT count(*) FROM information_schema.tables  WHERE table_name = 'realtor_subscriptions') as realtor_table,
  (SELECT count(*) FROM information_schema.tables  WHERE table_name = 'featured_suppliers')    as suppliers_table,
  (SELECT count(*) FROM information_schema.tables  WHERE table_name = 'beta_feedback')         as feedback_table;

-- ── Referral System ───────────────────────────────────────────
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS referral_code     TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by       TEXT,
ADD COLUMN IF NOT EXISTS referral_count    INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_discount_earned BOOLEAN DEFAULT false;

-- Generate referral codes for existing contractors
UPDATE contractors
SET referral_code = 'BUILDALABAMA-' || UPPER(SUBSTRING(id::TEXT, 1, 6))
WHERE referral_code IS NULL;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_contractors_referral_code ON contractors(referral_code);
CREATE INDEX IF NOT EXISTS idx_contractors_referred_by   ON contractors(referred_by);

-- Function to handle referral reward when referred user hits 3 reviews
CREATE OR REPLACE FUNCTION check_referral_reward()
RETURNS TRIGGER AS $$
DECLARE
  review_count    INT;
  referrer_record RECORD;
  new_user_record RECORD;
BEGIN
  -- Count reviews for this user
  SELECT COUNT(*) INTO review_count
  FROM reviews WHERE user_id = NEW.user_id;

  -- Get the new user's record
  SELECT * INTO new_user_record
  FROM contractors WHERE id = NEW.user_id;

  -- When new user hits 3 reviews and was referred
  IF review_count = 3
     AND new_user_record.referred_by IS NOT NULL
     AND NOT new_user_record.referral_discount_earned THEN

    -- Mark discount as earned for new user
    UPDATE contractors
    SET referral_discount_earned = true
    WHERE id = NEW.user_id;

    -- Credit referrer — increment their count
    UPDATE contractors
    SET referral_count = referral_count + 1
    WHERE referral_code = new_user_record.referred_by;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_referral_check ON reviews;
CREATE TRIGGER on_review_referral_check
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION check_referral_reward();

SELECT 'Referral system created' as status;

-- ── Review Edit Requests ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS review_edit_requests (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id   UUID REFERENCES reviews(id) ON DELETE CASCADE,
  user_id     UUID,
  reason      TEXT,
  resolved    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_edit_requests_review ON review_edit_requests(review_id);
CREATE INDEX IF NOT EXISTS idx_edit_requests_user   ON review_edit_requests(user_id);

SELECT 'review_edit_requests table created' as status;

-- ── Admin RLS — allow anon key to read all tables for admin console ──
-- These policies allow read-only access using the anon key
-- Admin write actions use the same key but are password-protected in the UI

ALTER TABLE contractors        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_feedback      ENABLE ROW LEVEL SECURITY;
ALTER TABLE nda_signatures     ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtor_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies if any
DROP POLICY IF EXISTS "admin_read_contractors"    ON contractors;
DROP POLICY IF EXISTS "admin_read_reviews"        ON reviews;
DROP POLICY IF EXISTS "admin_read_feedback"       ON beta_feedback;
DROP POLICY IF EXISTS "admin_read_nda"            ON nda_signatures;
DROP POLICY IF EXISTS "admin_read_realtors"       ON realtor_subscriptions;

-- Allow anon key full read on all admin tables
CREATE POLICY "admin_read_contractors"    ON contractors           FOR SELECT USING (true);
CREATE POLICY "admin_read_reviews"        ON reviews               FOR SELECT USING (true);
CREATE POLICY "admin_read_feedback"       ON beta_feedback         FOR SELECT USING (true);
CREATE POLICY "admin_read_nda"            ON nda_signatures        FOR SELECT USING (true);
CREATE POLICY "admin_read_realtors"       ON realtor_subscriptions FOR SELECT USING (true);

-- Allow anon key to update/delete for admin actions
DROP POLICY IF EXISTS "admin_write_contractors" ON contractors;
DROP POLICY IF EXISTS "admin_write_reviews"     ON reviews;
DROP POLICY IF EXISTS "admin_write_feedback"    ON beta_feedback;
CREATE POLICY "admin_write_contractors"   ON contractors   FOR ALL  USING (true);
CREATE POLICY "admin_write_reviews"       ON reviews       FOR ALL  USING (true);
CREATE POLICY "admin_write_feedback"      ON beta_feedback FOR ALL  USING (true);

SELECT 'Admin RLS policies applied' as status;

-- ── Allow authenticated realtors to read reviews ──────────────
DROP POLICY IF EXISTS "realtor_read_reviews" ON reviews;
CREATE POLICY "realtor_read_reviews" ON reviews
  FOR SELECT USING (true);

SELECT 'Realtor read policy applied' as status;

-- ── Ownership Flags Table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS ownership_flags (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  address     TEXT NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes       TEXT,
  resolved    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ownership_flags_address ON ownership_flags(address);
ALTER TABLE ownership_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ownership_flags_read"   ON ownership_flags;
DROP POLICY IF EXISTS "ownership_flags_insert" ON ownership_flags;
CREATE POLICY "ownership_flags_read"   ON ownership_flags FOR SELECT USING (true);
CREATE POLICY "ownership_flags_insert" ON ownership_flags FOR INSERT WITH CHECK (true);

SELECT 'ownership_flags table created' as status;
-- ── Fix reviews INSERT policy for authenticated contractors ───
DROP POLICY IF EXISTS "contractors_insert_reviews" ON reviews;
CREATE POLICY "contractors_insert_reviews"
  ON reviews FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "contractors_read_reviews" ON reviews;
CREATE POLICY "contractors_read_reviews"
  ON reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "contractors_update_reviews" ON reviews;
CREATE POLICY "contractors_update_reviews"
  ON reviews FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

SELECT 'Reviews RLS policies fixed' as status;

-- ── Broaden reviews INSERT to also allow anon (fallback) ─────
DROP POLICY IF EXISTS "reviews_insert_anon" ON reviews;
CREATE POLICY "reviews_insert_anon"
  ON reviews FOR INSERT
  WITH CHECK (true);

SELECT 'Reviews INSERT policy broadened' as status;

-- ── Property Type Classification ─────────────────────────────
-- Adds community-sourced property type to reviews
-- and a computed property_type_votes view for AddressCard display

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS property_type TEXT
  CHECK (property_type IN ('homestead','secondary','rental') OR property_type IS NULL);

-- Materialized view: most-voted property type per address
-- (used by AddressCard to show the label)
CREATE OR REPLACE VIEW address_property_types AS
SELECT
  address,
  property_type,
  COUNT(*) AS votes,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY address), 0) AS pct
FROM reviews
WHERE property_type IS NOT NULL
GROUP BY address, property_type
ORDER BY address, votes DESC;

SELECT 'property_type column + view created' AS status;
