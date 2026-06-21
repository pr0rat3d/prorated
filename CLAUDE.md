# ProRated — Claude Code Context

## What this is
ProRated ("Built by Pros, Built for Pros") is a verified job site intelligence PWA for licensed trade professionals (contractors, GCs, plumbers, electricians, etc.). Pros search any residential address to see verified reviews from other licensed contractors before bidding.

**URL:** https://prorated.app  
**Admin:** https://prorated.app/admin (password: LittlePigs6969!)  
**Support:** hello@prorated.app → pr0rat3d@gmail.com

---

## Stack
| Layer | Tech |
|-------|------|
| Frontend | React + Vite PWA |
| Database | Supabase (Postgres + Auth + RLS + Edge Functions) |
| Hosting | Vercel |
| DNS / R2 | Cloudflare |
| Maps | Google Maps API |
| Payments | Stripe |
| Email | Resend |
| Mobile | Capacitor (iOS + Android) |

---

## Infrastructure
| Service | Detail |
|---------|--------|
| Supabase ref | wsdrbdojnzmtwndswpwr |
| Vercel project | pro-rated-s-projects1/prorated |
| Cloudflare R2 bucket | prorated-videos |
| App bundle ID | app.prorated |
| Demo account | demo@prorated.io / ProRated2025! |

---

## Pricing
| Tier | Seats | Price | Stripe Link |
|------|-------|-------|-------------|
| Free | 1 | $0 | — |
| 🥉 Bronze | 1–5 | $9.99/mo | https://buy.stripe.com/4gMfZg9mL8TM9HI9szeQM00 |
| 🥈 Silver | 6–15 | $19.99/mo | https://buy.stripe.com/eVqcN4buT0ng6vw48feQM01 |
| 🥇 Gold | 16–39 | $29.99/mo | https://buy.stripe.com/dRmeVc56v6LE3jk34beQM02 |
| 💎 Platinum | 40+ | Custom | mailto:hello@prorated.app |

**Stripe Price IDs:**
- Bronze: price_1TjOgqC1rxqA9InBsiUr7I6g
- Silver: price_1TjR08C1rxqA9InBl5Pl127t
- Gold: price_1TjR2QC1rxqA9InB6TMOOS5L

**Promo:** ProRated2026 = 2 months free (100% off, repeating 2 months, one use per customer)

---

## Key Files
```
src/
  App.js                    ← Router, page state, auth gate
  config.js                 ← Supabase URL, anon key, Google Maps key
  api/
    auth.js                 ← signIn, signUp, signOut, saveSession
    supabase.js             ← fetchReviews, saveReview, updateReview, deleteReview
    lookupCounter.js        ← lookup limits per plan
    db.js                   ← frontend fetch helper → routes through /api/db
  hooks/
    useAuth.js              ← AuthContext, user state, background sync
  pages/
    HomePage.js             ← Search, address lookup
    DashboardPage.js        ← Reviews, saved addresses, profile, team tab
    SignupPage.js           ← Signup + login (3 steps, skips plan for invites)
    ReviewPage.js           ← Multi-step review form with edit mode
    CompanySetupPage.js     ← Team management, invite, rename, delete
    InvitePage.js           ← Invite link handler (/invite/TOKEN)
    NDAPage.js              ← NDA agreement post-signup
    PricingPage.js          ← Plan comparison + Stripe links
    admin/
      AdminPage.js          ← Internal admin console
  components/
    UI.js                   ← Card, Btn, Badge, Stars, Pill (Card spreads ...props)
    NearbyPlaces.js         ← Local suppliers (isPro = plan !== "free")
    AddressCard.js          ← Address search results
  data/
    constants.js            ← TRADES, WORK_CATEGORIES, COMPANY_TIERS, BRAND
    tradeTags.js            ← getTagsForTrade() — grouped by severity
api/
  db.js                     ← Vercel serverless proxy (allowedTables whitelist)
  admin-auth.js             ← Admin password check
supabase/functions/
  send-approval-email/      ← Handles approval, rejection, AND invite emails
  notify-watchers/          ← Push notifications for saved addresses
  stripe-webhook/           ← Updates plan on payment
  check-anniversary-rewards/ ← Weekly loyalty reward check
public/
  service-worker.js         ← PWA SW (cache v7, /invite/* not cached)
```

---

## Database Tables (Supabase)
- `contractors` — user profiles (id, name, email, trade, state, license, plan, status, company_id, company_role)
- `reviews` — job site reviews (address, user_id, overall_score, tags, review_text, would_return)
- `companies` — team workspaces (name, owner_id, plan, seat_limit, status, anniversary_date)
- `invites` — team invites (email, token, company_id, invited_by, expires_at, accepted_at)
- `review_points` — loyalty points (1 point per review, $0.25/point)
- `saved_addresses` — watchlist
- `nda_signatures` — NDA acceptance log
- `lookup_log` — search usage tracking

---

## Auth Flow
1. Signup → NDA → pending screen (admin approves) → approval email
2. Login → `signIn()` fetches contractor row → saves to `prorated_session` in localStorage
3. `useAuth` background sync fires 1.5s after mount — preserves company_id/role from session
4. Plan gating: `user.plan !== "free"` = paid (bronze/silver/gold/platinum)

## Team / Invite Flow
1. Owner creates company → `companies` table + `company_id` on contractor row
2. Owner invites email → `invites` table with UUID token + sends email via `send-approval-email` Edge Function
3. Invitee clicks `/invite/TOKEN` → `InvitePage` loads
4. Not logged in → stores `pending_invite_context` + `pending_invite_token` → goes to signup
5. Signup detects invite context → skips plan step → after NDA → back to InvitePage
6. InvitePage (now logged in) → patches contractor row with company_id + marks invite accepted

---

## Known Issues / Watch Out For
- `Card` component in UI.js spreads `...props` — required for onClick to work
- `isPro` in NearbyPlaces.js = `user?.plan && user.plan !== "free"` (NOT `=== "pro"`)
- Admin `adminDelete` import conflicts with local function — local is named `deleteUser`
- Service worker cache version must be bumped when changing SW behavior
- Supabase anon key fallback hardcoded in InvitePage.js (env var unreliable for unauthenticated pages)
- `company_id` race condition: background auth sync has 1.5s delay to let DB writes settle

---

## Deploy Commands
```bash
# Standard deploy
npm run build
git add .
git commit -m "fix: description"
git push   # auto-deploys via Vercel GitHub integration

# Edge Functions (Supabase dashboard Code tab is most reliable)
supabase functions deploy send-approval-email
supabase functions deploy notify-watchers
supabase functions deploy stripe-webhook

# Link Supabase project
supabase link --project-ref wsdrbdojnzmtwndswpwr
```

---

## Environment Variables (Vercel + .env)
```
VITE_SUPABASE_URL=https://wsdrbdojnzmtwndswpwr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GOOGLE_MAPS_KEY=...
ADMIN_PASSWORD=LittlePigs6969!
SUPABASE_SERVICE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
RESEND_API_KEY=...
```

---

## Co-founders
- Canaan Farris — product, public health/epi background (MPH, UAB)
- Tommy — iOS/Mac builds, App Store submission
 
