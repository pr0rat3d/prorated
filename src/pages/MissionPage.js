import { BRAND } from "../components/UI";
import Logo from "../components/Logo";
import { useLang } from "../hooks/useLang";

export default function MissionPage({ go }) {
  const { lang } = useLang();

  const stats = [
    { stat: "$280B",    label: "lost annually by the U.S. construction industry due to slow and delayed payments in 2024 — the highest ever recorded", source: "Rabbet 2024",     url: "https://www.globenewswire.com/news-release/2024/10/01/2955968/0/en/Slow-Payments-Cost-280-Billion-in-2024-Threaten-U-S-Construction-Industry-s-Financial-Health.html" },
    { stat: "57%",      label: "of service businesses lose $1,000–$5,000 every month to unbilled scope creep — and only 1% successfully bill for all out-of-scope work", source: "Ignition 2025",   url: "https://www.ignitionapp.com/news/2025-agency-pricing-cashflow-report" },
    { stat: "3–7%",     label: "average net profit margin for U.S. contractors — meaning a single unmanaged scope-creep job can wipe out months of profit", source: "IBIS World / Procore", url: "https://www.procore.com/library/construction-markup-and-profit-margin" },
    { stat: "27%",      label: "average budget overrun on projects that experience scope creep — 85% of all projects that creep go over budget by this amount", source: "PMI 2025",        url: "https://www.pmi.org" },
    { stat: "70%",      label: "of contractors say payment delays regularly threaten their ability to operate and grow their business",                        source: "Built 2025",      url: "https://getbuilt.com/blog/70-percent-of-contractors-say-payment-delays-threaten-industry/" },
    { stat: "27%",      label: "of contractors have used personal savings or retirement funds to cover cash flow gaps caused by slow-paying clients",          source: "Billd 2025",      url: "https://billd.com/resources/2025-market-report" },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #1a3328 0%, #1E3A5F 100%)",
        padding: "3rem 1.5rem 2.5rem",
        textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <Logo size={56} />
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#60A5FA", marginBottom: 12 }}>
            Our Mission
          </div>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 38px)", fontWeight: 900, color: "#F8FAFC", margin: "0 0 14px", lineHeight: 1.15, letterSpacing: "-0.5px" }}>
            Built by Pros, Built for Pros
          </h1>
          <p style={{ fontSize: 16, color: "#94A3B8", margin: "0 auto", maxWidth: 480, lineHeight: 1.75 }}>
            Trade professionals deserve the full picture of what they're committing to before they commit. ProRated exists to make that possible.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1.25rem 5rem" }}>

        {/* Mission Statement */}
        <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 18, padding: "1.75rem", marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#2563EB", marginBottom: 12 }}>
            🎯 Mission Statement
          </div>
          <p style={{ fontSize: 15, color: BRAND.dark, lineHeight: 1.8, margin: "0 0 14px", fontWeight: 500 }}>
            ProRated is a verified job site intelligence platform built for licensed trade professionals. We pull together peer-sourced data on residential job sites to equip our bidders. This protects their time, their business, their capital and their reputation. We strive to give our members a voice and empower them to feel heard.
          </p>
        </div>

        {/* Objective */}
        <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 18, padding: "1.75rem", marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#16A34A", marginBottom: 12 }}>
            🏗️ Our Objective
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { icon: "🔒", title: "Verified intelligence only", body: "Every account is license-verified before access is granted. Data on ProRated comes from licensed trade professionals — not homeowners, anonymous users, or unverified contractors." },
              { icon: "📊", title: "Data that informs, not advises", body: "ProRated presents peer-sourced scores and work history. We never tell a contractor what to do. The platform provides the picture; the contractor makes the call." },
              { icon: "🤝", title: "A stronger trade community", body: "The more contractors contribute, the more valuable the platform becomes for everyone. Every review left after a job helps the next professional in that trade make a better decision." },
              { icon: "🌍", title: "Community first, then everywhere", body: "We're building the model one market at a time — with association partnerships, verified licensing data, and a community that trusts each other. Concentrated adoption beats shallow national reach." },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: BRAND.dark, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: BRAND.gray, lineHeight: 1.7 }}>{item.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By the Numbers */}
        <div style={{ background: "linear-gradient(135deg, #1a3328, #1E3A5F)", borderRadius: 18, padding: "1.75rem", marginBottom: 20, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#60A5FA", marginBottom: 6 }}>
              📊 By the Numbers
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "#F8FAFC", margin: "0 0 18px", lineHeight: 1.3 }}>
              Why this problem needed solving
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
              {stats.map((s, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "#4ADE80", lineHeight: 1, marginBottom: 5 }}>{s.stat}</div>
                  <div style={{ fontSize: 11, color: "#CBD5E1", lineHeight: 1.5, marginBottom: 4 }}>{s.label}</div>
                  {s.url
                    ? <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: "#60A5FA", textDecoration: "underline" }}>Source: {s.source} ↗</a>
                    : <div style={{ fontSize: 9, color: "#475569" }}>Source: {s.source}</div>
                  }
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(200,131,26,0.15)", border: "1px solid rgba(200,131,26,0.3)", borderRadius: 10, padding: "12px 14px", fontSize: 12, color: "#FBBF24", lineHeight: 1.65 }}>
              💡 Platforms like Angi and Thumbtack now factor dispute history into contractor search ranking. A single payment dispute that goes public can suppress your visibility for months. Peer intelligence before the bid protects your cash flow <em>and</em> your reputation.
            </div>
            <div style={{ marginTop: 12, fontSize: 9, color: "#334155", lineHeight: 1.8 }}>
              <span style={{ color: "#475569", fontWeight: 600 }}>Further reading: </span>
              {[
                { label: "GlobeNewsWire — $280B Slow Payments 2024", url: "https://www.globenewswire.com/news-release/2024/10/01/2955968/0/en/Slow-Payments-Cost-280-Billion-in-2024-Threaten-U-S-Construction-Industry-s-Financial-Health.html" },
                { label: "Ignition 2025 Agency Pricing & Cash Flow Report", url: "https://www.ignitionapp.com/news/2025-agency-pricing-cashflow-report" },
                { label: "IBIS World / Procore — Construction Profit Margins", url: "https://www.procore.com/library/construction-markup-and-profit-margin" },
                { label: "CFMA 2024 Construction Financial Benchmarker", url: "https://cfma.org/articles/construction-s-lifeline-key-metrics-for-measuring-financial-health" },
                { label: "Built 2025 Construction Cash Crunch Survey", url: "https://getbuilt.com/blog/70-percent-of-contractors-say-payment-delays-threaten-industry/" },
                { label: "Billd 2025 National Subcontractor Market Report", url: "https://billd.com/resources/2025-market-report" },
              ].map((r, i) => (
                <span key={i}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: "#60A5FA", textDecoration: "underline" }}>{r.label}</a>
                  {i < 3 && <span style={{ color: "#334155" }}> · </span>}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Built by */}
        <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 18, padding: "1.5rem", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>🛡️</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: BRAND.dark, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                A Note from the Team
              </div>
              <p style={{ fontSize: 13, color: BRAND.gray, lineHeight: 1.75, margin: "0 0 10px" }}>
                We built ProRated because trade professionals deserve the full picture of what they're committing to with a job. Your experience and voice matter — every review you leave ensures your fellow professionals are equipped to succeed.
              </p>
              <p style={{ fontSize: 13, color: BRAND.gray, lineHeight: 1.75, margin: 0 }}>
                We're always open to feedback, suggestions, or any concerns you may have.
              </p>
              <div style={{ fontSize: 13, color: "#2563EB", marginTop: 10, fontWeight: 700 }}>
                — Tommy, Canaan, and the ProRated Team
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: BRAND.dark, borderRadius: 18, padding: "1.75rem", textAlign: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: "#F8FAFC", margin: "0 0 8px" }}>
            Ready to bid smarter?
          </h2>
          <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 18px", lineHeight: 1.6 }}>
            Join verified trade professionals on ProRated. Free to create an account.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => go("signup")}
              style={{ background: "#2563EB", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Create Free Account →
            </button>
            <button onClick={() => go("contact")}
              style={{ background: "rgba(255,255,255,0.08)", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.15)", padding: "12px 28px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Contact Us
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
