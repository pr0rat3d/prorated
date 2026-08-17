-- Security advisor perf pass: 29 pre-existing RLS policies across 14
-- tables re-evaluate auth.uid() once per row instead of once per query.
-- Same fix already applied to push_tokens on 2026-08-13/14 as a template.
-- Every policy below is dropped and recreated with IDENTICAL cmd/roles/
-- logic - only auth.uid() calls get wrapped in (select ...). No behavior
-- change, verified via curl spot-checks after applying.

-- companies
drop policy if exists "Owners can update their company" on companies;
create policy "Owners can update their company" on companies
  for update using (owner_id = (select auth.uid()));

drop policy if exists "Paid contractors can create company" on companies;
create policy "Paid contractors can create company" on companies
  for insert to authenticated with check (
    exists (
      select 1 from contractors
      where contractors.id = (select auth.uid())
        and contractors.plan = any (array['bronze','silver','gold','platinum','pro'])
    )
  );

drop policy if exists "members_read_own_company" on companies;
create policy "members_read_own_company" on companies
  for select to authenticated using (
    owner_id = (select auth.uid())
    or id in (
      select contractors.company_id from contractors
      where contractors.id = (select auth.uid()) and contractors.company_id is not null
    )
  );

-- contractor_private
drop policy if exists "Users can view their own private fields" on contractor_private;
create policy "Users can view their own private fields" on contractor_private
  for select to authenticated using ((select auth.uid()) = id);

-- contractors
drop policy if exists "Contractors can insert own profile" on contractors;
create policy "Contractors can insert own profile" on contractors
  for insert with check ((select auth.uid()) = id);

drop policy if exists "Contractors can read own profile" on contractors;
create policy "Contractors can read own profile" on contractors
  for select using ((select auth.uid()) = id);

drop policy if exists "Contractors can update own profile" on contractors;
create policy "Contractors can update own profile" on contractors
  for update using ((select auth.uid()) = id);

drop policy if exists "authenticated_read_contractor_profiles" on contractors;
create policy "authenticated_read_contractor_profiles" on contractors
  for select using ((select auth.uid()) is not null);

drop policy if exists "teammates_read_each_other" on contractors;
create policy "teammates_read_each_other" on contractors
  for select to authenticated using (
    id = (select auth.uid())
    or (company_id is not null and company_id = get_my_company_id())
  );

-- helpful_votes
drop policy if exists "Users can vote once per review" on helpful_votes;
create policy "Users can vote once per review" on helpful_votes
  for insert with check ((select auth.uid()) = voter_id);

-- invites
drop policy if exists "owners_manage_invites" on invites;
create policy "owners_manage_invites" on invites
  for all to authenticated using (
    company_id in (
      select contractors.company_id from contractors
      where contractors.id = (select auth.uid())
        and contractors.company_role = 'owner'
        and contractors.company_id is not null
    )
  ) with check (
    company_id in (
      select contractors.company_id from contractors
      where contractors.id = (select auth.uid())
        and contractors.company_role = 'owner'
        and contractors.company_id is not null
    )
  );

-- lookup_log
drop policy if exists "Users can insert own lookups" on lookup_log;
create policy "Users can insert own lookups" on lookup_log
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "Users can view own lookups" on lookup_log;
create policy "Users can view own lookups" on lookup_log
  for select using ((select auth.uid()) = user_id);

drop policy if exists "teammates_read_team_lookups" on lookup_log;
create policy "teammates_read_team_lookups" on lookup_log
  for select to authenticated using (
    (select auth.uid()) = user_id
    or user_id in (
      select contractors.id from contractors
      where contractors.company_id is not null and contractors.company_id = get_my_company_id()
    )
  );

-- nda_signatures
drop policy if exists "Users can insert their own signature" on nda_signatures;
create policy "Users can insert their own signature" on nda_signatures
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own signature" on nda_signatures;
create policy "Users can view their own signature" on nda_signatures
  for select to authenticated using ((select auth.uid()) = user_id);

-- notification_log
drop policy if exists "Users can read own notifications" on notification_log;
create policy "Users can read own notifications" on notification_log
  for select using ((select auth.uid()) = user_id);

-- points_redemptions
drop policy if exists "Contractors can insert own redemptions" on points_redemptions;
create policy "Contractors can insert own redemptions" on points_redemptions
  for insert with check (contractor_id = (select auth.uid()));

drop policy if exists "Contractors can view own redemptions" on points_redemptions;
create policy "Contractors can view own redemptions" on points_redemptions
  for select using (contractor_id = (select auth.uid()));

-- realtor_lookups
drop policy if exists "Users can insert own lookups" on realtor_lookups;
create policy "Users can insert own lookups" on realtor_lookups
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read own lookups" on realtor_lookups;
create policy "Users can read own lookups" on realtor_lookups
  for select to authenticated using ((select auth.uid()) = user_id);

-- realtor_subscriptions
drop policy if exists "Realtors can insert own record" on realtor_subscriptions;
create policy "Realtors can insert own record" on realtor_subscriptions
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Realtors can view own record" on realtor_subscriptions;
create policy "Realtors can view own record" on realtor_subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);

-- review_edit_requests
drop policy if exists "Users can insert own edit requests" on review_edit_requests;
create policy "Users can insert own edit requests" on review_edit_requests
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own edit requests" on review_edit_requests;
create policy "Users can update own edit requests" on review_edit_requests
  for update to authenticated using ((select auth.uid()) = user_id);

-- reviews
drop policy if exists "Approved contractors can insert reviews" on reviews;
create policy "Approved contractors can insert reviews" on reviews
  for insert to authenticated with check (
    exists (
      select 1 from contractors
      where contractors.id = (select auth.uid()) and contractors.status = 'approved'
    )
  );

drop policy if exists "Users can delete own reviews" on reviews;
create policy "Users can delete own reviews" on reviews
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can update own reviews" on reviews;
create policy "Users can update own reviews" on reviews
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "contractors_update_reviews" on reviews;
create policy "contractors_update_reviews" on reviews
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- saved_addresses
drop policy if exists "Users can manage own saved addresses" on saved_addresses;
create policy "Users can manage own saved addresses" on saved_addresses
  for all using ((select auth.uid()) = user_id);
