# ProRated — App Store Submission Metadata
# Copy and paste these directly into App Store Connect and Google Play Console

═══════════════════════════════════════════════════════
APPLE APP STORE
═══════════════════════════════════════════════════════

── App Information ────────────────────────────────────

App Name (30 chars max):
ProRated – Bid Smarter

Subtitle (30 chars max):
Job Site Intel for Contractors

Bundle ID (set in Xcode/Expo):
io.prorated.app

SKU (internal reference):
PRORATED-001

Primary Category:
Business

Secondary Category:
Utilities

── App Store Description (4000 chars max) ─────────────

ProRated gives contractors the intel they need before they bid — real ratings on real job sites from the contractors who've been there.

Stop walking into job sites blind. ProRated lets verified contractors rate residential properties on 5 key factors:

🚗 ACCESS & PARKING — Is there staging room? Will your truck fit?
💰 PAYMENT RELIABILITY — Do they pay on time, or are you chasing invoices?
📅 TIMELINE RESPECT — Do they honor start dates and make decisions promptly?
🗣 CUSTOMER COMMUNICATION — Are they responsive and professional to work with?
🚧 JOB SITE OBSTACLES — Pets, HOA restrictions, old systems, hazards

Every reviewer is a licensed contractor, verified by license number. No homeowners. No fake reviews. Just real field intelligence from people who've worked the job.

FEATURES:
• Search any residential address for contractor ratings
• 5-category job site scoring system
• Verified contractor reviews with issue tags
• Save addresses to your watchlist
• Push notifications when saved addresses get new reviews
• Leave reviews in 60 seconds — 3-step form
• Works offline — access cached addresses anywhere
• English and Spanish language support
• Secure login with license verification

Free to search (3 lookups/month) and always free to leave reviews.
Upgrade to Pro for unlimited lookups at $9.99/month.

ProRated is built by contractors, for contractors. Bidding Made Better.

── Keywords (100 chars max — comma separated) ──────────

contractor,job site,bidding,roofing,plumbing,electrical,HVAC,ratings,reviews,homeowner

── What's New (release notes) ──────────────────────────

Version 1.0
• Initial release
• Address search with AI-powered job site intelligence
• 5-category contractor ratings
• Verified contractor reviews
• English and Spanish support
• Push notifications for saved addresses
• Offline mode

── Promotional Text (170 chars — can update without review) ─

Know before you bid. ProRated gives contractors real ratings on real job sites — access, payment, communication, and obstacles — all from verified contractors.

── App Store Screenshots Required Sizes ────────────────

iPhone 6.9" (iPhone 16 Pro Max):    1320 x 2868 px  ← REQUIRED
iPhone 6.5" (iPhone 14 Plus):       1242 x 2688 px  ← REQUIRED
iPad Pro 13" (M4):                  2064 x 2752 px  ← if supporting iPad
iPad Pro 12.9" (2nd gen):           2048 x 2732 px  ← if supporting iPad

Recommended screenshots (in order):
1. Home screen — search bar with hero copy
2. Search results — address card with 5-category ratings
3. Review detail — contractor reviews with tags
4. Leave a review — 3-step form
5. Dashboard — saved addresses and profile

── App Review Information ──────────────────────────────

Demo Account (for Apple reviewer):
  Email:    demo@prorated.io
  Password: ProRated2025!

Notes for reviewer:
  This app is for licensed contractors only. The demo account
  is pre-verified and has full Pro access. Search "89 Birchwood Ln"
  or "412 Meadowbrook Dr" to see sample job site ratings.
  The review submission form requires a license number —
  use "AL-DEMO-001" for testing.

── Support & URLs ──────────────────────────────────────

Support URL:      https://prorated.app
Marketing URL:    https://prorated.app
Privacy Policy:   https://prorated.app (navigate to Privacy)

── Age Rating Questionnaire Answers ────────────────────

Does your app contain:
  Cartoon or fantasy violence?          NO
  Realistic violence?                   NO
  Sexual content or nudity?             NO
  Profanity or crude humor?             NO
  Alcohol, tobacco, or drug use?        NO
  Horror/fear themed content?           NO
  Gambling?                             NO
  Medical/treatment information?        NO
  User-generated content?               YES ← contractor reviews
  Unrestricted web access?              NO

Recommended age rating: 4+ (user-generated content is moderated)

── Privacy Nutrition Label (App Privacy) ───────────────

DATA COLLECTED:
  Contact Info:
    • Email Address — Used for: App Functionality, Account Management
      Linked to user: YES | Used for tracking: NO

  Identifiers:
    • User ID — Used for: App Functionality
      Linked to user: YES | Used for tracking: NO

  User Content:
    • Other User Content (reviews) — Used for: App Functionality
      Linked to user: YES | Used for tracking: NO

  Usage Data:
    • App Interactions — Used for: Analytics (aggregate only)
      Linked to user: NO | Used for tracking: NO

DATA NOT COLLECTED:
  • Location data
  • Health & fitness
  • Financial info
  • Browsing history
  • Search history
  • Sensitive info
  • Purchases
  • Diagnostics

═══════════════════════════════════════════════════════
GOOGLE PLAY STORE
═══════════════════════════════════════════════════════

── App Information ────────────────────────────────────

App Name (50 chars):
ProRated – Contractor Job Site Ratings

Short Description (80 chars):
Know the job site before you bid. Verified contractor ratings.

Package Name:
io.prorated.app

Category: Business
Tags: Contractor, Construction, Business Tools

── Full Description (4000 chars) ───────────────────────

[Same as App Store description above — Google allows the same content]

── Content Rating Questionnaire ────────────────────────

Violence: No
Sexual content: No
Controlled substances: No
User-generated content: Yes (text reviews, moderated)

Recommended rating: Everyone

── Data Safety (Google Play) ───────────────────────────

Data collected:
  Personal info:
    • Name — required, encrypted, not shared with third parties
    • Email — required, encrypted, not shared with third parties

  App activity:
    • App interactions — optional, not linked to identity

Data NOT collected:
  • Location
  • Financial info
  • Health info
  • Messages
  • Photos/videos
  • Web browsing

Security practices:
  • Data encrypted in transit ✓
  • Data encrypted at rest ✓
  • Users can request data deletion ✓

── APK / AAB Requirements ──────────────────────────────

Target SDK: 34 (Android 14)
Minimum SDK: 26 (Android 8.0)
App signing: Use Google Play App Signing (recommended)

═══════════════════════════════════════════════════════
EXPO / REACT NATIVE CONFIG (app.json)
═══════════════════════════════════════════════════════

{
  "expo": {
    "name": "ProRated",
    "slug": "prorated",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0F172A"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "io.prorated.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSUserNotificationsUsageDescription": "ProRated sends alerts when saved job site addresses receive new contractor reviews.",
        "NSLocationWhenInUseUsageDescription": "ProRated uses your location to suggest nearby job site addresses."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0F172A"
      },
      "package": "io.prorated.app",
      "versionCode": 1,
      "permissions": [
        "NOTIFICATIONS",
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ]
    },
    "plugins": [
      "expo-notifications"
    ]
  }
}
