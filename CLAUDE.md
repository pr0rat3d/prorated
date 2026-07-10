# ProRated — Claude Code Context

_Last updated: 2026-07-09_

## What this is
ProRated ("Built by Pros, Built for Pros") is a verified job site intelligence PWA for licensed trade professionals (contractors, GCs, plumbers, electricians, etc.). Pros search any residential address to see verified reviews from other licensed contractors before bidding.

**URL:** https://prorated.app  
**Admin:** https://prorated.app/admin (password: LittlePigs6969!)  
**Support:** hello@prorated.app → pr0rat3d@gmail.com

## Current status (2026-07-09)
- **iOS:** build 26 submitted to App Store, **in review** (Guideline 5.1.1v fix — unauthenticated search — plus 2 prior build fixes: Google Maps key fallback, demo-account auth). See "iOS/Android Build & Store Status" below for full build history.
- **Android:** submitted to Google Play, **in review**.
- Beta language fully removed from user-facing copy app-wide. App is out of beta.
- Bronze/Silver/Gold are **free through Dec 31, 2026** (Stripe coupon auto-applied, card still collected).
- Bid Intelligence is built and deployed but **feature-flagged off** in production — not yet enabled for any user.

---

## Major Features (built & deployed)
- **Core review flow** — search any address, submit/edit multi-step reviews (payment/access/communication scoring, tags, work items), semi-anonymous display (initials + trade, never full name).
- **Trust score system** (2026-06-28) — DB-calculated reviewer trust score (0–100), 5 tiers with badges (New Member → Elite Pro), shown as a label-only pill on profile/review cards. See "Trust Score System" below.
- **Helpful votes** — `helpful_votes` table, one vote per reviewer per review (DB-enforced via `UNIQUE`), feeds trust score.
- **Team / company accounts** — company workspaces, seat-based plans, email invites with auto-approve for invited members.
- **Unauthenticated search** (2026-07-09, Apple 5.1.1v requirement) — guests can search any address without logging in; results are heavily minimized (address + Street View + lock card only, no ratings/tags/text). Enforced at the DB layer via column-level RLS grants, not just the UI — see "Known Issues" and "iOS/Android Build & Store Status" below.
- **Bid Intelligence** (2026-07-06) — AI-generated (Claude) bid-prep report per address for Gold/Platinum, built and verified end-to-end but **gated behind `feature_flags` and currently disabled** in production. Full in-app UI walkthrough with a real paid account still pending. See "Feature Flags" below.
- **Free-through-2026 pricing** (2026-07-06) — Bronze/Silver/Gold subscriptions are $0 until Jan 1, 2027 via an auto-applied Stripe coupon (`PRORATED2026`); card is still collected at signup.
- **SEO landing pages** — Birmingham + 4 other AL city pages (`LocalPage.js`: Huntsville, Mobile, Montgomery, Tuscaloosa), 5 trade landing pages (`TradePage.js`: roofing, electrical, plumbing, HVAC, general), and a blog (`BlogPage.js`) with several articles — all routed in `App.js`.
- **App Store / Google Play badges** — `StoreBadges.js`, platform-aware, shown on HomePage/LocalPage/footer. **Links are still placeholder** (`https://prorated.app`) pending both store listings going live — swap the two URL constants once approved.
- **Beta language removed** (2026-07-09) — all "beta" copy stripped from onboarding, homepage, FAQ, and partner/AGC landing pages. Left alone (not user-visible): the `/beta` route slug, `beta_signups`/`beta_feedback` table names, internal `useOnboarding.js` variable/localStorage names.
- **Native platform gating** — `isNativeIOS()` (`src/utils/platform.js`, wraps `Capacitor.isNativePlatform() && getPlatform() === "ios"`) hides all Stripe payment links and the Merch nav item on iOS (App Store policy — no external payment links in-app). A separate `isNativeApp()` covers both iOS+Android for hiding "download our app" prompts.

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
| Demo account | demo@prorated.io / LittlePigs6969! |

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

**Free through 2026 (2026-07-06):** Bronze/Silver/Gold are currently $0 through Dec 31, 2026 to accelerate data collection ahead of Bid Intelligence's launch thresholds. Card is still collected via Stripe checkout; the `PRORATED2026` 100%-off coupon is auto-applied via `prefilled_promo_code` on the checkout URL — no manual entry. First real charge lands January 2027. Platinum is unaffected (no Stripe link).

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
    useFeatureFlag.js       ← reads feature_flags table by plan
  utils/
    platform.js             ← isNativeIOS(), isNativeApp() — Capacitor platform checks
    bidScoring.js            ← deterministic scoring engine for Bid Intelligence
  pages/
    HomePage.js             ← Search, address lookup (guest search included)
    DashboardPage.js        ← Reviews, saved addresses, profile, team tab
    SignupPage.js           ← Signup + login (3 steps, skips plan for invites)
    ReviewPage.js           ← Multi-step review form with edit mode
    CompanySetupPage.js     ← Team management, invite, rename, delete
    InvitePage.js           ← Invite link handler (/invite/TOKEN)
    NDAPage.js              ← NDA agreement post-signup
    PricingPage.js          ← Plan comparison + Stripe links
    LocalPage.js            ← SEO city landing pages (Birmingham + 4 others)
    TradePage.js            ← SEO trade landing pages (roofing/electrical/plumbing/HVAC/general)
    BlogPage.js              ← Blog list + article permalinks
    PartnerDashboardPage.js  ← /agc/dashboard etc., shares admin auth
    admin/
      AdminPage.js          ← Internal admin console (incl. Feature Flags tab)
  components/
    UI.js                   ← Card, Btn, Badge, Stars, Pill (Card spreads ...props)
    NearbyPlaces.js         ← Local suppliers (isPro = plan !== "free")
    AddressCard.js          ← Address search results (guest branch = minimal preview)
    BidIntelligence.js      ← Bid Intelligence card UI (Gold/Platinum, behind feature flag)
    StoreBadges.js           ← App Store / Google Play badges, platform-aware
  data/
    constants.js            ← TRADES, WORK_CATEGORIES, COMPANY_TIERS, BRAND
    tradeTags.js            ← getTagsForTrade() — grouped by severity
api/
  db.js                     ← Vercel serverless proxy (allowedTables whitelist, adminGet/Post/Patch/Delete)
  admin-auth.js             ← Admin password check
supabase/functions/
  send-approval-email/      ← Handles approval, rejection, AND invite emails
  notify-watchers/          ← Push notifications for saved addresses
  stripe-webhook/           ← Updates plan on payment
  check-anniversary-rewards/ ← Weekly loyalty reward check
  bid-intelligence/         ← Calls Anthropic to generate advisory bid-prep reports
public/
  service-worker.js         ← PWA SW (cache v7, /invite/* not cached)
```

---

## Database Tables (Supabase)
- `contractors` — user profiles (id, name, email, trade, state, license, plan, status, company_id, company_role, `trust_score`, `review_points` is a column here, not its own table)
- `reviews` — job site reviews (address, user_id, overall_score, tags, review_text, would_return, work_items[])
- `companies` — team workspaces (name, owner_id, plan, seat_limit, status, anniversary_date)
- `invites` — team invites (email, token, company_id, invited_by, expires_at, accepted_at)
- `helpful_votes` — one row per (review_id, voter_id), `UNIQUE` constraint prevents double-voting; feeds trust score
- `feature_flags` — gradual rollout gating (currently one row: `bid_intelligence`, disabled). See "Feature Flags" below.
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

## Trust Score System
DB function `calculate_trust_score(contractor_id)`: first review +10, each subsequent +5, each helpful vote received +5, +2/month since account creation, capped at 100. Trigger `recalc_trust_on_review` recalculates on every review insert. 5 tiers (New Member/Established/Trusted/Verified Pro/Elite Pro) shown as a label-only pill (no number) on profile cards, review cards, and My Reviews.

## Feature Flags
`feature_flags` table (public SELECT, service-role writes) gates gradual rollouts, read via `src/hooks/useFeatureFlag.js`. Admin → Feature Flags tab has Enable Early Access / Full Launch / Disable buttons per flag, each behind a confirm dialog — no SQL needed. Currently one flag, `bid_intelligence`, fully disabled. Launch thresholds tracked live in Admin → Overview: 50+ total reviews → flip Early Access (Gold/Platinum), 200+ → Full Launch (all paid tiers).

## Unauthenticated Search & Reviewer Privacy
Guests can search (Apple 5.1.1v requirement) but see only address + Street View + a lock card — no rating, score bars, tags, or timing info. Enforced at the DB layer, not just the UI: `reviews` anon SELECT grant is restricted to a safe column subset (no `review_text`, `tags`, `contractor_name`, `user_id`); full columns require `authenticated`. Guest search calls the `address_has_reviews(text)` RPC (`SECURITY DEFINER`, returns boolean only) instead of fetching review rows. **Postgres gotcha:** `select=*` against a partial column grant hard-errors (`42501`) rather than silently narrowing — any future anon-facing query must list exact columns.

---

## Known Issues / Watch Out For
- `Card` component in UI.js spreads `...props` — required for onClick to work
- `isPro` in NearbyPlaces.js = `user?.plan && user.plan !== "free"` (NOT `=== "pro"`)
- Admin `adminDelete` import conflicts with local function — local is named `deleteUser`
- Service worker cache version must be bumped when changing SW behavior (currently `prorated-v7`)
- Supabase anon key fallback hardcoded in InvitePage.js and `config.js` (env var unreliable for unauthenticated pages / native builds — Codemagic doesn't reliably set `VITE_*` env vars, so `config.js`'s Supabase URL/anon key AND Google Maps key all need hardcoded fallbacks, not just anon key)
- `company_id` race condition: background auth sync has 1.5s delay to let DB writes settle
- Any anon-facing Supabase query must list exact columns (`select=col1,col2`) — `select=*` hard-errors against a partial column grant, it does not silently narrow
- Admin password: do not use `import.meta.env.VITE_ADMIN_PASSWORD` in `AdminPage.js` — read from `sessionStorage` key `pr_admin_auth`, set via `/api/admin-auth` server-side check. Partner Dashboard (`/agc/dashboard` etc.) shares this same admin auth — no separate per-partner login yet (deliberate, only 3 real partner agencies so far; Canaan's team shares data manually).
- Codemagic's iOS build number in `codemagic.yaml` is **hardcoded**, not auto-incrementing, and Codemagic's own dashboard status can lag/misreport vs. what actually registered in App Store Connect — always verify the last real build number against ASC directly before triggering a new build, don't trust Codemagic's UI alone.

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
supabase functions deploy bid-intelligence

# iOS: keep Xcode project in sync after native-relevant changes,
# then bump the build number in codemagic.yaml BEFORE triggering a Codemagic build
npx cap sync ios

# Link Supabase project
supabase link --project-ref wsdrbdojnzmtwndswpwr
```

---

## iOS/Android Build & Store Status (as of 2026-07-09)
**Treat build numbers and store review status as a snapshot — verify against App Store Connect / Google Play Console directly before relying on them, they change outside this repo.**

- **iOS:** build 26 submitted, **in review**. Build history this resubmission cycle: 22 (rejected — Guideline 5.1.1v, search required login), 23 (uploaded, shipped with broken Maps autocomplete), 24 (fixed Maps key, upload succeeded despite Codemagic reporting failure), 25 (confirmed live in ASC/TestFlight), 26 (current — carries the guest-search DB privacy fix + beta-copy removal).
- **Android:** submitted to Google Play, **in review**. Codemagic workflow builds APK/AAB with release signing configured; versionCode auto-increments.
- **Tommy's Mac is broken** — not used for builds. Codemagic.io handles archive + store submission for both platforms.
- `npx cap sync ios` keeps the Xcode project current on the PC for Codemagic/Tommy builds.

---

## Environment Variables (Vercel + .env)
```
VITE_SUPABASE_URL=https://wsdrbdojnzmtwndswpwr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GOOGLE_MAPS_KEY=...
VITE_ADMIN_PASSWORD=...        # Vercel only — do NOT read via import.meta.env in AdminPage.js at runtime, see Known Issues
ADMIN_PASSWORD=LittlePigs6969!
SUPABASE_SERVICE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
RESEND_API_KEY=...
ANTHROPIC_API_KEY=...          # Supabase secret, used by bid-intelligence edge function
```

---

## Co-founders
- Canaan Farris — product, public health/epi background (MPH, UAB)
- Tommy — iOS/Mac builds, App Store submission
 
