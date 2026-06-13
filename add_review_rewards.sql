-- ─────────────────────────────────────────────────────────────
-- ProRated Review Rewards System
-- Tracks review count and unlocks Pro access automatically
-- ─────────────────────────────────────────────────────────────

ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS review_rewards_unlocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pro_unlocked_at         TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pro_expires_at          TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pro_source              TEXT DEFAULT 'paid';
-- pro_source values: 'paid', 'reviews', 'agc', 'promo'

-- Function to auto-unlock Pro when review count hits 3
CREATE OR REPLACE FUNCTION check_review_rewards()
RETURNS TRIGGER AS $$
BEGIN
  -- Count reviews for this user
  DECLARE
    review_count INT;
    contractor_record RECORD;
  BEGIN
    SELECT COUNT(*) INTO review_count
    FROM reviews WHERE user_id = NEW.user_id;

    SELECT * INTO contractor_record
    FROM contractors WHERE id = NEW.user_id;

    -- Unlock Pro free month at 3 reviews
    IF review_count >= 3 AND NOT contractor_record.review_rewards_unlocked THEN
      UPDATE contractors SET
        review_rewards_unlocked = true,
        pro_unlocked_at         = now(),
        pro_expires_at          = now() + INTERVAL '30 days',
        pro_source              = 'reviews',
        status                  = 'approved'
      WHERE id = NEW.user_id;
    END IF;

    -- Extend another month at 8 total reviews
    IF review_count >= 8 AND contractor_record.review_rewards_unlocked
       AND contractor_record.pro_expires_at < now() + INTERVAL '5 days' THEN
      UPDATE contractors SET
        pro_expires_at = now() + INTERVAL '30 days'
      WHERE id = NEW.user_id;
    END IF;

    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_insert ON reviews;
CREATE TRIGGER on_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION check_review_rewards();

SELECT 'Review rewards system created' as status;
