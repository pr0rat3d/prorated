// src/pages/TeamActivityDemo.js
// ─────────────────────────────────────────────────────────────
// Team Activity — Sales Demo
//
// Renders the exact same "Team activity" panel that ships in
// CompanySetupPage.js, styled identically, but fed hardcoded
// synthetic data instead of a real company/team. No auth, no DB
// calls — safe to pull up on a phone in a sales meeting without
// a real signed-in account or real (and possibly empty) data.
//
// Built for Tommy's pitch to Stegall Heating & Air — swap the
// COMPANY/MEMBERS objects below to re-skin for a different
// prospect (name, trade, plan tier, review counts).
//
// Internal tool. Not linked from product nav — reachable directly
// at /team-activity-demo for demo/QA use.
// ─────────────────────────────────────────────────────────────
import { BRAND, Card } from "../components/UI";
import Logo from "../components/Logo";
import { getTrustTier } from "../data/constants";

const COMPANY = {
  name:      "Stegall Heating & Air",
  plan:      "silver",
  seatLimit: 15,
};

const daysAgo = (n) => new Date(Date.now() - n * 86400000);

const MEMBERS = [
  { id: "1", name: "Mike Stegall",  email: "mike@stegallhvac.com",   company_role: "owner",  status: "approved", trust_score: 82, review_count: 11, created_at: daysAgo(240), last_review: daysAgo(4),  avg_score: 4.5 },
  { id: "2", name: "Jason Vance",   email: "jason@stegallhvac.com",  company_role: "member", status: "approved", trust_score: 61, review_count: 7,  created_at: daysAgo(185), last_review: daysAgo(9),  avg_score: 4.1 },
  { id: "3", name: "Carla Nunez",   email: "carla@stegallhvac.com",  company_role: "member", status: "approved", trust_score: 45, review_count: 4,  created_at: daysAgo(150), last_review: daysAgo(19), avg_score: 3.8 },
  { id: "4", name: "Derek Holt",    email: "derek@stegallhvac.com",  company_role: "member", status: "approved", trust_score: 20, review_count: 1,  created_at: daysAgo(62),  last_review: daysAgo(34), avg_score: 5.0 },
  { id: "5", name: "Priya Anand",   email: "priya@stegallhvac.com",  company_role: "member", status: "approved", trust_score: 0,  review_count: 0,  created_at: daysAgo(21),  last_review: null,        avg_score: null },
];

// Same shape/definitions as the real panel (see CompanySetupPage.js) —
// would-return %, payment-delay %, and top non-"good" tags across the team.
const TEAM_STATS = { wouldReturnPct: 78, slowPaymentPct: 13 };
const TEAM_TAG_TRENDS = [
  { id: "slow_payment", label: "Slow payment",       icon: "⏰", severity: "bad", count: 3 },
  { id: "scope_creep",  label: "Scope creep",        icon: "📋", severity: "bad", count: 2 },
  { id: "tight_access", label: "Tight access points", icon: "📏", severity: "warn", count: 2 },
  { id: "poor_comms",   label: "Poor communication", icon: "📵", severity: "bad", count: 1 },
  { id: "old_systems",  label: "Very old equipment", icon: "🔩", severity: "alert", count: 1 },
];

export default function TeamActivityDemo() {
  const usedSeats = MEMBERS.length;
  const seatsLeft = Math.max(0, COMPANY.seatLimit - usedSeats);
  const tierMeta  = { bronze: { icon: "🥉", name: "Bronze" }, silver: { icon: "🥈", name: "Silver" }, gold: { icon: "🥇", name: "Gold" } }[COMPANY.plan];

  return (
    <div style={{ maxWidth: 560, margin: "2rem auto", padding: "0 1.25rem 4rem", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Logo size={52} />
        <h1 style={{ fontSize: 20, fontWeight: 800, color: BRAND.dark, margin: "12px 0 4px" }}>🏗️ {COMPANY.name}</h1>
        <div style={{ fontSize: 12, color: BRAND.gray }}>Your team workspace</div>
        <div style={{ display: "inline-block", marginTop: 10, fontSize: 10, fontWeight: 700, color: "#92400E", background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 20, padding: "3px 10px" }}>
          SAMPLE DATA — for illustration
        </div>
      </div>

      {/* Plan card */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>{tierMeta.icon} {tierMeta.name} Plan</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: BRAND.gray, marginBottom: 6 }}>
          <span>{usedSeats} of {COMPANY.seatLimit} seats used</span>
          <span style={{ color: "#16A34A", fontWeight: 700 }}>{seatsLeft} left</span>
        </div>
        <div style={{ background: BRAND.border, borderRadius: 4, height: 8, overflow: "hidden" }}>
          <div style={{ width: `${Math.min(100, (usedSeats / COMPANY.seatLimit) * 100)}%`, height: "100%", background: BRAND.blue, borderRadius: 4 }} />
        </div>
      </Card>

      {/* Team roster */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 12 }}>Team members ({usedSeats})</div>
        {MEMBERS.map(m => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${BRAND.border}` }}>
            <div style={{ width: 32, height: 32, background: m.company_role === "owner" ? BRAND.blue : "#94A3B8", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
              {m.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>{m.name}</div>
              <div style={{ fontSize: 11, color: BRAND.gray, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.email}</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: m.company_role === "owner" ? BRAND.blue : BRAND.gray, background: m.company_role === "owner" ? "#EFF6FF" : "#F1F5F9", padding: "2px 8px", borderRadius: 20 }}>
              {m.company_role === "owner" ? "Owner" : "Member"}
            </span>
          </div>
        ))}
      </Card>

      {/* Team activity */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 2 }}>Team activity</div>
        <div style={{ fontSize: 11, color: BRAND.gray, marginBottom: 12 }}>
          {MEMBERS.filter(m => m.review_count > 0).length} of {usedSeats} members have submitted a review
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#16A34A" }}>{TEAM_STATS.wouldReturnPct}%</div>
            <div style={{ fontSize: 9, color: "#166534", fontWeight: 600 }}>Would return</div>
          </div>
          <div style={{ flex: 1, background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#DC2626" }}>{TEAM_STATS.slowPaymentPct}%</div>
            <div style={{ fontSize: 9, color: "#991B1B", fontWeight: 600 }}>Payment delays</div>
          </div>
        </div>

        {MEMBERS.map(m => {
          const tier = getTrustTier(m.trust_score);
          return (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${BRAND.border}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {m.name}
                </div>
                <div style={{ fontSize: 10, color: BRAND.gray }}>
                  {tier.badge} {tier.label} · Since {m.created_at.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </div>
              </div>
              <div style={{ textAlign: "center", flexShrink: 0, minWidth: 44 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: BRAND.dark }}>{m.review_count}</div>
                <div style={{ fontSize: 9, color: BRAND.gray }}>reviews</div>
              </div>
              <div style={{ textAlign: "center", flexShrink: 0, minWidth: 44 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: m.avg_score ? BRAND.dark : BRAND.gray }}>{m.avg_score ? m.avg_score.toFixed(1) : "—"}</div>
                <div style={{ fontSize: 9, color: BRAND.gray }}>avg ★</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, minWidth: 76 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: m.last_review ? BRAND.dark : BRAND.gray }}>
                  {m.last_review
                    ? m.last_review.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "No reviews yet"}
                </div>
                {m.last_review && <div style={{ fontSize: 9, color: BRAND.gray }}>last review</div>}
              </div>
            </div>
          );
        })}
      </Card>

      {/* Site condition trends */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 2 }}>Trends across your team's reviews</div>
        <div style={{ fontSize: 11, color: BRAND.gray, marginBottom: 12 }}>
          Most-reported site conditions and customer issues
        </div>
        {TEAM_TAG_TRENDS.map(t => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: `1px solid ${BRAND.border}` }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>{t.icon}</span>
            <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600, color: BRAND.dark }}>{t.label}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: t.severity === "bad" ? "#DC2626" : "#D97706", flexShrink: 0 }}>
              {t.count}× reported
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
