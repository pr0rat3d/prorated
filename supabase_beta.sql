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
