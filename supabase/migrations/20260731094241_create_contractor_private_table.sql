
-- Splits the truly sensitive contractors columns into their own table with
-- real per-row RLS. RLS alone can't restrict columns (only rows), and grants
-- apply uniformly regardless of row — so stripe_customer_id/rejection_reason
-- (legitimately needed by a user for their OWN row) couldn't be hidden from
-- other users' rows any other way. admin_notes/reviewed_by/deletion_requested*
-- have zero legitimate client read/write need at all (confirmed via code
-- audit — every write to any of these 6 fields already goes through a
-- service-role edge function or the admin proxy).
create table public.contractor_private (
  id                     uuid primary key references public.contractors(id) on delete cascade,
  stripe_customer_id     text,
  rejection_reason       text,
  admin_notes            text,
  reviewed_by            text,
  deletion_requested     boolean not null default false,
  deletion_requested_at  timestamptz
);

insert into public.contractor_private (id, stripe_customer_id, rejection_reason, admin_notes, reviewed_by, deletion_requested, deletion_requested_at)
select id, stripe_customer_id, rejection_reason, admin_notes, reviewed_by, deletion_requested, deletion_requested_at
from public.contractors;

alter table public.contractor_private enable row level security;

-- Own row only — covers the two legitimately-needed-by-owner fields
-- (stripe_customer_id, rejection_reason). admin_notes/reviewed_by/
-- deletion_requested* have no policy at all beyond this, so only the
-- service role (which bypasses RLS entirely) can ever read/write them.
create policy "Users can view their own private fields"
on public.contractor_private for select
to authenticated
using (auth.uid() = id);
