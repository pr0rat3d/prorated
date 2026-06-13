import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
import { useState } from "react";
import Logo from "../components/Logo";
import { BRAND, FREE_MONTHLY_LOOKUPS } from "../data/constants";




function FeatureCard({ icon, title, body }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "1.5rem" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#F8FAFC", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.7 }}>{body}</div>
    </div>
  );
}

function TestimonialCard({ quote, name, trade }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "1.25rem" }}>
      <div style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.7, marginBottom: 12, fontStyle: "italic" }}>"{quote}"</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#F8FAFC" }}>{name}</div>
      <div style={{ fontSize: 11, color: "#64748B" }}>{trade}</div>
    </div>
  );
}

export default function BetaLanding({ go }) {
  const [email, setEmail]     = useState("");
  const [trade, setTrade]     = useState("");
  const [submitted, setSubmit] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!email.trim() || !trade) return;
    setLoading(true);
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/beta_signups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({ email: email.trim(), trade, signed_up_at: new Date().toISOString() }),
      });
    } catch {}
    setLoading(false);
    setSubmit(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", fontFamily: "'DM Sans', sans-serif", color: "#F8FAFC" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fade1 { animation: fadeUp 0.5s ease 0.1s both; }
        .fade2 { animation: fadeUp 0.5s ease 0.2s both; }
        .fade3 { animation: fadeUp 0.5s ease 0.3s both; }
        .fade4 { animation: fadeUp 0.5s ease 0.4s both; }
      `}</style>

      {/* Nav */}
      <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0 1.5rem", position: "sticky", top: 0, zIndex: 100, background: "rgba(10,15,30,0.95)", backdropFilter: "blur(14px)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo size={36} />
            <div>
              <span style={{ fontSize: 16, fontWeight: 800 }}>
                <span style={{ color: BRAND.blue }}>Pro</span><span style={{ color: BRAND.green }}>Rated</span>
              </span>
            </div>
          </div>
          <button onClick={() => go("signup")}
            style={{ background: BRAND.blue, color: "#fff", border: "none", padding: "8px 18px", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Create account →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ position: "relative", overflow: "hidden", padding: "5rem 1.5rem 4rem", textAlign: "center" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(37,99,235,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.05) 1px,transparent 1px)", backgroundSize: "44px 44px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)", width: 700, height: 500, background: "radial-gradient(ellipse,rgba(37,99,235,0.12) 0%,transparent 65%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: 700, margin: "0 auto" }}>
          <div className="fade1" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 20, padding: "5px 16px", marginBottom: 24 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#93C5FD" }}>
              Beta · Alabama Contractors
            </span>
          </div>

          <h1 className="fade2" style={{ fontSize: "clamp(36px,6vw,68px)", fontWeight: 800, lineHeight: 1.05, marginBottom: 20, letterSpacing: "-1.5px" }}>
            Know the job site<br /><span style={{ color: "#4ADE80" }}>before you bid.</span>
          </h1>

          <p className="fade3" style={{ fontSize: 18, color: "#94A3B8", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 36px" }}>
            ProRated is the first contractor-to-contractor job site rating platform. See access, payment history, communication, and obstacles — all rated by verified trade professionals who've been there.
          </p>

          <div className="fade4" style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => go("signup")}
              style={{ background: BRAND.blue, color: "#fff", border: "none", padding: "14px 28px", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Join the beta — it's free →
            </button>
            <button onClick={() => go("home")}
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#F8FAFC", padding: "14px 28px", borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              See a demo first
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 1.5rem 5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "5rem" }}>
          <FeatureCard icon="🚗" title="Access & Parking" body="Know before you arrive — steep driveways, tight access, no parking zones. Quote accurately, not hopefully." />
          <FeatureCard icon="💰" title="Payment Reliability" body="See who pays on time and who chases invoices. Protect your cash flow before you sign anything." />
          <FeatureCard icon="📅" title="Timeline Respect" body="Find out if start dates are honored and decisions get made promptly. Avoid the job that drags on forever." />
          <FeatureCard icon="🗣️" title="Communication" body="Is the homeowner responsive? Professional? Know what you're walking into before the first call." />
          <FeatureCard icon="🚧" title="Job Site Obstacles" body="Aggressive dogs, HOA restrictions, old wiring, unmarked hazards — real warnings from trade professionals who've worked it." />
        </div>

        {/* Social proof */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#475569", marginBottom: 16 }}>What beta contractors are saying</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginBottom: "5rem" }}>
          <TestimonialCard
            quote="I checked an address before bidding a roof job last week. Saw three reviews mentioning the steep driveway and a homeowner who added scope mid-job. Adjusted my quote accordingly. Worth every penny."
            name="Mike R." trade="Roofing · Vestavia Hills, AL" />
          <TestimonialCard
            quote="The payment reliability rating alone is worth it. I walked away from two bids this month based on what other plumbers had posted. Saved me months of invoice chasing."
            name="Carlos V." trade="Plumbing · Hoover, AL" />
          <TestimonialCard
            quote="Finally something built for us. Homeowners have Yelp, Angi, all of it. Now contractors have ProRated."
            name="Dana H." trade="HVAC · Birmingham, AL" />
        </div>

        {/* Signup form */}
        {!submitted ? (
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "2.5rem", maxWidth: 540, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Join the Alabama beta</h2>
            <p style={{ fontSize: 14, color: "#94A3B8", marginBottom: 24, lineHeight: 1.65 }}>
              Free for licensed trade professionals. {FREE_MONTHLY_LOOKUPS} lookups/month included. No credit card required.
            </p>
            <input type="email" placeholder="Your email address"
              value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#F8FAFC", fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif", marginBottom: 10, boxSizing: "border-box" }} />
            <select value={trade} onChange={e => setTrade(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: trade ? "#F8FAFC" : "#64748B", fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif", marginBottom: 16, boxSizing: "border-box", cursor: "pointer" }}>
              <option value="" disabled>Select your trade</option>
              {["Roofing","Painting","Plumbing","Electrical","HVAC","General Contracting","Landscaping","Concrete"].map(t => (
                <option key={t} value={t} style={{ background: "#1E293B", color: "#F8FAFC" }}>{t}</option>
              ))}
            </select>
            <button onClick={handleJoin} disabled={!email.trim() || !trade || loading}
              style={{ width: "100%", background: !email.trim() || !trade ? "#1E293B" : BRAND.blue, color: !email.trim() || !trade ? "#475569" : "#fff", border: "none", padding: "14px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: !email.trim() || !trade ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>
              {loading ? "Joining..." : "Request beta access →"}
            </button>
            <p style={{ fontSize: 11, color: "#475569" }}>
              Or <button onClick={() => go("signup")} style={{ background: "none", border: "none", color: BRAND.blue, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>create your account now</button> — instant access after license verification
            </p>
          </div>
        ) : (
          <div style={{ background: "rgba(22,163,74,0.1)", border: "1px solid #86EFAC", borderRadius: 20, padding: "2.5rem", maxWidth: 540, margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#4ADE80", marginBottom: 12 }}>You're on the list!</h2>
            <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.65, marginBottom: 24 }}>
              Thanks for signing up. We'll be in touch within 24 hours with your access link.
            </p>
            <button onClick={() => go("signup")}
              style={{ background: BRAND.blue, color: "#fff", border: "none", padding: "13px 28px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Create your account now →
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "1.5rem", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Logo size={24} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            <span style={{ color: BRAND.blue }}>Pro</span><span style={{ color: BRAND.green }}>Rated</span>
          </span>
        </div>
        <p style={{ fontSize: 11, color: "#475569" }}>© 2025 ProRated · Bidding Made Better · Hoover, Alabama</p>
      </div>
    </div>
  );
}
