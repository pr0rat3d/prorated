import { BRAND } from "../components/UI";
import Logo from "../components/Logo";
import { useAuth } from "../hooks/useAuth";

export default function VerificationRejected({ go }) {
  const { user, logout } = useAuth();
  const reason = user?.rejection_reason || "We were unable to verify your contractor license with the state database.";

  const handleLogout = async () => {
    await logout();
    go("home");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <Logo size={72} />
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 20, padding: "6px 16px", marginBottom: 24 }}>
          <span style={{ fontSize: 14 }}>✗</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#991B1B", letterSpacing: "0.5px" }}>VERIFICATION UNSUCCESSFUL</span>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: BRAND.dark, marginBottom: 12 }}>
          We couldn't verify your license
        </h1>
        <p style={{ fontSize: 14, color: BRAND.gray, lineHeight: 1.7, marginBottom: 24 }}>
          Unfortunately we weren't able to verify your contractor credentials. Here's what we found:
        </p>

        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 14, padding: "1.25rem", marginBottom: "1.25rem", textAlign: "left" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", marginBottom: 8 }}>Reason</div>
          <div style={{ fontSize: 13, color: "#7F1D1D", lineHeight: 1.65 }}>{reason}</div>
        </div>

        <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "1.25rem", marginBottom: "1.5rem", textAlign: "left" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: "0.75rem" }}>What you can do</div>
          {[
            "Double-check your license number and state",
            "Make sure your license is active and not expired",
            "Contact us with proof of your license and we'll review manually",
          ].map(item => (
            <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: BRAND.gray, padding: "5px 0", borderBottom: `1px solid ${BRAND.border}` }}>
              <span style={{ color: BRAND.blue, flexShrink: 0 }}>→</span> {item}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="mailto:hello@prorated.app?subject=License Verification Appeal"
            style={{ background: BRAND.blue, color: "#fff", border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textDecoration: "none" }}>
            Contact us to appeal
          </a>
          <button onClick={handleLogout}
            style={{ background: "transparent", color: BRAND.gray, border: `1px solid ${BRAND.border}`, padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
