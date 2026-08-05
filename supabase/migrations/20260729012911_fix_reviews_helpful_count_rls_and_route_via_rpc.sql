
-- Any authenticated user could previously update ANY column on ANY
-- review (not just helpful_count) via the overly-broad
-- "Authenticated can update helpful count" policy (USING(true)/WITH
-- CHECK(true)), which OR's with the correctly-scoped owner-only
-- policies and so overrode them for every row. Fix: route helpful
-- count increments through a SECURITY DEFINER function that performs
-- the vote insert + count increment atomically and as its own role,
-- then remove direct UPDATE access for non-owners entirely.

create or replace function public.mark_review_helpful(p_review_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_count integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.helpful_votes (review_id, voter_id)
  values (p_review_id, auth.uid())
  on conflict (review_id, voter_id) do nothing;

  if not found then
    -- Already voted — return current count without incrementing
    select helpful_count into v_new_count from public.reviews where id = p_review_id;
    return v_new_count;
  end if;

  update public.reviews
  set helpful_count = coalesce(helpful_count, 0) + 1
  where id = p_review_id
  returning helpful_count into v_new_count;

  return v_new_count;
end;
$$;

grant execute on function public.mark_review_helpful(uuid) to authenticated;

drop policy if exists "Authenticated can update helpful count" on public.reviews;
