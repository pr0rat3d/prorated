
-- "Admin can view all signatures" was qual:true for the authenticated role —
-- any logged-in contractor, not just admins, could read every user's NDA
-- signature. Real admin access already goes through the service-role key
-- (bypasses RLS, needs no policy). The properly-scoped "Users can view
-- their own signature" (auth.uid() = user_id) policy remains intact.
drop policy if exists "Admin can view all signatures" on public.nda_signatures;
