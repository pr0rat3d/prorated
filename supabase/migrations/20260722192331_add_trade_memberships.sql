-- Self-declared trade association memberships, separate from pro_source
-- (which tracks first-touch referral attribution and is also written by the
-- unrelated review-count reward trigger). A contractor can belong to more
-- than one association, hence an array rather than a single value.
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS trade_memberships TEXT[] DEFAULT '{}';

-- Saves the member's selected associations and awards a one-time +5 point
-- completion bonus on first save only (guarded server-side, not by trusting
-- client input — contractors.review_points has no column-level RLS
-- restriction on UPDATE, so a bonus granted via a plain client PATCH could
-- be replayed/forged; this function is the only path that can award it).
CREATE OR REPLACE FUNCTION public.save_trade_memberships(p_memberships TEXT[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  had_previous BOOLEAN;
BEGIN
  SELECT COALESCE(array_length(trade_memberships, 1), 0) > 0
  INTO had_previous
  FROM public.contractors
  WHERE id = auth.uid();

  UPDATE public.contractors
  SET trade_memberships = p_memberships
  WHERE id = auth.uid();

  IF NOT had_previous AND COALESCE(array_length(p_memberships, 1), 0) > 0 THEN
    UPDATE public.contractors
    SET review_points = COALESCE(review_points, 0) + 5
    WHERE id = auth.uid();
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_trade_memberships(TEXT[]) TO authenticated;