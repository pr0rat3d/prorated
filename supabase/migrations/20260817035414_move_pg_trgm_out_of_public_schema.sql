-- Security advisor best-practice: extensions shouldn't live in the public
-- schema. ALTER EXTENSION ... SET SCHEMA moves the extension and all its
-- owned objects (functions, operator classes) together atomically -
-- existing indexes reference operator classes by OID internally, not by
-- re-resolving the schema at query time, so this doesn't break anything.
-- Verified live: idx_reviews_address_trgm / idx_reviews_street_trgm (the
-- two real gin_trgm_ops indexes on reviews) and an actual ILIKE query
-- against reviews both still work after the move.
alter extension pg_trgm set schema extensions;
