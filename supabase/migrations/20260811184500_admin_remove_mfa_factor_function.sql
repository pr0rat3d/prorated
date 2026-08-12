-- Supabase's TOTP MFA has no backup-code mechanism, so a lost-authenticator
-- case has no self-service recovery (confirmed live: unenrolling a verified
-- factor requires AAL2, i.e. you need the device you just lost). This is the
-- one path out — service-role only, called from the admin-remove-mfa edge
-- function, never exposed to the anon/authenticated roles.
create or replace function admin_remove_mfa_factor(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from auth.mfa_factors where user_id = p_user_id;
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function admin_remove_mfa_factor(uuid) from public, anon, authenticated;
grant execute on function admin_remove_mfa_factor(uuid) to service_role;
