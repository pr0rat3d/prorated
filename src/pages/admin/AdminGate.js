import { useState, useEffect } from "react";
import Logo from "../../components/Logo";
import { BRAND } from "../../components/UI";
import AdminPage from "./AdminPage";

// No password hardcoded here — validation happens server-side via /api/admin-auth
export default function AdminGate({ go }) {
  const [authed, setAuthed] = useState(() => {
    try { return !!sessionStorage.getItem("pr_admin_auth"); } catch { return false; }
  });
  const [pw, setPw]       = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (data.ok) {
        try { sessionStorage.setItem("pr_admin_auth", data.token); } catch {}
        setAuthed(true);
      } else {
        setError(true);
        setTimeout(() => setError(false), 2000);
      }
    } catch {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
    setLoading(false);
  };

  if (authed) return <AdminPage go={go} />;

  return (
    <div style={{ minHeight: "100vh", background: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 20, padding: "2rem", width: "100%", maxWidth: 360, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <Logo size={40} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#F8FAFC", marginBottom: 4, marginTop: 0 }}>Admin Console</h2>
        <p style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>Internal access only</p>
        <input
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          placeholder="Access password"
          autoFocus
          style={{ width: "100%", padding: "12px", border: `1.5px solid ${error ? "#EF4444" : "#334155"}`, borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", marginBottom: 8, textAlign: "center", background: "#0F172A", color: "#F8FAFC" }}
        />
        {error && <div style={{ fontSize: 12, color: "#EF4444", marginBottom: 8 }}>Incorrect password</div>}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: "100%", background: BRAND.blue, color: "#fff", border: "none", padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Checking..." : "Enter →"}
        </button>
      </div>
    </div>
  );
}
