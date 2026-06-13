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
