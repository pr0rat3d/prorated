// src/components/BidIntelligence.js
// AI-powered bid prep report — advisory only, never dollar amounts or %.
import { useState, useEffect, useRef } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { BRAND } from "./UI";

const SIGNAL_META = {
  strong:    { emoji: "🟢", color: "#22C55E", label: "Strong Site — Bid Confidently" },
  good:      { emoji: "🔵", color: "#2563EB", label: "Good Site — Minor Considerations" },
  caution:   { emoji: "🟡", color: "#F59E0B", label: "Proceed with Caution" },
  high_risk: { emoji: "🔴", color: "#EF4444", label: "High Risk Site — Review Carefully" },
  avoid:     { emoji: "⚫", color: "#6B7280", label: "Significant Concerns" },
};

const CONFIDENCE_META = {
  high:   { emoji: "🟢", label: "High Confidence" },
  medium: { emoji: "🟡", label: "Medium Confidence" },
  low:    { emoji: "🔴", label: "Low Confidence" },
};

export default function BidIntelligence({ address, reviews, bidScore, user, forceUnlock = false }) {
  const plan = user?.plan || "free";
  const { canAccess: flagCanAccess, loading: flagLoadingReal, isEarlyAccess } = useFeatureFlag("bid_intelligence", plan);
  // forceUnlock is an explicit demo-only escape hatch (app walkthrough, internal
  // previews) — it bypasses the live feature_flags row, which is off for real
  // users until review volume hits the launch thresholds. Defaults false, so
  // production behavior is completely unchanged unless a caller opts in.
  const canAccess = forceUnlock || flagCanAccess;
  const flagLoading = !forceUnlock && flagLoadingReal;

  const [report, setReport]           = useState(null);
  const [status, setStatus]           = useState("idle"); // idle | loading | loaded | error
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [generatedAt, setGeneratedAt] = useState(null);
  const cacheKey = useRef(null);

  const isGoldPlus = plan === "gold" || plan === "platinum";
  const isLockedTier = plan === "bronze" || plan === "silver";

  const addressLabel = typeof address === "string"
    ? address
    : `${address?.street || ""}, ${address?.city || ""} ${address?.state || ""}`.trim();

  const generate = async () => {
    setStatus("loading");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/bid-intelligence`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ address: addressLabel, reviews, bidScore }),
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error("Bid Intelligence request failed");
      const data = await res.json();
      if (data?.error) throw new Error(data.error);
      setReport(data);
      setGeneratedAt(new Date());
      setStatus("loaded");
    } catch {
      clearTimeout(timeout);
      setStatus("error");
    }
  };

  // Auto-generate on mount for gold/platinum with 1+ reviews — cache by address
  useEffect(() => {
    if (flagLoading || !canAccess || !isGoldPlus) return;
    if (!reviews || reviews.length === 0) return;
    if (cacheKey.current === addressLabel && report) return; // already cached
    cacheKey.current = addressLabel;
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flagLoading, canAccess, isGoldPlus, addressLabel, reviews?.length]);

  const handleRegenerate = () => {
    setReport(null);
    generate();
  };

  if (flagLoading || !canAccess) return null;
  if (plan === "free") return null;

  const cardBase = { borderRadius: 16, overflow: "hidden", marginTop: "1rem", fontFamily: "'DM Sans', sans-serif", border: `1px solid ${BRAND.border}` };

  return (
    <div>
      {isEarlyAccess && !bannerDismissed && (
        <div style={{
          background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 12,
          padding: "8px 12px", marginTop: "1rem", display: "flex",
          justifyContent: "space-between", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 12, color: "#92400E", fontWeight: 600 }}>
            ⚡ Early Access — Available to Gold &amp; Platinum members before general release
          </span>
          <button onClick={() => setBannerDismissed(true)}
            style={{ background: "none", border: "none", color: "#92400E", fontSize: 16, cursor: "pointer", lineHeight: 1, flexShrink: 0 }}>
            ×
          </button>
        </div>
      )}

      {isLockedTier && (
        <div style={cardBase}>
          <div style={{ background: BRAND.dark, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>🤖 Bid Intelligence</span>
            <span style={{ background: "#F59E0B", color: "#1F2937", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>GOLD+</span>
          </div>
          <div style={{ background: "#fff", padding: "16px", position: "relative" }}>
            <div style={{ filter: "blur(3px)", opacity: 0.5, userSelect: "none", pointerEvents: "none" }}>
              <div style={{ fontSize: 12, color: BRAND.gray, marginBottom: 6 }}>SITE ASSESSMENT</div>
              <p style={{ fontSize: 13, color: BRAND.dark, lineHeight: 1.6 }}>
                This site shows strong payment reliability and clear scope communication across recent trade professional reviews...
              </p>
            </div>
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: 10 }}>
                Upgrade to Gold to unlock AI-powered bid preparation intelligence
              </div>
              <a href="#pricing" onClick={(e) => { e.preventDefault(); window.location.hash = "pricing"; }}
                style={{ display: "inline-block", background: BRAND.blue, color: "#fff", padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                Upgrade to Gold →
              </a>
            </div>
          </div>
        </div>
      )}

      {isGoldPlus && status === "loading" && (
        <div style={{ ...cardBase, background: "#fff", padding: "20px 16px", textAlign: "center" }}>
          <div style={{ width: 28, height: 28, margin: "0 auto 10px", borderRadius: "50%", border: `3px solid ${BRAND.border}`, borderTop: `3px solid ${BRAND.blue}`, animation: "spin 0.8s linear infinite" }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>
            Analyzing {reviews?.length || 0} verified trade professional review{reviews?.length !== 1 ? "s" : ""}...
          </div>
          <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 4 }}>Generating your Bid Intelligence report</div>
        </div>
      )}

      {isGoldPlus && status === "error" && (
        <div style={{ ...cardBase, background: "#fff", padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", marginBottom: 8 }}>Unable to generate report</div>
          <button onClick={handleRegenerate}
            style={{ background: "#F1F5F9", border: "none", color: BRAND.dark, padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            ↻ Try again
          </button>
        </div>
      )}

      {isGoldPlus && status === "loaded" && report && (() => {
        const sig = SIGNAL_META[report.signal] || SIGNAL_META.caution;
        const conf = CONFIDENCE_META[report.confidence] || CONFIDENCE_META.low;
        return (
          <div style={cardBase}>
            {/* Header */}
            <div style={{ background: BRAND.dark, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>🤖 Bid Intelligence</span>
              <span style={{ color: "#94A3B8", fontSize: 10 }}>Powered by ProRated AI</span>
            </div>

            {/* Signal banner */}
            <div style={{ background: sig.color, color: "#fff", padding: "10px 16px", fontSize: 13, fontWeight: 800, textAlign: "center" }}>
              {sig.emoji} {sig.label}
            </div>

            {/* Confidence + score row */}
            <div style={{ background: "#F8FAFC", padding: "8px 16px", fontSize: 12, fontWeight: 600, color: BRAND.dark, textAlign: "center", borderBottom: `1px solid ${BRAND.border}` }}>
              {conf.emoji} {conf.label} · {typeof report.score === "number" ? report.score.toFixed(1) : bidScore?.finalScore}/5.0 · {bidScore?.reviewCount ?? reviews?.length ?? 0} review{(bidScore?.reviewCount ?? reviews?.length) !== 1 ? "s" : ""}
            </div>

            {/* Body */}
            <div style={{ background: "#fff", padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: BRAND.gray, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Site Assessment</div>
              <p style={{ fontSize: 13, color: BRAND.dark, lineHeight: 1.6, margin: "0 0 14px" }}>{report.summary}</p>

              {Array.isArray(report.risks) && report.risks.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Key Risks</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {report.risks.map((r, i) => (
                      <span key={i} style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>
                        ⚠️ {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(report.positives) && report.positives.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Key Positives</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {report.positives.map((p, i) => (
                      <span key={i} style={{ background: "#F0FDF4", color: "#166534", border: "1px solid #86EFAC", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>
                        ✓ {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {report.recommendation && (
                <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "10px 12px", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: "#1E3A8A", lineHeight: 1.6 }}>💡 {report.recommendation}</span>
                </div>
              )}

              <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 10 }}>
                Based on {bidScore?.reviewCount ?? reviews?.length ?? 0} verified trade professional reviews
              </div>
              <div style={{ fontSize: 10, color: "#94A3B8", fontStyle: "italic", marginTop: 4, lineHeight: 1.5 }}>
                Bid Intelligence is advisory — always conduct your own site assessment before committing.
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 10, borderTop: `1px solid ${BRAND.border}` }}>
                <span style={{ fontSize: 10, color: BRAND.gray }}>
                  Generated {generatedAt ? generatedAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : ""}
                </span>
                <button onClick={handleRegenerate}
                  style={{ background: "none", border: "none", color: BRAND.gray, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  ↻ Regenerate
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
