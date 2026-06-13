-- ============================================================
-- ProRated — Additional Supabase Tables
-- Run this in Supabase → SQL Editor
-- ============================================================

-- ── Contractors table ─────────────────────────────────────────
create table if not exists contractors (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text,
  trade       text,
  state       text,
  license     text,
  plan        text default 'free',
  created_at  timestamptz default now()
);

alter table contractors enable row level security;

create policy "Contractors can read own profile"
  on contractors for select using (auth.uid() = id);

create policy "Contractors can insert own profile"
  on contractors for insert with check (auth.uid() = id);

create policy "Contractors can update own profile"
  on contractors for update using (auth.uid() = id);

-- ── Saved addresses (watchlist) ───────────────────────────────
create table if not exists saved_addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  address     text not null,
  notify      boolean default true,
  created_at  timestamptz default now(),
  unique(user_id, address)
);

alter table saved_addresses enable row level security;

create policy "Users can manage own saved addresses"
  on saved_addresses for all using (auth.uid() = user_id);

-- ── Update reviews table to link to auth user (optional) ──────
alter table reviews add column if not exists user_id uuid references auth.users(id);

-- Allow logged-in users to see their own reviews
create policy "Users can read own reviews"
  on reviews for select using (
    auth.uid() = user_id or user_id is null
  );
