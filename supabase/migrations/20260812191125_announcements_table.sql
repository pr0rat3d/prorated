-- In-app announcement banners, admin-authored. Public-in-app "push a
-- notification/pop-up into the app" mechanism — no native infra, just
-- data the already-open client fetches.
--
-- Read via the /api/db proxy (dbGet), which always calls Supabase with
-- the anon key — it never forwards the logged-in user's own JWT (only
-- src/api/supabase.js's direct-fetch pattern does that, for auth.uid()-
-- scoped tables like saved_addresses). A `to authenticated` policy would
-- therefore never match here and reads would silently come back empty,
-- so this stays public-select like automated_emails, restricted to
-- active rows only.
create table if not exists announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table announcements enable row level security;

create policy "announcements_select_active" on announcements
  for select using (active = true);
