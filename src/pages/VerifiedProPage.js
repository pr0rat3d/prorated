import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
import { useState, useEffect } from "react";
import { BRAND } from "../components/UI";
import { useLang } from "../hooks/useLang";
import { useAuth } from "../hooks/useAuth";
import { calculateTrustScore, getTrustTier, VERIFIED_PRO_MIN_SCORE } from "../data/constants";




const TRADES_DISPLAY = {
  general:      "General Contractor",
  electrical:   "Electrical",
  plumbing:     "Plumbing",
  hvac:         "HVAC",
  roofing:      "Roofing",
  painting:     "Painting",
  flooring:     "Flooring",
  pest_control: "Pest Control",
  landscaping:  "Landscaping",
  concrete:     "Concrete / Masonry",
};

export default function VerifiedProPage({ go }) {
  const { lang }          = useLang();
  const { user, contractor } = useAuth();
  const [pros, setPros]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [optingIn, setOptingIn]     = useState(false);
  const [optedIn, setOptedIn]       = useState(false);

  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/contractors?verified_pro=eq.true&status=eq.approved&select=id,name,trade,state,verification_tier,trust_score,created_at,verified_pro_bio&order=trust_score.desc`, {
      headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` }
    })
    .then(r => r.json())
    .then(data => { setPros(Array.isArray(data) ? data : []); setLoading(false); })
    .catch(() => setLoading(false));

    // Check if current user is opted in
    if (contractor?.verified_pro) setOptedIn(true);
  }, [contractor]);

  const handleOptIn = async () => {
    setOptingIn(true);
    await fetch(`${SUPABASE_URL}/rest/v1/contractors?id=eq.${contractor?.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ verified_pro: true }),
    }).catch(() => {});
    setOptedIn(true);
    setOptingIn(false);
  };

  const filtered = pros.filter(p =>
    (filter === "all" || p.trade === filter) &&
    (stateFilter === "all" || p.state === stateFilter)
  );

  const myTrustData = contractor ? calculateTrustScore({
    reviewCount:    contractor.review_count || 0,
    helpfulVotes:   contractor.helpful_count || 0,
    accountAgeDays: contractor.created_at ? Math.floor((Date.now() - new Date(contractor.created_at)) / 86400000) : 0,
    licenseVerified: contractor.verification_tier === "license_verified",
    reviewsWithDetail: contractor.reviews_with_detail || 0,
    reportedCount:  0,
  }) : null;

  const qualifies = myTrustData && myTrustData.score >= VERIFIED_PRO_MIN_SCORE;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1E1B4B, #312E81)", padding: "1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🛡️</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#F8FAFC", marginBottom: 6 }}>Verified Pro Directory</h1>
        <p style={{ fontSize: 12, color: "#C7D2FE", margin: 0 }}>Top-rated, license-verified trade professionals</p>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "1.25rem 1.25rem 5rem" }}>

        {/* Your eligibility card */}
        {user && myTrustData && (
          <div style={{
            background: qualifies ? "linear-gradient(135deg, #7C3AED15, #4F46E515)" : "#F8FAFC",
            border: `1.5px solid ${qualifies ? "#7C3AED" : BRAND.border}`,
            borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "1.25rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: qualifies ? "#7C3AED" : BRAND.dark, marginBottom: 4 }}>
                  {qualifies ? "🛡️ You qualify for Verified Pro!" : `Your score: ${myTrustData.score}/100`}
                </div>
                <div style={{ fontSize: 11, color: BRAND.gray }}>
                  {qualifies
                    ? optedIn ? "✅ You're listed in the directory" : "Get listed and start receiving inquiries"
                    : `${VERIFIED_PRO_MIN_SCORE - myTrustData.score} more points needed — submit more reviews to qualify`}
                </div>
              </div>
              {qualifies && !optedIn && (
                <button onClick={handleOptIn} disabled={optingIn}
                  style={{ background: "#7C3AED", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  {optingIn ? "Adding..." : "Get Listed →"}
                </button>
              )}
              {optedIn && (
                <span style={{ background: "#7C3AED", color: "#fff", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 8 }}>✓ Listed</span>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap" }}>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            style={{ flex: 1, padding: "8px 12px", border: `1.5px solid ${BRAND.border}`, borderRadius: 10, fontSize: 12, background: "#fff", fontFamily: "'DM Sans', sans-serif", color: BRAND.dark, cursor: "pointer" }}>
            <option value="all">All trades</option>
            {Object.entries(TRADES_DISPLAY).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
          <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}
            style={{ flex: 1, padding: "8px 12px", border: `1.5px solid ${BRAND.border}`, borderRadius: 10, fontSize: 12, background: "#fff", fontFamily: "'DM Sans', sans-serif", color: BRAND.dark, cursor: "pointer" }}>
            <option value="all">All states</option>
            {["AL","TN","GA","MS","FL"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "3rem", color: BRAND.gray }}>Loading verified pros...</div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* What is this */}
            <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 16, padding: "1.5rem" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>🛡️</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: BRAND.dark, marginBottom: 6 }}>What is Verified Pros?</div>
                  <p style={{ fontSize: 13, color: BRAND.gray, lineHeight: 1.7, margin: "0 0 10px" }}>
                    Verified Pros is a directory of top-rated, license-verified trade professionals on ProRated. Every listing is earned — not bought. Contractors qualify by building a trust score through peer-verified reviews.
                  </p>
                  <p style={{ fontSize: 13, color: BRAND.gray, lineHeight: 1.7, margin: 0 }}>
                    As our community grows, this page will surface the most trusted contractors in your area — vetted by the peers who've worked alongside them.
                  </p>
                </div>
              </div>
            </div>

            {/* How to qualify */}
            <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 16, padding: "1.5rem" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: BRAND.dark, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>How to get listed</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { n: "1", text: "Create a verified account — license checked against state records" },
                  { n: "2", text: "Leave reviews after your jobs — each one builds your trust score" },
                  { n: "3", text: "Reach a trust score of 75+ and opt in to appear in the directory" },
                ].map(s => (
                  <div key={s.n} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#2563EB,#7C3AED)", color: "#fff", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.n}</div>
                    <div style={{ fontSize: 13, color: BRAND.gray }}>{s.text}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            {user && qualifies && !optedIn && (
              <button onClick={handleOptIn}
                style={{ width: "100%", background: "#7C3AED", color: "#fff", border: "none", padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                You qualify — Get Listed Now →
              </button>
            )}
            {!user && (
              <button onClick={() => go("signup")}
                style={{ width: "100%", background: BRAND.blue, color: "#fff", border: "none", padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                Create Free Account →
              </button>
            )}
          </div>
        )}
        {/* Pro cards */}
        {filtered.map(pro => {
          const tier = getTrustTier(pro.trust_score || 0);
          return (
            <div key={pro.id} style={{ background: "#fff", border: `1.5px solid ${BRAND.border}`, borderRadius: 14, padding: "1.25rem", marginBottom: "0.85rem", display: "flex", gap: 14, alignItems: "flex-start" }}>
              {/* Avatar */}
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #7C3AED, #4F46E5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                🛡️
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 6 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: BRAND.dark }}>{pro.name}</div>
                    <div style={{ fontSize: 12, color: BRAND.gray }}>{TRADES_DISPLAY[pro.trade] || pro.trade} · {pro.state}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <span style={{ background: "#7C3AED", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8 }}>
                      🛡️ Verified Pro
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: tier.color }}>{pro.trust_score || 0}/100</span>
                  </div>
                </div>
                {pro.verified_pro_bio && (
                  <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.6, marginTop: 8, marginBottom: 0 }}>{pro.verified_pro_bio}</p>
                )}
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {pro.verification_tier === "license_verified" && (
                    <span style={{ background: "#DCFCE7", color: "#166534", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>✓ Licensed</span>
                  )}
                  <span style={{ background: "#EFF6FF", color: "#1E40AF", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>
                    {tier.badge} {tier.label}
                  </span>
                  <span style={{ background: "#F8FAFC", color: BRAND.gray, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6 }}>
                    Member since {new Date(pro.created_at).getFullYear()}
                  </span>
                </div>
                {/* Contact info — only shown if contractor opted in */}
                {(pro.share_phone && pro.phone) || (pro.share_email && pro.email) ? (
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    {pro.share_phone && pro.phone && (
                      <a href={"tel:" + pro.phone} style={{ fontSize: 12, color: BRAND.blue, fontWeight: 600, textDecoration: "none" }}>📞 {pro.phone}</a>
                    )}
                    {pro.share_email && pro.email && (
                      <a href={"mailto:" + pro.email} style={{ fontSize: 12, color: BRAND.blue, fontWeight: 600, textDecoration: "none" }}>📧 {pro.email}</a>
                    )}
                  </div>
                ) : null}
                <div style={{ display: "none" }}>
                </div>
              </div>
            </div>
          );
        })}

        {/* Upsell for non-users */}
        {!user && (
          <div style={{ background: "linear-gradient(135deg, #1E1B4B, #312E81)", borderRadius: 14, padding: "1.5rem", textAlign: "center", marginTop: "1rem" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#F8FAFC", marginBottom: 8 }}>Are you a trade professional?</div>
            <div style={{ fontSize: 12, color: "#C7D2FE", marginBottom: 16, lineHeight: 1.65 }}>
              Build your trust score by submitting reviews. Reach 75+ points to get listed in this directory.
            </div>
            <button onClick={() => go("signup")}
              style={{ background: "#fff", color: "#7C3AED", border: "none", padding: "10px 24px", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Create free account →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
