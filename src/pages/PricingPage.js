import { useState } from "react";
import { BRAND } from "../components/UI";
import Logo from "../components/Logo";
import { useAuth } from "../hooks/useAuth";
import { useLang } from "../hooks/useLang";
import { t } from "../i18n/translations";
import { FREE_MONTHLY_LOOKUPS } from "../data/constants";

const STRIPE_MONTHLY = "https://buy.stripe.com/test_00waEW0RKfllcKb9uJ9Ve00";
const STRIPE_ANNUAL  = "https://buy.stripe.com/test_8x23cu7g87STdOf0Yd9Ve01";

const FREE_FEATURES = [
  `${FREE_MONTHLY_LOOKUPS} address lookups per month`,
  "Leave unlimited reviews",
  "All 5 rating categories",
  "Issue tags",
  "Save up to 3 addresses",
];

const PRO_FEATURES = [
  "Unlimited address lookups",
  "All 5 rating categories",
  "Full issue tag library",
  "Save unlimited addresses",
  "Push notifications for saved addresses",
  "Local Points of Interest (suppliers + food)",
  "Watchlist alerts before you bid",
  "Priority support",
  "Early access to new features",
];

function Check({ color = BRAND.green }) {
  return <span style={{ color, fontWeight: 700, marginRight: 8, flexShrink: 0 }}>✓</span>;
}

export default function PricingPage({ go, goBack }) {
  const { user, isLoggedIn } = useAuth();
  const { lang } = useLang();
  const pOpenCheckout  = t(lang, "pricingExtra.openingCheckout");
  const [billing, setBilling] = useState("monthly");
  const pUpgradeBtn   = billing === "annual" ? t(lang, "pricingExtra.upgradeAnnual") : t(lang, "pricingExtra.upgradeMonthly"); // "monthly" | "annual"
  const [loading, setLoading] = useState(false);

  const monthlyPrice = 9.99;
  const annualPrice  = 99.99;
  const annualMonthly = (annualPrice / 12).toFixed(2); // $8.33/mo
  const savings = Math.round(((monthlyPrice * 12) - annualPrice) / (monthlyPrice * 12) * 100);

  const handleUpgrade = () => {
    setLoading(true);
    const link        = billing === "annual" ? STRIPE_ANNUAL : STRIPE_MONTHLY;
    const base = isLoggedIn && user?.email
      ? `${link}?prefilled_email=${encodeURIComponent(user.email)}`
      : link;
    window.location.href = base;
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "3rem 1.5rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <Logo size={56} />
        </div>
        <h1 style={{ fontSize: "clamp(26px,5vw,40px)", fontWeight: 800, color: BRAND.dark, marginBottom: 10, letterSpacing: "-0.5px" }}>
          Simple, transparent pricing
        </h1>
        <p style={{ fontSize: 15, color: BRAND.gray, maxWidth: 400, margin: "0 auto", lineHeight: 1.65 }}>
          Start free. Upgrade for unlimited lookups and full intel on every job site.
        </p>
      </div>

      {/* Billing toggle */}
      <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: 12, color: BRAND.gray, fontWeight: 600 }}>Choose billing period:</span>
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem", padding: "0 1.5rem" }}>
        <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 14, padding: 4, position: "relative" }}>
          {["monthly", "annual"].map(b => (
            <button key={b} onClick={() => setBilling(b)}
              style={{ padding: "9px 24px", borderRadius: 11, border: "none", background: billing === b ? "#fff" : "transparent", color: billing === b ? BRAND.dark : BRAND.gray, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: billing === b ? "0 2px 8px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s", position: "relative" }}>
              {b === "monthly" ? t(lang, "pricing.monthly") : t(lang, "pricing.annual")}
              {b === "annual" && (
                <span style={{ position: "absolute", top: -10, right: -8, background: BRAND.green, color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 10 }}>
                  SAVE {savings}%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 1.5rem 4rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>

        {/* Free */}
        <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 20, padding: "2rem", display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.gray, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 8 }}>Free</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
              <span style={{ fontSize: 42, fontWeight: 800, color: BRAND.dark, fontFamily: "'DM Mono', monospace" }}>$0</span>
              <span style={{ fontSize: 14, color: BRAND.gray }}>/month</span>
            </div>
            <p style={{ fontSize: 13, color: BRAND.gray, lineHeight: 1.6, margin: 0 }}>Perfect for occasional bidding and trying ProRated.</p>
          </div>
          <div style={{ flex: 1, borderTop: `1px solid ${BRAND.border}`, paddingTop: "1.25rem", marginBottom: "1.5rem" }}>
            {FREE_FEATURES.map(f => (
              <div key={f} style={{ display: "flex", alignItems: "flex-start", padding: "5px 0", fontSize: 13, color: BRAND.dark }}>
                <Check />{f}
              </div>
            ))}
          </div>
          <button onClick={() => isLoggedIn ? go("home") : go("signup")}
            style={{ width: "100%", background: "#F1F5F9", color: BRAND.dark, border: `1.5px solid ${BRAND.border}`, padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            {isLoggedIn ? "Your current plan" : "Get started free"}
          </button>
        </div>

        {/* Pro */}
        <div style={{ background: BRAND.dark, border: `2px solid ${BRAND.blue}`, borderRadius: 20, padding: "2rem", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 16, right: 16, background: BRAND.blue, color: "#fff", fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>MOST POPULAR</div>
          <div style={{ position: "absolute", top: "-40%", right: "-20%", width: 300, height: 300, background: "radial-gradient(ellipse,rgba(37,99,235,0.15) 0%,transparent 70%)", pointerEvents: "none" }} />

          <div style={{ marginBottom: "1.5rem", position: "relative" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#93C5FD", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 8 }}>Pro</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 42, fontWeight: 800, color: "#fff", fontFamily: "'DM Mono', monospace" }}>
                ${billing === "annual" ? annualMonthly : "9.99"}
              </span>
              <span style={{ fontSize: 14, color: "#94A3B8" }}>/month</span>
            </div>
            {billing === "annual" && (
              <div style={{ fontSize: 12, color: "#4ADE80", fontWeight: 600, marginBottom: 6 }}>
                Billed annually — ${annualPrice}/year · saves you ${((monthlyPrice * 12) - annualPrice).toFixed(2)}/year
              </div>
            )}
            {billing === "monthly" && (
              <div style={{ fontSize: 11, color: "#64748B", marginBottom: 6 }}>
                Or save {savings}% with annual billing — ${annualMonthly}/mo
              </div>
            )}
            <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.6, margin: 0 }}>
              For contractors who bid regularly and need full intel on every job.
            </p>
          </div>

          <div style={{ flex: 1, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1.25rem", marginBottom: "1.5rem", position: "relative" }}>
            {PRO_FEATURES.map(f => (
              <div key={f} style={{ display: "flex", alignItems: "flex-start", padding: "5px 0", fontSize: 13, color: "#F1F5F9" }}>
                <Check color="#4ADE80" />{f}
              </div>
            ))}
          </div>

          <button onClick={handleUpgrade} disabled={loading}
            style={{ width: "100%", background: BRAND.blue, color: "#fff", border: "none", padding: "13px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.7 : 1, position: "relative" }}>
            {loading ? pOpenCheckout : pUpgradeBtn}
          </button>
          <p style={{ fontSize: 11, color: "#64748B", textAlign: "center", marginTop: 10, margin: "10px 0 0" }}>
            Cancel anytime · Secure payment via Stripe
          </p>
        </div>
      </div>

      {/* Current plan callout for logged-in users */}
      {isLoggedIn && (
        <div style={{ maxWidth: 820, margin: "-2rem auto 2rem", padding: "0 1.5rem" }}>
          <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 14, padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 2 }}>
                📋 Your current plan: <strong>{user?.plan === "pro" ? "Pro" : "Free"}</strong>
              </div>
              <div style={{ fontSize: 12, color: "#166534" }}>
                {user?.plan === "pro"
                  ? t(lang, "pricingExtra.proUnlimited")
                  : `${FREE_MONTHLY_LOOKUPS} lookups/month · Upgrade for unlimited access`}
              </div>
            </div>
            {user?.plan !== "pro" && (
              <button onClick={handleUpgrade}
                style={{ background: BRAND.green, color: "#fff", border: "none", padding: "8px 18px", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                Upgrade now →
              </button>
            )}
          </div>
        </div>
      )}

      {/* FAQ */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 1.5rem 4rem" }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: BRAND.dark, marginBottom: "1.25rem", textAlign: "center" }}>Common questions</h2>
        {[
          ["What counts as a lookup?", `Searching a new address uses 1 lookup. Searching the same address again doesn't use another. Free accounts get ${FREE_MONTHLY_LOOKUPS} per month — resets on the 1st.`],
          ["What's the difference between monthly and annual?", `Monthly is $9.99/month. Annual is $99.99/year — billed once, saves you $${((monthlyPrice * 12) - annualPrice).toFixed(2)} per year (${savings}% off).`],
          ["Can I cancel anytime?", "Yes — cancel from your Stripe billing portal with one click. No questions asked, no fees. Annual plans are refunded pro-rata."],
          ["Is my payment secure?", "All payments processed by Stripe. ProRated never sees or stores your card details."],
          ["Do I need Pro to leave reviews?", "No — leaving reviews is always free for any verified trade professional. Pro is for unlimited lookups."],
        ].map(([q, a]) => (
          <div key={q} style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "0.75rem" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 6 }}>{q}</div>
            <div style={{ fontSize: 13, color: BRAND.gray, lineHeight: 1.65 }}>{a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
