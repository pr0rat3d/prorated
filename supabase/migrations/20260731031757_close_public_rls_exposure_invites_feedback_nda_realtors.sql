
-- 1. invites — both SELECT policies were USING(true) for anon/public despite
-- names implying token-scoping, letting anyone read every pending invite
-- (token, email, company_id) with no auth at all. The only legitimate client
-- paths (lookup, accept) already go through /api/invite-lookup and
-- /api/accept-invite, both using the service role key — direct PostgREST
-- SELECT access was never actually needed. owners_manage_invites (ALL,
-- properly scoped to company owners via auth.uid()) remains intact and
-- covers the real in-app "view/create my company's invites" need.
drop policy if exists "Public invite token lookup" on public.invites;
drop policy if exists "Invitees can view their own invite by token" on public.invites;

-- 2. beta_feedback — admin_write_feedback (ALL, public, true) let anyone
-- delete or modify any feedback row via the public API, not just submit
-- one. admin_read_feedback (SELECT, public, true) let anyone read every
-- submission. Real admin ops already go through the service role key
-- (bypasses RLS, needs no policy at all) — these were never needed by any
-- legitimate client path. "Anyone can insert feedback" (INSERT only,
-- anon+authenticated) is untouched and is the actual intended public
-- surface for this table.
drop policy if exists "admin_write_feedback" on public.beta_feedback;
drop policy if exists "admin_read_feedback" on public.beta_feedback;

-- 3. nda_signatures / realtor_subscriptions — same root cause: "admin_*"
-- named policies attached to the public role instead of being handled by
-- the service role key, opening every user's NDA signature / realtor
-- subscription row to fully unauthenticated reads. The properly-scoped
-- "Users can view their own X" (auth.uid() = user_id) policies on both
-- tables remain intact.
drop policy if exists "admin_read_nda" on public.nda_signatures;
drop policy if exists "admin_read_realtors" on public.realtor_subscriptions;
