
-- Add trust_score column to contractors
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0;

-- Drop and recreate helpful_votes with correct schema
DROP TABLE IF EXISTS helpful_votes CASCADE;

CREATE TABLE helpful_votes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id  UUID        NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  voter_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(review_id, voter_id)
);

ALTER TABLE helpful_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can vote once per review"
  ON helpful_votes FOR INSERT
  WITH CHECK (auth.uid() = voter_id);

CREATE POLICY "Users can read all votes"
  ON helpful_votes FOR SELECT
  USING (true);

-- Trust score calculation
CREATE OR REPLACE FUNCTION calculate_trust_score(contractor_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  review_pts  INTEGER;
  helpful_pts INTEGER;
  age_pts     INTEGER;
BEGIN
  SELECT COALESCE(COUNT(*), 0) * 10 INTO review_pts
  FROM reviews WHERE user_id = contractor_id;

  SELECT COALESCE(SUM(helpful_count), 0) * 5 INTO helpful_pts
  FROM reviews WHERE user_id = contractor_id;

  SELECT FLOOR(
    EXTRACT(EPOCH FROM (now() - created_at)) / (30.0 * 24 * 3600) * 2
  ) INTO age_pts
  FROM contractors WHERE id = contractor_id;

  RETURN LEAST(review_pts + helpful_pts + COALESCE(age_pts, 0), 100);
END;
$$;

-- Trigger function to recalculate after new review
CREATE OR REPLACE FUNCTION update_trust_score_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE contractors
  SET trust_score = calculate_trust_score(NEW.user_id)
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recalc_trust_on_review ON reviews;
CREATE TRIGGER recalc_trust_on_review
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_trust_score_on_review();

-- Backfill existing contractors
UPDATE contractors SET trust_score = calculate_trust_score(id);
