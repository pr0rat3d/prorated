import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
import { useState } from "react";
import { BRAND } from "./UI";
import { useAuth } from "../hooks/useAuth";




const CATEGORIES = [
  { id: "bug",        label: "🐛 Bug report",      color: "#FEE2E2" },
  { id: "suggestion", label: "💡 Suggestion",       color: "#FEF9C3" },
  { id: "missing",    label: "🔍 Missing feature",  color: "#EFF6FF" },
  { id: "praise",     label: "⭐ Something I love", color: "#F0FDF4" },
];

export default function FeedbackButton({ page }) {
  const { user } = useAuth();
  const [open, setOpen]       = useState(false);
  const [category, setCat]    = useState("");
  const [text, setText]       = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone]       = useState(false);

  const submit = async () => {
    if (!text.trim() || !category) return;
    setSending(true);
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/beta_feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          category,
          text: text.trim(),
          page,
          user_email: user?.email || "anonymous",
          user_id:    user?.id    || null,
        }),
      });
      setDone(true);
      setTimeout(() => {
        setDone(false); setOpen(false);
        setCat(""); setText("");
      }, 2500);
    } catch (err) {
      console.warn("Feedback send failed:", err);
    }
    setSending(false);
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed", bottom: 96, right: 16, zIndex: 190,
          background: BRAND.blue, color: "#fff",
          border: "none", borderRadius: 20,
          padding: "8px 14px", fontSize: 12, fontWeight: 700,
          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          boxShadow: "0 4px 16px rgba(37,99,235,0.4)",
          display: "flex", alignItems: "center", gap: 6,
          WebkitTapHighlightColor: "transparent",
        }}>
        💬 Feedback
      </button>

      {/* Modal overlay */}
      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9000,
          background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "flex-end",
          justifyContent: "center",
          animation: "fadeUp 0.2s ease both",
        }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div style={{
            background: "#fff", borderRadius: "20px 20px 0 0",
            padding: "1.5rem", width: "100%", maxWidth: 520,
            boxShadow: "0 -8px 32px rgba(0,0,0,0.15)",
            paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))",
          }}>
            {done ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🙏</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: BRAND.dark, marginBottom: 6 }}>Thanks for the feedback!</div>
                <div style={{ fontSize: 13, color: BRAND.gray }}>We read every single one.</div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: BRAND.dark }}>Send feedback</div>
                  <button onClick={() => setOpen(false)}
                    style={{ background: "none", border: "none", fontSize: 20, color: BRAND.gray, cursor: "pointer", lineHeight: 1 }}>×</button>
                </div>

                {/* Category selector */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "1rem" }}>
                  {CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => setCat(c.id)}
                      style={{ padding: "10px 8px", borderRadius: 10, border: `2px solid ${category === c.id ? BRAND.blue : BRAND.border}`, background: category === c.id ? "#EFF6FF" : "#F8FAFC", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", color: category === c.id ? BRAND.blue : BRAND.dark, transition: "all 0.15s" }}>
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Text input */}
                <textarea
                  placeholder="Tell us what's on your mind... the more detail the better!"
                  value={text}
                  onChange={e => setText(e.target.value.slice(0, 500))}
                  rows={4}
                  style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${BRAND.border}`, borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif", resize: "none", boxSizing: "border-box", lineHeight: 1.6, marginBottom: 4 }}
                />
                <div style={{ fontSize: 10, color: BRAND.gray, textAlign: "right", marginBottom: "1rem" }}>{text.length}/500</div>

                <button onClick={submit}
                  disabled={!text.trim() || !category || sending}
                  style={{ width: "100%", background: (!text.trim() || !category) ? "#E2E8F0" : BRAND.blue, color: (!text.trim() || !category) ? BRAND.gray : "#fff", border: "none", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: (!text.trim() || !category) ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s" }}>
                  {sending ? "Sending..." : "Send feedback →"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
