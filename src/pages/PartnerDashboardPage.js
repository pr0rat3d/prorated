import { adminGet } from "../api/db";
import { useState, useEffect } from "react";
import { BRAND } from "../components/UI";
import Logo from "../components/Logo";
import { PARTNERS } from "./PartnerLandingPage";

function StatCard({ icon, value, label, sub, color = BRAND.blue }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "1.25rem", textAlign: "center" }}>
      <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 900, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, marginBottom: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: BRAND.gray }}>{sub}</div>}
    </div>
  );
}

export default function PartnerDashboardPage({ partnerId }) {
  const p           = PARTNERS[partnerId] || PARTNERS.agc;
  const [authed, setAuthed]     = useState(() => {
    try { return !!sessionStorage.getItem("pr_admin_auth"); } catch { return false; }
  });
  const [pw, setPw]             = useState("");
  const [error, setError]       = useState(false);
  const [loading, setLoading]   = useState(false);
  const [data, setData]         = useState(null);

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    loadData();
  }, [authed]);

  const loadData = async () => {
    try {
      // Members who signed up with this promo code
      const members = await adminGet("/contractors", {
        pro_source: `eq.${partnerId}`,
        select: "id,name,trade,state,status,created_at,review_count,trust_score",
        order: "created_at.desc",
      });
      const memberList = Array.isArray(members) ? members : [];

      // Reviews submitted by those members
      const memberIds = memberList.map(m => m.id).filter(Boolean);
      let reviews = [];
      if (memberIds.length > 0) {
        reviews = await adminGet("/reviews", {
          user_id: `in.(${memberIds.join(",")})`,
          select: "id,trade,work_label,overall_score,payment_score,access_score,created_at",
          order: "created_at.desc",
        });
        reviews = Array.isArray(reviews) ? reviews : [];
      }

      // Calculate aggregate stats
      const approved  = memberList.filter(m => m.status === "approved").length;
      const pending   = memberList.filter(m => m.status === "pending").length;
      const avgScore  = reviews.length > 0
        ? (reviews.reduce((s, r) => s + (r.overall_score || 0), 0) / reviews.length).toFixed(1)
        : "—";
      const avgPayment = reviews.length > 0
        ? (reviews.reduce((s, r) => s + (r.payment_score || 0), 0) / reviews.length).toFixed(1)
        : "—";
      const avgAccess = reviews.length > 0
        ? (reviews.reduce((s, r) => s + (r.access_score || 0), 0) / reviews.length).toFixed(1)
        : "—";

      // Work types breakdown
      const workTypes = reviews.reduce((acc, r) => {
        if (r.work_label) acc[r.work_label] = (acc[r.work_label] || 0) + 1;
        return acc;
      }, {});

      // Monthly signups
      const byMonth = memberList.reduce((acc, m) => {
        const month = new Date(m.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

      setData({ members: memberList, reviews, approved, pending, avgScore, avgPayment, avgAccess, workTypes, byMonth });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (data.ok) {
        try { sessionStorage.setItem("pr_admin_auth", data.token); } catch {}
        setAuthed(true);
      } else {
        setError(true);
        setTimeout(() => setError(false), 2000);
      }
    } catch {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
    setLoading(false);
  };

  // Login screen
  if (!authed) return (
    <div style={{ minHeight: "100vh", background: p.color, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "2rem", width: "100%", maxWidth: 380, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <Logo size={36} />
          <span style={{ fontSize: 20, color: "#94A3B8" }}>×</span>
          <span style={{ fontSize: 28 }}>{p.icon}</span>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: BRAND.dark, marginBottom: 4, marginTop: 0 }}>{p.name}</h2>
        <p style={{ fontSize: 13, color: BRAND.gray, marginBottom: 20 }}>Partner Dashboard · Internal access only</p>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          placeholder="Admin password" autoFocus
          style={{ width: "100%", padding: "12px", border: `1.5px solid ${error ? "#EF4444" : BRAND.border}`, borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", marginBottom: 8, textAlign: "center" }} />
        {error && <div style={{ fontSize: 12, color: "#DC2626", marginBottom: 8 }}>Incorrect password</div>}
        <button onClick={handleLogin} disabled={loading}
          style={{ width: "100%", background: p.color, color: p.accent, border: "none", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Checking..." : "View Dashboard →"}
        </button>
      </div>
    </div>
  );

  // Loading
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center", color: BRAND.gray }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${BRAND.border}`, borderTop: `3px solid ${BRAND.blue}`, borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
        Loading partner data...
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ background: p.color, padding: "1.25rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 900, margin: "0 auto", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Logo size={36} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#F8FAFC" }}>ProRated Partner Dashboard</div>
              <div style={{ fontSize: 11, color: p.accent }}>{p.name} · {p.trade}</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
            Last updated: {new Date().toLocaleDateString("en-US", { dateStyle: "medium" })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem 1.25rem 4rem" }}>

        {/* Summary stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
          <StatCard icon="👥" value={data?.members.length || 0}    label="Total Members"    sub="Signed up via partner link" color={p.color} />
          <StatCard icon="✅" value={data?.approved || 0}           label="Verified"         sub="License approved" color="#16A34A" />
          <StatCard icon="⏳" value={data?.pending || 0}            label="Pending"          sub="Awaiting verification" color="#D97706" />
          <StatCard icon="📝" value={data?.reviews.length || 0}    label="Reviews"          sub="Job sites rated" color={BRAND.blue} />
          <StatCard icon="⭐" value={data?.avgScore || "—"}         label="Avg Rating"       sub="Overall job site score" color="#7C3AED" />
        </div>

        {/* Rating breakdown */}
        {data?.reviews.length > 0 && (
          <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "1.25rem", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: BRAND.dark, marginBottom: "1rem" }}>📊 Aggregate Job Site Intelligence</div>
            <div style={{ fontSize: 11, color: BRAND.gray, marginBottom: "1rem" }}>
              Based on {data.reviews.length} job site review{data.reviews.length !== 1 ? "s" : ""} submitted by {p.name} members
            </div>
            {[
              { label: "Overall Rating",       value: data.avgScore,   color: "#7C3AED" },
              { label: "Payment History",       value: data.avgPayment, color: "#16A34A" },
              { label: "Job Site Access",       value: data.avgAccess,  color: BRAND.blue },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: BRAND.dark }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color }}>{value}/5</span>
                </div>
                <div style={{ height: 8, background: "#E2E8F0", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${((parseFloat(value) || 0) / 5) * 100}%`, background: color, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Work types */}
        {Object.keys(data?.workTypes || {}).length > 0 && (
          <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "1.25rem", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: BRAND.dark, marginBottom: "1rem" }}>🔨 Work Types Reported</div>
            {Object.entries(data.workTypes).sort((a,b) => b[1]-a[1]).map(([type, count]) => (
              <div key={type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${BRAND.border}` }}>
                <span style={{ fontSize: 13, color: BRAND.dark }}>{type}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 80, height: 6, background: "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(count / Math.max(...Object.values(data.workTypes))) * 100}%`, background: p.color, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: BRAND.gray, width: 20, textAlign: "right" }}>{count}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Monthly signups */}
        {Object.keys(data?.byMonth || {}).length > 0 && (
          <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "1.25rem", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: BRAND.dark, marginBottom: "1rem" }}>📅 Member Signups by Month</div>
            {Object.entries(data.byMonth).map(([month, count]) => (
              <div key={month} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${BRAND.border}` }}>
                <span style={{ fontSize: 13, color: BRAND.dark }}>{month}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 100, height: 6, background: "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(count / Math.max(...Object.values(data.byMonth))) * 100}%`, background: p.color, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: BRAND.gray }}>{count} new</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent members */}
        {data?.members.length > 0 && (
          <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "1.25rem", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: BRAND.dark, marginBottom: "1rem" }}>
              👥 Recent Members
              <span style={{ fontSize: 11, fontWeight: 400, color: BRAND.gray, marginLeft: 8 }}>Names anonymized for privacy</span>
            </div>
            {data.members.slice(0, 10).map((m, i) => (
              <div key={m.id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${BRAND.border}`, flexWrap: "wrap", gap: 6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>
                    {m.name ? m.name.split(" ")[0] + " " + (m.name.split(" ")[1]?.[0] || "") + "." : "Member"}
                  </div>
                  <div style={{ fontSize: 11, color: BRAND.gray }}>
                    {m.trade} · {m.state} · Joined {new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8,
                    background: m.status === "approved" ? "#DCFCE7" : "#FEF9C3",
                    color: m.status === "approved" ? "#166534" : "#854D0E" }}>
                    {m.status === "approved" ? "✓ Verified" : "⏳ Pending"}
                  </span>
                  {m.review_count > 0 && (
                    <span style={{ fontSize: 10, color: BRAND.gray }}>{m.review_count} review{m.review_count !== 1 ? "s" : ""}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {data?.members.length === 0 && (
          <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "3rem", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{p.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: BRAND.dark, marginBottom: 8 }}>No members yet</div>
            <div style={{ fontSize: 13, color: BRAND.gray, lineHeight: 1.65, maxWidth: 360, margin: "0 auto" }}>
              Once {p.name} members sign up using the partner link or promo code <strong>{p.code}</strong>, their activity will appear here.
            </div>
            <div style={{ marginTop: 16, background: "#F8FAFC", borderRadius: 10, padding: "12px 16px", display: "inline-block" }}>
              <div style={{ fontSize: 12, color: BRAND.gray }}>Partner signup link:</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.blue }}>prorated.app/{p.url}</div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <p style={{ fontSize: 11, color: BRAND.gray, lineHeight: 1.6 }}>
            Data updated in real-time · All member data is anonymized in this report<br/>
            Questions? <a href="mailto:hello@prorated.app" style={{ color: BRAND.blue }}>hello@prorated.app</a>
          </p>
        </div>
      </div>
    </div>
  );
}
