-- Add work category columns to reviews table
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS work_category TEXT,
ADD COLUMN IF NOT EXISTS work_item     TEXT,
ADD COLUMN IF NOT EXISTS work_label    TEXT;

-- Index for realtor queries later
CREATE INDEX IF NOT EXISTS idx_reviews_work_category ON reviews(work_category);
CREATE INDEX IF NOT EXISTS idx_reviews_work_item ON reviews(work_item);

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reviews' 
AND column_name IN ('work_category', 'work_item', 'work_label');
