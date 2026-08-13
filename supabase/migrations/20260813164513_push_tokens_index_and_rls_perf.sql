-- Found via Supabase's performance advisor right after creating push_tokens:
-- missing index on the FK, and the RLS policies re-evaluate auth.uid() per
-- row instead of once per query. Both cheap to fix immediately rather than
-- add to the same debt already present across ~15 other tables in this DB.
create index if not exists push_tokens_user_id_idx on push_tokens(user_id);

drop policy if exists "push_tokens_insert_own" on push_tokens;
create policy "push_tokens_insert_own" on push_tokens
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "push_tokens_update_own" on push_tokens;
create policy "push_tokens_update_own" on push_tokens
  for update using ((select auth.uid()) = user_id);

drop policy if exists "push_tokens_delete_own" on push_tokens;
create policy "push_tokens_delete_own" on push_tokens
  for delete using ((select auth.uid()) = user_id);
