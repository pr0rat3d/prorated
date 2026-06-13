import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
import { useState, useRef, useEffect } from "react";
import { BRAND } from "../components/UI";
import Logo from "../components/Logo";



const NDA_VERSION       = "1.0"; // bump this when legal updates the NDA

// ── Placeholder NDA text — replace with real PDF/text when legal finalizes ──
const NDA_PLACEHOLDER = `
PRORATED BETA TESTER NON-DISCLOSURE AGREEMENT

[PLACEHOLDER — Legal document will be inserted here]

This Non-Disclosure Agreement ("Agreement") is entered into between ProRated 
("Company") and the undersigned Beta Tester ("Recipient").

1. CONFIDENTIAL INFORMATION
   The Recipient may receive access to non-public information including but not 
   limited to: platform features, user data structures, business strategies, 
   pricing models, and technical implementations ("Confidential Information").

2. OBLIGATIONS
   Recipient agrees to:
   (a) Keep all Confidential Information strictly confidential
   (b) Not disclose any Confidential Information to third parties
   (c) Use Confidential Information only for the purpose of beta testing
   (d) Notify ProRated immediately of any unauthorized disclosure

3. TERM
   This Agreement remains in effect for two (2) years from the date of signing.

4. FEEDBACK
   Any feedback, suggestions, or ideas provided by Recipient regarding the 
   platform may be used by ProRated without compensation or attribution.

5. NO WARRANTIES
   The beta platform is provided "as is" without warranties of any kind.

6. GOVERNING LAW
   This Agreement shall be governed by the laws of the State of Alabama.

7. ENTIRE AGREEMENT
   This Agreement constitutes the entire agreement between the parties 
   regarding confidentiality of the beta program.

[FULL LEGAL TEXT WILL BE INSERTED BY COUNSEL]
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
      const res = await fetch(`${SUPABASE_URL}/rest/v1/nda_signatures`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "apikey":        SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
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
        <p style={{ fontSize: 15, color: "#94A3B8" }}>Welcome to the ProRated beta. Taking you in now...</p>
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
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#F8FAFC", marginBottom: 4 }}>Beta Tester Agreement</h1>
        <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>Please read and sign before accessing ProRated</p>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "1.5rem 1.5rem 6rem" }}>

        {/* Info banner */}
        <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: "12px 16px", marginBottom: "1.25rem", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>ℹ️</span>
          <div style={{ fontSize: 13, color: "#1E40AF", lineHeight: 1.6 }}>
            As a ProRated beta tester, you're getting early access to our platform. 
            Please read this agreement carefully — it protects both you and us during the beta period.
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
            {NDA_PLACEHOLDER}
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
              I have read and agree to the ProRated Beta Tester Non-Disclosure Agreement. 
              I understand this constitutes a legally binding digital signature.
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
            {signing ? "Recording signature..." : !scrolled ? "↑ Scroll to read agreement first" : !checked ? "Check the box to sign" : "✍️ Sign & Enter ProRated →"}
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
