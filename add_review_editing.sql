-- Add updated_at column to reviews
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Add user_id if not already present (from previous migration)
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for user's own reviews
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- RLS policy: users can update their own reviews
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
CREATE POLICY "Users can update own reviews"
ON reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

SELECT 'Review editing columns and policies added' as status;
