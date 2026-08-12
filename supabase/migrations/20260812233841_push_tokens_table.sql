-- Device push tokens (FCM registration tokens, unified across iOS/Android
-- via @capacitor-firebase/messaging). One row per (user, device) — a
-- device's token is globally unique, not scoped per-user, since the same
-- physical device can be reassigned to a different logged-in user.
--
-- No select policy at all: the client never needs to read tokens back,
-- only the service role (which bypasses RLS entirely) reads across users
-- to actually send. Default-deny covers anon/authenticated reads.
create table if not exists push_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  platform    text not null check (platform in ('ios', 'android')),
  token       text not null unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table push_tokens enable row level security;

create policy "push_tokens_insert_own" on push_tokens
  for insert with check (auth.uid() = user_id);

create policy "push_tokens_update_own" on push_tokens
  for update using (auth.uid() = user_id);

create policy "push_tokens_delete_own" on push_tokens
  for delete using (auth.uid() = user_id);
