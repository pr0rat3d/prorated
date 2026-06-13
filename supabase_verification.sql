-- ============================================================
-- ProRated — License Verification System
-- Run this in Supabase → SQL Editor
-- ============================================================

-- Add verification status to contractors table
alter table contractors 
  add column if not exists status text default 'pending',
  add column if not exists verified_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists reviewed_by text;

-- Update existing contractors to approved (they were created before verification)
update contractors set status = 'approved', verified_at = now() where status = 'pending';

-- Update demo user to approved
update contractors set status = 'approved', verified_at = now() where email = 'demo@prorated.io';

-- Index for fast status queries
create index if not exists contractors_status_idx on contractors(status);
create index if not exists contractors_created_idx on contractors(created_at desc);
