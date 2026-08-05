
-- The core search path (fetchReviewsForAddress, address_has_reviews RPC, and
-- the community property-type votes query) all use leading-wildcard
-- ILIKE '%term%' against reviews.address/street. A plain btree index can't
-- serve that at all — Postgres falls back to a sequential scan regardless.
-- Invisible at today's row count, but this is the single most-hit query in
-- the app and will degrade as review volume grows toward the product's own
-- 50/200-review launch thresholds. pg_trgm + GIN lets ILIKE '%term%' actually
-- use an index.
create extension if not exists pg_trgm;

create index if not exists idx_reviews_address_trgm on public.reviews using gin (address gin_trgm_ops);
create index if not exists idx_reviews_street_trgm  on public.reviews using gin (street  gin_trgm_ops);
