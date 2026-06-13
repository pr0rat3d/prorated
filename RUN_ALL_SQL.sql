-- ============================================================
-- ProRated — Run All SQL (in order)
-- Copy and paste this entire file into Supabase SQL Editor
-- and run it once. Safe to re-run — uses IF NOT EXISTS.
-- ============================================================

-- ── supabase_tables.sql ──────────────────────────────────────────────────
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

-- ── supabase_verification.sql ──────────────────────────────────────────────────
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

-- ── supabase_push.sql ──────────────────────────────────────────────────
-- ============================================================
-- ProRated — Push Notification Tables
-- Run this in Supabase → SQL Editor
-- ============================================================

-- ── Push subscriptions table ──────────────────────────────────
create table if not exists push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz default now(),
  last_used  timestamptz default now()
);

alter table push_subscriptions enable row level security;

-- Anyone can insert (anonymous subscriptions allowed for demo)
create policy "Anyone can subscribe"
  on push_subscriptions for insert with check (true);

-- Users can manage their own subscriptions
create policy "Users can manage own subscriptions"
  on push_subscriptions for all using (
    auth.uid() = user_id or user_id is null
  );

-- Service role can read all (for sending notifications)
create policy "Service role can read all subscriptions"
  on push_subscriptions for select using (true);

-- ── Notification log ──────────────────────────────────────────
create table if not exists notification_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id),
  type          text not null,
  title         text,
  body          text,
  address       text,
  sent_at       timestamptz default now(),
  success       boolean default true
);

alter table notification_log enable row level security;

create policy "Users can read own notifications"
  on notification_log for select using (auth.uid() = user_id);

create policy "Service can insert notifications"
  on notification_log for insert with check (true);

-- ── supabase_beta.sql ──────────────────────────────────────────────────
-- ============================================================
-- ProRated — Beta Feedback Table
-- Run this in Supabase → SQL Editor
-- ============================================================

create table if not exists beta_feedback (
  id           uuid primary key default gen_random_uuid(),
  category     text not null,
  text         text not null,
  page         text,
  user_email   text,
  user_id      uuid references auth.users(id) on delete set null,
  created_at   timestamptz default now(),
  resolved     boolean default false,
  admin_notes  text
);

alter table beta_feedback enable row level security;

-- Anyone can insert feedback
create policy "Anyone can submit feedback"
  on beta_feedback for insert with check (true);

-- Only service role can read (admin dashboard uses anon key so also allow select)
create policy "Anyone can read feedback"
  on beta_feedback for select using (true);

create policy "Anyone can update feedback"
  on beta_feedback for update using (true);

-- Index for fast queries
create index if not exists beta_feedback_created_idx on beta_feedback(created_at desc);
create index if not exists beta_feedback_category_idx on beta_feedback(category);

-- ── supabase_beta_signups.sql ──────────────────────────────────────────────────
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

-- ── supabase_translations.sql ──────────────────────────────────────────────────
-- ============================================================
-- ProRated — Translation Cache Table
-- Run this in Supabase → SQL Editor
-- Stores translations so each review is only ever translated
-- once by the Claude API, then served free forever after.
-- ============================================================

create table if not exists translation_cache (
  id              uuid primary key default gen_random_uuid(),
  hash            text not null unique,
  original_text   text not null,
  translated_text text not null,
  lang            text not null default 'es',
  created_at      timestamptz default now(),
  hit_count       integer default 1
);

alter table translation_cache enable row level security;

-- Anyone can read translations (shared cache)
create policy "Anyone can read translations"
  on translation_cache for select using (true);

-- Anyone can insert translations
create policy "Anyone can insert translations"
  on translation_cache for insert with check (true);

-- Anyone can update hit count
create policy "Anyone can update translations"
  on translation_cache for update using (true);

-- Fast lookup by hash
create index if not exists translation_cache_hash_idx
  on translation_cache(hash);

create index if not exists translation_cache_lang_idx
  on translation_cache(lang);

-- ── supabase_reported_reviews.sql ──────────────────────────────────────────────────
-- ============================================================
-- ProRated — Reported Reviews Table
-- Run this in Supabase → SQL Editor
-- ============================================================

create table if not exists reported_reviews (
  id           uuid primary key default gen_random_uuid(),
  review_id    uuid references reviews(id) on delete set null,
  review_text  text,
  reason       text not null,
  reported_at  timestamptz default now(),
  resolved     boolean default false,
  admin_notes  text
);

alter table reported_reviews enable row level security;

create policy "Anyone can report a review"
  on reported_reviews for insert with check (true);

create policy "Anyone can read reports"
  on reported_reviews for select using (true);

create policy "Anyone can update reports"
  on reported_reviews for update using (true);

create index if not exists reported_reviews_resolved_idx
  on reported_reviews(resolved);

-- ── supabase_lookup_counter.sql ──────────────────────────────────────────────────
-- ============================================================
-- ProRated — Lookup Counter
-- Tracks address searches per user per month
-- ============================================================

create table if not exists lookup_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  address    text not null,
  searched_at timestamptz default now(),
  month_year  text generated always as (
    to_char(searched_at, 'YYYY-MM')
  ) stored
);

alter table lookup_log enable row level security;

create policy "Users can insert own lookups"
  on lookup_log for insert with check (true);

create policy "Users can read own lookups"
  on lookup_log for select using (auth.uid() = user_id);

-- Fast count query: how many lookups this month?
create index if not exists lookup_log_user_month_idx
  on lookup_log(user_id, month_year);

