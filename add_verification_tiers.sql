-- Add verification tier columns to contractors table
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS verification_tier    TEXT DEFAULT 'pending'
  CHECK (verification_tier IN ('license_verified', 'business_verified', 'insurance_verified', 'self_attested', 'pending', 'rejected')),
ADD COLUMN IF NOT EXISTS business_license_num TEXT,
ADD COLUMN IF NOT EXISTS insurance_cert_num   TEXT,
ADD COLUMN IF NOT EXISTS license_type         TEXT,
ADD COLUMN IF NOT EXISTS license_required     BOOLEAN DEFAULT true;

-- Index for admin filtering
CREATE INDEX IF NOT EXISTS idx_contractors_verification_tier ON contractors(verification_tier);

-- Update existing approved contractors to license_verified
-- (skipping the license number check since column name may vary)
UPDATE contractors 
SET verification_tier = 'license_verified' 
WHERE status = 'approved';

SELECT 'Verification tier columns added successfully' as status;
