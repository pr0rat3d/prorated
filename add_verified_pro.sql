-- Add verified_pro columns to contractors table
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS verified_pro     BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_pro_bio TEXT,
ADD COLUMN IF NOT EXISTS trust_score      INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count     INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS helpful_count    INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_contractors_verified_pro ON contractors(verified_pro);
CREATE INDEX IF NOT EXISTS idx_contractors_trust_score  ON contractors(trust_score DESC);

ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS share_phone BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS share_email BOOLEAN DEFAULT false;

SELECT 'Verified Pro columns added' as status;
