import { useEffect } from "react";
import { BRAND } from "../components/UI";
import Logo from "../components/Logo";

// ── Partner Configuration ─────────────────────────────────────
export const PARTNERS = {
  agc: {
    code:        "AGC2026",
    name:        "AGC Alabama",
    fullName:    "Associated General Contractors of Alabama",
    trade:       "General Contractors",
    icon:        "🏗️",
    color:       "#1a3328",
    accent:      "#c8831a",
    description: "The leading association for licensed general contractors across Alabama.",
    features:    ["Job site access ratings", "Payment history", "Homeowner communication scores", "Subcontractor work history"],
    dataOffer:   "Quarterly aggregate intelligence reports on Alabama job site conditions, payment trends, and regional ratings — broken down by county and project type.",
    url:         "agc",
  },
  acca: {
    code:        "ACCA2026",
    name:        "ACCA Alabama",
    fullName:    "Air Conditioning Contractors of America — Alabama Chapter",
    trade:       "HVAC Contractors",
    icon:        "❄️",
    color:       "#1E3A5F",
    accent:      "#38BDF8",
    description: "The premier association for HVAC professionals across Alabama.",
    features:    ["Equipment access & staging ratings", "Payment history by homeowner", "Service call communication scores", "Regional HVAC job site trends"],
    dataOffer:   "Quarterly HVAC-specific intelligence — payment delay rates, access issues, and homeowner communication trends across Alabama counties.",
    url:         "acca",
  },
  phcc: {
    code:        "PHCC2026",
    name:        "PHCC Alabama",
    fullName:    "Plumbing-Heating-Cooling Contractors Association — Alabama",
    trade:       "Plumbing & HVAC Contractors",
    icon:        "🔧",
    color:       "#1E3A5F",
    accent:      "#22D3EE",
    description: "Serving licensed plumbing and HVAC professionals across Alabama.",
    features:    ["Job site access ratings", "Payment history & delays", "Emergency call responsiveness", "Work history by address"],
    dataOffer:   "Quarterly plumbing & HVAC intelligence reports — payment trends, access issues, and regional job site ratings across Alabama.",
    url:         "phcc",
  },
  iec: {
    code:        "IEC2026",
    name:        "IEC Alabama",
    fullName:    "Independent Electrical Contractors — Alabama Chapter",
    trade:       "Electrical Contractors",
    icon:        "⚡",
    color:       "#1C1917",
    accent:      "#FBBF24",
    description: "Representing independent electrical contractors across Alabama.",
    features:    ["Panel access & staging ratings", "Payment history", "Permit & inspection notes", "Homeowner communication scores"],
    dataOffer:   "Quarterly electrical contractor intelligence — payment delays, access conditions, and job site ratings by Alabama county.",
    url:         "iec",
  },
  nrca: {
    code:        "NRCA2026",
    name:        "NRCA Alabama",
    fullName:    "National Roofing Contractors Association — Alabama Members",
    trade:       "Roofing Contractors",
    icon:        "🏠",
    color:       "#1C0A00",
    accent:      "#DC2626",
    description: "Representing licensed roofing professionals across Alabama.",
    features:    ["Roof access & staging ratings", "Payment history by address", "HOA & permit complexity", "Homeowner communication"],
    dataOffer:   "Quarterly roofing intelligence — payment trends, access issues, HOA complication rates, and job site ratings across Alabama.",
    url:         "nrca",
  },
  pca: {
    code:        "PCA2026",
    name:        "PCA Alabama",
    fullName:    "Painting Contractors Association — Alabama Members",
    trade:       "Painting Contractors",
    icon:        "🎨",
    color:       "#1E1B4B",
    accent:      "#818CF8",
    description: "Supporting professional painting contractors across Alabama.",
    features:    ["Interior access ratings", "Payment history", "Preparation requirements", "Homeowner communication scores"],
    dataOffer:   "Quarterly painting contractor intelligence — payment delays, access complexity, and regional job site trends.",
    url:         "pca",
  },
  nalp: {
    code:        "NALP2026",
    name:        "NALP Alabama",
    fullName:    "National Association of Landscape Professionals — Alabama",
    trade:       "Landscape Professionals",
    icon:        "🌿",
    color:       "#14532D",
    accent:      "#4ADE80",
    description: "Representing landscape professionals across Alabama.",
    features:    ["Property access ratings", "Payment history", "HOA restriction notes", "Seasonal work trends"],
    dataOffer:   "Quarterly landscaping intelligence — payment trends, access issues, HOA complication rates across Alabama counties.",
    url:         "nalp",
  },
  abc: {
    code:        "ABC2026",
    name:        "ABC Alabama",
    fullName:    "Associated Builders and Contractors — Alabama Chapter",
    trade:       "General & Specialty Contractors",
    icon:        "🔨",
    color:       "#1C3557",
    accent:      "#F59E0B",
    description: "Representing merit shop contractors across residential and commercial Alabama.",
    features:    ["Job site access & staging ratings", "Homeowner payment history", "Communication scores", "Work history by address"],
    dataOffer:   "Quarterly intelligence reports on Alabama residential job site conditions — payment trends, access issues, and homeowner communication scores broken down by county and trade type.",
    url:         "abc",
  },
  hba: {
    code:        "HBA2026",
    name:        "HBA Alabama",
    fullName:    "Home Builders Association of Alabama",
    trade:       "Home Builders & Residential Contractors",
    icon:        "🏡",
    color:       "#7C2D12",
    accent:      "#FED7AA",
    description: "The largest association of residential builders and contractors in Alabama — over 2,000 members statewide.",
    features:    ["Homeowner payment history before you break ground", "Site access & staging ratings", "Subcontractor work history by address", "Regional market intelligence"],
    dataOffer:   "Quarterly Alabama residential market reports — payment delay rates by county, access condition trends, homeowner communication scores, and work type frequency across the state. Data your members can use to bid smarter and build better.",
    url:         "hba",
    isHBA:       true,
  },
  neca: {
    code:        "NECA2026",
    name:        "NECA Alabama",
    fullName:    "National Electrical Contractors Association — Alabama Chapter",
    trade:       "Electrical Contractors",
    icon:        "⚡",
    color:       "#1C1917",
    accent:      "#FBBF24",
    description: "Representing union electrical contractors across Alabama.",
    features:    ["Panel access & staging ratings", "Payment history", "Permit complexity by address", "Homeowner communication scores"],
    dataOffer:   "Quarterly electrical contractor intelligence — payment delays, access conditions, and job site ratings by Alabama county.",
    url:         "neca",
  },
  bar: {
    code:        "BAR2026",
    name:        "Birmingham Association of Realtors",
    fullName:    "Birmingham Association of Realtors",
    trade:       "Real Estate Professionals",
    icon:        "🏡",
    color:       "#1E3A5F",
    accent:      "#F59E0B",
    description: "Serving real estate professionals across the Birmingham metro area.",
    features:    ["Property work history reports", "Contractor ratings by address", "Disclosure-ready data", "Work type timeline"],
    dataOffer:   "Quarterly property intelligence for the Birmingham metro — work history trends, contractor activity by zip code, and property condition indicators across Jefferson, Shelby, and surrounding counties.",
    url:         "bar",
    isRealtor:   true,
  },
  aar: {
    code:        "AAR2026",
    name:        "Alabama Association of Realtors",
    fullName:    "Alabama Association of Realtors",
    trade:       "Real Estate Professionals",
    icon:        "🏡",
    color:       "#1E3A5F",
    accent:      "#F59E0B",
    description: "Serving real estate professionals across Alabama.",
    features:    ["Property work history reports", "Contractor ratings by address", "Disclosure-ready data", "Work type timeline"],
    dataOffer:   "Quarterly property intelligence reports — work history trends, contractor activity by county, and property condition indicators across Alabama.",
    url:         "aar",
    isRealtor:   true,
  },
};

export default function PartnerLandingPage({ go, partnerId }) {
  const p = PARTNERS[partnerId] || PARTNERS.agc;

  // Prefills SignupPage's partner/referral code field — SignupPage resolves
  // it back to this same partnerId at signup, which is what
  // PartnerDashboardPage filters contractors by.
  const goToSignup = () => {
    try { localStorage.setItem("pending_partner_code", p.code); } catch {}
    go(p.isRealtor ? "realtor-signup" : "signup");
  };

  useEffect(() => {
    const title = `ProRated × ${p.name} — Free Pro Access for Members`;
    const desc = `${p.name} members get free ProRated Pro access. Search job site ratings, payment history, and access conditions before you bid. Use code ${p.code}.`;
    document.title = title;
    const metaDesc = document.querySelector("meta[name='description']");
    if (metaDesc) metaDesc.setAttribute("content", desc);
    const ogTitle = document.querySelector("meta[property='og:title']");
    if (ogTitle) ogTitle.setAttribute("content", title);
    const ogDesc = document.querySelector("meta[property='og:description']");
    if (ogDesc) ogDesc.setAttribute("content", desc);
    return () => {
      document.title = "ProRated — Built by Pros, Built for Pros";
      if (metaDesc) metaDesc.setAttribute("content", "Contractor-to-contractor job site ratings. Know access, payment history, obstacles before you bid.");
    };
  }, [partnerId]);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ background: p.color, padding: "1.5rem", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
          <Logo size={44} />
          <div style={{ fontSize: 20, color: "rgba(255,255,255,0.4)" }}>×</div>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, border: `1px solid ${p.accent}40` }}>
            <span style={{ fontSize: 22 }}>{p.icon}</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: p.accent, letterSpacing: "0.05em" }}>{p.name}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", letterSpacing: "0.03em" }}>{p.trade}</div>
            </div>
          </div>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: "#F8FAFC", marginBottom: 6 }}>
          ProRated — Exclusive for {p.name} Members
        </h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0 }}>
          Free Pro access · Job site intelligence · Built by Pros, Built for Pros
        </p>
      </div>

      {/* Partnership banner */}
      <div style={{ background: p.accent, padding: "8px 1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: p.color, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          🤝 In Official Partnership with {p.name}
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "1.5rem 1.25rem 4rem" }}>

        {/* Hero CTA */}
        <div style={{ background: "#fff", border: `1.5px solid ${BRAND.border}`, borderRadius: 16, padding: "1.5rem", marginBottom: "1.25rem", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>{p.icon}</div>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: BRAND.dark, marginBottom: 10, marginTop: 0 }}>
            Know the job site before you bid
          </h2>
          <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, marginBottom: "1.25rem" }}>
            ProRated gives {p.trade.toLowerCase()} verified intelligence on residential job sites — access ratings, payment history, homeowner communication scores, and work history — submitted by real contractors.
          </p>
          <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 12, padding: "12px 16px", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#166534", marginBottom: 4 }}>
              🎁 {p.name} Members get Pro free
            </div>
            <div style={{ fontSize: 12, color: "#166534" }}>Full access · No credit card required</div>
          </div>
          <button onClick={goToSignup}
            style={{ width: "100%", background: p.color, color: p.accent, border: "none", padding: "14px", borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Claim your free {p.name} Pro account →
          </button>
          <p style={{ fontSize: 11, color: BRAND.gray, marginTop: 8, marginBottom: 0 }}>
            Use code <strong style={{ color: p.color }}>{p.code}</strong> at signup
          </p>
        </div>

        {/* Features grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1.25rem" }}>
          {p.features.map(f => (
            <div key={f} style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 12, padding: "1rem", display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ color: p.accent === "#c8831a" ? p.color : p.accent, fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
              <span style={{ fontSize: 12, color: BRAND.dark, fontWeight: 600, lineHeight: 1.4 }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Data partnership */}
        <div style={{ background: p.color, borderRadius: 16, padding: "1.5rem", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: p.accent, marginBottom: 8 }}>
            📊 ProRated × {p.name} Data Partnership
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, marginBottom: 0 }}>
            {p.dataOffer}
          </p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 10, marginBottom: 0 }}>
            All data is fully anonymized — no individual is identifiable.
          </p>
        </div>

        {/* How it works */}
        <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 16, padding: "1.5rem", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: BRAND.dark, marginBottom: "1rem" }}>How it works</div>
          {[
            { step: "1", title: "Create your free account", desc: `Sign up with your contractor license. Use code ${p.code} for free Pro access.` },
            { step: "2", title: "Search any address", desc: "See what other licensed trade professionals say about a job site before you bid." },
            { step: "3", title: "Submit reviews", desc: `Rate job sites you've worked. Help fellow ${p.name} members bid smarter.` },
            { step: "4", title: "Build your trust score", desc: "Active contributors earn continued Pro access and Verified Pro status." },
          ].map(({ step, title, desc }) => (
            <div key={step} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: p.color, color: p.accent, fontSize: 13, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {step}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 12, color: BRAND.gray, lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <button onClick={goToSignup}
          style={{ width: "100%", background: p.color, color: p.accent, border: "none", padding: "16px", borderRadius: 14, fontSize: 16, fontWeight: 900, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>
          Get started free — {p.name} members →
        </button>

        <p style={{ fontSize: 11, color: BRAND.gray, textAlign: "center", lineHeight: 1.6 }}>
          Questions? Email <a href="mailto:hello@prorated.app" style={{ color: BRAND.blue }}>hello@prorated.app</a>
          {" · "}Already have an account?{" "}
          <button onClick={() => go("signup")} style={{ background: "none", border: "none", color: BRAND.blue, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: 0 }}>
            Sign in →
          </button>
        </p>

      </div>
    </div>
  );
}
