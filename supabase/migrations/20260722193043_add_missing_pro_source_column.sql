-- pro_source was assumed to exist by PartnerDashboardPage.js's member query
-- and by today's partner-referral-attribution signup fix, but the migration
-- that was supposed to add it (add_review_rewards.sql, a repo file) was
-- never actually applied to this database — confirmed via information_schema.
-- Adding only this column, not the rest of that file's contents (a separate,
-- apparently-abandoned "auto-unlock temporary Pro access after 3 reviews"
-- mechanic using a "pro" plan tier that doesn't fit the current
-- bronze/silver/gold/platinum model already live).
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS pro_source TEXT;