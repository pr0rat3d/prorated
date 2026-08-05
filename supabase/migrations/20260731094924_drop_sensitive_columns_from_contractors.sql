
-- Final step of the contractor_private split — all reads/writes have been
-- moved to the new table and verified (client build clean, both edge
-- functions redeployed, full codebase grep confirms no other reference to
-- these columns on contractors). Dropping is safe: old app versions still
-- doing select=* just won't see these fields anymore (undefined, not an
-- error) until their next build.
alter table public.contractors
  drop column admin_notes,
  drop column reviewed_by,
  drop column rejection_reason,
  drop column stripe_customer_id,
  drop column deletion_requested,
  drop column deletion_requested_at;
