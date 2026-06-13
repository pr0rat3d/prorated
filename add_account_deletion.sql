-- ─────────────────────────────────────────────────────────────
-- Account deletion support
-- Soft delete approach — preserves review data integrity
-- ─────────────────────────────────────────────────────────────

-- Add deletion request columns to contractors
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS deletion_requested    BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted               BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at            TIMESTAMPTZ;

-- Index for admin filtering
CREATE INDEX IF NOT EXISTS idx_contractors_deletion ON contractors(deletion_requested, deleted);

-- Allow NULL on user_id for reviews (in case of hard delete later)
ALTER TABLE reviews
ALTER COLUMN user_id DROP NOT NULL;

SELECT 'Account deletion columns added' as status;
