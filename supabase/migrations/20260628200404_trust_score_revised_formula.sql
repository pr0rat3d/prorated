
CREATE OR REPLACE FUNCTION calculate_trust_score(contractor_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  cnt         BIGINT;
  review_pts  INTEGER;
  helpful_pts INTEGER;
  age_pts     INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt FROM reviews WHERE user_id = contractor_id;
  -- First review = 10 pts, every review after = 5 pts
  review_pts := CASE WHEN cnt > 0 THEN 10 + (cnt - 1) * 5 ELSE 0 END;

  SELECT COALESCE(SUM(helpful_count), 0) * 5 INTO helpful_pts
  FROM reviews WHERE user_id = contractor_id;

  SELECT FLOOR(
    EXTRACT(EPOCH FROM (now() - created_at)) / (30.0 * 24 * 3600) * 2
  ) INTO age_pts
  FROM contractors WHERE id = contractor_id;

  RETURN LEAST(review_pts + helpful_pts + COALESCE(age_pts, 0), 100);
END;
$$;

-- Backfill with new formula
UPDATE contractors SET trust_score = calculate_trust_score(id);
