-- reviews.property_type: UI has always offered "commercial" as a 4th option
-- (AddressCard.js already renders "🏢 Commercial / Business" for it), but the
-- constraint was never updated to include it — any review submitted against
-- a commercial property fails silently at the DB layer.
ALTER TABLE reviews DROP CONSTRAINT reviews_property_type_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_property_type_check
  CHECK (property_type = ANY (ARRAY['homestead','secondary','rental','commercial']) OR property_type IS NULL);

-- points_redemptions.status: constraint was created with placeholder values
-- (pending/applied/declined) that don't match the actual admin workflow
-- (pending -> approved -> fulfilled, or pending -> rejected), which the
-- Rewards tab's own UI text describes ("Approve -> coordinate merch -> mark
-- Fulfilled"). approveRedemption/rejectRedemption/fulfillRedemption in
-- AdminPage.js write "approved"/"rejected"/"fulfilled" — none of which were
-- previously valid. Dormant (0 rows currently, since the merch-redemption
-- entry point is still just a mailto link) but would break the instant
-- anyone exercises it.
ALTER TABLE points_redemptions DROP CONSTRAINT points_redemptions_status_check;
ALTER TABLE points_redemptions ADD CONSTRAINT points_redemptions_status_check
  CHECK (status = ANY (ARRAY['pending','approved','fulfilled','rejected']));