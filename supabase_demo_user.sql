-- ============================================================
-- ProRated — Create Demo User
-- Run this in Supabase → SQL Editor
-- Creates a demo contractor account for presentations
-- ============================================================

-- Note: Supabase Auth users must be created via the Auth dashboard
-- or the API. Use the Supabase dashboard instead:
--
-- 1. Go to Supabase → Authentication → Users
-- 2. Click "Add user" → "Create new user"
-- 3. Email:    demo@prorated.io
-- 4. Password: ProRated2025!
-- 5. Click "Create user"
--
-- Then run this to add their contractor profile:

insert into contractors (id, email, name, trade, state, license, plan, status, trust_score, verified_pro, verified_pro_bio)
select 
  id,
  'demo@prorated.io',
  'Demo Contractor',
  'roofing',
  'AL',
  'AL-DEMO-001',
  'pro',
  'approved',
  85,
  true,
  'Verified roofing contractor with 10+ years residential experience. ProRated demo account.'
from auth.users 
where email = 'demo@prorated.io'
on conflict (id) do update set
  status        = 'approved',
  trust_score   = 85,
  verified_pro  = true,
  plan          = 'pro',
  verified_pro_bio = 'Verified roofing contractor with 10+ years residential experience. ProRated demo account.';
