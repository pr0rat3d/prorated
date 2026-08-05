-- Single-session-per-user enforcement: on login, kill every other active
-- session for that user; the app then periodically checks whether its own
-- session is still the active one and force-logs-out if not.

create or replace function public.kill_other_sessions()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.sessions
  where user_id = auth.uid()
    and id != (auth.jwt()->>'session_id')::uuid;
end;
$$;

grant execute on function public.kill_other_sessions() to authenticated;

create or replace function public.session_still_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.sessions
    where id = (auth.jwt()->>'session_id')::uuid
      and user_id = auth.uid()
  );
$$;

grant execute on function public.session_still_active() to authenticated;