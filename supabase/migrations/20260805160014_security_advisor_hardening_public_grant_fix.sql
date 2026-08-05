-- The prior revoke targeted anon/authenticated specifically, but Postgres
-- auto-grants EXECUTE to PUBLIC on function creation, and anon/authenticated
-- inherit whatever PUBLIC has regardless of per-role revokes. Revoke from
-- PUBLIC directly to actually close this off.
revoke execute on function public.check_anniversary_reward(uuid) from public;
revoke execute on function public.check_referral_reward() from public;
revoke execute on function public.increment_review_points() from public;

-- service_role needs it back explicitly since revoking from PUBLIC also
-- strips it from every role that isn't given an explicit grant.
grant execute on function public.check_anniversary_reward(uuid) to service_role;
grant execute on function public.check_referral_reward() to service_role;
grant execute on function public.increment_review_points() to service_role;