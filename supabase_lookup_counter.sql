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
