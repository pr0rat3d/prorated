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
