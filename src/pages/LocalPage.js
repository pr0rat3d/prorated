import { useLang } from "../hooks/useLang";
import { t } from "../i18n/translations";
import { BRAND } from "../components/UI";
import Logo from "../components/Logo";
import { useEffect } from "react";

const CITIES = {
  birmingham: {
    name: "Birmingham", state: "AL",
    pop: "212,000+", contractors: "2,400+",
    desc: "Alabama's largest city and the economic hub of the state. Birmingham's residential market spans historic neighborhoods like Mountain Brook, Homewood, and Vestavia Hills through to growing suburbs like Hoover and Trussville.",
    trades: ["General Contractor", "Electrical", "Plumbing", "HVAC", "Roofing", "Painting"],
    zip: "35203",
  },
  huntsville: {
    name: "Huntsville", state: "AL",
    pop: "215,000+", contractors: "1,800+",
    desc: "Home to Redstone Arsenal and a booming aerospace economy, Huntsville is Alabama's fastest-growing city. New construction and residential renovation are both active markets driven by the region's growing professional workforce.",
    trades: ["General Contractor", "Electrical", "HVAC", "Insulation", "Windows & Doors", "Flooring"],
    zip: "35801",
  },
  mobile: {
    name: "Mobile", state: "AL",
    pop: "187,000+", contractors: "1,600+",
    desc: "Alabama's only port city, Mobile has a diverse residential market ranging from historic districts in Midtown to suburban development on the Eastern Shore. Coastal weather conditions make roofing, siding, and foundation work especially active.",
    trades: ["Roofing", "Siding & Exterior", "Foundation", "General Contractor", "Plumbing", "Pest Control"],
    zip: "36602",
  },
  montgomery: {
    name: "Montgomery", state: "AL",
    pop: "200,000+", contractors: "1,400+",
    desc: "Alabama's capital city has an active residential market in neighborhoods like Cloverdale, Pike Road, and the Hampstead development. State government employment drives a stable middle-class homeowner base.",
    trades: ["General Contractor", "HVAC", "Electrical", "Landscaping", "Painting", "Concrete / Masonry"],
    zip: "36104",
  },
  tuscaloosa: {
    name: "Tuscaloosa", state: "AL",
    pop: "100,000+", contractors: "900+",
    desc: "Home to the University of Alabama, Tuscaloosa has strong residential activity in areas like Lake Tuscaloosa, North River, and the historic districts near campus. A mix of long-term homeowners and investment properties.",
    trades: ["General Contractor", "Roofing", "Flooring", "Painting", "HVAC", "Plumbing"],
    zip: "35401",
  },
};

export default function LocalPage({ go, city }) {
  const data = CITIES[city] || CITIES.birmingham;

  useEffect(() => {
    const title = `ProRated for ${data.name}, AL Contractors — Job Site Intelligence`;
    const desc  = `Verified job site ratings for ${data.name}, Alabama trade professionals. Search any residential address before you bid — payment history, access, and work records from licensed trade professionals.`;
    document.title = title;
    const m = document.querySelector("meta[name='description']");
    if (m) m.setAttribute("content", desc);
    return () => { document.title = "ProRated — Bidding Made Better"; };
  }, [city]);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg,#1a3328,#1E3A5F)", padding: "2.5rem 1.5rem 2rem", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <Logo size={44} />
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#60A5FA", marginBottom: 10 }}>
          📍 {data.name}, Alabama
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#F8FAFC", margin: "0 0 10px", lineHeight: 1.15 }}>
          ProRated for {data.name} Contractors
        </h1>
        <p style={{ fontSize: 14, color: "#94A3B8", margin: "0 auto", maxWidth: 420, lineHeight: 1.65 }}>
          Know the job site before you bid. Verified payment history, access conditions, and work records from licensed {data.name} trade professionals.
        </p>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "1.5rem 1.25rem 5rem" }}>

        <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 16, padding: "1.25rem", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: BRAND.dark, margin: "0 0 8px" }}>
            About {data.name}'s Residential Market
          </h2>
          <p style={{ fontSize: 13, color: BRAND.gray, lineHeight: 1.7, margin: 0 }}>{data.desc}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "1rem", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: BRAND.blue }}>{data.pop}</div>
            <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 2 }}>Population</div>
          </div>
          <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "1rem", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#16A34A" }}>{data.contractors}</div>
            <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 2 }}>Licensed Trade Professionals</div>
          </div>
        </div>

        <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 16, padding: "1.25rem", marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: BRAND.dark, margin: "0 0 12px" }}>
            Active Trades in {data.name}
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {data.trades.map(t => (
              <div key={t} style={{ background: "#F0FDF4", color: "#166534", border: "1px solid #86EFAC", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>
                {t}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: BRAND.dark, borderRadius: 16, padding: "1.5rem", textAlign: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 900, color: "#F8FAFC", margin: "0 0 8px" }}>
            Join {data.name} contractors on ProRated
          </h2>
          <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 16px", lineHeight: 1.6 }}>
            Free to join. License verified. Search any {data.name} residential address before you bid.
          </p>
          <button onClick={() => go("signup")}
            style={{ background: "#2563EB", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Create Free Account →
          </button>
        </div>

        <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "1rem 1.25rem" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, marginBottom: 4 }}>Other Alabama cities</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(CITIES).filter(([slug]) => slug !== city).map(([slug, c]) => (
              <button key={slug} onClick={() => go(`local-${slug}`)}
                style={{ background: "#F8FAFC", border: `1px solid ${BRAND.border}`, color: BRAND.blue, fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 8, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
