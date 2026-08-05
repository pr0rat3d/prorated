
-- Three SECURITY DEFINER views (bypass RLS entirely) with SELECT granted to
-- anon — anyone, unauthenticated, could pull every company's seat count and
-- review volume with no scoping. Confirmed unused anywhere in the app code
-- or edge functions, so dropping outright rather than just tightening grants.
drop view if exists public.company_seat_usage;
drop view if exists public.company_review_stats;
drop view if exists public.address_return_rates;
