# ProRated — Push Notification Setup

Your VAPID keys have been generated. Follow these steps to go live.

─────────────────────────────────────────────────────────────
STEP 1 — Run the Supabase SQL
─────────────────────────────────────────────────────────────

Go to Supabase → SQL Editor and run the contents of:
  supabase_push.sql

This creates the push_subscriptions and notification_log tables.

─────────────────────────────────────────────────────────────
STEP 2 — Set secrets in Supabase Edge Functions
─────────────────────────────────────────────────────────────

Install Supabase CLI (if not already installed):
  npm install -g supabase

Login and link your project:
  supabase login
  supabase link --project-ref wsdrbdojnzmtwndswpwr

Set your VAPID secrets (run each line separately):
  supabase secrets set VAPID_PUBLIC_KEY=BFCehdO86H-wfTwu9ftnDm49Z3tzdxtQ19uvBo0lboeSySy-1QoNUPoL9oRuscog9C5BFvQHAyFIJscJEdnmUXo
  supabase secrets set VAPID_PRIVATE_KEY=Mo-4Ij3npybrtgcBclcoLwooBCgZQI4VQ24CB57qjL8
  supabase secrets set VAPID_SUBJECT=mailto:hello@prorated.io

─────────────────────────────────────────────────────────────
STEP 3 — Deploy the Edge Function
─────────────────────────────────────────────────────────────

  supabase functions deploy notify-watchers

You should see:
  Deployed function notify-watchers

─────────────────────────────────────────────────────────────
STEP 4 — Add VAPID public key to Vercel environment
─────────────────────────────────────────────────────────────

Go to vercel.com → your ProRated project → Settings → Environment Variables

Add this variable:
  Name:  REACT_APP_VAPID_PUBLIC_KEY
  Value: BFCehdO86H-wfTwu9ftnDm49Z3tzdxtQ19uvBo0lboeSySy-1QoNUPoL9oRuscog9C5BFvQHAyFIJscJEdnmUXo

─────────────────────────────────────────────────────────────
STEP 5 — Build and deploy
─────────────────────────────────────────────────────────────

  cd C:\prorated
  npm run build
  vercel --prod

─────────────────────────────────────────────────────────────
HOW IT WORKS ONCE LIVE
─────────────────────────────────────────────────────────────

1. Contractor opens ProRated
2. After 30 seconds: "Get notified of new reviews 🔔" prompt appears
3. They tap Enable → browser asks permission → they allow
4. Subscription saved to Supabase push_subscriptions table
5. Another contractor submits a review for a saved address
6. ReviewPage calls notifyAddressWatchers()
7. Supabase Edge Function fires → finds all watchers → sends Web Push
8. First contractor gets notification:
   "412 Meadowbrook Dr just got a new contractor review.
    Tap to see it before you bid." 🛡️

─────────────────────────────────────────────────────────────
⚠️  SECURITY NOTES
─────────────────────────────────────────────────────────────

✓ Public key  — safe to include in client-side code (already done)
✓ Private key — stored ONLY in Supabase secrets, never in source code
✓ .gitignore  — .env.local is excluded from any git commits
✗ Never paste your private key into any file that gets deployed
