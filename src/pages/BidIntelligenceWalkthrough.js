// src/pages/BidIntelligenceWalkthrough.js
// ─────────────────────────────────────────────────────────────
// Bid Intelligence — App Walkthrough
//
// This is NOT a lookalike mockup — it renders the REAL AddressCard,
// ReviewCard, and BidIntelligence components (the exact same files the
// live app uses), fed the same 14 synthetic scenarios that populate
// /bid-intelligence-test, run through the SAME buildAddressFromReviews
// pipeline api/supabase.js uses for real DB rows. The only thing faked
// is the auth context (so you can preview any plan tier without
// actually logging in) and the underlying data (synthetic, not a real
// address). Bid Intelligence itself makes a real call to the real
// edge function — nothing about that report is canned.
//
// Internal tool. Not linked from product nav — reachable directly at
// /bid-intelligence-walkthrough for demo/QA use.
// ─────────────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import { SCENARIOS } from "./BidIntelligenceTest";
import { buildAddressFromReviews } from "../api/supabase";
import { AuthContext } from "../hooks/useAuth";
import AddressCard from "../components/AddressCard";
import { BRAND } from "../components/UI";
import Logo from "../components/Logo";

// ── Fake but plausible AL addresses, one per scenario — real cities
// ProRated already covers (Birmingham/Huntsville/Mobile/Montgomery/
// Tuscaloosa), fictional street numbers ─────────────────────────────
const ADDRESS_BOOK = {
  "dream-client":     { street: "142 Overton Ridge Drive", city: "Birmingham", state: "AL", zip: "35242" },
  "payment-risky":    { street: "3305 Sparkman Drive",     city: "Huntsville", state: "AL", zip: "35810" },
  "scope-creep":      { street: "618 Dauphin Island Pkwy", city: "Mobile",     state: "AL", zip: "36605" },
  "comms-broken":     { street: "2210 Vaughn Road",        city: "Montgomery", state: "AL", zip: "36106" },
  "red-flag-city":    { street: "911 Skyland Blvd",        city: "Tuscaloosa", state: "AL", zip: "35405" },
  "split-opinion":    { street: "77 Shades Creek Pkwy",    city: "Birmingham", state: "AL", zip: "35209" },
  "mostly-bad":       { street: "4400 University Drive",   city: "Huntsville", state: "AL", zip: "35816" },
  "newer-contractor": { street: "1500 Government Street",  city: "Mobile",     state: "AL", zip: "36604" },
  "seasonal":         { street: "3801 Atlanta Highway",    city: "Montgomery", state: "AL", zip: "36109" },
  "too-few":          { street: "220 15th Street",         city: "Tuscaloosa", state: "AL", zip: "35401" },
  "perfect-storm":    { street: "6 Red Mountain Terrace",  city: "Birmingham", state: "AL", zip: "35205" },
  "contradictory":    { street: "9020 Bailey Cove Road",   city: "Huntsville", state: "AL", zip: "35803" },
  "one-bad-apple":    { street: "155 Schillinger Road",    city: "Mobile",     state: "AL", zip: "36695" },
  "missing-data":     { street: "3100 Zelda Road",         city: "Montgomery", state: "AL", zip: "36106" },
};

const TRADE_POOL = ["general", "electrical", "plumbing", "hvac", "roofing"];
const INITIALS_POOL = ["J.M", "R.T", "K.D", "A.S", "B.W", "L.C", "T.P", "N.G", "V.H", "E.O", "S.M", "C.R", "D.F", "P.Q"];

// Turn a bidScoring-shape scenario into the exact row shape
// api/supabase.js expects from a live Supabase fetch, then run it
// through the real buildAddressFromReviews() pipeline — same math,
// same output shape the app already renders every day.
function scenarioToAddress(scenario) {
  const loc = ADDRESS_BOOK[scenario.id];
  const reviews = scenario.build();
  const rows = reviews.map((r, i) => ({
    id: r.id,
    contractor_name: null,
    contractor_initials: INITIALS_POOL[i % INITIALS_POOL.length],
    trade: TRADE_POOL[i % TRADE_POOL.length],
    created_at: r.created_at,
    overall_score: r.overall_score,
    tags: r.tags || [],
    review_text: r.review_text || "No written comments left for this review.",
    helpful_count: 0,
    contractors: { trust_score: r.reviewer_trust_score },
    payment_score: r.payment_score,
    access_score: r.access_score,
    timeline_score: r.timeline_score,
    communication_score: r.communication_score,
    obstacles_score: r.obstacles_score,
    street: loc.street, city: loc.city, state: loc.state, zip: loc.zip,
  }));
  const fullAddr = `${loc.street}, ${loc.city}, ${loc.state}`;
  const built = buildAddressFromReviews(fullAddr, rows);
  return {
    ...built,
    // buildAddressFromReviews always stamps fromDatabase: true on each
    // review (correct for real rows) — override it here so ReviewCard's
    // helpful-vote / report gating correctly treats these as synthetic
    // and never writes to a real table.
    reviews: built.reviews.map(r => ({ ...r, fromDatabase: false })),
  };
}

const PLANS = [
  { id: "free",     label: "Free",         icon: "" },
  { id: "bronze",   label: "Bronze",       icon: "🥉" },
  { id: "silver",   label: "Silver",       icon: "🥈" },
  { id: "gold",     label: "Gold",         icon: "🥇" },
  { id: "platinum", label: "Platinum",     icon: "💎" },
];

export default function BidIntelligenceWalkthrough({ go: goApp }) {
  const [step, setStep] = useState("search"); // search | result
  const [selectedId, setSelectedId] = useState(null);
  const [plan, setPlan] = useState("gold");

  const selectedScenario = SCENARIOS.find(s => s.id === selectedId) || null;
  const mappedAddress = useMemo(
    () => (selectedScenario ? scenarioToAddress(selectedScenario) : null),
    [selectedScenario]
  );

  const authValue = useMemo(() => ({
    user: { id: "demo-viewer", name: "Demo Viewer", plan },
    isLoggedIn: true,
    loading: false,
    login: () => {},
    logout: () => {},
    refreshUser: () => {},
    sessionKilled: false,
    dismissSessionKilled: () => {},
  }), [plan]);

  const noop = () => {};

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: BRAND.dark, padding: "2rem 1.5rem 1.75rem", textAlign: "center", position: "relative" }}>
        {goApp && (
          <button onClick={() => goApp("home")} style={{ position: "absolute", top: 16, left: 16, background: "none", border: "none", color: "#94A3B8", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            ← Back
          </button>
        )}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Logo size={44} /></div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#93C5FD", marginBottom: 8 }}>App Walkthrough</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#F8FAFC", margin: "0 0 8px" }}>
          {step === "search" ? "What a search looks like" : "The real address card, live"}
        </h1>
        <p style={{ fontSize: 12.5, color: "#94A3B8", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
          {step === "search"
            ? "Same 14 scenarios from the test harness — pick one to see it rendered in the actual AddressCard / ReviewCard / BidIntelligence components, not a mockup."
            : "This is the real component tree. Bid Intelligence below makes a real call to the real edge function."}
        </p>
      </div>

      {step === "search" && (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "1.5rem 1.25rem 4rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: `1.5px solid ${BRAND.border}`, borderRadius: 14, padding: "12px 16px", marginBottom: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <span style={{ fontSize: 16, color: "#94A3B8" }}>🔍</span>
            <span style={{ fontSize: 13.5, color: "#94A3B8" }}>Search any address...</span>
            <span style={{ marginLeft: "auto", fontSize: 10, color: "#CBD5E1", fontStyle: "italic" }}>demo — pick below</span>
          </div>

          <div style={{ fontSize: 10.5, fontWeight: 800, color: BRAND.gray, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Demo Scenarios
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {SCENARIOS.map(s => {
              const loc = ADDRESS_BOOK[s.id];
              return (
                <button key={s.id} onClick={() => { setSelectedId(s.id); setStep("result"); }}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, textAlign: "left", background: "#fff", border: `1.5px solid ${BRAND.border}`, borderRadius: 12, padding: "12px 16px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: BRAND.dark }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 2 }}>{loc.street}, {loc.city}, {loc.state} {loc.zip}</div>
                  </div>
                  <span style={{ fontSize: 16, color: "#CBD5E1", flexShrink: 0 }}>→</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === "result" && mappedAddress && (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "1.5rem 1.25rem 4rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: 10 }}>
            <button onClick={() => setStep("search")}
              style={{ background: "none", border: "none", color: BRAND.blue, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              ← Back to search
            </button>
            <div style={{ display: "inline-flex", background: "#fff", border: `1.5px solid ${BRAND.border}`, borderRadius: 10, padding: 3, gap: 2 }}>
              {PLANS.map(p => (
                <button key={p.id} onClick={() => setPlan(p.id)}
                  style={{ padding: "5px 10px", borderRadius: 7, border: "none", background: plan === p.id ? BRAND.dark : "transparent", color: plan === p.id ? "#fff" : BRAND.gray, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "center", fontSize: 11, color: BRAND.gray, marginBottom: "1.25rem" }}>
            Viewing as a <strong style={{ color: BRAND.dark }}>{PLANS.find(p => p.id === plan)?.label}</strong> member — this is exactly what that tier sees today, gating included.
          </div>

          <AuthContext.Provider value={authValue}>
            <AddressCard address={mappedAddress} go={noop} goLogin={noop} goReview={noop} demoMode />
          </AuthContext.Provider>
        </div>
      )}
    </div>
  );
}
