create policy "teammates_read_team_lookups" on public.lookup_log
for select
to authenticated
using (
  auth.uid() = user_id
  or user_id in (
    select id from public.contractors
    where company_id is not null
      and company_id = get_my_company_id()
  )
);