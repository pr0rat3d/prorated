-- Root cause of the real push-registration bug found 2026-08-14:
-- Postgres's INSERT ... ON CONFLICT (what PostgREST's upsert does)
-- needs SELECT-level visibility to evaluate the conflict target, even
-- when the row ends up being a fresh insert with no actual conflict.
-- push_tokens had zero select policy (reasoning at the time: "client
-- never needs to read tokens back") which silently broke every upsert
-- with a 42501 RLS violation - confirmed live: identical payload
-- succeeds as a plain INSERT, fails only with on_conflict= set.
-- A user reading their own device token isn't a real security concern.
create policy "push_tokens_select_own" on push_tokens
  for select using ((select auth.uid()) = user_id);
