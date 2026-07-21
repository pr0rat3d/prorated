import { useState, useEffect } from "react";
import { BRAND } from "../components/UI";
import Logo from "../components/Logo";
import { useAuth } from "../hooks/useAuth";
import { useLang } from "../hooks/useLang";
import { t } from "../i18n/translations";
import { FREE_MONTHLY_LOOKUPS } from "../data/constants";
import { isNativeIOS } from "../utils/platform";
import UpgradeModal from "../components/UpgradeModal";

// ── Stripe live links (replace test_ links before launch) ────
const STRIPE_BRONZE = "https://buy.stripe.com/4gMfZg9mL8TM9HI9szeQM00";
const STRIPE_SILVER = "https://buy.stripe.com/eVqcN4buT0ng6vw48feQM01";
const STRIPE_GOLD   = "https://buy.stripe.com/dRmeVc56v6LE3jk34beQM02";

// Bronze/Silver/Gold are free for the first 6 months — applied automatically
// via the PRORATED2026 Stripe coupon at checkout, no user-facing promo entry.
// Same 6-month duration as the iOS RevenueCat introductory offer (available
// now through Dec 31, 2026), so pricing reads identically on both platforms.
const FREE_2026_COUPON = "PRORATED2026";

// ── Tier definitions ─────────────────────────────────────────
const TIERS = [
  {
    id:       "bronze",
    name:     "Bronze",
    price:    9.99,
    seats:    "1–5 users",
    seatMax:  5,
    icon:     "🥉",
    stripe:   STRIPE_BRONZE,
    iapProductId: "com.prorated.bronze",
    color:    "#B45309",
    bg:       "#FFFBEB",
    border:   "#D97706",
    tagline:  "Perfect for solo pros and small crews",
    features: [
      "1–5 team logins",
      "Unlimited address lookups",
      "All 5 rating categories",
      "Full tag library + tooltips",
      "Bid Prep Summary",
      "Would-Return rate",
      "Save unlimited addresses",
      "Push notifications",
      "Local Points of Interest",
      "Watchlist alerts",
    ],
    lockedFeatures: ["Bid Intelligence (Gold+ Early Access)"],
  },
  {
    id:       "silver",
    name:     "Silver",
    price:    19.99,
    seats:    "6–15 users",
    seatMax:  15,
    icon:     "🥈",
    stripe:   STRIPE_SILVER,
    iapProductId: "com.prorated.silver",
    color:    "#475569",
    bg:       "#F8FAFC",
    border:   "#94A3B8",
    tagline:  "For growing trade businesses",
    popular:  true,
    features: [
      "6–15 team logins",
      "Everything in Bronze",
      "Team review dashboard",
      "Priority support",
      "Early access to new features",
    ],
    lockedFeatures: ["Bid Intelligence (Gold+ Early Access)"],
  },
  {
    id:       "gold",
    name:     "Gold",
    price:    29.99,
    seats:    "16–39 users",
    seatMax:  39,
    icon:     "🥇",
    stripe:   STRIPE_GOLD,
    iapProductId: "com.prorated.gold",
    color:    "#92400E",
    bg:       "#FFFBEB",
    border:   "#F59E0B",
    tagline:  "For large companies and multi-crew operations",
    features: [
      "Up to 39 team logins",
      "Everything in Silver",
      "Dedicated account support",
      "Custom onboarding",
      "Bid Intelligence — AI bid prep summaries",
      "Early access to new features",
    ],
    earlyAccessFeature: "Bid Intelligence — AI bid prep summaries",
  },
  {
    id:       "platinum",
    name:     "Platinum",
    price:    null,
    seats:    "40+ users",
    seatMax:  999,
    icon:     "\u{1F48E}",
    stripe:   null,
    color:    "#1E3A8A",
    bg:       "#EFF6FF",
    border:   "#BFDBFE",
    tagline:  "Enterprise pricing for large trade organizations",
    contact:  true,
    features: [
      "40+ team logins (custom seat limit)",
      "Everything in Gold",
      "Custom pricing negotiated directly",
      "Dedicated account manager",
      "Onboarding + training for your team",
      "Bid Intelligence — AI bid prep summaries",
      "Early access to all new features",
    ],
    earlyAccessFeature: "Bid Intelligence — AI bid prep summaries",
  },

];

const FREE_FEATURES = [
  `${FREE_MONTHLY_LOOKUPS} address lookups/month`,
  "Leave unlimited reviews",
  "All 5 rating categories",
  "Save up to 3 addresses",
  "Single login only",
];

function Check({ color = BRAND.green }) {
  return <span style={{ color, fontWeight: 700, marginRight: 8, flexShrink: 0 }}>✓</span>;
}

export default function PricingPage({ go, goBack, onPurchaseSuccess }) {
  const { user, isLoggedIn } = useAuth();
  const currentPlan = user?.plan || "free";
  const { lang }             = useLang();
  const nativeIOS            = isNativeIOS();
  const [loading, setLoading]       = useState(null);
  const [upgradeTier, setUpgradeTier] = useState(null);

  // Handoff from Signup/CompanySetupPage on iOS — auto-open the purchase
  // modal for the tier the user picked before the account/company existed.
  useEffect(() => {
    if (!nativeIOS) return;
    const pendingId = localStorage.getItem("pending_iap_tier");
    if (!pendingId) return;
    localStorage.removeItem("pending_iap_tier");
    const match = TIERS.find(t => t.id === pendingId);
    if (match) setUpgradeTier(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpgrade = (tier) => {
    setLoading(tier.id);
    let url = tier.stripe;
    const params = new URLSearchParams();
    if (isLoggedIn && user?.email) params.set("prefilled_email", user.email);
    params.set("prefilled_promo_code", FREE_2026_COUPON);
    url += "?" + params.toString();
    window.location.href = url;
    setTimeout(() => setLoading(null), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif", paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: "#0F172A", padding: "2rem 1.25rem 2.5rem", textAlign: "center" }}>
        <button onClick={() => goBack ? goBack() : go("home")}
          style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginBottom: 16, display: "block", margin: "0 auto 16px" }}>
          ← Back
        </button>
        <Logo size={52} dark={false} />
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#F8FAFC", margin: "12px 0 6px" }}>Simple team pricing</h1>
        <p style={{ fontSize: 14, color: "#94A3B8", margin: 0 }}>One flat monthly price. No annual lock-in. Cancel anytime.</p>

        {!nativeIOS && (
          <div style={{ maxWidth: 400, margin: "20px auto 0", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(134,239,172,0.4)", borderRadius: 10, padding: "10px 16px", textAlign: "center" }}>
            <span style={{ fontSize: 12, color: "#86EFAC" }}>🎉 Bronze, Silver &amp; Gold are free for your first 6 months — card collected, no charge until then.</span>
          </div>
        )}
      </div>

      {/* Free tier */}
      <div style={{ maxWidth: 560, margin: "24px auto 0", padding: "0 1.25rem" }}>
        <div style={{ background: "#fff", border: `1.5px solid ${BRAND.border}`, borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: BRAND.dark }}>Free</div>
              <div style={{ fontSize: 12, color: BRAND.gray, marginTop: 2 }}>Get started with the basics</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: BRAND.dark }}>$0</span>
              <span style={{ fontSize: 12, color: BRAND.gray }}>/mo</span>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${BRAND.border}`, paddingTop: 12 }}>
            {FREE_FEATURES.map(f => (
              <div key={f} style={{ display: "flex", alignItems: "flex-start", marginBottom: 6, fontSize: 13, color: BRAND.dark }}>
                <Check color={BRAND.gray} />{f}
              </div>
            ))}
          </div>
          {currentPlan === "free" && (
            <div style={{ marginTop: 10, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, color: BRAND.blue, textAlign: "center" }}>
              ✓ Your current plan
            </div>
          )}
          {!isLoggedIn && (
            <button onClick={() => go("signup")}
              style={{ width: "100%", marginTop: 14, padding: "10px", background: "#F1F5F9", color: BRAND.dark, border: `1.5px solid ${BRAND.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Sign up free →
            </button>
          )}
        </div>

        {/* Paid tiers */}
        {TIERS.map(tier => (
          <div key={tier.id} style={{
            background:   "#fff",
            border:       `${tier.popular ? "2px" : "1.5px"} solid ${tier.popular ? BRAND.blue : BRAND.border}`,
            borderRadius: 16,
            padding:      "1.25rem 1.5rem",
            marginBottom: 16,
            position:     "relative",
          }}>
            {tier.popular && (
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: BRAND.blue, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 14px", borderRadius: 20, whiteSpace: "nowrap" }}>
                Most Popular
              </div>
            )}

            {/* Tier header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: BRAND.dark }}>
                  {tier.icon} {tier.name}
                </div>
                <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 2 }}>{tier.tagline}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                {tier.contact ? (
                  <span style={{ fontSize: 20, fontWeight: 800, color: BRAND.dark }}>Contact us</span>
                ) : (
                  <>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#16A34A" }}>First 6 months free</div>
                    <div style={{ fontSize: 11, color: BRAND.gray }}>then ${tier.price}/mo · cancel anytime</div>
                  </>
                )}
              </div>
            </div>

            {/* Seat badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: tier.bg, border: `1px solid ${tier.border}`, borderRadius: 8, padding: "4px 10px", marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: tier.color, fontWeight: 700 }}>👥 {tier.seats}</span>
            </div>

            {/* Features */}
            <div style={{ borderTop: `1px solid ${BRAND.border}`, paddingTop: 12, marginBottom: 14 }}>
              {tier.features.map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", marginBottom: 6, fontSize: 13, color: BRAND.dark }}>
                  <Check />{f}
                  {tier.earlyAccessFeature === f && (
                    <span style={{ marginLeft: 8, background: "#FFFBEB", color: "#B45309", border: "1px solid #FCD34D", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 20, whiteSpace: "nowrap" }}>
                      ⚡ EARLY ACCESS
                    </span>
                  )}
                </div>
              ))}
              {(tier.lockedFeatures || []).map(f => (
                <div key={f} style={{ display: "flex", alignItems: "flex-start", marginBottom: 6, fontSize: 13, color: "#94A3B8" }}>
                  <span style={{ color: "#CBD5E1", fontWeight: 700, marginRight: 8, flexShrink: 0 }}>✓</span>{f}
                </div>
              ))}
            </div>

            {/* CTA */}
            {currentPlan === tier.id ? (
              <div style={{ width: "100%", padding: "11px", background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 10, fontSize: 14, fontWeight: 700, color: BRAND.blue, textAlign: "center" }}>
                ✓ Your current plan
              </div>
            ) : nativeIOS ? (
              <button
                onClick={() => setUpgradeTier(tier)}
                style={{ width: "100%", padding: "11px", background: tier.popular ? BRAND.blue : "#0F172A", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                Get Started →
              </button>
            ) : tier.contact ? (
              <a href={"mailto:hello@prorated.app?subject=Platinum%20Plan%20Inquiry%20-%20" + encodeURIComponent(tier.name)}
                style={{ display: "block", width: "100%", padding: "11px", background: "#1E3A8A", color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}>
                Contact us for pricing →
              </a>
            ) : (
              <button
                onClick={() => handleUpgrade(tier)}
                disabled={loading === tier.id}
                style={{ width: "100%", padding: "11px", background: tier.popular ? BRAND.blue : "#0F172A", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading === tier.id ? "not-allowed" : "pointer", opacity: loading === tier.id ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif", transition: "opacity 0.15s" }}>
                {loading === tier.id ? "Opening checkout..." : "Get Started Free →"}
              </button>
            )}
          </div>
        ))}

        {/* Loyalty note */}
        <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 14, padding: "1rem 1.25rem", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 4 }}>🎁 Active user reward</div>
          <div style={{ fontSize: 12, color: "#15803D", lineHeight: 1.6 }}>
            Average 3 reviews per week as a team over your first year and your 13th month is on us. Every year.
          </div>
        </div>

        {/* FAQ */}
        <div style={{ background: "#fff", border: `1.5px solid ${BRAND.border}`, borderRadius: 16, padding: "1.25rem 1.5rem" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: BRAND.dark, marginBottom: 12 }}>Common questions</div>
          {[
            ["Can I change plans later?",          "Yes — upgrade or downgrade anytime. Changes take effect immediately."],
            ["What happens to my team if I downgrade?", "Existing members keep access. You just can't add new members until you're under the new seat limit."],
            ["Is there a contract?",               "No. Month-to-month only. Cancel anytime from your dashboard."],
            ["Why is my card charged $0 today?",   "Bronze, Silver, and Gold are free for your first 6 months. We collect your card at checkout to make the switch to billing seamless, but nothing is charged until your 7th month — cancel anytime before then at no cost."],
            ["How does the 13th month reward work?", "On your 1-year anniversary, if your team averaged 3 or more reviews per week (156 total), we add one free month before your next charge."],
            ["Can individuals use ProRated?",      "Yes — sign up free and search addresses without a team plan. Upgrade to Bronze for unlimited access."],
          ].map(([q, a]) => (
            <div key={q} style={{ borderBottom: `1px solid ${BRAND.border}`, padding: "10px 0" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 4 }}>{q}</div>
              <div style={{ fontSize: 12, color: BRAND.gray, lineHeight: 1.6 }}>{a}</div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p style={{ textAlign: "center", fontSize: 11, color: BRAND.gray, marginTop: 20 }}>
          Bronze, Silver, and Gold are <strong style={{ color: BRAND.dark, fontWeight: 700 }}>free for your first 6 months</strong> — your card is collected at checkout but not charged until then.
          Payments processed securely by Stripe.
        </p>
      </div>

      <UpgradeModal tier={upgradeTier} isOpen={!!upgradeTier} onClose={() => setUpgradeTier(null)} go={go} onPurchaseSuccess={onPurchaseSuccess} />
    </div>
  );
}
