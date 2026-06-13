import { BRAND } from "../components/UI";
import Logo from "../components/Logo";
import { useAuth } from "../hooks/useAuth";

export default function VerificationPending({ go }) {
  const { user, logout } = useAuth();
  const trade = user?.trade || "contractor";
  const license = user?.license || "—";

  const handleLogout = async () => {
    await logout();
    go("home");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>

        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <Logo size={72} />
        </div>

        {/* Status badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FEF9C3", border: "1px solid #FDE047", borderRadius: 20, padding: "6px 16px", marginBottom: 24 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#D97706", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#854D0E", letterSpacing: "0.5px" }}>VERIFICATION PENDING</span>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: BRAND.dark, marginBottom: 12, letterSpacing: "-0.5px" }}>
          We're verifying your license
        </h1>
        <p style={{ fontSize: 14, color: BRAND.gray, lineHeight: 1.7, marginBottom: 32 }}>
          Thanks for signing up! We verify every contractor's license before granting full access. This usually takes <strong style={{ color: BRAND.dark }}>less than 24 hours</strong>.
        </p>

        {/* What we're checking */}
        <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 16, padding: "1.5rem", marginBottom: "1.25rem", textAlign: "left" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginBottom: "1rem" }}>What we're verifying</div>
          {[
            ["🪪", "License number", license, "Checking state contractor database"],
            ["🏗️", "Trade",          trade.charAt(0).toUpperCase() + trade.slice(1), "Confirming license matches trade"],
            ["📧", "Email",          user?.email || "—", "Already confirmed"],
          ].map(([icon, label, value, note]) => (
            <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: `1px solid ${BRAND.border}` }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, marginBottom: 1 }}>{label}: <span style={{ fontFamily: "'DM Mono', monospace", color: BRAND.blue }}>{value}</span></div>
                <div style={{ fontSize: 11, color: BRAND.gray }}>{note}</div>
              </div>
              <span style={{ fontSize: 16 }}>⏳</span>
            </div>
          ))}
        </div>

        {/* What you can do while waiting */}
        <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 16, padding: "1.25rem", marginBottom: "1.25rem", textAlign: "left" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: "0.75rem" }}>✓ While you wait, you can still:</div>
          {[
            "Search any job site address",
            "Read existing contractor reviews",
            "Browse job site ratings",
          ].map(item => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#166534", padding: "4px 0" }}>
              <span>→</span> {item}
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => go("home")}
            style={{ background: BRAND.blue, color: "#fff", border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Search addresses →
          </button>
          <button onClick={handleLogout}
            style={{ background: "transparent", color: BRAND.gray, border: `1px solid ${BRAND.border}`, padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Sign out
          </button>
        </div>

        <p style={{ fontSize: 11, color: BRAND.gray, marginTop: 20 }}>
          Questions? Email <a href="mailto:hello@prorated.app" style={{ color: BRAND.blue }}>hello@prorated.app</a>
        </p>
      </div>
    </div>
  );
}
