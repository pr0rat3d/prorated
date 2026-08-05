-- 1. Fix mutable search_path on the 7 flagged functions (hijacking hardening, no behavior change)
alter function public.get_seat_limit set search_path = public;
alter function public.validate_promo_code(text) set search_path = public;
alter function public.check_anniversary_reward(uuid) set search_path = public;
alter function public.check_referral_reward() set search_path = public;
alter function public.increment_review_points() set search_path = public;
alter function public.update_trust_score_on_review() set search_path = public;
alter function public.calculate_trust_score(uuid) set search_path = public;

-- 2. check_anniversary_reward was never meant to be user-callable — only the
-- weekly check-anniversary-rewards Edge Function (service role) calls it.
-- Confirmed no frontend code calls this RPC directly.
revoke execute on function public.check_anniversary_reward(uuid) from anon, authenticated;

-- 3. Trigger functions should only ever run via their trigger, never direct RPC.
revoke execute on function public.check_referral_reward() from anon, authenticated;
revoke execute on function public.increment_review_points() from anon, authenticated;

-- 4. notification_log's insert policy is named "Service can insert
-- notifications" but was never actually restricted to service_role.
drop policy "Service can insert notifications" on public.notification_log;
create policy "Service can insert notifications" on public.notification_log
for insert
to service_role
with check (true);