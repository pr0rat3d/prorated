import { useState } from "react";
import Logo from "../components/Logo";
import { BRAND } from "../components/UI";

const STEPS = [
  {
    icon: "🔍",
    title: "Search any job site",
    body: "Type any residential address to instantly see contractor ratings — access, payment history, communication, and obstacles.",
    action: "Got it →",
  },
  {
    icon: "⭐",
    title: "Leave honest reviews",
    body: "Worked a job recently? Rate it in 60 seconds. Your review helps the next contractor walk in prepared instead of surprised.",
    action: "Makes sense →",
  },
  {
    icon: "🔖",
    title: "Save addresses to your watchlist",
    body: "Bidding on a job next week? Save the address and we'll notify you if a new review comes in before you commit.",
    action: "Let's go →",
  },
];

export default function BetaWelcome({ onDone }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      background: BRAND.dark,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "2rem", fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Grid bg */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(59,130,246,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.06) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />

      <div style={{ position: "relative", maxWidth: 400, width: "100%", textAlign: "center", animation: "fadeUp 0.35s ease both" }}>

        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <Logo size={72} />
        </div>

        {/* Welcome badge */}
        {step === 0 && (
          <div style={{ display: "inline-block", background: "rgba(232,160,32,0.15)", color: "#FCD34D", fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", padding: "5px 14px", borderRadius: 20, border: "1px solid rgba(232,160,32,0.3)", marginBottom: 20 }}>
            🎉 Welcome to ProRated
          </div>
        )}

        {/* Step icon */}
        <div style={{ fontSize: 64, marginBottom: 20, animation: "fadeUp 0.3s ease both" }}
          key={step}>
          {current.icon}
        </div>

        {/* Step content */}
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#F8FAFC", marginBottom: 12, letterSpacing: "-0.5px", animation: "fadeUp 0.3s ease 0.05s both" }}
          key={`title-${step}`}>
          {current.title}
        </h2>
        <p style={{ fontSize: 15, color: "#94A3B8", lineHeight: 1.7, marginBottom: 40, animation: "fadeUp 0.3s ease 0.1s both" }}
          key={`body-${step}`}>
          {current.body}
        </p>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 32 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, background: i === step ? BRAND.blue : "rgba(255,255,255,0.2)", transition: "all 0.3s" }} />
          ))}
        </div>

        {/* CTA button */}
        <button
          onClick={() => isLast ? onDone() : setStep(s => s + 1)}
          style={{ width: "100%", background: isLast ? BRAND.green : BRAND.blue, color: "#fff", border: "none", padding: "14px", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginBottom: 16, boxShadow: `0 8px 24px ${isLast ? "rgba(22,163,74,0.4)" : "rgba(37,99,235,0.4)"}` }}>
          {isLast ? "🚀 Start using ProRated" : current.action}
        </button>

        {/* Skip */}
        {!isLast && (
          <button onClick={onDone}
            style={{ background: "none", border: "none", color: "#475569", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Skip intro
          </button>
        )}

        {/* Note on last step */}
        {isLast && (
          <p style={{ fontSize: 11, color: "#475569", marginTop: 12, lineHeight: 1.6 }}>
            Use the <strong style={{ color: "#94A3B8" }}>💬 Feedback</strong> button anytime to tell us what you think.
          </p>
        )}
      </div>
    </div>
  );
}
