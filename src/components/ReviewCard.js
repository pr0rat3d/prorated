import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
import { useState } from "react";
import { TRADES } from "../data/constants";
import { getTagsForTrade } from "../data/tradeTags";
import { Avatar, Stars, Pill, BRAND } from "./UI";
import { incrementHelpful } from "../api/supabase";




export default function ReviewCard({ review, idx }) {
  const [helpful, setHelpful]       = useState(review.helpfulCount || 0);
  const [voted, setVoted]           = useState(false);
  const [isReported, setIsReported] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const handleHelpful = () => {
    if (voted) return;
    setHelpful(h => h + 1);
    setVoted(true);
    if (review.fromDatabase && review.id) incrementHelpful(review.id).catch(() => {});
  };

  const handleReport = async (reason) => {
    // Only real DB-backed reviews can actually be reported — synthetic/demo
    // reviews (test harness, app walkthrough) don't carry fromDatabase and
    // must never write a row to reported_reviews.
    if (review.fromDatabase) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/reported_reviews`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({
            review_id:   review.id || null,
            review_text: review.text,
            reason,
            reported_at: new Date().toISOString(),
          }),
        });
      } catch {}
    }
    setIsReported(true);
    setShowReport(false);
  };

  const trade   = TRADES.find(t => t.id === review.trade);
  const allTags = getTagsForTrade(review.trade);

  return (
    <div style={{ padding: "1rem 0", borderTop: idx > 0 ? `1px solid ${BRAND.border}` : "none", animation: `fadeUp 0.3s ease ${idx * 0.07}s both` }}>
      <div style={{ display: "flex", gap: 10 }}>
        <Avatar initials={review.contractorInitials} idx={idx} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: BRAND.dark }}>
              {review.contractorInitials?.split("").join(".") + (review.contractorInitials ? "." : "")}
              {trade ? ` · ${trade.icon} ${trade.label}` : ""}
            </span>
            {(() => {
              const s = review.reviewerTrustScore;
              if (s === null || s === undefined) return null;
              const t = s >= 90 ? { badge: "🛡️", label: "Elite Pro",    color: "#7C3AED", bg: "#FAF5FF", border: "#DDD6FE" }
                      : s >= 75 ? { badge: "⭐",  label: "Verified Pro", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" }
                      : s >= 50 ? { badge: "🟢",  label: "Trusted",      color: "#16A34A", bg: "#F0FDF4", border: "#86EFAC" }
                      : s >= 25 ? { badge: "🔵",  label: "Established",  color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" }
                      :           { badge: "⚪",  label: "New Member",   color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0" };
              return (
                <span style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.color, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
                  {t.badge} {t.label}
                </span>
              );
            })()}
            <span style={{ background: "#DBEAFE", color: "#1E40AF", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 20 }}>
              ✓ VERIFIED
            </span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: BRAND.gray }}>{new Date(review.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
          </div>
          <div style={{ marginBottom: 6 }}><Stars score={review.overallScore} size={13} /></div>
          <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.65, margin: "0 0 8px" }}>{review.text}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
            {(review.tags || []).map(tid => {
              const t = allTags.find(x => x.id === tid);
              return t ? <Pill key={tid} label={t.label} sev={t.severity} small selected /> : null;
            })}
          </div>

          {/* Actions row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={handleHelpful}
              style={{ background: "none", border: `1px solid ${BRAND.border}`, borderRadius: 6, padding: "3px 9px", fontSize: 11, color: voted ? BRAND.green : BRAND.gray, cursor: voted ? "default" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              {voted ? "✓" : "👍"} Helpful · {helpful}
            </button>
            {!isReported
              ? <button onClick={() => setShowReport(s => !s)}
                  style={{ background: "none", border: "none", fontSize: 14, color: "#CBD5E1", cursor: "pointer", padding: "2px 4px" }}>
                  🚩
                </button>
              : <span style={{ fontSize: 10, color: BRAND.gray }}>Reported</span>
            }
          </div>

          {/* Report reasons */}
          {showReport && !isReported && (
            <div style={{ marginTop: 8, background: "#F8FAFC", border: `1px solid ${BRAND.border}`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.dark, marginBottom: 8 }}>Why are you reporting this?</div>
              {["False or fabricated", "Retaliatory review", "Personal info about homeowner", "Spam", "Other"].map(reason => (
                <button key={reason} onClick={() => handleReport(reason)}
                  style={{ display: "block", width: "100%", background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 7, padding: "6px 10px", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "left", color: BRAND.dark, marginBottom: 4 }}>
                  {reason}
                </button>
              ))}
              <button onClick={() => setShowReport(false)}
                style={{ background: "none", border: "none", color: BRAND.gray, fontSize: 11, cursor: "pointer", marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
