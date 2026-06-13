-- ============================================================
-- ProRated — Email Notification Triggers (#4)
-- Run this in Supabase → SQL Editor
-- Sends emails when contractors are approved or rejected
-- Requires: Supabase → Auth → Email Templates to be configured
-- ============================================================

-- Enable the pg_net extension for HTTP calls (needed for emails)
create extension if not exists pg_net;

-- Function to send approval email via Supabase Auth
create or replace function notify_contractor_status()
returns trigger as $$
declare
  contractor_email text;
  subject_line text;
  email_body text;
begin
  -- Get the contractor's email
  select email into contractor_email
  from auth.users
  where id = NEW.id;

  -- Only fire when status changes
  if OLD.status = NEW.status then
    return NEW;
  end if;

  -- Approved email
  if NEW.status = 'approved' then
    subject_line := 'Welcome to ProRated — Your account is approved!';
    email_body := format(
      'Hi %s,

Great news! Your contractor license has been verified and your ProRated account is now fully active.

You can now:
✓ Search unlimited job site addresses (free tier: 3/month)
✓ Leave reviews for job sites you''ve worked
✓ Save addresses to your watchlist

Get started: https://prorated-kappa.vercel.app

Bidding Made Better,
The ProRated Team',
      coalesce(NEW.name, 'Contractor')
    );

  -- Rejected email
  elsif NEW.status = 'rejected' then
    subject_line := 'ProRated — License verification update';
    email_body := format(
      'Hi %s,

We were unable to verify your contractor license at this time.

Reason: %s

If you believe this is an error, please reply to this email with:
- Your license number
- Your state
- A photo or scan of your license

We review appeals within 2 business days.

The ProRated Team',
      coalesce(NEW.name, 'Contractor'),
      coalesce(NEW.rejection_reason, 'Unable to verify license in state database')
    );
  else
    return NEW;
  end if;

  -- Send via Supabase's built-in email (uses your SMTP settings)
  perform net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'to', contractor_email,
      'subject', subject_line,
      'text', email_body
    )
  );

  return NEW;
exception when others then
  -- Don't fail the update if email fails
  return NEW;
end;
$$ language plpgsql security definer;

-- Trigger on contractor status change
drop trigger if exists on_contractor_status_change on contractors;
create trigger on_contractor_status_change
  after update of status on contractors
  for each row execute function notify_contractor_status();

-- ============================================================
-- SIMPLER ALTERNATIVE: Manual email reminders
-- If the trigger above is too complex, use this query to find
-- contractors who need to be notified and email them manually:
-- ============================================================

-- Find recently approved contractors (last 24 hours):
-- select name, email, status, verified_at from contractors
-- where status = 'approved' and verified_at > now() - interval '24 hours';

-- Find recently rejected contractors (last 24 hours):
-- select name, email, status, rejected_at, rejection_reason from contractors
-- where status = 'rejected' and rejected_at > now() - interval '24 hours';
