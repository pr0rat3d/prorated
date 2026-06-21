import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
import { useState, useRef, useEffect } from "react";
import { BRAND } from "../components/UI";
import Logo from "../components/Logo";



const NDA_VERSION = "1.1"; // bump this when legal updates the NDA

// ── R2 hosted NDA PDF ─────────────────────────────────────────
// Upload finalized PDF to Cloudflare R2 prorated-videos bucket
// then replace this URL with the public link
const NDA_PDF_URL = "https://pub-adda1244317b474f9827ed482efd0c69.r2.dev/prorated-user-agreement-v1.1.pdf";

// ── NDA summary shown in scroll box ──────────────────────────
// Full legal document is linked above — this is a plain-English summary
const NDA_SUMMARY = `
PRORATED USER AGREEMENT — SUMMARY
Version ${NDA_VERSION} | Governed by the laws of the State of Alabama

This is a summary of your agreement with ProRated. The full legal document is linked below. By signing, you agree to the complete terms of the full document.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. PLATFORM USE
   ProRated is a job site intelligence platform for licensed trade professionals. Access is granted to verified license holders only. You agree to use the platform for lawful, professional purposes.

2. REVIEW ACCURACY
   All reviews you submit must be honest, accurate, and based on your direct professional experience at that job site. Submitting false, misleading, or malicious reviews is a violation of this agreement and may result in account termination.

3. CONFIDENTIALITY
   You may receive access to non-public platform information during your use of ProRated. You agree not to disclose platform features, data structures, pricing models, or business strategies to third parties.

4. YOUR DATA
   ProRated collects your name, email, trade license number, and reviews for platform operation. We do not sell your personal data. Full details in our Privacy Policy at prorated.app/privacy.

5. INTELLECTUAL PROPERTY
   All platform content, design, and technology is owned by ProRated. You may not copy, reproduce, or reverse-engineer any part of the platform.

6. FEEDBACK
   Any feedback or suggestions you provide may be used by ProRated to improve the platform without compensation or attribution.

7. NO WARRANTIES
   The platform is provided "as is." ProRated makes no guarantees about the accuracy of third-party submitted reviews.

8. LIMITATION OF LIABILITY
   ProRated's liability is limited to the amount paid by you in the 12 months prior to any claim.

9. TERM & TERMINATION
   This agreement remains in effect for the duration of your account. ProRated reserves the right to terminate accounts that violate these terms.

10. GOVERNING LAW
    This agreement is governed by the laws of the State of Alabama. Any disputes shall be resolved in Jefferson County, Alabama.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

By signing below you confirm you have read, understood, and agree to the full ProRated User Agreement linked above.
`;

export default function NDAPage({ go, user, onAccepted }) {
  const [scrolled, setScrolled] = useState(false);
  const [checked, setChecked]   = useState(false);
  const [signing, setSigning]   = useState(false);
  const [signed, setSigned]     = useState(false);
  const [error, setError]       = useState(null);
  const scrollRef               = useRef(null);

  // Check if user has already signed
  useEffect(() => {
    if (!user?.id) return;
    fetch(`${SUPABASE_URL}/rest/v1/nda_signatures?user_id=eq.${user.id}&select=id`, {
      headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` }
    })
    .then(r => r.json())
    .then(data => { if (data?.length > 0) onAccepted?.(); })
    .catch(() => {});
  }, [user?.id, onAccepted]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 40) setScrolled(true);
  };

  const handleSign = async () => {
    if (!checked || !scrolled) return;
    setSigning(true);
    setError(null);
    try {
      const session = JSON.parse(localStorage.getItem("prorated_session") || "{}");
      const token   = session.access_token || SUPABASE_ANON_KEY;
      const res = await fetch(`${SUPABASE_URL}/rest/v1/nda_signatures`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "apikey":        SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${token}`,
          "Prefer":        "return=minimal",
        },
        body: JSON.stringify({
          user_id:     user?.id,
          user_email:  user?.email,
          full_name:   user?.name,
          nda_version: NDA_VERSION,
          agreed_at:   new Date().toISOString(),
          platform:    "web",
        }),
      });

      if (!res.ok) throw new Error("Failed to record signature");
      setSigned(true);
      setTimeout(() => onAccepted?.(), 2000);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSigning(false);
    }
  };

  if (signed) return (
    <div style={{ minHeight: "100vh", background: BRAND.dark, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
      <div>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#F8FAFC", marginBottom: 10 }}>Agreement signed!</h2>
        <p style={{ fontSize: 15, color: "#94A3B8" }}>Welcome to ProRated. Taking you in now...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ background: BRAND.dark, padding: "1.5rem", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <Logo size={44} />
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#F8FAFC", marginBottom: 4 }}>ProRated User Agreement</h1>
        <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>Please read and sign before accessing ProRated</p>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "1.5rem 1.5rem 6rem" }}>

        {/* Info banner */}
        <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: "12px 16px", marginBottom: "1.25rem", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>ℹ️</span>
          <div style={{ fontSize: 13, color: "#1E40AF", lineHeight: 1.6 }}>
            Please read this agreement carefully before using ProRated. By signing you confirm you are a licensed trade professional and agree to use the platform honestly and in good faith.
          </div>
        </div>

        {/* NDA scroll box */}
        <div style={{ position: "relative", marginBottom: "1.25rem" }}>
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            style={{
              background: "#fff",
              border: `2px solid ${scrolled ? BRAND.green : BRAND.border}`,
              borderRadius: 14,
              padding: "1.5rem",
              height: 360,
              overflowY: "auto",
              fontSize: 13,
              lineHeight: 1.8,
              color: "#334155",
              whiteSpace: "pre-line",
              transition: "border-color 0.3s",
            }}>
            {/* PDF link at top */}
            <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#1E40AF", fontWeight: 600 }}>📄 Full legal document (PDF)</span>
              <a href={NDA_PDF_URL} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: BRAND.blue, fontWeight: 700, textDecoration: "none", background: "#DBEAFE", padding: "4px 10px", borderRadius: 6 }}>
                View PDF ↗
              </a>
            </div>
            {NDA_SUMMARY}
          </div>

          {/* Scroll indicator */}
          {!scrolled && (
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "linear-gradient(transparent, rgba(255,255,255,0.95))", borderRadius: "0 0 14px 14px", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 10, pointerEvents: "none" }}>
              <span style={{ fontSize: 11, color: BRAND.gray, fontWeight: 600 }}>↓ Scroll to read full agreement</span>
            </div>
          )}
          {scrolled && (
            <div style={{ position: "absolute", top: 10, right: 10, background: BRAND.green, color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 8 }}>
              ✓ Read
            </div>
          )}
        </div>

        {/* Signature section */}
        <div style={{ background: "#fff", border: `1.5px solid ${BRAND.border}`, borderRadius: 14, padding: "1.25rem", marginBottom: "1rem" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: "1rem" }}>Digital Signature</div>

          {/* Name display */}
          <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "10px 14px", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: BRAND.gray }}>Signing as:</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>{user?.name || "—"} · {user?.email || "—"}</span>
          </div>

          {/* Timestamp preview */}
          <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "10px 14px", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: BRAND.gray }}>Date & time:</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: BRAND.dark, fontFamily: "'DM Mono', monospace" }}>
              {new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            </span>
          </div>

          {/* NDA version */}
          <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "10px 14px", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: BRAND.gray }}>Agreement version:</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: BRAND.dark }}>v{NDA_VERSION}</span>
          </div>

          {/* Checkbox */}
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: "1.25rem" }}>
            <input
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              disabled={!scrolled}
              style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0, cursor: scrolled ? "pointer" : "not-allowed", accentColor: BRAND.blue }}
            />
            <span style={{ fontSize: 13, color: scrolled ? BRAND.dark : BRAND.gray, lineHeight: 1.6 }}>
              I have read and fully understand the ProRated User Agreement (linked above). By checking this box I am providing my legally binding digital signature and agree to all terms and conditions contained therein.
            </span>
          </label>

          {/* Sign button */}
          <button
            onClick={handleSign}
            disabled={!scrolled || !checked || signing}
            style={{
              width: "100%",
              background: scrolled && checked ? BRAND.blue : "#E2E8F0",
              color: scrolled && checked ? "#fff" : BRAND.gray,
              border: "none",
              padding: "14px",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              cursor: scrolled && checked ? "pointer" : "not-allowed",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.2s",
            }}>
            {signing ? "Recording signature..." : !scrolled ? "↑ Scroll to read agreement first" : !checked ? "☑️ Check the box above to sign" : "✍️ I Agree — This is my Legal Signature →"}
          </button>

          {error && (
            <div style={{ fontSize: 12, color: "#DC2626", textAlign: "center", marginTop: 8 }}>{error}</div>
          )}
        </div>

        {/* Legal note */}
        <p style={{ fontSize: 11, color: BRAND.gray, textAlign: "center", lineHeight: 1.6 }}>
          🔒 Your digital signature is recorded with your name, email, timestamp, and IP address. 
          This record is stored securely and constitutes a legally binding agreement.
          Questions? Email <a href="mailto:hello@prorated.app" style={{ color: BRAND.blue }}>hello@prorated.app</a>
        </p>
      </div>
    </div>
  );
}
