-- Restrict anon access to reviews: allow only aggregate/non-identifying
-- columns. Full row access (review_text, tags, contractor_name, user_id,
-- etc.) now requires an authenticated session. The anon key is public
-- (shipped in the client bundle), so table-level SELECT for anon was
-- previously equivalent to public read access to every review's full text.
revoke select on public.reviews from anon;
grant select (
  id, street, city, state, zip, address,
  trade, work_label, overall_score, payment_score, access_score, created_at
) on public.reviews to anon;

-- Lightweight existence check for the unauthenticated address search flow.
-- Returns only a boolean, never row content, so the public search UI can
-- distinguish "reviews exist, sign up to see them" from "no reviews yet"
-- without exposing anything about the reviews themselves.
create or replace function public.address_has_reviews(p_address text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.reviews
    where address ilike '%' || p_address || '%'
       or street  ilike '%' || split_part(p_address, ',', 1) || '%'
    limit 1
  );
$$;

revoke all on function public.address_has_reviews(text) from public;
grant execute on function public.address_has_reviews(text) to anon, authenticated;
