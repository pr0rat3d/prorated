-- H1: reviews.address — core product query, was a full seq scan
CREATE INDEX IF NOT EXISTS idx_reviews_address ON reviews USING btree (address);

-- H2: contractors.email — Stripe webhook lookup on every payment
CREATE INDEX IF NOT EXISTS idx_contractors_email ON contractors USING btree (email);