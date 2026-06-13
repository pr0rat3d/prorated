import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
import { useState, useEffect } from "react";
import { BRAND } from "../components/UI";
import Logo from "../components/Logo";



const AGC_PROMO         = "AGC2026";

export default function AGCLandingPage({ go }) {
  useEffect(() => {
    document.title = "ProRated × AGC Alabama — Free Pro Access for Members";
    const d = document.querySelector("meta[name='description']");
    if (d) d.setAttribute("content", "AGC Alabama members get free ProRated Pro access during our beta. Search job site ratings, payment history, and access conditions before you bid. Use code AGC2026.");
    return () => { document.title = "ProRated — Bidding Made Better"; };
  }, []);
  const [started, setStarted] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ background: BRAND.dark, padding: "1.5rem", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
          <Logo size={44} />
          <div style={{ fontSize: 20, color: "#64748B" }}>×</div>
          {/* AGC Badge */}
          <div style={{ background: "#fff", borderRadius: 10, padding: "6px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 18 }}>🏗️</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, color: "#1a3328", letterSpacing: "0.05em" }}>AGC</div>
              <div style={{ fontSize: 9, color: "#64748B", letterSpacing: "0.03em" }}>ALABAMA</div>
            </div>
          </div>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#F8FAFC", marginBottom: 6 }}>
          ProRated — Exclusive for AGC Alabama Members
        </h1>
        <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>
          Free Pro access · Job site intelligence · Bidding Made Better
        </p>
      </div>

      {/* Partnership badge */}
      <div style={{ background: "#1a3328", padding: "10px 1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#c8831a", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          🤝 In Official Partnership with AGC Alabama
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "1.5rem 1.25rem 4rem" }}>

        {/* Hero value props */}
        <div style={{ background: "#fff", border: `1.5px solid ${BRAND.border}`, borderRadius: 16, padding: "1.5rem", marginBottom: "1.25rem", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🛡️</div>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: BRAND.dark, marginBottom: 10, marginTop: 0 }}>
            Know the job site before you bid
          </h2>
          <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, marginBottom: "1.25rem" }}>
            ProRated gives licensed trade professionals verified intelligence on residential job sites — access ratings, payment history, homeowner communication scores, and work history — submitted by real trade professionals who've been there.
          </p>
          <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 12, padding: "12px 16px", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#166534", marginBottom: 4 }}>
              🎁 AGC Members get Pro free
            </div>
            <div style={{ fontSize: 12, color: "#166534" }}>
              Full access during beta — no credit card required
            </div>
          </div>
          <button onClick={() => { setStarted(true); go("signup"); }}
            style={{ width: "100%", background: "#1a3328", color: "#c8831a", border: "none", padding: "14px", borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.02em" }}>
            Claim your free AGC Pro account →
          </button>
          <p style={{ fontSize: 11, color: BRAND.gray, marginTop: 8, marginBottom: 0 }}>
            Use code <strong>{AGC_PROMO}</strong> at signup · Limited to verified AGC members
          </p>
        </div>

        {/* Features */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1.25rem" }}>
          {[
            { icon: "🚗", title: "Access Ratings", desc: "Driveway, staging, equipment access" },
            { icon: "💰", title: "Payment History", desc: "How fast homeowners pay contractors" },
            { icon: "💬", title: "Communication", desc: "Homeowner responsiveness scores" },
            { icon: "🔨", title: "Work History", desc: "What trades have worked the address" },
            { icon: "⭐", title: "Overall Rating", desc: "Peer-verified job site score" },
            { icon: "📍", title: "Local Suppliers", desc: "Nearby supply houses and food" },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 12, padding: "1rem", textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: BRAND.dark, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 11, color: BRAND.gray, lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* Data partnership section */}
        <div style={{ background: "linear-gradient(135deg, #1a3328, #0F172A)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#c8831a", marginBottom: 8 }}>
            📊 ProRated × AGC Alabama Data Partnership
          </div>
          <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.7, marginBottom: 12 }}>
            As an AGC partner, ProRated will provide quarterly aggregate intelligence reports to AGC Alabama including:
          </p>
          {[
            "Payment delay rates by county across Alabama",
            "Most common job site access and obstacle issues",
            "Regional trends in homeowner communication scores",
            "Work type frequency by trade and geography",
          ].map(item => (
            <div key={item} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <span style={{ color: "#c8831a", flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 12, color: "#CBD5E1" }}>{item}</span>
            </div>
          ))}
          <p style={{ fontSize: 10, color: "#64748B", marginTop: 12, marginBottom: 0 }}>
            All data is fully anonymized and aggregate — no individual contractor or homeowner is identifiable.
          </p>
        </div>

        {/* How it works */}
        <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 16, padding: "1.5rem", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: BRAND.dark, marginBottom: "1rem" }}>How it works</div>
          {[
            { step: "1", title: "Create your free account", desc: "Sign up with your contractor license. Use code AGC2026 for free Pro access." },
            { step: "2", title: "Search any address", desc: "See what other licensed trade professionals say about a job site before you bid." },
            { step: "3", title: "Submit reviews", desc: "Rate job sites you've worked. Help fellow AGC members make smarter bids." },
            { step: "4", title: "Build your trust score", desc: "Active contributors earn continued Pro access and directory listing." },
          ].map(({ step, title, desc }) => (
            <div key={step} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1a3328", color: "#c8831a", fontSize: 13, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {step}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 12, color: BRAND.gray, lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button onClick={() => go("signup")}
          style={{ width: "100%", background: "#1a3328", color: "#c8831a", border: "none", padding: "16px", borderRadius: 14, fontSize: 16, fontWeight: 900, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>
          Get started free — AGC members →
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
