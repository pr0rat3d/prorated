-- Dead leftover from an unused push framework (Expo, not what this app
-- actually uses — Capacitor + Firebase). Confirmed 0 rows, 0 code
-- references anywhere in the repo. Same cleanup as push_subscriptions
-- (dropped 2026-07-31, same class of dead table).
drop table if exists public.expo_push_tokens;
