-- ============================================================
-- ProRated — Beta Signups Table
-- Run this in Supabase → SQL Editor
-- ============================================================
create table if not exists beta_signups (
  id           uuid primary key default gen_random_uuid(),
  email        text not null unique,
  trade        text,
  signed_up_at timestamptz default now(),
  converted    boolean default false
);
alter table beta_signups enable row level security;
create policy "Anyone can sign up for beta" on beta_signups for insert with check (true);
create policy "Anyone can read beta signups" on beta_signups for select using (true);
