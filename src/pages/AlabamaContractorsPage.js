import { useEffect } from "react";
import { BRAND } from "../components/UI";
import Logo from "../components/Logo";

const CITIES = [
  { slug: "birmingham", name: "Birmingham" },
  { slug: "huntsville",  name: "Huntsville" },
  { slug: "mobile",      name: "Mobile" },
  { slug: "montgomery",  name: "Montgomery" },
  { slug: "tuscaloosa",  name: "Tuscaloosa" },
];

const TRADES = [
  { slug: "general",    name: "General Contracting", icon: "🏗️" },
  { slug: "roofing",    name: "Roofing",              icon: "🏠" },
  { slug: "electrical", name: "Electrical",           icon: "⚡" },
  { slug: "plumbing",   name: "Plumbing",             icon: "🔧" },
  { slug: "hvac",       name: "HVAC",                 icon: "❄️" },
];

export default function AlabamaContractorsPage({ go }) {
  useEffect(() => {
    const title = "ProRated for Alabama Contractors — Job Site Intelligence Statewide";
    const desc  = "Verified job site ratings for licensed trade professionals across Alabama. Search any residential address before you bid — payment history, access, and work records from licensed contractors statewide.";
    document.title = title;
    const m = document.querySelector("meta[name='description']");
    if (m) m.setAttribute("content", desc);
    return () => { document.title = "ProRated — Built by Pros, Built for Pros"; };
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg,#1a3328,#1E3A5F)", padding: "2.5rem 1.5rem 2rem", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <Logo size={44} />
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#60A5FA", marginBottom: 10 }}>
          📍 Statewide · Alabama
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#F8FAFC", margin: "0 0 10px", lineHeight: 1.15 }}>
          ProRated for Alabama Contractors
        </h1>
        <p style={{ fontSize: 14, color: "#94A3B8", margin: "0 auto", maxWidth: 440, lineHeight: 1.65 }}>
          Know the job site before you bid. Verified payment history, access conditions, and work records from licensed Alabama trade professionals — in every city, every trade.
        </p>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "1.5rem 1.25rem 5rem" }}>

        <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 16, padding: "1.25rem", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: BRAND.dark, margin: "0 0 8px" }}>
            Built for Alabama's Trade Community
          </h2>
          <p style={{ fontSize: 13, color: BRAND.gray, lineHeight: 1.7, margin: 0 }}>
            From Birmingham's historic neighborhoods to Huntsville's fast-growing suburbs, Mobile's coastal properties, Montgomery's established communities, and Tuscaloosa's college-town market — ProRated gives licensed Alabama contractors verified job site intelligence before they ever write a bid.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "1rem", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: BRAND.blue }}>8,000+</div>
            <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 2 }}>Licensed Trade Professionals Statewide</div>
          </div>
          <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "1rem", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#16A34A" }}>5</div>
            <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 2 }}>Major Alabama Markets Covered</div>
          </div>
        </div>

        <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 16, padding: "1.25rem", marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: BRAND.dark, margin: "0 0 12px" }}>
            Find ProRated in Your City
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CITIES.map(c => (
              <button key={c.slug} onClick={() => go(`local-${c.slug}`)}
                style={{ background: "#F0FDF4", color: "#166534", border: "1px solid #86EFAC", fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                {c.name}, AL
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 16, padding: "1.25rem", marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: BRAND.dark, margin: "0 0 12px" }}>
            Built for Every Trade
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {TRADES.map(tr => (
              <button key={tr.slug} onClick={() => go(`trade-${tr.slug}`)}
                style={{ background: "#EFF6FF", color: "#1E40AF", border: "1px solid #BFDBFE", fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                {tr.icon} {tr.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: BRAND.dark, borderRadius: 16, padding: "1.5rem", textAlign: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 900, color: "#F8FAFC", margin: "0 0 8px" }}>
            Join Alabama contractors on ProRated
          </h2>
          <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 16px", lineHeight: 1.6 }}>
            Free to join. License verified. Search any Alabama residential address before you bid.
          </p>
          <button onClick={() => go("signup")}
            style={{ background: "#2563EB", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Create Free Account →
          </button>
        </div>

        <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "1rem 1.25rem", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: BRAND.gray }}>
            Want contractor tips and industry insight?{" "}
            <button onClick={() => go("blog")}
              style={{ background: "none", border: "none", color: BRAND.blue, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0, fontFamily: "'DM Sans', sans-serif" }}>
              Read the ProRated Blog →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
