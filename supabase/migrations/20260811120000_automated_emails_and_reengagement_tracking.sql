-- Automated, admin-toggleable email jobs (day-3 re-engagement nudge, and any
-- future ones) live in one small key/value-style table so Admin can flip
-- them on/off without a code deploy.
create table if not exists automated_emails (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  enabled     boolean not null default false,
  label       text not null,
  description text,
  updated_at  timestamptz not null default now()
);

alter table automated_emails enable row level security;

-- Public can read (Admin console reads it like feature_flags), only
-- service role can write.
create policy "automated_emails_select_all" on automated_emails
  for select using (true);

insert into automated_emails (key, enabled, label, description)
values (
  'day3_reengagement',
  false,
  'Day-3 re-engagement nudge',
  'Sends once, 3 days after signup, to contractors with no lookup/review activity since. Content branches on what they did on day 1.'
)
on conflict (key) do nothing;

-- Idempotency guard + audit trail: prevents double-sends and lets us see
-- who's already gotten the nudge.
alter table contractors
  add column if not exists reengagement_sent_at timestamptz;
