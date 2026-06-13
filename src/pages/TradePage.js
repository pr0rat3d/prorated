import { useLang } from "../hooks/useLang";
import { t } from "../i18n/translations";
import { BRAND } from "../components/UI";
import Logo from "../components/Logo";
import { useEffect } from "react";

const TRADES = {
  roofing: {
    name: "Roofing", icon: "🏠",
    headline: "ProRated for Alabama Roofers",
    sub: "Know the job site before you load the truck. Verified payment history and site conditions from licensed Alabama roofing contractors.",
    why: "Roofing is one of the highest-risk trades for payment disputes. Jobs are large, weather-dependent, and often involve insurance claims — all factors that create payment complexity. ProRated lets roofers check payment history, HOA restrictions, and access conditions at any Alabama residential address before they bid.",
    categories: ["Payment timing on insurance jobs", "HOA permit requirements", "Driveway and staging access", "Shingle disposal access", "Homeowner communication style"],
    cta: "Join Alabama roofers on ProRated",
  },
  electrical: {
    name: "Electrical", icon: "⚡",
    headline: "ProRated for Alabama Electricians",
    sub: "Before you pull the permit. Verified job site data from licensed Alabama electrical contractors.",
    why: "Electrical work often involves permit timelines, inspection scheduling, and coordination with other trades — all of which depend heavily on homeowner responsiveness. ProRated helps Alabama electricians verify payment history and communication patterns at any residential address before committing to a job.",
    categories: ["Panel location and accessibility", "Permit history at the address", "Homeowner responsiveness", "Payment timeline on previous work", "Coordination with other trades"],
    cta: "Join Alabama electricians on ProRated",
  },
  plumbing: {
    name: "Plumbing", icon: "🔧",
    headline: "ProRated for Alabama Plumbers",
    sub: "Know what you're walking into. Verified site intel from licensed Alabama plumbing contractors.",
    why: "Plumbing emergencies create pressure to start work before terms are fully agreed. ProRated helps Alabama plumbers separate genuine emergencies from homeowners who use urgency to skip proper contracts — and check payment history on any address before arriving on site.",
    categories: ["Access to crawl space and utility areas", "Previous plumbing work history", "Payment history at the address", "Scope change patterns", "Permit history"],
    cta: "Join Alabama plumbers on ProRated",
  },
  hvac: {
    name: "HVAC", icon: "❄️",
    headline: "ProRated for Alabama HVAC Contractors",
    sub: "Summer heat makes HVAC work urgent. Don't let urgency skip due diligence.",
    why: "Alabama's summer heat creates genuine urgency for HVAC work — and urgency creates payment risk. Homeowners who are hot and uncomfortable sometimes agree to terms in the moment that they dispute later. ProRated lets HVAC contractors check payment history and communication patterns at any address before they dispatch a crew.",
    categories: ["Attic and equipment access", "Existing system age and condition", "Payment history on previous work", "HOA requirements for equipment placement", "Permit history"],
    cta: "Join Alabama HVAC contractors on ProRated",
  },
  general: {
    name: "General Contracting", icon: "🏗️",
    headline: "ProRated for Alabama General Contractors",
    sub: "Every residential GC job is a relationship. Know who you're entering it with.",
    why: "General contractors take on more scope, more risk, and more subcontractor coordination than any other trade. A single difficult homeowner can turn a profitable project into a months-long dispute. ProRated gives Alabama GCs verified peer intelligence on any residential address — payment history, access conditions, communication patterns, and work history — before they commit.",
    categories: ["Payment history and timing", "Scope change patterns", "HOA and permit requirements", "Site access for equipment and subs", "Homeowner communication style"],
    cta: "Join Alabama general contractors on ProRated",
  },
};

export default function TradePage({ go, trade }) {
  const data = TRADES[trade] || TRADES.roofing;

  useEffect(() => {
    const title = `${data.headline} — Job Site Intelligence | ProRated`;
    const desc  = data.sub;
    document.title = title;
    const m = document.querySelector("meta[name='description']");
    if (m) m.setAttribute("content", desc);
    return () => { document.title = "ProRated — Bidding Made Better"; };
  }, [trade]);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg,#1a3328,#1E3A5F)", padding: "2.5rem 1.5rem 2rem", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <Logo size={44} />
        </div>
        <div style={{ fontSize: 28, marginBottom: 8 }}>{data.icon}</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#F8FAFC", margin: "0 0 10px", lineHeight: 1.15 }}>
          {data.headline}
        </h1>
        <p style={{ fontSize: 14, color: "#94A3B8", margin: "0 auto", maxWidth: 400, lineHeight: 1.65 }}>
          {data.sub}
        </p>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "1.5rem 1.25rem 5rem" }}>

        <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 16, padding: "1.25rem", marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: BRAND.dark, margin: "0 0 10px" }}>
            Why {data.name} contractors use ProRated
          </h2>
          <p style={{ fontSize: 13, color: BRAND.gray, lineHeight: 1.7, margin: 0 }}>{data.why}</p>
        </div>

        <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 16, padding: "1.25rem", marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: BRAND.dark, margin: "0 0 12px" }}>
            What {data.name} contractors check before bidding
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.categories.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < data.categories.length - 1 ? `1px solid #F1F5F9` : "none" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#EFF6FF", color: "#1E40AF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ fontSize: 13, color: BRAND.dark, fontWeight: 500 }}>{c}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: BRAND.dark, borderRadius: 16, padding: "1.5rem", textAlign: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 900, color: "#F8FAFC", margin: "0 0 8px" }}>{data.cta}</h2>
          <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 16px", lineHeight: 1.6 }}>
            Free to join. License verified. Available across Alabama.
          </p>
          <button onClick={() => go("signup")}
            style={{ background: "#2563EB", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Create Free Account →
          </button>
        </div>

        <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "1rem 1.25rem" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, marginBottom: 8 }}>Other trades on ProRated</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(TRADES).filter(([slug]) => slug !== trade).map(([slug, t]) => (
              <button key={slug} onClick={() => go(`trade-${slug}`)}
                style={{ background: "#F8FAFC", border: `1px solid ${BRAND.border}`, color: BRAND.blue, fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 8, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                {t.icon} {t.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
