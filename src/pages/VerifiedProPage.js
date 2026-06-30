import { BRAND } from "../components/UI";
import { useAuth } from "../hooks/useAuth";
import { getTrustTier, TRUST_TIERS } from "../data/constants";

export default function VerifiedProPage({ go }) {
  const { user, contractor } = useAuth();
  const score = contractor?.trust_score ?? 0;
  const tier  = getTrustTier(score);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1E1B4B, #312E81)", padding: "1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🛡️</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#F8FAFC", marginBottom: 6 }}>Verified Pro</h1>
        <p style={{ fontSize: 12, color: "#C7D2FE", margin: 0 }}>Trust score tiers for license-verified trade professionals</p>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "1.25rem 1.25rem 5rem" }}>

        {/* Your current score */}
        {user && contractor && (
          <div style={{
            background: `linear-gradient(135deg, ${tier.color}18, ${tier.color}08)`,
            border: `1.5px solid ${tier.color}`,
            borderRadius: 14, padding: "1.25rem", marginBottom: "1.25rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: tier.color, marginBottom: 4 }}>
                  {tier.badge} Your Trust Score
                </div>
                <div style={{ fontSize: 36, fontWeight: 900, color: tier.color, lineHeight: 1 }}>
                  {score}<span style={{ fontSize: 16, opacity: 0.5 }}>/100</span>
                </div>
                <div style={{ fontSize: 12, color: BRAND.gray, marginTop: 4 }}>{tier.label}</div>
              </div>
              <button onClick={() => go("dashboard")}
                style={{ background: tier.color, color: "#fff", border: "none", padding: "9px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                View Profile →
              </button>
            </div>
          </div>
        )}

        {/* Tiers breakdown */}
        <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 16, padding: "1.25rem", marginBottom: "1rem" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: BRAND.dark, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Trust Score Tiers</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {TRUST_TIERS.map(t => (
              <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, background: score >= t.min && score <= t.max ? `${t.color}12` : "#F8FAFC", border: `1px solid ${score >= t.min && score <= t.max ? t.color : BRAND.border}` }}>
                <span style={{ fontSize: 20 }}>{t.badge}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: t.color }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: BRAND.gray }}>{t.min}–{t.max} points</div>
                </div>
                {score >= t.min && score <= t.max && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: t.color, background: `${t.color}18`, padding: "3px 8px", borderRadius: 6 }}>You are here</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* How to build score */}
        <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 16, padding: "1.25rem", marginBottom: "1rem" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: BRAND.dark, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>How your score grows</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "+10 pts", desc: "First review submitted" },
              { label: "+5 pts", desc: "Each review after the first" },
              { label: "+5 pts", desc: "Each helpful vote received from peers" },
              { label: "+2 pts/mo", desc: "Account age (continuous)" },
              { label: "100 pts", desc: "Maximum score" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: BRAND.blue, background: "#EFF6FF", padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap", minWidth: 64, textAlign: "center" }}>{item.label}</span>
                <span style={{ fontSize: 13, color: BRAND.gray }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {!user && (
          <button onClick={() => go("signup")}
            style={{ width: "100%", background: BRAND.blue, color: "#fff", border: "none", padding: "13px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Create free account →
          </button>
        )}
      </div>
    </div>
  );
}
